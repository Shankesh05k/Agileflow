<div align="center">

<h1>AgileFlow</h1>

<p>A full-stack SaaS Agile project management system — AI-assisted ticket creation, Kanban board, sprint planning, velocity analytics, role-based access control, and a CI/CD pipeline view.</p>

[![CI](https://github.com/Shankesh05k/Agileflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Shankesh05k/Agileflow/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq-F55036)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Overview

AgileFlow is a production-ready project management tool built for engineering teams. It demonstrates a modern full-stack architecture: JWT authentication with refresh-token rotation, role-based access control, a workflow-driven Kanban board, sprint velocity analytics, an immutable audit log, a 4-stage GitHub Actions CI/CD pipeline — and an **AI ticket-draft assistant** that turns a one-line title into a fully drafted ticket.

---

## Features

| Feature | Details |
|---|---|
| ✨ **AI Ticket Draft** | Type a title → Groq (free-tier LLM) drafts the description, type, priority and story points; you review and edit before saving |
| 🗂 **Kanban Board** | Drag-and-drop tickets across workflow states with sprint filtering |
| 🏃 **Sprint Management** | Create, start and complete sprints with story-point progress tracking |
| 📊 **Velocity Analytics** | Canvas-rendered bar chart — planned vs completed points per sprint |
| 🔐 **Auth & RBAC** | JWT access + refresh token rotation; Admin / Developer / Viewer roles |
| 🔀 **Workflow Engine** | State-machine transitions guarded by role — tickets move only along allowed paths |
| 📋 **Audit Log** | Immutable record of every create / update / move / delete with JSONB diffs |
| 🚦 **CI Pipeline View** | Stage-level GitHub Actions run status with pass/fail indicators |
| 🛡 **Security** | Helmet, CORS, rate limiting, bcrypt password hashing |
| 🧪 **Testing** | Jest + Supertest (backend), Vitest (frontend), Cypress E2E |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Zustand, React Router v6, CSS Modules |
| **Backend** | Node.js 20, Express 4, TypeScript, express-validator |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (access 15m + refresh 7d, rotated), bcrypt |
| **AI** | Groq free-tier inference (`openai/gpt-oss-20b`), via Node 20 built-in `fetch` |
| **Testing** | Jest, Supertest, Vitest, Cypress |
| **DevOps** | Docker Compose, GitHub Actions CI/CD |

---

## AI Ticket-Draft Assistant

In the **New Ticket** modal, type a short title and click **AI Draft**. A Groq-hosted LLM generates the ticket's `description`, `type`, `priority` and `story_points`, which populate the form for you to review and edit before saving — it never auto-submits.

| Aspect | Detail |
|---|---|
| **Endpoint** | `POST /api/tickets/ai-draft` — auth + `admin`/`developer` role + 10 req/min rate limit |
| **Provider** | [Groq](https://console.groq.com) free tier (no credit card required) |
| **Model** | `openai/gpt-oss-20b` (OpenAI-compatible, JSON mode); set via `GROQ_MODEL` so it can be swapped if retired |
| **Robustness** | Output is validated & clamped to valid enums/ranges; any failure returns HTTP 502 and the UI shows "AI draft unavailable" — manual creation is unaffected |
| **Footprint** | No new dependency — uses Node 20's built-in `fetch` |

**Setup:** get a free key at [console.groq.com](https://console.groq.com), then set `GROQ_API_KEY` in `backend/.env`.

**How it works:** `TicketModal.tsx` → `POST /api/tickets/ai-draft` → `draftTicket` controller → `generateTicketDraft` (`services/ai.ts`) builds a prompt, calls Groq with `response_format: json_object` and a 15s timeout, validates the result, and returns the draft JSON, which the frontend writes into the form fields.

---

## Getting Started

### Prerequisites

- **Docker** (recommended) — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Or** Node.js 20+ and PostgreSQL 16
- A free **Groq API key** for the AI feature — [console.groq.com](https://console.groq.com)

### Option A — Docker Compose *(recommended)*

```bash
git clone https://github.com/Shankesh05k/Agileflow.git
cd Agileflow
cp .env.example .env          # set DB password, JWT secrets, and GROQ_API_KEY
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

### Option B — Local (without Docker)

**1. Database**

```bash
createdb agileflow
psql -d agileflow -f database/schema.sql
psql -d agileflow -f database/seed.sql
```

**2. Backend**

```bash
cd backend
npm install
cp ../.env.example .env     # set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, GROQ_API_KEY
npm run dev                 # ts-node-dev → auto-reload on :4000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev                 # Vite dev server → :5173
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | alice@agileflow.dev | password |
| Developer | sam@agileflow.dev | password |
| Developer | maya@agileflow.dev | password |
| Viewer | dan@agileflow.dev | password |

---

## Project Structure

```
agileflow/
├── .github/
│   └── workflows/
│       └── ci.yml                  # 4-job CI/CD pipeline
├── backend/
│   ├── src/
│   │   ├── controllers/            # Route handlers (auth, tickets, sprints, workflow)
│   │   ├── db/                     # PostgreSQL connection pool + query helpers
│   │   ├── middleware/             # JWT auth, RBAC, validation
│   │   ├── routes/                 # Express router + middleware wiring
│   │   ├── services/               # audit.ts (audit log) · ai.ts (Groq ticket draft)
│   │   └── types/                  # Shared TypeScript types
│   └── tests/
│       ├── integration/            # Supertest API tests
│       └── unit/                   # Unit tests (incl. ai.test.ts)
├── cypress/
│   ├── e2e/                        # End-to-end specs
│   └── support/                    # Custom commands (loginAs)
├── database/
│   ├── schema.sql                  # Full PostgreSQL schema
│   └── seed.sql                    # Demo data
├── frontend/
│   ├── src/
│   │   ├── components/             # Shared UI + Layout + TicketModal (AI Draft button)
│   │   ├── lib/                    # API client (auto-refresh JWT) + api.test.ts
│   │   ├── pages/                  # Route-level page components
│   │   ├── store/                  # Zustand auth store
│   │   └── types/                  # Frontend TypeScript types
│   └── Dockerfile                  # Multi-stage build → nginx
├── docker-compose.yml
├── cypress.config.ts
└── .env.example
```

---

## API Reference

All endpoints require `Authorization: Bearer <accessToken>` unless marked public.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Obtain access + refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token |
| `GET` | `/api/auth/me` | ✓ | Current user profile |

### Tickets
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | Any | List tickets (`?sprint_id=` filter) |
| `POST` | `/api/tickets/ai-draft` | Dev+ | **AI:** draft description/type/priority/points from a title |
| `POST` | `/api/tickets` | Dev+ | Create ticket |
| `PATCH` | `/api/tickets/:id` | Dev+ | Update ticket |
| `DELETE` | `/api/tickets/:id` | Admin | Delete ticket |
| `POST` | `/api/tickets/:id/move` | Dev+ | Move to new workflow state |

### Sprints
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/sprints` | Any | List sprints with progress stats |
| `POST` | `/api/sprints` | Admin | Create sprint |
| `POST` | `/api/sprints/:id/start` | Admin | Start sprint |
| `POST` | `/api/sprints/:id/complete` | Admin | Complete sprint |
| `GET` | `/api/sprints/velocity` | Any | Velocity data for Analytics |

### Other
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/workflow/states` | Any | All workflow states |
| `GET` | `/api/workflow/transitions` | Any | All transitions |
| `GET` | `/api/audit` | Admin | Immutable audit log |

---

## Running Tests

```bash
# Backend — unit + integration
cd backend
npm test
npm run test:coverage     # enforces line-coverage gate

# Frontend — unit tests
cd frontend
npm test

# E2E — requires both servers running
npx cypress open          # interactive
npx cypress run           # headless CI mode
```

---

## CI/CD Pipeline

Every push and pull request runs the full pipeline via GitHub Actions:

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌──────────────┐
│   Backend   │    │    Frontend      │    │    Docker    │    │  Cypress E2E │
│             │    │                  │    │              │    │  (main only) │
│ ESLint      │    │ ESLint           │    │ Build API    │    │              │
│ Jest        │───▶│ tsc --noEmit     │───▶│ image        │───▶│ Full E2E run │
│ coverage    │    │ Vitest           │    │ Build web    │    │              │
└─────────────┘    └──────────────────┘    │ image        │    └──────────────┘
                                           └──────────────┘
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit the real `.env`** — keep secrets out of `.env.example` too.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `PORT` | `4000` | Backend server port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed origins (space-separated) |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Frontend API base URL |
| `GROQ_API_KEY` | — | Free Groq key for the AI ticket-draft feature |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model used for AI drafts |

Generate JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Deployment

| Service | Provider | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Connect GitHub repo, set `VITE_API_BASE_URL` |
| Backend | [Render](https://render.com) | Web service, set all env vars (incl. `GROQ_API_KEY`) |
| Database | [Neon](https://neon.tech) | Serverless PostgreSQL, free tier available |

---

## Contributing

1. Fork the repo
2. Create a feature branch — `git checkout -b feat/your-feature`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push and open a pull request

---

## License

[MIT](LICENSE) © 2024 AgileFlow
