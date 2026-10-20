import pool from '../db/pool';
import { AuditAction } from '../types';

interface LogParams {
  projectId: string;
  actorId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

export async function logAudit(params: LogParams): Promise<void> {
  const { projectId, actorId, action, entityType, entityId, payload } = params;
  await pool.query(
    `INSERT INTO audit_logs
       (project_id, actor_id, action, entity_type, entity_id, payload)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [projectId, actorId, action, entityType ?? null, entityId ?? null, payload ? JSON.stringify(payload) : null]
  );
}

export async function getAuditLogs(projectId: string, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `SELECT al.*, u.name AS actor_name, u.avatar_initials, u.avatar_color
     FROM audit_logs al
     JOIN users u ON u.id = al.actor_id
     WHERE al.project_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2 OFFSET $3`,
    [projectId, limit, offset]
  );
  return rows;
}
