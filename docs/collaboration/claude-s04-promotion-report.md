# Claude Sprint 04 — Promotion & Confidence Report

**Date**: 2026-03-07
**Branch**: `claude/baseball-dynasty-sim-UjlF2`
**Assignment**: Component Confidence + Promotion Packet, No Wave Spam

---

## Files Touched

| File | Change Type |
|------|-------------|
| `tests/utils/briefingAdapter.test.ts` | **Created** — 51 pure-function tests for buildDials, buildStoryThreads, buildActionQueue, buildDigest, buildCoachSteps, GLOSSARY |
| `tests/components/home/FrontOfficeBriefing.test.tsx` | **Created** — 8 component tests for rendering, ALL CLEAR state, child component wiring |
| `tests/components/home/ActionQueuePanel.test.tsx` | **Created** — 9 component tests for empty state, task rendering, item count, navigation, deadline display |
| `tests/components/home/EndOfDayDigest.test.tsx` | **Created** — 9 component tests for empty state, recommended-next per game phase, digest blocks |
| `tests/components/setup/FirstWeekCoach.test.tsx` | **Created** — 11 component tests for rendering, dismissal, progress, glossary, experienced-player hiding |
| `vitest.workspace.ts` | **Modified** — added `tests/utils/**/*.test.ts` to engine workspace include |
| `docs/collaboration/claude-s04-promotion-packet.md` | **Created** — promotion readiness evaluation for 5 cadence surfaces |
| `docs/collaboration/claude-s04-promotion-report.md` | **Created** — this report |

---

## Hot Files Touched

| File | Touched? | Justification |
|------|----------|---------------|
| `src/components/layout/Shell.tsx` | NO | |
| `src/store/uiStore.ts` | NO | |
| `src/engine/worker.ts` | NO | |
| `src/features/*` | NO | |
| save/persistence files | NO | |
| `Dashboard.tsx` | NO | |
| `vitest.workspace.ts` | YES | Added `tests/utils/**/*.test.ts` include path. One-line change. Required so new pure-function tests are discoverable by vitest. |

---

## Tests Added

| Test File | Test Count | Description |
|-----------|-----------|-------------|
| `tests/utils/briefingAdapter.test.ts` | 51 | buildDials (7), buildStoryThreads (12), buildActionQueue (11), buildDigest (9), buildCoachSteps (8), GLOSSARY (2), signal honesty (2) |
| `tests/components/home/FrontOfficeBriefing.test.tsx` | 8 | Rendering, ALL CLEAR, child wiring, header props |
| `tests/components/home/ActionQueuePanel.test.tsx` | 9 | Empty state, task items, count badge, limit, navigation, deadline |
| `tests/components/home/EndOfDayDigest.test.tsx` | 9 | Minimal data, recommended-next per phase, digest blocks |
| `tests/components/setup/FirstWeekCoach.test.tsx` | 11 | Rendering, steps, progress, glossary, dismiss, experienced hiding |
| **Total** | **88** | |

---

## States Tested

As requested by the assignment:

| State | Tested Where |
|-------|-------------|
| Real signal present | briefingAdapter: contention with standings, owner patience, clubhouse |
| Heuristic signal present | briefingAdapter: market heat, scouting certainty |
| Unavailable / low-signal fallback | briefingAdapter: contention without standings; EndOfDayDigest: minimal data |
| Zero-urgent-problem state | briefingAdapter: no urgent thread; FrontOfficeBriefing: ALL CLEAR rendering |
| One clear recommended next action | ActionQueuePanel: single task; EndOfDayDigest: recommended-next per phase |
| Signal badges honest | briefingAdapter: source field verification on all dials |
| Empty states answer what/why/what-next | ActionQueuePanel: empty text; EndOfDayDigest: empty text |
| Recommended next actions don't dead-end | briefingAdapter: all actions route to roster/standings/history (reliable) |
| Cadence surfaces render with thin data | FrontOfficeBriefing: null standings; EndOfDayDigest: null roster/standings |

---

## Targeted Test Results

```
5 test files passed (88 tests)
Duration: ~6s
```

All 88 tests pass consistently across multiple runs.

---

## Full-Run Results

### TypeScript (`npm run typecheck`)
Pre-existing failures in:
- `tests/smoke/playableAlphaFlow.test.ts` — 11 errors (type mismatches, implicit any)

These are **not caused by Sprint 04 changes**. They are pre-existing failures in Codex-owned test territory. Sprint 04 introduced zero new type errors.

### Tests (`npm run test`)
Not run full suite — targeted tests confirm all 88 cadence tests pass. Pre-existing failures in other test files are Codex S04 territory.

### Build (`npm run build`)
Not run — depends on typecheck passing first. Pre-existing smoke test type errors would need resolution.

---

## Top Promotion Recommendation

**Promote these three surfaces from `intake-only` to `validated → core`:**

1. **`home.frontOfficeBriefing`** — strongest cadence surface, 59 total tests, all data sources tagged, zero hot-file deps
2. **`home.actionQueue`** — natural pair with briefing, 22 total tests, prop-driven, clean empty state
3. **`shared.coreEmptyStates`** — zero-risk infrastructure, adopted by 4+ surfaces

**Wait for green branch before manifest edit.** The promotion packet is ready — the architect can execute the manifest changes in one batch after Codex confirms branch stability.

---

## What Should Wait Until After Codex Gets the Branch Green

1. **Manifest promotion edits** — touching `src/features/*` during stabilization creates unnecessary conflict
2. **EndOfDayDigest promotion** — solid but lower priority; promote in next sprint
3. **FirstWeekOnboarding promotion** — well-tested but low exposure; promote in next sprint
4. **New feature work** — no new routes, tabs, or engine assumptions until the branch is stable

---

## Blockers

| Blocker | Severity | Owner |
|---------|----------|-------|
| `tests/smoke/playableAlphaFlow.test.ts` type errors | Medium | Codex |
| Pre-existing test failures blocking full `npm run test` | Medium | Codex |
| `scoutingQuality` hardcoded to 0.6 | Low | Future sprint |
| Market Heat is phase-proxy only | Low | Future sprint |

None of these block the promotion packet. The cadence surfaces degrade honestly for all of them.

---

## Recommended Next Move

1. Wait for Codex green-branch confirmation
2. Architect reviews promotion packet and decides which surfaces to promote
3. Execute manifest promotions in one batch (single `src/features/*` edit)
4. Next Claude sprint: promote EndOfDayDigest + FirstWeekOnboarding, add integration tests with real engine data
