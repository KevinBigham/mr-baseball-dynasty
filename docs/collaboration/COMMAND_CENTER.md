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
- PR #11 has a merge conflict in `docs/collaboration/COMMAND_CENTER.md`.
- Codex current environment has no `origin`, so Codex cannot push or open a PR directly.
- Shared branch health should be re-verified after conflict resolution (`typecheck`, `test`, `build`).

## Next architect decision
- Resolve this file conflict.
- Re-run checks on `claude/baseball-dynasty-sim-UjlF2`.
- Decide whether PR #11 is intended to merge Claude Sprint 03/04 work into `main`.
- Continue Sprint 04 once the branch is clean.
