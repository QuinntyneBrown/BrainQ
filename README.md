# BrainQ

> A personal knowledge graph for the things you can't afford to forget — notes, ideas, projects, people, and commitments — with structured query and semantic search over a single graph.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4.svg)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031.svg)](https://angular.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B%20pgvector-336791.svg)](https://github.com/pgvector/pgvector)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Support](#support)
- [Security](#security)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

BrainQ is a single-user personal knowledge graph. One person captures notes, ideas, projects, people, and commitments through one Angular SPA, against one ASP.NET Core API, against one PostgreSQL database with the `pgvector` extension. The schema is a graph in relational form — typed entities connected by typed edges — so new kinds of knowledge fit without structural changes.

BrainQ is part of the **Q-Suite** and serves as the canonical store for [Commitments](https://github.com/QuinntyneBrown/Commitments) and [RecallQ](https://github.com/QuinntyneBrown/RecallQ).

## Features

- **Unified capture.** A single text input infers entity type (Person, Project, Commitment, Note, Idea); manual override is one tap.
- **Typed graph.** Every relationship is a typed edge (`mentions`, `blocks`, `fulfills`, `relatesTo`); no foreign-key sprawl as new types appear.
- **Structured query.** Filter by type, attribute, date range, or related entity with deterministic results.
- **Semantic search.** Vector similarity over entity content (`pgvector`) ranks results across all types.
- **Today surface.** Greeting, capture prompt, commitments due, soft nudges, recently touched entities — every session.
- **Commitment streaks.** Per-commitment activity log, derived streak, year heatmap.
- **Responsive.** Mobile-first from xs (<576px) through xl (≥1200px); ambient context at xl without extra interaction.
- **Personalization.** Theme, accent, density — local, no account.
- **Operational hardening.** Health checks, rate limiting, security headers, structured JSON logs.

## Architecture

Three containers, one repo:

```
┌─────────────┐    HTTPS    ┌──────────────────┐    Npgsql + pgvector    ┌─────────────────────┐
│ brain-q SPA │ ──────────▶ │   brain-q API    │ ──────────────────────▶ │ PostgreSQL 16 +     │
│ (Angular 21)│             │  (ASP.NET Core   │                         │ pgvector            │
│             │             │   minimal API)   │                         │ Entity / Edge /     │
│             │             │                  │                         │ CommitmentActivity  │
└─────────────┘             └──────────────────┘                         └─────────────────────┘
                                     │
                                     ▼
                           Embeddings provider
                          (Ollama or hosted API)
```

- **No microservices, no message broker, no cache.** Radical simplicity (L1-012).
- **Three tables.** `Entity`, `Edge`, `CommitmentActivity`. Type-specific shape lives in `Entity.Attributes` (JSONB).
- **Two domain implementations.** `BRAIN_Q_DATA` injection token has an HTTP impl for prod and an in-memory impl for offline dev / Storybook / unit tests.

See [`docs/detailed-designs/shared/README.md`](docs/detailed-designs/shared/README.md) for the full system context, container, and class diagrams.

## Repository Layout

```
BrainQ/
├── backend/
│   ├── BrainQ.sln
│   ├── src/BrainQ.Api/              # ASP.NET Core minimal API (.NET 10)
│   └── tests/BrainQ.Api.Tests/      # xUnit integration tests
├── frontend/
│   ├── angular.json
│   └── projects/
│       ├── components/              # @brainq/components — atoms/molecules/organisms (`bq` prefix)
│       ├── domain/                  # BrainQDataService contract + BRAIN_Q_DATA token
│       └── brain-q/                 # the application
├── docs/
│   ├── specs/                       # L1 (high-level) and L2 (detailed) requirements
│   ├── detailed-designs/            # vertical slice designs + PlantUML diagrams
│   └── user-guide/                  # end-user documentation
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
└── SUPPORT.md
```

## Getting Started

### Prerequisites

| Tool         | Version  | Notes                                          |
|--------------|----------|------------------------------------------------|
| .NET SDK     | 10.0+    | Backend API                                     |
| Node.js      | 20 LTS+  | Frontend toolchain                              |
| npm          | 10+      | Bundled with Node                               |
| PostgreSQL   | 16+      | With the [`pgvector`](https://github.com/pgvector/pgvector) extension installed |
| Embeddings   | optional | Local [Ollama](https://ollama.com/) or hosted API |

### 1. Clone

```bash
git clone https://github.com/QuinntyneBrown/BrainQ.git
cd BrainQ
```

### 2. Database

```sql
CREATE DATABASE brainq;
\c brainq
CREATE EXTENSION IF NOT EXISTS vector;
```

Set the connection string:

```bash
# Windows (PowerShell)
$env:ConnectionStrings__BrainQ = "Host=localhost;Database=brainq;Username=postgres;Password=postgres"

# macOS / Linux
export ConnectionStrings__BrainQ="Host=localhost;Database=brainq;Username=postgres;Password=postgres"
```

### 3. Backend

```bash
cd backend
dotnet restore
dotnet ef database update --project src/BrainQ.Api
dotnet run --project src/BrainQ.Api
```

The API listens on `https://localhost:5001` by default. OpenAPI is at `/swagger`.

### 4. Frontend

```bash
cd frontend
npm install
ng serve brain-q
```

The SPA is at `http://localhost:4200`.

## Development

### Useful commands

| Task                          | Command                                              |
|-------------------------------|------------------------------------------------------|
| Backend run                   | `dotnet run --project backend/src/BrainQ.Api`        |
| Backend unit + integration    | `dotnet test backend/BrainQ.sln`                     |
| Frontend dev server           | `ng serve brain-q` (in `frontend/`)                  |
| Frontend build                | `ng build brain-q`                                   |
| Frontend unit (Vitest)        | `ng test`                                            |
| Frontend e2e (Playwright)     | `npx playwright test` (in `frontend/`)               |
| Generate component            | `ng generate component <name> --project components`  |

### Conventions

- **Vertical slices.** Each feature ends in a Playwright e2e test (Page Object Model) at `frontend/e2e/`.
- **Tokens-only styling.** Component SCSS is layout/spacing; visual design comes from `components/styles/tokens.scss`.
- **Signals, not NgRx.** State is `signal` / `computed` / `effect`.
- **No service layer.** The API controller talks to `AppDbContext` directly — no MediatR, no AutoMapper, no repository interface.

## Testing

Every requirement traces from `docs/specs/L1.md` → `docs/specs/L2.md` → a slice in `docs/detailed-designs/` → a Playwright spec under `frontend/e2e/`. Backend integration tests sit alongside in `backend/tests/BrainQ.Api.Tests/`.

```bash
# Full check
dotnet test backend/BrainQ.sln
cd frontend && ng test && npx playwright test
```

## Documentation

| Document                                                    | Purpose                                              |
|-------------------------------------------------------------|------------------------------------------------------|
| [`docs/specs/L1.md`](docs/specs/L1.md)                      | High-level requirements                              |
| [`docs/specs/L2.md`](docs/specs/L2.md)                      | Detailed requirements with acceptance criteria       |
| [`docs/detailed-designs/00-index.md`](docs/detailed-designs/00-index.md) | Slice index + status                     |
| [`docs/detailed-designs/shared/README.md`](docs/detailed-designs/shared/README.md) | System architecture, C4 diagrams, domain model |
| [`docs/user-guide/README.md`](docs/user-guide/README.md)    | End-user documentation                               |

## Roadmap

Slice progress is tracked in [`docs/detailed-designs/00-index.md`](docs/detailed-designs/00-index.md).

- ✅ Slice 01 — Entity Capture
- ✅ Slice 02 — Entity Browse
- ✅ Slice 03 — Entity Detail + Edges
- ✅ Slice 04 — Semantic Search
- ✅ Slice 05 — Today Surface
- ✅ Slice 06 — Commitment Activity
- ✅ Slice 07 — Personalization
- ✅ Slice 08 — Operational Hardening

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request, and abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

- **Bugs:** [open a bug report](https://github.com/QuinntyneBrown/BrainQ/issues/new?template=bug_report.md)
- **Features:** [open a feature request](https://github.com/QuinntyneBrown/BrainQ/issues/new?template=feature_request.md)
- **Questions:** see [SUPPORT.md](SUPPORT.md)

## Support

See [SUPPORT.md](SUPPORT.md) for ways to get help and the support policy for this project.

## Security

If you believe you have found a security vulnerability, please follow the responsible-disclosure process documented in [SECURITY.md](SECURITY.md). **Do not** open a public issue.

## Code of Conduct

This project has adopted a Contributor Covenant–based [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## License

BrainQ is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [pgvector](https://github.com/pgvector/pgvector) — vector similarity for PostgreSQL
- [Angular](https://angular.dev/) and [.NET](https://dotnet.microsoft.com/) — the platforms this is built on
- [Q-Suite](https://github.com/QuinntyneBrown) — sibling apps ([Commitments](https://github.com/QuinntyneBrown/Commitments), [RecallQ](https://github.com/QuinntyneBrown/RecallQ))
