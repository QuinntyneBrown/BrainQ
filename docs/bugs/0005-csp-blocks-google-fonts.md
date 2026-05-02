# Bug 0005 — Production CSP blocks Google Fonts; design typography never loads

## Symptom

`frontend/projects/brain-q/src/index.html` loads Inter Tight + JetBrains Mono from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:..." rel="stylesheet" />
```

Production middleware in `Program.cs` writes:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

There's no `font-src` directive (so it falls back to `default-src 'self'`), and `style-src` doesn't whitelist `https://fonts.googleapis.com`. Both the stylesheet link **and** the woff2 file requests are blocked at the CSP layer in production.

Result: a production deployment renders every screen in `system-ui`, completely losing the design system's typography (`tokens.scss` declares `--bq-font-sans: "Inter Tight"` and `--bq-font-mono: "JetBrains Mono"`). Local dev is unaffected because the CSP middleware only mounts when `app.Environment.IsDevelopment()` is false.

## Reproduction

```
ASPNETCORE_ENVIRONMENT=Production dotnet run --project backend/src/BrainQ.Api
# point a browser at the SPA against this server
# devtools console: "Refused to load the stylesheet 'https://fonts.googleapis.com/...' because it violates the following Content Security Policy directive: 'style-src 'self' 'unsafe-inline''."
```

## Failing test

A new xUnit assertion in `OpsTests.cs` confirms the production CSP whitelists `https://fonts.googleapis.com` for stylesheets and `https://fonts.gstatic.com` for fonts. Today it fails because neither origin is mentioned.

## Fix

Extend the production CSP middleware to allow Google Fonts:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
```

No frontend change; `index.html` already does the right thing.

## Verification

- Updated test passes.
- Production deploy renders `Inter Tight` (devtools → Computed → font-family resolves to Inter Tight, no console CSP violation).

Status: Fixed in the next two commits.
