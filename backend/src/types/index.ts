export type UserRole = 'admin' | 'developer' | 'viewer';
export type TicketType = 'story' | 'task' | 'bug' | 'epic';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type RunStatus = 'running' | 'pass' | 'fail' | 'cancelled';
export type AuditAction =
  | 'ticket.created' | 'ticket.updated' | 'ticket.deleted'
  | 'ticket.status_changed' | 'ticket.assigned'
  | 'sprint.started' | 'sprint.completed'
  | 'member.added' | 'member.removed' | 'member.role_changed';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_initials?: string;
  avatar_color?: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface Ticket {
  id: string;
  project_id: string;
  sprint_id?: string | null;
  state_id: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description?: string | null;
  story_points?: number | null;
  assignee_id?: string | null;
  reporter_id: string;
  ticket_number: number;
  parent_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowState {
  id: string;
  project_id: string;
  name: string;
  key: string;
  color: string;
  position: number;
  is_terminal: boolean;
}

export interface WorkflowTransition {
  id: string;
  project_id: string;
  from_state_id: string;
  to_state_id: string;
  label: string;
  guard_condition?: string | null;
  allowed_roles: UserRole[];
}

export interface AuditLog {
  id: string;
  project_id: string;
  actor_id: string;
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  created_at: Date;
}

export interface PipelineRun {
  id: string;
  project_id: string;
  run_number: number;
  branch: string;
  commit_sha?: string;
  commit_msg?: string;
  status: RunStatus;
  coverage_pct?: number;
  duration_ms?: number;
  started_at: Date;
  finished_at?: Date;
}

// Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
