import { Request, Response } from 'express';
import { query, queryOne } from '../db/pool';
import { logAudit } from '../services/audit';

const PROJECT_ID = '00000000-0000-0000-0001-000000000001';

export async function listSprints(req: Request, res: Response): Promise<void> {
  const sprints = await query(
    `SELECT s.*,
       COUNT(t.id)::int AS total_tickets,
       COALESCE(SUM(t.story_points),0)::int AS total_points,
       COUNT(t.id) FILTER (WHERE ws.is_terminal)::int AS completed_tickets,
       COALESCE(SUM(t.story_points) FILTER (WHERE ws.is_terminal),0)::int AS completed_points
     FROM sprints s
     LEFT JOIN tickets t ON t.sprint_id = s.id
     LEFT JOIN workflow_states ws ON ws.id = t.state_id
     WHERE s.project_id = $1
     GROUP BY s.id
     ORDER BY s.start_date ASC`,
    [PROJECT_ID]
  );
  res.json(sprints);
}

export async function getSprint(req: Request, res: Response): Promise<void> {
  const sprint = await queryOne(
    `SELECT s.*,
       COUNT(t.id)::int AS total_tickets,
       COALESCE(SUM(t.story_points),0)::int AS total_points
     FROM sprints s
     LEFT JOIN tickets t ON t.sprint_id = s.id
     WHERE s.id = $1 AND s.project_id = $2
     GROUP BY s.id`,
    [req.params.id, PROJECT_ID]
  );
  if (!sprint) { res.status(404).json({ error: 'Sprint not found' }); return; }
  res.json(sprint);
}

export async function createSprint(req: Request, res: Response): Promise<void> {
  const { name, goal, start_date, end_date } = req.body;
  const sprint = await queryOne(
    `INSERT INTO sprints (project_id, name, goal, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [PROJECT_ID, name, goal ?? null, start_date, end_date]
  );
  res.status(201).json(sprint);
}

export async function startSprint(req: Request, res: Response): Promise<void> {
  // Only one active sprint at a time
  const active = await queryOne(
    `SELECT id FROM sprints WHERE project_id = $1 AND status = 'active'`,
    [PROJECT_ID]
  );
  if (active) {
    res.status(409).json({ error: 'A sprint is already active' });
    return;
  }

  const sprint = await queryOne(
    `UPDATE sprints SET status = 'active' WHERE id = $1 AND status = 'planned' RETURNING *`,
    [req.params.id]
  );
  if (!sprint) { res.status(404).json({ error: 'Sprint not found or not in planned state' }); return; }

  await logAudit({
    projectId: PROJECT_ID,
    actorId: req.user!.sub,
    action: 'sprint.started',
    entityType: 'sprint',
    entityId: req.params.id,
  });

  res.json(sprint);
}

export async function completeSprint(req: Request, res: Response): Promise<void> {
  const sprint = await queryOne(
    `UPDATE sprints SET status = 'completed' WHERE id = $1 AND status = 'active' RETURNING *`,
    [req.params.id]
  );
  if (!sprint) { res.status(404).json({ error: 'Sprint not found or not active' }); return; }

  await logAudit({
    projectId: PROJECT_ID,
    actorId: req.user!.sub,
    action: 'sprint.completed',
    entityType: 'sprint',
    entityId: req.params.id,
  });

  res.json(sprint);
}

export async function getVelocity(req: Request, res: Response): Promise<void> {
  const data = await query(
    `SELECT s.name AS sprint_name, s.id,
       COALESCE(SUM(t.story_points),0)::int AS planned_points,
       COALESCE(SUM(t.story_points) FILTER (WHERE ws.is_terminal),0)::int AS completed_points
     FROM sprints s
     LEFT JOIN tickets t ON t.sprint_id = s.id
     LEFT JOIN workflow_states ws ON ws.id = t.state_id
     WHERE s.project_id = $1 AND s.status IN ('active','completed')
     GROUP BY s.id
     ORDER BY s.start_date ASC`,
    [PROJECT_ID]
  );
  res.json(data);
}