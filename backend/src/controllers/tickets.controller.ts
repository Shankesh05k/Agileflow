import { Request, Response } from 'express';
import pool, { query, queryOne } from '../db/pool';
import { logAudit } from '../services/audit';
import { Ticket } from '../types';
import { generateTicketDraft } from '../services/ai';

const PROJECT_ID = '00000000-0000-0000-0001-000000000001'; // single-tenant seed

export async function listTickets(req: Request, res: Response): Promise<void> {
  const { sprint_id, state_id, assignee_id } = req.query;
  const conditions: string[] = ['t.project_id = $1'];
  const params: unknown[] = [PROJECT_ID];
  let i = 2;

  if (sprint_id)   { conditions.push(`t.sprint_id = $${i++}`);   params.push(sprint_id); }
  if (state_id)    { conditions.push(`t.state_id = $${i++}`);    params.push(state_id); }
  if (assignee_id) { conditions.push(`t.assignee_id = $${i++}`); params.push(assignee_id); }

  const tickets = await query(
    `SELECT t.*,
       ws.key AS state_key, ws.name AS state_name, ws.color AS state_color,
       u_a.name AS assignee_name, u_a.avatar_initials AS assignee_initials, u_a.avatar_color AS assignee_color,
       u_r.name AS reporter_name,
       CONCAT(p.key, '-', t.ticket_number) AS display_id
     FROM tickets t
     JOIN workflow_states ws ON ws.id = t.state_id
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u_a ON u_a.id = t.assignee_id
     LEFT JOIN users u_r ON u_r.id = t.reporter_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.created_at DESC`,
    params
  );

  res.json(tickets);
}

export async function getTicket(req: Request, res: Response): Promise<void> {
  const ticket = await queryOne(
    `SELECT t.*,
       ws.key AS state_key, ws.name AS state_name, ws.color AS state_color,
       u_a.name AS assignee_name, u_a.avatar_initials AS assignee_initials,
       u_r.name AS reporter_name,
       CONCAT(p.key, '-', t.ticket_number) AS display_id
     FROM tickets t
     JOIN workflow_states ws ON ws.id = t.state_id
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u_a ON u_a.id = t.assignee_id
     LEFT JOIN users u_r ON u_r.id = t.reporter_id
     WHERE t.id = $1 AND t.project_id = $2`,
    [req.params.id, PROJECT_ID]
  );

  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
  res.json(ticket);
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const { state_id, type, priority, title, description, story_points, assignee_id, sprint_id } = req.body;

  const ticket = await queryOne<Ticket>(
    `INSERT INTO tickets
       (project_id, sprint_id, state_id, type, priority, title, description, story_points, assignee_id, reporter_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [PROJECT_ID, sprint_id ?? null, state_id, type, priority, title, description ?? null, story_points ?? null, assignee_id ?? null, req.user!.sub]
  );

  await logAudit({
    projectId: PROJECT_ID,
    actorId: req.user!.sub,
    action: 'ticket.created',
    entityType: 'ticket',
    entityId: ticket!.id,
    payload: { title, type, priority },
  });

  res.status(201).json(ticket);
}

export async function updateTicket(req: Request, res: Response): Promise<void> {
  const existing = await queryOne<Ticket>(
    'SELECT * FROM tickets WHERE id = $1 AND project_id = $2',
    [req.params.id, PROJECT_ID]
  );
  if (!existing) { res.status(404).json({ error: 'Ticket not found' }); return; }

  const { title, description, story_points, assignee_id, priority, state_id, sprint_id } = req.body;

  const updated = await queryOne<Ticket>(
    `UPDATE tickets SET
       title         = COALESCE($1, title),
       description   = COALESCE($2, description),
       story_points  = COALESCE($3, story_points),
       assignee_id   = COALESCE($4, assignee_id),
       priority      = COALESCE($5, priority),
       state_id      = COALESCE($6, state_id),
       sprint_id     = COALESCE($7, sprint_id)
     WHERE id = $8
     RETURNING *`,
    [title, description, story_points, assignee_id, priority, state_id, sprint_id, req.params.id]
  );

  // Log status change separately
  if (state_id && state_id !== existing.state_id) {
    await logAudit({
      projectId: PROJECT_ID,
      actorId: req.user!.sub,
      action: 'ticket.status_changed',
      entityType: 'ticket',
      entityId: req.params.id,
      payload: { from: existing.state_id, to: state_id },
    });
  } else {
    await logAudit({
      projectId: PROJECT_ID,
      actorId: req.user!.sub,
      action: 'ticket.updated',
      entityType: 'ticket',
      entityId: req.params.id,
    });
  }

  res.json(updated);
}

export async function deleteTicket(req: Request, res: Response): Promise<void> {
  const result = await pool.query(
    'DELETE FROM tickets WHERE id = $1 AND project_id = $2 RETURNING id',
    [req.params.id, PROJECT_ID]
  );
  if (result.rowCount === 0) { res.status(404).json({ error: 'Ticket not found' }); return; }

  await logAudit({
    projectId: PROJECT_ID,
    actorId: req.user!.sub,
    action: 'ticket.deleted',
    entityType: 'ticket',
    entityId: req.params.id,
  });

  res.status(204).send();
}
export async function draftTicket(req: Request, res: Response): Promise<void> {
  const { title } = req.body as { title?: string };
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  try {
    const draft = await generateTicketDraft(title.trim());
    res.json(draft);
  } catch (err) {
    // Convenience feature on top of manual ticket creation —
    // never let an LLM/network failure read as a 500 server bug.
    res.status(502).json({
      error: 'AI draft unavailable',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

export async function moveTicket(req: Request, res: Response): Promise<void> {
  const { state_id } = req.body as { state_id: string };

  // Validate transition exists
  const transition = await queryOne(
    `SELECT wt.* FROM workflow_transitions wt
     JOIN tickets t ON t.state_id = wt.from_state_id
     WHERE t.id = $1 AND wt.to_state_id = $2`,
    [req.params.id, state_id]
  );

  if (!transition) {
    res.status(422).json({ error: 'Transition not allowed by workflow rules' });
    return;
  }

  const updated = await queryOne<Ticket>(
    'UPDATE tickets SET state_id = $1 WHERE id = $2 RETURNING *',
    [state_id, req.params.id]
  );

  await logAudit({
    projectId: PROJECT_ID,
    actorId: req.user!.sub,
    action: 'ticket.status_changed',
    entityType: 'ticket',
    entityId: req.params.id,
    payload: { to: state_id },
  });

  res.json(updated);
}
