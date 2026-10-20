export type UserRole = 'admin' | 'developer' | 'viewer';
export type TicketType = 'story' | 'task' | 'bug' | 'epic';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type SprintStatus = 'planned' | 'active' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface WorkflowTransition {
  id: string;
  from_state_id: string;
  to_state_id: string;
  from_name: string;
  to_name: string;
  allowed_roles: UserRole[];
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  story_points?: number;
  state_id: string;
  state_name: string;
  state_color: string;
  sprint_id?: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  reporter_id: string;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  start_date: string;
  end_date: string;
  total_tickets: number;
  completed_tickets: number;
  total_points: number;
  completed_points: number;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  actor_avatar?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface VelocityData {
  sprint_name: string;
  planned_points: number;
  completed_points: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
