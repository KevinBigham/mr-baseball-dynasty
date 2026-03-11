# Mr. Baseball Dynasty — Shared Collaboration Protocol

Date: 2026-03-07
Audience: Claude Code + Codex

## 1. Canonical truth

Before coding, assume this order of truth:

1. `main` in `KevinBigham/mr-baseball-dynasty`
2. `HANDOFF_BIBLE.md`
3. `CODEX_HANDOFF.md`
4. This architect packet

The large 100-wave feature branch is **reference material**, not the canonical baseline.

## 2. Shared mission

Ship a **playable alpha** fast without daily merge pain.

Playable alpha means:
- new game works,
- sim works,
- roster / transaction actions work,
- save/load works,
- offseason transition works,
- multi-season continuation works,
- no blocker-level crashes in the core loop.

## 3. Lane split

### Claude owns
- new player-facing UI surfaces
- cadence UX
- briefing / digest / onboarding
- narrative surfacing
- core empty states and help patterns

### Codex owns
- feature manifest / intake / readiness / integrity
- save safety / migrations / runtime guards
- smoke tests / invariants / release gates
- truth audit and promotion rules
- engine-side stability and alpha-loop hardening

## 4. Hot files

Treat these as hot:
- `src/components/layout/Shell.tsx`
- `src/store/uiStore.ts`
- `src/engine/worker.ts`
- `src/types/*`
- save schema / persistence files

### Rules
- Do not casually touch hot files.
- Batch hot-file edits into one planned window.
- If you need a hot-file change, document it first in your assignment note.
- If another agent has an open hot-file task, stop and coordinate instead of freelancing.

## 5. Branch / PR guidance

Suggested working branches:
- Claude: `claude/briefing-cadence-s01`
- Codex: `codex/alpha-control-plane-s01`
- Integration: `integration/s01-cadence-control-plane`

If you use a different branch name, keep the same intent: clear ownership, no mystery meat.

## 6. Definition of done

Nothing is done until all of these are true:
- `npm run typecheck`
- `npm run test`
- `npm run build`
- no broken empty states
- no direct UI mutation of worker state
- all new worker responses are guarded
- change summary written in markdown

## 7. Delivery note format

Each agent ends a work pass with a short markdown note containing:
- what changed
- files touched
- contracts added / changed
- blockers
- exact next recommended move

## 8. Promotion rule

A feature gets promoted to Core only if it does at least one of these:
- creates a better baseball decision,
- explains a baseball decision better,
- makes the consequence of a baseball decision memorable,
- or materially improves alpha-loop reliability.

If not, it stays Advanced or Experimental.

## 9. Anti-chaos rules

- Do **not** bulk-merge the analytics-heavy branch.
- Do **not** add net-new schema breakage before alpha.
- Do **not** promote decorative dashboards into Core.
- Do **not** add manipulative retention mechanics.
- Do **not** leave hidden assumptions about whether a feature is canonical.

## 10. First principle when in doubt

Choose **conservative safety over flashy breadth**.
