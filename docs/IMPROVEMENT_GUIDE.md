# Mr. Baseball Dynasty — Improvement Guide

> Living document tracking planned enhancements, their status, and implementation notes.
> Updated as work progresses.

---

## 1. Icon System (Replace Emojis)
**Status:** NEXT UP
**Priority:** High — Visual polish
**Scope:** 18+ files, 45+ emojis, 36 unique icons

Replace all emoji characters with a `GameIcon` component backed by custom nanobanana2-generated images. Fallback to styled text until images land in `public/icons/`.

**Files to create:**
- `src/constants/icons.ts` — icon name to path mapping
- `src/components/shared/GameIcon.tsx` — `<GameIcon name="..." />` with image + fallback
- `public/icons/` — directory for nanobanana2 PNGs

**Files to edit (emoji replacement):**
1. `Shell.tsx`, `MobileNav.tsx` — navigation icons
2. `SetupFlow.tsx`, `DelegationPanel.tsx` — setup/delegation
3. `HomeCommandCenter.tsx`, `WeeklyCard.tsx`, `PressConference.tsx`, `MomentsPanel.tsx`
4. `AwardRacePanel.tsx`, `InSeasonDashboard.tsx`, `LegacyTimeline.tsx`
5. `NewsFeedView.tsx`, `PlayoffBracketView.tsx`, `AwardsView.tsx`, `CoreEmptyState.tsx`
6. `PlayerProfile.tsx`, `Dashboard.tsx`
7. Engine data: `narrative.ts`, `moments.ts`, `yearInReview.ts`, `briefingAdapter.ts`
8. `storyboard.ts`, `playerTraits.ts`, `reputation.ts`, `rivalry.ts`
9. `frontOffice.ts`, `leagueStore.ts`

**36 unique icons needed:**
`home`, `team`, `frontOffice`, `league`, `history`, `casual`, `standard`, `hardcore`,
`lineup`, `rosterMoves`, `trades`, `freeAgency`, `draft`, `extensions`, `arbitration`,
`minorLeagues`, `scouting`, `development`, `news`, `injury`, `medal`, `star`, `fire`,
`lightning`, `stats`, `construction`, `seedling`, `people`, `money`, `scroll`,
`microphone`, `checkmark`, `blocked`, `warning`, `skip`, `target`

---

## 2. Age-Based Stat Curves
**Status:** PLANNED
**Priority:** High — Realism
**Scope:** `fakeStats.ts`

Model realistic career arcs in fake stat generation:
- **Prospect years (age 20-22):** Stats ~70-80% of peak. Fewer AB/IP. Learning phase.
- **Ascending (23-26):** Gradual improvement. 85-95% of peak.
- **Prime (27-30):** Full attribute-based stats. Best seasons here.
- **Veteran (31-34):** Gentle decline. 90-95% of peak. Wisdom offsets physical loss.
- **Declining (35+):** Steeper decline. 70-85% of peak. Fewer games.

Implementation: Apply a multiplier to key stat drivers (contact, power, stuff, etc.) based on what age the player was in each fake season. Work backwards from current age.

---

## 3. Injury Seasons
**Status:** PLANNED
**Priority:** Medium — Texture
**Scope:** `fakeStats.ts`

Occasionally generate shortened seasons to simulate IL stints:
- ~15% chance per season of a "short year" (50-90 games for hitters, 60-120 IP for SP)
- ~5% chance of a "lost season" (under 30 games / under 40 IP)
- Injury-prone players (low durability attribute) get higher probabilities
- Short seasons still have per-game stats at normal rates

---

## 4. Team Variety in Career
**Status:** PLANNED
**Priority:** Medium — Immersion
**Scope:** `fakeStats.ts`, possibly `CareerStatsTable.tsx`

Veterans with 7+ years of service could show earlier seasons with different team IDs:
- ~40% chance a veteran was on a different team earlier in career
- Switch point: random year in first half of career
- Pick a random team from the league for the "previous team"
- Display team abbreviation in career table (add column or color-code)

---

## 5. Save Migration
**Status:** PLANNED
**Priority:** Medium — Stability
**Scope:** `worker.ts` save/load path

When loading old saves, update stale team metadata to match current `INITIAL_TEAMS`:
- Compare saved team data against current team definitions
- Update abbreviations, city names, division assignments
- Preserve user's roster/stats but refresh team identity
- Add migration version number to save format

---

## Completed Improvements

### Fake Career History (Multi-Year)
**Shipped:** 2026-03-12
- Players get 1 fake season per service year (e.g., 11Y service = 11 seasons)
- Real calendar year labels ('15, '16, ... '25) counting back from 2026
- Stats derived from player attributes with gaussian noise for natural variation
- Career totals row in table
- Files: `fakeStats.ts`, `worker.ts`, `CareerStatsTable.tsx`, `PlayerProfile.tsx`

### Full Player Profile Fix
**Shipped:** 2026-03-12
- Fixed `getPlayerProfile()` to return properly flattened `PlayerProfileData`
- Built scouting grades (20-80 scale) from raw attributes
- Computed trade value via `evaluatePlayer()`
- Fixed `rosterStatus.replace()` crash (was nested under `rosterData`)

### AVG vs OBP Fix
**Shipped:** 2026-03-12
- Root cause: `toRosterPlayer()` had duplicate broken OBP formula
- Fix: Replaced inline stat calculation with `getPlayerStatLine()` call

### Codex Bug Fixes (PR #22 Review)
**Shipped:** 2026-03-12
- IL status mismatch: `IL_10`/`IL_60` → `MLB_IL_10`/`MLB_IL_60`
- simToNextEvent empty interrupts: `interrupts: []` → `result.interrupts ?? []`
- NEW GAME button visible on mobile
