# AgileFlow

A SaaS-based Agile project management system built with React, Node.js, PostgreSQL, and Docker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Zustand, React Router v6 |
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Testing | Jest + Supertest (backend), Vitest + Cypress (frontend/E2E) |
| DevOps | Docker Compose, GitHub Actions CI/CD |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node.js 20 + PostgreSQL 16 (local setup)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/agileflow.git
cd agileflow
cp .env.example .env
# Edit .env — update DB password and JWT secrets
```

### 2. Start with Docker Compose (recommended)

```bash
docker compose up --build
```

Services:
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:4000
- **PostgreSQL** → localhost:5432

### 3. Local development (without Docker)

**Database**

```bash
# Create database and apply schema
createdb agileflow
psql -d agileflow -f database/schema.sql
psql -d agileflow -f database/seed.sql
```

**Backend**

```bash
cd backend
npm install
npm run dev          # ts-node-dev with auto-reload on :4000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev          # Vite dev server on :5173
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | alice@agileflow.dev | Password123! |
| Developer | sam@agileflow.dev | Password123! |
| Developer | maya@agileflow.dev | Password123! |
| Viewer | dan@agileflow.dev | Password123! |

---

## Project Structure

```
agileflow/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions pipeline
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── db/                 # PostgreSQL pool
│   │   ├── middleware/         # Auth, validation, RBAC
│   │   ├── routes/             # Express router
│   │   ├── services/           # Audit logging service
│   │   ├── types/              # Shared TypeScript types
│   │   └── index.ts            # Express app entry point
│   └── tests/
│       ├── integration/        # Supertest API tests
│       └── unit/               # Unit tests
├── cypress/
│   ├── e2e/                    # Cypress E2E specs
│   └── support/                # Custom commands
├── database/
│   ├── schema.sql              # Full PostgreSQL schema
│   └── seed.sql                # Demo data
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI components + Layout
│   │   ├── lib/                # API client (auto-refresh JWT)
│   │   ├── pages/              # Route-level page components
│   │   ├── store/              # Zustand auth store
│   │   └── types/              # Frontend TypeScript types
│   └── Dockerfile              # Multi-stage build → nginx
├── docker-compose.yml
├── cypress.config.ts
└── .env.example
```

---

## Features

### Kanban Board
- Drag-and-drop tickets between workflow states
- Sprint filter
- Create / edit / delete tickets (role-gated)

### Sprint Management
- Create sprints, start and complete them
- Progress bars showing story-point completion

### Analytics
- Velocity chart (Canvas 2D) — planned vs completed story points per sprint
- Predictability score

### Team & RBAC
- Three roles: **Admin**, **Developer**, **Viewer**
- Permission matrix visible in the Team page
- Role-based API guards on every sensitive route

### Audit Log
- Immutable log of all create / update / delete / move actions
- JSONB diff payload for each entry

### CI Pipeline View
- Mock GitHub Actions pipeline runs with stage-level status chips

---

## API Reference

All routes require `Authorization: Bearer <accessToken>` unless noted.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Obtain access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tickets` | List tickets (sprint filter via `?sprint_id=`) |
| POST | `/api/tickets` | Create ticket |
| PATCH | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket (Admin only) |
| POST | `/api/tickets/:id/move` | Move ticket to new workflow state |
| GET | `/api/sprints` | List sprints |
| POST | `/api/sprints` | Create sprint (Admin only) |
| POST | `/api/sprints/:id/start` | Start sprint (Admin only) |
| POST | `/api/sprints/:id/complete` | Complete sprint (Admin only) |
| GET | `/api/sprints/:id/velocity` | Velocity data for Analytics |
| GET | `/api/workflow/states` | All workflow states |
| GET | `/api/workflow/transitions` | All transitions |
| GET | `/api/workflow/available/:stateId` | States reachable from given state |
| GET | `/api/audit` | Audit log (Admin only) |

---

## Running Tests

### Backend unit + integration tests

```bash
cd backend
npm test
npm run test:coverage   # enforces 80 % line coverage
```

### Frontend unit tests

```bash
cd frontend
npm test
```

### Cypress E2E tests

```bash
# Requires both frontend and backend to be running
npx cypress open        # interactive
npx cypress run         # headless
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Backend** — ESLint → Jest + Supertest → 80 % coverage gate
2. **Frontend** — ESLint → TypeScript type-check → Vitest unit tests
3. **Docker** — `docker build` smoke test for both images
4. **E2E** — Cypress (main branch only)

---

## Environment Variables

See `.env.example` for all available variables with descriptions.

Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) |
| `PORT` | Backend server port (default 4000) |
| `VITE_API_BASE_URL` | Frontend API base URL |

---

## License

MIT
