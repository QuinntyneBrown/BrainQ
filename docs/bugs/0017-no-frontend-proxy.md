# Bug 0017 — No proxy config; frontend dev server can't reach the API

## Symptom

`appsettings.Development.json` runs the API on `http://localhost:5159`. The Angular dev server (`ng serve`) defaults to `http://localhost:4200` (or `:4201` per `playwright.config.ts`'s `webServer.command`). The SPA's HTTP service uses `provideBrainQHttpDomain({ baseUrl: '/api' })`, so every fetch goes to a relative path on **the dev server's** origin — `http://localhost:4201/api/entities`, `/api/today`, `/health`, etc.

There's no `proxy.conf.json` in the repo and `angular.json`'s `serve.options` doesn't reference one. So:

1. `GET /api/entities` lands on the dev server, which doesn't know about it → SPA fallback returns `index.html` with `Content-Type: text/html` and status 200. The HTTP client tries to parse the HTML as `BqEntity[]` and silently fails (no error handler in the hydration call). The Today/Brain screens stay empty.
2. `GET /health` (no `/api` prefix) does the same. The down banner never triggers because the dev server always returns 200 for the SPA shell.

In short: **`docker compose up -d` + `ng serve` + `dotnet run` produces a frontend that can't talk to the backend at all** — every API call resolves to the SPA's index.html. None of the user-facing flows (capture, list, search, log) actually round-trip to the database.

## Reproduction

1. `docker compose up -d` (bug 0001 fix).
2. `dotnet run --project backend/src/BrainQ.Api` — `[2026-05-02 …] Now listening on: http://localhost:5159`.
3. `cd frontend && npm start` — `Local: http://localhost:4200/`.
4. Open a browser at `http://localhost:4200`.
5. devtools → Network → filter `/api/`. Every request returns `200 OK` with `Content-Type: text/html` (the SPA shell), not JSON.
6. Today renders empty greeting, no recent, no nudges.

## Failing test

This is an infra-not-code issue, so no unit test reproduces it cleanly. The repro above is the executable specification: when the fix is in place, `curl -i http://localhost:4201/api/entities` returns `Content-Type: application/json` (proxied to `localhost:5159`), not the SPA shell.

## Fix

Add `frontend/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:5159",
    "secure": false,
    "changeOrigin": true
  },
  "/health": {
    "target": "http://localhost:5159",
    "secure": false,
    "changeOrigin": true
  }
}
```

Wire it into `angular.json` under `projects.brain-q.architect.serve.configurations.development`:

```jsonc
"development": {
  "buildTarget": "brain-q:build:development",
  "proxyConfig": "proxy.conf.json"
}
```

Now `ng serve` forwards `/api/*` and `/health` to the running API; everything the frontend already does Just Works.

## Verification

- `curl -sI http://localhost:4201/api/entities | grep content-type` returns `application/json`.
- Capture a Note from the SPA, refresh the page, the Note is still there (round-tripped to Postgres).
- Stop the API. Refresh. The connection-lost banner appears (because `/health` proxies through and hits a refused connection now).

Status: Fixed in the next two commits.
