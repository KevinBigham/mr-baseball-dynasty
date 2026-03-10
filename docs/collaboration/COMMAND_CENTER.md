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
- P0: Front Office setup flow can fail to advance after “Confirm Staff and Start Dynasty”.
- Rookie front-office budget is too tight for onboarding goals and should be raised to 30M.
- Front-office candidate pool is too thin for first-session agency and should be expanded.
- Latest off-target Claude response was from the wrong project and is non-canonical.

## Next architect decision
- Claude owns the Front Office setup bug fix and Rookie tuning.
- Codex owns the Front Office Setup Fix Packet v1.
- No Personality & Chemistry implementation begins until the start flow is reliable.
