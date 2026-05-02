# Bug 0012 — Delete / edge / commitment-log failures roll back silently (no toast)

## Symptom

`docs/user-guide/troubleshooting.md` promises:

> Writes will fail. Captures, deletes, edge mutations, and commitment logs that hit the server during an outage roll back optimistically — you'll see a `Save failed — try again` toast.

The `App` component shows the toast by watching `BrainQDataService.captureFailures` and incrementing a `seenCaptureFailures` counter. Only `HttpBrainQDataService.capture()` increments that signal. The other four mutators — `removeEntity`, `addEdge`, `removeEdge`, `logCommitment` — error-handle by reverting `_entities` to the pre-call snapshot but **never bump the counter**, so the user sees their delete/log/edge silently undo with no message.

The slice 01 contract explicitly named the signal `captureFailures`; the slice 03 and slice 06 follow-ups extended the mutation surface but didn't extend the toast.

## Reproduction

1. Disable network (or stop the API).
2. Open a Commitment's Detail screen and hit `Log today`.
3. The ring fills (optimistic), the network call 500s, and the ring snaps back. No toast appears. The user has no idea anything went wrong.

## Failing test

A new unit test on `HttpBrainQDataService` provides `HttpClientTesting`, calls `removeEntity('some-id')`, flushes the DELETE with `{ status: 500 }`, and asserts the failure-counter signal increments by 1. Today the counter stays at 0.

## Fix

1. Rename `captureFailures` → `mutationFailures` on the `BrainQDataService` interface and both implementations (the slice 01 contract was just narrower than reality; the broadened semantics match what the user guide ships).
2. Increment `_mutationFailures` from every mutator's error path: `capture`, `removeEntity`, `addEdge`, `removeEdge`, `logCommitment`.
3. Update `App` to read `data.mutationFailures()` instead of `data.captureFailures()`.

The toast text stays `Save failed — try again`. One shared signal, five increment sites.

## Verification

- New unit test passes.
- Manual: stop the API, log a commitment → the ring rolls back **and** the toast appears.

Status: Fixed in the next two commits.
