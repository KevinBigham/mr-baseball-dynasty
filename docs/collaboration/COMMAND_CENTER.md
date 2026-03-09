# COMMAND_CENTER.md

## Current sprint
Sprint 04 — Green Branch + Promotion Prep

## Shared branch
`claude/baseball-dynasty-sim-UjlF2`

## Active sessions

| Agent | Branch | Session / PR | Status | Last updated |
|---|---|---|---|---|
| Claude (Opus 4.6) | `claude/baseball-dynasty-sim-UjlF2` | `session_011dsEjrELHhenEUteCnsDCH` | pushed / review | 2026-03-08 |
| Codex (GPT-5.4) | `work` (local-only) | no PR — origin missing | in progress / blocked on push | 2026-03-08 |

## Lane ownership

### Codex
Owner: control-plane, green-branch work, readiness, diagnostics, CI/test/build truth

### Claude
Owner: cadence surfaces, targeted tests, promotion packet

## Hot files
- Shell.tsx
- uiStore.ts
- worker.ts
- src/features/*
- save/persistence files

## Merge rule
Nothing is "shared" until pushed.
Nothing is "done" until reported.
Nothing is "promoted" until reviewed.

## Current blockers
- PR #11 is not merge-ready.
- `npm run typecheck` fails on the shared branch (334 TS errors reported by Claude).
- `npm run test` fails due to a stale `tests/engine/pythagoreanWins.test.ts` assertion and smoke coverage drift.
- `npm run build` is blocked by the current typecheck failures.
- Codex environment has no `origin`, so Codex cannot push or open a PR directly.

## Next architect decision
- Claude owns branch surgery until `typecheck`, `test`, and `build` are all green.
- Codex owns a docs-first `Player Personality & Chemistry RFC v1`.
- No new feature implementation begins until branch health is green.
