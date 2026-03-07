# Claude Sprint 01 — Feature IDs & Manifest Mapping

**Date**: 2026-03-07
**Branch**: `claude/baseball-dynasty-sim-UjlF2`

---

## Feature Registry

### `home.frontOfficeBriefing`

| Field | Value |
|-------|-------|
| **featureId** | `home.frontOfficeBriefing` |
| **title** | Front Office Briefing |
| **group** | `home` |
| **tier** | surface |
| **status** | `intake` |
| **navLabel** | — (embedded in Dashboard, no standalone nav entry) |
| **showInNav** | `false` |
| **deps** | `gameStore.ownerPatience`, `gameStore.teamMorale`, `gameStore.ownerArchetype`, `leagueStore.standings`, `leagueStore.roster`, `leagueStore.franchiseHistory`, `engine/narrative` |
| **corePriority** | **high** |

**Components**: `FrontOfficeBriefing`, `BriefingHeader`, `UrgentProblemCard`, `OpenMysteryCard`, `LongArcCard`, `LeaguePressureStrip`
**Adapter**: `buildDials()`, `buildStoryThreads()`

---

### `home.actionQueue`

| Field | Value |
|-------|-------|
| **featureId** | `home.actionQueue` |
| **title** | Action Queue |
| **group** | `home` |
| **tier** | surface |
| **status** | `intake` |
| **navLabel** | — (rendered within FrontOfficeBriefing) |
| **showInNav** | `false` |
| **deps** | `leagueStore.roster`, `gameStore.ownerPatience`, `gameStore.gamePhase`, `gameStore.seasonPhase` |
| **corePriority** | **high** |

**Components**: `ActionQueuePanel`, `ActionQueueItem`
**Adapter**: `buildActionQueue()`

---

### `home.endOfDayDigest`

| Field | Value |
|-------|-------|
| **featureId** | `home.endOfDayDigest` |
| **title** | End-of-Day Digest |
| **group** | `home` |
| **tier** | surface |
| **status** | `intake` |
| **navLabel** | — (embedded in Dashboard, no standalone nav entry) |
| **showInNav** | `false` |
| **deps** | `leagueStore.standings`, `leagueStore.roster`, `leagueStore.newsItems`, `gameStore.ownerPatience`, `gameStore.teamMorale`, `gameStore.gamePhase` |
| **corePriority** | **medium** |

**Components**: `EndOfDayDigest`, `DigestSection`
**Adapter**: `buildDigest()`

---

### `setup.firstWeekCoach`

| Field | Value |
|-------|-------|
| **featureId** | `setup.firstWeekCoach` |
| **title** | First-Week Onboarding Coach |
| **group** | `setup` |
| **tier** | surface |
| **status** | `intake` |
| **navLabel** | — (conditional overlay, no nav entry) |
| **showInNav** | `false` |
| **deps** | `gameStore.seasonsManaged`, `gameStore.gamePhase`, `leagueStore.roster`, `leagueStore.standings` |
| **corePriority** | **medium** |

**Components**: `FirstWeekCoach`, `NextBestActionPanel`
**Adapter**: `buildCoachSteps()`

**Note**: Dismissal state is component-local (volatile). Could be promoted to `uiStore` or `localStorage` for persistence.

---

### `shared.coreEmptyStates`

| Field | Value |
|-------|-------|
| **featureId** | `shared.coreEmptyStates` |
| **title** | Core Empty State System |
| **group** | `shared` |
| **tier** | utility |
| **status** | `intake` |
| **navLabel** | — (utility component, no nav entry) |
| **showInNav** | `false` |
| **deps** | none (fully prop-driven) |
| **corePriority** | **low** |

**Components**: `CoreEmptyState` (base), `RosterEmptyState`, `StandingsEmptyState`, `FinanceEmptyState`, `HistoryEmptyState`, `LeaderboardEmptyState` (presets)

**Note**: Zero store dependencies. Presets are thin wrappers with hardcoded copy. Can be adopted by any tab without integration risk.

---

### `shared.glossaryInlineTip`

| Field | Value |
|-------|-------|
| **featureId** | `shared.glossaryInlineTip` |
| **title** | Glossary Inline Tip |
| **group** | `shared` |
| **tier** | utility |
| **status** | `intake` |
| **navLabel** | — |
| **showInNav** | `false` |
| **deps** | none (fully prop-driven) |
| **corePriority** | **low** |

**Components**: `GlossaryInlineTip`

---

## Summary Table

| featureId | group | tier | status | corePriority | showInNav |
|-----------|-------|------|--------|-------------|-----------|
| `home.frontOfficeBriefing` | home | surface | intake | high | false |
| `home.actionQueue` | home | surface | intake | high | false |
| `home.endOfDayDigest` | home | surface | intake | medium | false |
| `setup.firstWeekCoach` | setup | surface | intake | medium | false |
| `shared.coreEmptyStates` | shared | utility | intake | low | false |
| `shared.glossaryInlineTip` | shared | utility | intake | low | false |
