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
- None on the Front Office onboarding path.
- Chemistry v1 has two competing design directions unless architect lock is enforced.

## Next architect decision
- Canonical Chemistry v1 uses existing hidden player traits (`workEthic`, `mentalToughness`) plus derived archetypes.
- Claude owns Chemistry v1 Slice 1A implementation.
- Codex owns Chemistry Slice 1A review/guard packet.
- No broad personality schema expansion and no UI promotion in Slice 1A.
