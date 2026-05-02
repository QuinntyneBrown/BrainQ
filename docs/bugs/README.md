# Bugs Log

Each bug gets one file, numbered sequentially. The bug file describes the issue, the failing test (or manual reproduction step), and links to the commit that fixed it.

| # | Title | Status | Discovered |
|---|---|---|---|
| 0001 | [Postgres not runnable locally — no docker-compose, service down](0001-postgres-not-runnable-locally.md) | Fixed | 2026-05-02 |
| 0002 | [e2e specs reference a non-existent fixtures.ts](0002-missing-playwright-fixtures.md) | Fixed | 2026-05-02 |
| 0003 | [brain.md user guide describes labels that don't match the implementation](0003-brain-user-guide-mismatch.md) | Fixed | 2026-05-02 |
| 0004 | [GET /api/entities returns Commitments with empty meta.streak / meta.todayDone](0004-entities-list-doesnt-hydrate-commitment-meta.md) | Fixed | 2026-05-02 |
| 0005 | [Production CSP blocks Google Fonts; design typography never loads](0005-csp-blocks-google-fonts.md) | Fixed | 2026-05-02 |
| 0006 | [Side rail and user guide promise an N shortcut that is never bound](0006-n-keyboard-shortcut-unbound.md) | Fixed | 2026-05-02 |
| 0007 | [Today screen footer ships hardcoded counts and a fake synced timestamp](0007-today-footer-hardcoded.md) | Fixed | 2026-05-02 |
| 0008 | [bq-search-bar [autofocus] doesn't reliably focus on route navigation](0008-search-bar-autofocus-unreliable.md) | Fixed | 2026-05-02 |
| 0009 | [getting-started.md misnames the type glyphs](0009-getting-started-glyph-names.md) | Fixed | 2026-05-02 |
| 0010 | [Esc shortcut documented but never bound](0010-esc-shortcut-unbound.md) | Fixed | 2026-05-02 |
| 0011 | [heatmapFor(id) over-fetches /api/commitments/{id}/activity](0011-heatmap-duplicate-fetches.md) | Fixed | 2026-05-02 |
| 0012 | [Delete / edge / commitment-log failures roll back silently (no toast)](0012-silent-write-failures.md) | Fixed | 2026-05-02 |
| 0013 | [Stale /api/search response can overwrite the current results](0013-semantic-search-stale-response.md) | Fixed | 2026-05-02 |
| 0014 | [Detail screen renders empty cells for unset Commitment / Person / Project meta](0014-detail-empty-meta-cells.md) | Fixed | 2026-05-02 |
| 0015 | [Detail's More menu doesn't close on outside click](0015-more-menu-no-outside-click.md) | Fixed | 2026-05-02 |
| 0016 | [Deleting an entity leaves a stale nudge in the agenda](0016-deleted-entity-leaves-stale-nudge.md) | Fixed | 2026-05-02 |
| 0017 | [No proxy config; frontend dev server can't reach the API](0017-no-frontend-proxy.md) | Fixed | 2026-05-02 |
| 0018 | [Today nudges are not keyboard-accessible](0018-nudge-not-keyboard-accessible.md) | Fixed | 2026-05-02 |
| 0019 | [Detail's Connections section renders empty when every edge target is deleted](0019-detail-connections-empty-when-targets-deleted.md) | Fixed | 2026-05-02 |
| 0020 | [POST /api/entities doesn't accept tags; e2e seedEntity silently drops them](0020-create-entity-doesnt-accept-tags.md) | Fixed | 2026-05-02 |
| 0021 | [Missing EF Core migrations for Edge and CommitmentActivity](0021-missing-edge-commitment-migrations.md) | Fixed | 2026-05-02 |
| 0022 | [SearchScreen semantic mode fires /api/search per keystroke](0022-search-no-debounce.md) | Fixed | 2026-05-02 |
| 0023 | [refresh() exists on HttpBrainQDataService but isn't on the BrainQDataService interface](0023-refresh-not-on-interface.md) | Fixed | 2026-05-02 |
