import { Request, Response } from 'express';
import { query, queryOne } from '../db/pool';

const PROJECT_ID = '00000000-0000-0000-0001-000000000001';

export async function getStates(req: Request, res: Response): Promise<void> {
  const states = await query(
    'SELECT * FROM workflow_states WHERE project_id = $1 ORDER BY position ASC',
    [PROJECT_ID]
  );
  res.json(states);
}

export async function getTransitions(req: Request, res: Response): Promise<void> {
  const transitions = await query(
    `SELECT wt.*,
       fs.key AS from_key, fs.name AS from_name,
       ts.key AS to_key,   ts.name AS to_name
     FROM workflow_transitions wt
     JOIN workflow_states fs ON fs.id = wt.from_state_id
     JOIN workflow_states ts ON ts.id = wt.to_state_id
     WHERE wt.project_id = $1
     ORDER BY fs.position, ts.position`,
    [PROJECT_ID]
  );
  res.json(transitions);
}

export async function getAvailableTransitions(req: Request, res: Response): Promise<void> {
  const ticket = await queryOne(
    'SELECT state_id FROM tickets WHERE id = $1 AND project_id = $2',
    [req.params.ticketId, PROJECT_ID]
  );
  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }

  const transitions = await query(
    `SELECT wt.*,
       ts.key AS to_key, ts.name AS to_name, ts.color AS to_color
     FROM workflow_transitions wt
     JOIN workflow_states ts ON ts.id = wt.to_state_id
     WHERE wt.from_state_id = $1
       AND $2 = ANY(wt.allowed_roles)`,
    [(ticket as { state_id: string }).state_id, req.user!.role]
  );
  res.json(transitions);
}
