-- AgileFlow Seed Data

-- Users (passwords are bcrypt hash of "Password123!")
INSERT INTO users (id, email, name, avatar_initials, avatar_color, role, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@agileflow.dev', 'Alice Brown',  'AB', '#6366f1', 'admin',     '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FApllPBNTe5D9Qs3bpE.3mKEVRDV/Ue'),
  ('00000000-0000-0000-0000-000000000002', 'sam@agileflow.dev',   'Sam Kumar',    'SK', '#06b6d4', 'developer', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FApllPBNTe5D9Qs3bpE.3mKEVRDV/Ue'),
  ('00000000-0000-0000-0000-000000000003', 'maya@agileflow.dev',  'Maya Chen',    'MC', '#22c55e', 'developer', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FApllPBNTe5D9Qs3bpE.3mKEVRDV/Ue'),
  ('00000000-0000-0000-0000-000000000004', 'dan@agileflow.dev',   'Dan Viewer',   'DV', '#f59e0b', 'viewer',    '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FApllPBNTe5D9Qs3bpE.3mKEVRDV/Ue');

-- Project
INSERT INTO projects (id, name, key, description, owner_id) VALUES
  ('00000000-0000-0000-0001-000000000001', 'AgileFlow Platform', 'AF', 'SaaS Agile Project Management System', '00000000-0000-0000-0000-000000000001');

-- Project members
INSERT INTO project_members (project_id, user_id, role) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'developer'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'developer'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', 'viewer');

-- Workflow states
INSERT INTO workflow_states (id, project_id, name, key, color, position, is_terminal) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'To Do',       'todo',        '#9298b0', 0, false),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'In Progress', 'in-progress', '#06b6d4', 1, false),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 'Review',      'review',      '#f59e0b', 2, false),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 'Done',        'done',        '#22c55e', 3, true);

-- Workflow transitions
INSERT INTO workflow_transitions (project_id, from_state_id, to_state_id, label, guard_condition, allowed_roles) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000002', 'Start Work',          NULL,                          '{admin,developer}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000003', 'Submit for Review',   'Description must be filled',  '{admin,developer}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000001', 'Revert to Backlog',   'Ticket must be unassigned',   '{admin}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0002-000000000002', 'Request Changes',     'Reviewer must add comment',   '{admin,developer}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0002-000000000004', 'Approve & Close',     'QA approval required',        '{admin}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0002-000000000003', 'Reopen',              'Admin only',                  '{admin}');

-- Sprints
INSERT INTO sprints (id, project_id, name, goal, start_date, end_date, status) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', 'Sprint 1', 'Core Kanban + Auth', '2025-01-06', '2025-01-17', 'completed'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000001', 'Sprint 2', 'Analytics + RBAC + CI/CD', '2025-01-20', '2025-01-31', 'active'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000001', 'Sprint 3', 'Mobile + Integrations', '2025-02-03', '2025-02-14', 'planned');

-- Tickets (Sprint 2)
INSERT INTO tickets (project_id, sprint_id, state_id, type, priority, title, description, story_points, assignee_id, reporter_id) VALUES
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000004','story','high',    'Implement Kanban drag-and-drop with real-time sync','HTML5 drag events + WebSocket broadcast',8,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000004','task', 'high',    'Design RBAC permission model and schema',          'Admin/Developer/Viewer roles with granular perms',5,'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000004','story','medium',  'Build velocity calculation engine',                'Aggregate story points per sprint',5,'00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000003','bug',  'high',    'Fix pagination bug on backlog view',               'Page offset calculation off-by-one',3,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000003','story','medium',  'Create burndown chart component',                  'Canvas-based line chart with ideal vs actual',5,'00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000002','task', 'high',    'Implement JWT refresh token rotation',             'Short-lived access + long-lived refresh tokens',3,'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000002','story','high',    'Add GitHub Actions CI/CD pipeline config',         'Lint→Test→Build→Deploy stages with 80% gate',8,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000002','task', 'medium',  'Write unit tests for workflow engine',             'Jest tests for state machine transitions',5,'00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000001','epic', 'high',    'Design custom workflow state machine UI',          'Drag-to-configure state graph editor',13,'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000001','task', 'medium',  'Implement audit logging middleware',               'Express middleware to write audit_logs on mutations',3,NULL,'00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000001','story','low',     'Add Slack notifications for ticket updates',       'Webhook integration via Slack incoming webhooks',5,NULL,'00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0002-000000000001','task', 'medium',  'E2E tests for Kanban board flows',                 'Cypress specs: drag-drop, state transitions',5,NULL,'00000000-0000-0000-0000-000000000001');
