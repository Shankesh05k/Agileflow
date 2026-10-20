<div align="center">

<h1>AgileFlow</h1>

<p>A full-stack SaaS Agile project management system — Kanban board, sprint planning, velocity analytics, role-based access control, and a CI/CD pipeline view.</p>

[![CI](https://github.com/Shankesh05k/Agileflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Shankesh05k/Agileflow/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Overview

AgileFlow is a production-ready project management tool built for engineering teams. It demonstrates a modern full-stack architecture with JWT authentication, RBAC, real-time Kanban workflows, sprint velocity analytics, an immutable audit log, and a 4-stage GitHub Actions CI/CD pipeline.

> **Live demo** · [agileflow.dev](https://agileflow.dev) *(coming soon)*

---

## Screenshots

> Dashboard · Kanban Board · Analytics · Sprint Management

*(Add screenshots here once deployed)*

---

## Features

| Feature | Details |
|---|---|
| 🗂 **Kanban Board** | Drag-and-drop tickets across workflow states with sprint filtering |
| 🏃 **Sprint Management** | Create, start and complete sprints with story-point progress tracking |
| 📊 **Velocity Analytics** | Canvas-rendered bar chart — planned vs completed points per sprint |
| 🔐 **Auth & RBAC** | JWT access + refresh token rotation; Admin / Developer / Viewer roles |
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
| **Auth** | JWT (access 15m + refresh 7d), bcrypt |
| **Testing** | Jest, Supertest, Vitest, Cypress |
| **DevOps** | Docker Compose, GitHub Actions CI/CD |

---

## Getting Started

### Prerequisites

- **Docker** (recommended) — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Or** Node.js 20+ and PostgreSQL 16

### Option A — Docker Compose *(recommended)*

```bash
git clone https://github.com/Shankesh05k/Agileflow.git
cd Agileflow
cp .env.example .env          # update DB password + JWT secrets
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
npm run dev        # ts-node-dev → auto-reload on :4000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev        # Vite dev server → :5173
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
│   │   ├── controllers/            # Route handlers
│   │   ├── db/                     # PostgreSQL connection pool
│   │   ├── middleware/             # JWT auth, RBAC, validation
│   │   ├── routes/                 # Express router
│   │   ├── services/               # Audit log service
│   │   └── types/                  # Shared TypeScript types
│   └── tests/
│       ├── integration/            # Supertest API tests
│       └── unit/                   # Unit tests
├── cypress/
│   ├── e2e/                        # End-to-end specs
│   └── support/                    # Custom commands (loginAs)
├── database/
│   ├── schema.sql                  # Full PostgreSQL schema
│   └── seed.sql                    # Demo data
├── frontend/
│   ├── src/
│   │   ├── components/             # Shared UI + Layout
│   │   ├── lib/                    # API client (auto-refresh JWT)
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
npm run test:coverage     # enforces 80% line coverage gate

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
│ 80% coverage│    │ Vitest           │    │ Build web    │    │              │
└─────────────┘    └──────────────────┘    │ image        │    └──────────────┘
                                           └──────────────┘
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `PORT` | `4000` | Backend server port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed origins (space-separated) |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Frontend API base URL |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Deployment

| Service | Provider | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Connect GitHub repo, set `VITE_API_BASE_URL` |
| Backend | [Render](https://render.com) | Web service, set all env vars |
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
