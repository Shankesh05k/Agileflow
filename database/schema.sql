-- AgileFlow PostgreSQL Schema
-- Version 1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users & Auth ──────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'developer', 'viewer');

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  avatar_initials CHAR(2),
  avatar_color VARCHAR(7) DEFAULT '#6366f1',
  role        user_role NOT NULL DEFAULT 'developer',
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ── Projects ──────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  key         VARCHAR(10) UNIQUE NOT NULL,   -- e.g. "AF"
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'developer',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ── Sprints ───────────────────────────────────────────────────────────────
CREATE TYPE sprint_status AS ENUM ('planned', 'active', 'completed');

CREATE TABLE sprints (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  goal        TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      sprint_status NOT NULL DEFAULT 'planned',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sprints_project ON sprints(project_id);

-- ── Workflow States ───────────────────────────────────────────────────────
CREATE TABLE workflow_states (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  key         VARCHAR(50) NOT NULL,          -- e.g. "in-progress"
  color       VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  position    INTEGER NOT NULL DEFAULT 0,    -- display order
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(project_id, key)
);

CREATE TABLE workflow_transitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_state_id   UUID NOT NULL REFERENCES workflow_states(id),
  to_state_id     UUID NOT NULL REFERENCES workflow_states(id),
  label           VARCHAR(100) NOT NULL,
  guard_condition TEXT,
  allowed_roles   user_role[] NOT NULL DEFAULT '{admin,developer}',
  UNIQUE(from_state_id, to_state_id)
);

-- ── Tickets ───────────────────────────────────────────────────────────────
CREATE TYPE ticket_type     AS ENUM ('story', 'task', 'bug', 'epic');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id       UUID REFERENCES sprints(id) ON DELETE SET NULL,
  state_id        UUID NOT NULL REFERENCES workflow_states(id),
  type            ticket_type NOT NULL DEFAULT 'task',
  priority        ticket_priority NOT NULL DEFAULT 'medium',
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  story_points    SMALLINT CHECK (story_points > 0 AND story_points <= 100),
  assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id     UUID NOT NULL REFERENCES users(id),
  ticket_number   SERIAL,         -- project-scoped number, e.g. AF-42
  parent_id       UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_project   ON tickets(project_id);
CREATE INDEX idx_tickets_sprint    ON tickets(sprint_id);
CREATE INDEX idx_tickets_state     ON tickets(state_id);
CREATE INDEX idx_tickets_assignee  ON tickets(assignee_id);

-- ── Comments ──────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_ticket ON comments(ticket_id);

-- ── Audit Log ─────────────────────────────────────────────────────────────
CREATE TYPE audit_action AS ENUM (
  'ticket.created', 'ticket.updated', 'ticket.deleted',
  'ticket.status_changed', 'ticket.assigned',
  'sprint.started', 'sprint.completed',
  'member.added', 'member.removed', 'member.role_changed'
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES users(id),
  action      audit_action NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  payload     JSONB,                        -- diff or context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_project    ON audit_logs(project_id, created_at DESC);
CREATE INDEX idx_audit_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor      ON audit_logs(actor_id);

-- ── CI/CD Pipeline Runs ───────────────────────────────────────────────────
CREATE TYPE run_status AS ENUM ('running', 'pass', 'fail', 'cancelled');

CREATE TABLE pipeline_runs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_number    INTEGER NOT NULL,
  branch        VARCHAR(255) NOT NULL,
  commit_sha    CHAR(40),
  commit_msg    TEXT,
  status        run_status NOT NULL DEFAULT 'running',
  coverage_pct  NUMERIC(5,2),
  duration_ms   INTEGER,
  triggered_by  UUID REFERENCES users(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX idx_runs_project ON pipeline_runs(project_id, started_at DESC);

CREATE TABLE pipeline_stages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id      UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  status      run_status NOT NULL DEFAULT 'running',
  position    SMALLINT NOT NULL,
  duration_ms INTEGER,
  log_output  TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_stages_run ON pipeline_stages(run_id);

-- ── Updated-at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','projects','sprints','tickets','comments'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END; $$;
