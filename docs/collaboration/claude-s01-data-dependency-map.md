# Claude Sprint 01 — Data Dependency Map

**Date**: 2026-03-07
**Branch**: `claude/baseball-dynasty-sim-UjlF2`

---

## Overview

All Sprint 01 surfaces consume data **read-only** through pure adapter functions in `src/utils/briefingAdapter.ts`. No surface mutates game state. Every adapter function is null-safe with fallback defaults.

---

## `home.frontOfficeBriefing`

### Dials (via `buildDials()`)

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Owner Patience | `gameStore.ownerPatience` | **Real** | Defaults to 50 |
| Team Morale | `gameStore.teamMorale` | **Real** | Defaults to 50 |
| Scouting Quality | hardcoded `0.6` | **Heuristic** — no store field exists | Always 60 |
| Market Heat | derived from `gamePhase` + `seasonPhase` | **Heuristic** — phase proxy, no trade data | Phase-based default |
| Clubhouse Temp | derived from morale + owner patience | **Heuristic** — composite average | Defaults to 50 |

### Story Threads (via `buildStoryThreads()`)

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Urgent thread | roster illegality, owner patience < 30 | **Real** (roster) + **Real** (patience) | Returns `null` if no urgent condition |
| Mystery thread | prospect breakouts, trade rumors | **Heuristic** — uses roster size/phase proxies | Returns `null` if no mystery detected |
| Long Arc thread | franchise history, seasons managed | **Real** (franchiseHistory) | Returns `null` if < 2 seasons |

### League Pressure Strip

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Division standings | `leagueStore.standings` | **Real** | Component not rendered if standings null |
| User team highlight | `gameStore.userTeamId` | **Real** | Falls back gracefully |

### Codex Verification Needed
- [ ] Expose `scoutingQuality` on team or game store (replace hardcoded 0.6)
- [ ] Expose `getActiveTradeOffers()` count for real Market Heat
- [ ] Verify `ownerPatience` range is consistently 0–100

---

## `home.actionQueue`

### Tasks (via `buildActionQueue()`)

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Roster illegality (40-man, 26-man violations) | `leagueStore.roster` active/minors counts | **Real** | No task generated if roster legal |
| IL/rehab candidates | `leagueStore.roster` injury flags | **Real** | No task if no injuries |
| Prospect pressure | roster minors list | **Heuristic** — counts minors, no OVR delta | No task if minors empty |
| Owner warnings | `gameStore.ownerPatience` < threshold | **Real** | No task if patience healthy |
| Contract/arb deadlines | `gameStore.seasonPhase` | **Heuristic** — phase-based, no real deadline dates | Phase-appropriate defaults |
| Trade market window | `gameStore.gamePhase` + `seasonPhase` | **Heuristic** — phase proxy | No task outside trade window |

### Codex Verification Needed
- [ ] Expose `RosterPlayer.seasonalOVRDelta` for prospect pressure accuracy
- [ ] Expose contract expiration dates for real deadline tasks
- [ ] Verify roster injury flag structure matches adapter expectations

---

## `home.endOfDayDigest`

### Digest Blocks (via `buildDigest()`)

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Standings snapshot | `leagueStore.standings` | **Real** | Block omitted if null |
| Injury report | `leagueStore.roster` IL list | **Real** | Block omitted if no injuries |
| Front office pulse | `gameStore.ownerPatience`, `teamMorale` | **Real** | Block omitted if values default |
| Headlines | `leagueStore.newsItems` | **Real** | Block omitted if empty array |
| Recommended next action | `gameStore.gamePhase` | **Real** (phase) + **hardcoded** copy | Always rendered with phase-appropriate text |

### Codex Verification Needed
- [ ] Confirm `newsItems` array structure (adapter expects `{ headline: string }`)
- [ ] Verify standings row shape matches `StandingsRow` type

---

## `setup.firstWeekCoach`

### Coach Steps (via `buildCoachSteps()`)

| Data Field | Source | Real vs Heuristic | Empty State |
|------------|--------|-------------------|-------------|
| Seasons managed gate | `gameStore.seasonsManaged` | **Real** | Component hidden if > 0 |
| "Review roster" complete | `leagueStore.roster !== null` | **Heuristic** — data existence, not user action | Marked incomplete |
| "Check standings" complete | `leagueStore.standings !== null` | **Heuristic** — data existence | Marked incomplete |
| "Start season" complete | `gameStore.gamePhase === 'in_season'` | **Real** | Marked incomplete |
| Dismissed state | component-local `useState` | **Volatile** — lost on reload | Not dismissed |

### Codex Verification Needed
- [ ] Decide if `dismissed` should persist (uiStore or localStorage)
- [ ] Confirm `seasonsManaged` increments correctly at season boundary

---

## `shared.coreEmptyStates`

### Data Dependencies: **None**

All empty state components are fully prop-driven with hardcoded copy. Zero store reads. Zero adapter calls. Can be adopted by any tab without integration risk.

---

## `shared.glossaryInlineTip`

### Data Dependencies: **None**

Fully prop-driven tooltip component. No store reads.

---

## Risk Summary

| Risk | Level | Detail |
|------|-------|--------|
| Hardcoded scouting quality | **Low** | Cosmetic only — dial shows 60 until real value exposed |
| Phase-proxy Market Heat | **Low** | Reasonable heuristic, upgrade path clear |
| Missing prospect OVR delta | **Low** | Prospect pressure task uses roster count instead |
| Volatile coach dismissal | **Low** | UX annoyance only — coach reappears on reload |
| newsItems shape assumption | **Medium** | Adapter expects `{ headline }` — verify or add guard |

---

## Integration Promotion Checklist

Before promoting any surface from `intake` to `core`, Codex should verify:

1. Store fields consumed actually exist and have expected types/ranges
2. Adapter fallback defaults are acceptable for production
3. No naming collisions with planned store contract changes
4. Empty states render correctly when all data is null/undefined
5. Navigation callbacks (`setActiveTab`) target valid tab IDs
