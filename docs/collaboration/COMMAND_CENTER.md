# COMMAND_CENTER.md

## Current sprint
Sprint 04 — Chemistry Canonicalization + Stability Hardening

## Shared branch
`task/mbd-repo-stabilize`

## Active sessions

| Agent | Branch | Status | Last updated |
|---|---|---|---|
| Codex | `task/mbd-repo-stabilize` | local implementation in progress | 2026-03-15 |
| Claude Code | review / design lane | awaiting updated diff review | 2026-03-15 |

## Lane ownership

### Codex
Owner: implementation, deterministic hardening, dashboard/store contract alignment, postseason/stability fixes

### Claude
Owner: architecture review, balance review, next-step design packet

## Hot files
- `src/engine/worker.ts`
- `src/engine/workerCache.ts`
- `src/store/leagueStore.ts`
- `src/components/dashboard/*`
- `src/components/home/*`

## Merge rule
Nothing is shared until reviewed.
Nothing is done until the verification gate is green.
Do not overwrite in-flight draft/setup worker changes outside the touched hunks.

## Current blockers
- Chemistry Slice 1A and 1B are implemented in source and worker persistence.
- Dashboard/home chemistry now reads from worker-owned state, but gameplay modifiers are still deferred.
- Front-office determinism fallback and standalone playoff bracket drift are fixed locally.

## Next architect decision
- Phase 1 and Phase 2 work is now represented in source:
  - typed dashboard bundle
  - worker-owned chemistry hydration
  - dashboard/home/franchise chemistry surfaces
  - real playoff bracket rendering path
  - deterministic front-office candidate generation
  - TradeCenter error-path cleanup
- Next task is MBD-007:
  - bounded chemistry gameplay effects
  - keep save compatibility
  - keep worker changes localized
