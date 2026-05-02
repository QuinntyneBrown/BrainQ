# Detailed Designs — Index

BrainQ designs are split into vertical slices. Each slice ends in a Playwright e2e acceptance test (Page Object Model) that exercises the slice end-to-end against a running frontend + API. Slices can be implemented in numerical order; later slices assume earlier ones have shipped.

Start with **[shared/README.md](shared/README.md)** for the system-wide architecture, then read the slices in order.

| # | Slice | Status | Traces to | Description |
|---|-------|--------|-----------|-------------|
| — | [Shared Architecture](shared/README.md) | Draft | L1-001, L1-007, L1-008, L1-012, L2-020 | System context, container, domain model, frontend↔backend split |
| 01 | [Entity Capture](01-capture/README.md) | Draft | L2-001, L2-003, L2-011, L2-024, L2-015 | Capture sheet → POST /api/entities, type inference, suggested links |
| 02 | [Entity Browse](02-browse/README.md) | Draft | L2-003, L2-005, L2-009, L2-027, L2-010 | Brain screen filter chips, structured query, RecallQ band |
| 03 | [Entity Detail + Edges](03-detail-edges/README.md) | Complete | L2-002, L2-003, L2-004, L2-026 | Detail screen, edge chips, Mentioned-by, Neighborhood pane |
| 04 | [Semantic Search](04-semantic-search/README.md) | Complete | L2-006, L2-007, L2-012 | Embedding generation, GET /api/search, structured/semantic toggle |
| 05 | [Today Surface](05-today/README.md) | Complete | L2-022, L1-013 | Today screen agenda, nudges, recently touched |
| 06 | [Commitment Activity](06-commitment-activity/README.md) | Complete | L2-008, L2-023 | CommitmentActivity table, log endpoint, derived streak + heatmap |
| 07 | [Personalization](07-tweaks/README.md) | Complete | L2-025, L1-014 | Tweaks panel, theme/accent/density, localStorage |
| 08 | [Operational Hardening](08-ops/README.md) | Draft | L2-015, L2-016, L2-017, L2-018, L2-019 | Validation, HTTPS/CSP, rate limiting, health, structured logs |

## Conventions every slice follows

- **Vertical:** one slice = one user-visible behavior, end-to-end (UI → API → DB).
- **Existing frontend wins:** start from the current Angular code under `frontend/projects/brain-q`. The HTTP-backed `BrainQDataService` replaces the in-memory one without changing screens or components beyond what the slice spells out.
- **Same patterns:** new domain implementations go behind the existing `BRAIN_Q_DATA` `InjectionToken`. New cross-cutting services use `InjectionToken<T>` and an interface, never a class type, as the DI key.
- **Radically simple:** no service layer, no repository interface, no MediatR, no AutoMapper. Controller talks to `AppDbContext` directly. One ASP.NET Core project + one Angular app + one Postgres database (L2-020).
- **Responsive:** every slice's UI changes are verified on xs (375px), md (768px), and xl (1440px) viewports in Playwright.
- **POM-tested:** each slice ships one `*.page.ts` Page Object and one `*.spec.ts` test suite under `frontend/e2e/`.
