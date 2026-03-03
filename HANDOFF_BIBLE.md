# Mr. Baseball Dynasty — Handoff Bible
> Last updated: 2026-03-01 by Claude (Sonnet 4.6)
> Branch: `claude/baseball-dynasty-sim-UjlF2`
> Commit: `ad74ae4`

---

## 0. TL;DR — State of the Game Right Now

**What exists:** A complete, playable baseball dynasty simulation.
- 30 teams, ~3,700 procedurally generated players across 7 farm levels
- Full 162-game season simulation (deterministic, seeded, ~1s per season)
- Playoff bracket (Wild Card → DS → CS → World Series)
- Roster management (promote/demote/DFA/release)
- Free agency shopping
- Trade system (incoming AI offers + propose your own)
- Auto-save / manual save / new game reset
- Rich narrative layer: press conferences, rivalry tracking, MFSN predictions, moments gallery, storyboard arcs, weekly cards, owner patience, team morale
- 35 passing tests across 3 test suites

**What's NOT built yet (priority order):**
1. Player Development Lab (assign prospects to programs)
2. International Signing Period (bid on INTL prospects)
3. Rule 5 Draft
4. Amateur Draft (college + HS)
5. Arbitration system
6. Contract extensions for current players
7. Injuries system (IL stints with recovery timelines)
8. Coaching staff active effects (currently selected but not affecting sim)
9. Scouting reports (fog-of-war on opponent players)
10. Historical player tracking / career stats across seasons
11. Team finance screen (payroll, luxury tax)
12. Waiver wire

---

## 1. Collaboration Protocol (READ THIS FIRST)

This project has **two AI collaborators**: **Claude** and **Codex**. To avoid merge conflicts and overwriting each other's work, we each own specific areas. **Always check the ownership table before touching a file.**

### Ownership Map

| Area | Owner | Files |
|------|-------|-------|
| **Dashboard UI** | Claude | `src/components/dashboard/*.tsx` |
| **Offseason UI** | Claude | `src/components/offseason/*.tsx` |
| **Roster UI** | Claude | `src/components/roster/RosterView.tsx` |
| **Stats UI** | Claude | `src/components/stats/*.tsx` |
| **Setup flow** | Claude | `src/components/setup/SetupFlow.tsx` |
| **Shell / Layout** | Claude | `src/components/layout/Shell.tsx` |
| **Narrative systems** | Claude | `src/engine/narrative.ts`, `src/engine/storyboard.ts`, `src/engine/moments.ts`, `src/engine/predictions.ts`, `src/engine/reputation.ts`, `src/engine/rivalry.ts`, `src/engine/staffPoaching.ts` |
| **Simulation engine** | Codex | `src/engine/sim/gameSimulator.ts`, `src/engine/sim/seasonSimulator.ts`, `src/engine/sim/plateAppearance.ts`, `src/engine/sim/markov.ts`, `src/engine/sim/fsm.ts` |
| **Player systems** | Codex | `src/engine/player/generation.ts`, `src/engine/player/development.ts`, `src/engine/player/attributes.ts`, `src/engine/player/awards.ts` |
| **Engine math** | Codex | `src/engine/math/log5.ts`, `src/engine/math/bayesian.ts`, `src/engine/math/prng.ts` |
| **Data files** | Codex | `src/data/*.ts` |
| **Tests** | Codex | `tests/**` |
| **Types** | Shared — coordinate first | `src/types/*.ts` |
| **Worker API** | Shared — coordinate first | `src/engine/worker.ts` |
| **Store state** | Shared — coordinate first | `src/store/*.ts` |
| **Constants** | Shared — coordinate first | `src/utils/constants.ts` |

### Coordination Rules
1. **Types**: If you need a new type, add it to the appropriate `src/types/` file and note it in your commit message so the other agent knows.
2. **Worker API** (`src/engine/worker.ts`): Add new methods at the bottom of the API object. Never remove or rename existing methods. Use the pattern `async methodName(args): Promise<ReturnType>`.
3. **Stores** (`src/store/`): Add new fields to the interface AND the initial state AND implement the setter. Don't rename existing fields.
4. **Constants**: Add new gates/tuning values. Don't change existing gate thresholds without running tests first.

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5.4 | Build tool + HMR dev server |
| Tailwind CSS | 3.4 | Styling |
| Zustand | 5.0 | State management (3 stores) |
| Comlink | 4.4 | Web Worker RPC |
| Dexie | 3.2 | IndexedDB (save/load) |
| pure-rand | 6.1 | Seedable PRNG (determinism) |
| pako | 2.1 | Gzip compression for saves |
| vitest | 2.1 | Test runner |

### Design Language
- **Bloomberg Terminal aesthetic**: dark (#0a0a0f background), orange accents (#f97316), monospace font
- **CSS classes to use**: `bloomberg-border`, `bloomberg-header`, `bloomberg-btn` (defined in index.css)
- **Text**: ALL CAPS for headers, labels, button text. Sentence case for body copy.
- **No emojis** in UI unless displaying narrative moments

---

## 3. Architecture Overview

```
Browser Main Thread                    Web Worker Thread
──────────────────────                 ────────────────
React UI (components)                  engine/worker.ts
     │                                      │
     │  Comlink RPC calls                   │
     ├──────────────────────────────────────►│
     │  (async API: simulateSeason,         │ sim/ ── gameSimulator.ts
     │   getStandings, promotePlayer, ...)  │      ── seasonSimulator.ts
     │◄──────────────────────────────────────┤      ── plateAppearance.ts
     │  Promise responses                   │      ── markov.ts
     │                                      │      ── playoffSimulator.ts
Zustand Stores                         │
  gameStore  ── phase, season           │ player/ ── generation.ts
  leagueStore ── standings, news        │         ── development.ts
  uiStore    ── active tab             │         ── attributes.ts
                                        │
Dexie (IndexedDB)                      │ math/ ── log5.ts
  ── saveGame()                         │       ── bayesian.ts
  ── loadGame()                         │       ── prng.ts
  ── listSaves()
```

**Key invariant**: The UI never directly mutates game state. It calls `engine.someMethod()` which modifies `_state` in the worker, then re-fetches what it needs (e.g., `engine.getStandings()`).

### Getting the Engine

```typescript
import { getEngine } from '../../engine/engineClient';
const engine = getEngine();
const result = await engine.simulateSeason();
```

### Game Phase State Machine

```
'preseason' ──[SIM SEASON]──► 'simulating' ──[complete]──► 'postseason'
     ▲                                                           │
     │                                                   [ENTER OFFSEASON]
     │                                                           ▼
     └──────────────────────────[ADVANCE TO NEXT SEASON]── 'offseason'
```

Stored in `gameStore.gamePhase`. The Dashboard component orchestrates transitions.

---

## 4. Running the Project

```bash
npm run dev          # Dev server at http://localhost:5173
npm run test         # Run 35 tests (all must pass)
npm run test:watch   # Watch mode
npm run typecheck    # Zero-tolerance TypeScript check
npm run build        # Production build
```

### The Golden Rule
Before pushing **any** change: `npm run typecheck && npm run test` must both pass with zero errors.

---

## 5. Key File Deep-Dives

### `src/engine/worker.ts` — The API Contract

This is the Comlink-exposed API. Every method the UI can call is here. Current methods:

```typescript
// Game lifecycle
newGame(seed, userTeamId)
simulateSeason(onProgressCallback?)
getFullState()
loadState(state)

// Standings / Stats
getStandings()
getLeaderboard(stat, limit?)

// Roster queries
getRoster(teamId)
getFullRoster(teamId)         // All 7 farm levels + 40-man/active counts

// Roster transactions
promotePlayer(playerId, targetStatus)
demotePlayer(playerId, targetStatus)
dfaPlayer(playerId)
releasePlayer(playerId)

// Player profile
getPlayerProfile(playerId)

// Playoffs
simulatePlayoffs()            // Returns PlayoffBracket | null

// Free Agency
startOffseason()              // Generates FA class
getFreeAgents(limit?)
signFreeAgent(playerId, years, salary)
finishOffseason()             // AI signings, cleanup

// Trades
getTradeOffers()
getTeamPlayers(teamId)
proposeTrade(partnerTeamId, userPlayerIds, partnerPlayerIds)
acceptTradeOffer(partnerTeamId, userPlayerIds, partnerPlayerIds)

// Utility
ping()
```

### `src/types/player.ts` — Player Structure

```typescript
interface Player {
  playerId: number;
  teamId: number;       // -1 = free agent
  name: string;
  age: number;
  position: Position;   // 'C'|'1B'|'2B'|'3B'|'SS'|'LF'|'CF'|'RF'|'DH'|'SP'|'RP'|'CL'
  isPitcher: boolean;
  overall: number;      // 0–550 internal scale (NOT 0-100)
  potential: number;    // Peak projection (0–550)
  hitterAttributes: HitterAttributes | null;
  pitcherAttributes: PitcherAttributes | null;
  development: DevelopmentData;  // SDE engine state
  rosterData: PlayerRosterData;  // Contract, status, service time
}
```

**Important**: `overall` is on a 0–550 scale. Convert for display with `toScoutingScale(overall)` → 20–80 scouting grade.

**Roster statuses** (14 types):
`MLB_ACTIVE`, `MLB_IL_10`, `MLB_IL_60`, `MINORS_AAA`, `MINORS_AA`, `MINORS_APLUS`, `MINORS_AMINUS`, `MINORS_ROOKIE`, `MINORS_INTL`, `DFA`, `WAIVERS`, `FREE_AGENT`, `RETIRED`, `DRAFT_ELIGIBLE`

### `src/types/league.ts` — Season Result Shape

```typescript
interface SeasonResult {
  teamSeasons: TeamSeasonStats[];    // Win/loss records per team
  playerSeasons: PlayerSeasonStats[]; // Individual stats
  leagueERA: number;
  leagueBA: number;
  leagueRPG: number;
  teamWinSD: number;
  awards: AwardWinner[];
  divisionChampions: number[];       // teamIds
  developmentEvents: DevelopmentEvent[];
}
```

### `src/utils/constants.ts` — Tuning Knobs

The `GATES` object defines all validation thresholds. Current calibration (after fixes):
```typescript
leagueERA:     { min: 3.80, max: 4.50 }   // Real MLB: 3.96 (2022) to 4.51 (2019)
leagueBA:      { min: 0.245, max: 0.265 }
leagueRPG:     { min: 4.2, max: 4.8 }
playersWith200K: { min: 15, max: 35 }      // Fixed with stuff exponent 1.3
```

### `src/engine/sim/plateAppearance.ts` — The Heart of Sim

**Critical calibration values** (touch carefully, run tests after):
- `stuffFactor` exponent: **1.3** (line ~89) — raises elite pitcher K separation
- `powerFactor` exponent: **1.8** (line ~71) — HR rate scaling
- `PITCHER_WEIGHTS.strikeout`: **0.75** — pitchers own 75% of K outcome

---

## 6. Zustand Stores Reference

### `gameStore.ts`
```typescript
// Key fields
season: number            // Current season year (starts 2026)
userTeamId: number        // Player's team
gamePhase: GamePhase      // 'preseason'|'simulating'|'postseason'|'offseason'
gameStarted: boolean      // false = show SetupFlow, true = show Shell
seasonsManaged: number    // Total seasons played
ownerPatience: number     // 0-100, decrements on bad seasons
teamMorale: number        // 0-100
```

### `leagueStore.ts`
```typescript
standings: StandingsData | null
roster: RosterData | null
leaderboard: LeaderboardEntry[]
newsItems: NewsItem[]       // Max 50, newest first
rivals: RivalRecord[]
franchiseHistory: SeasonSummary[]  // Max 30 seasons
presserAvailable: boolean
presserDone: boolean
mfsnReport: MFSNReport | null
moments: SeasonMoment[]     // Max 100
weeklyStories: WeeklyStory[]
```

### `uiStore.ts`
```typescript
activeTab: NavTab   // 'dashboard'|'standings'|'roster'|'stats'|'profile'
// + various modal/filter states
```

---

## 7. Database / Save System

```typescript
import { saveGame, loadGame, listSaves } from '../../db/schema';

// Save
const state = await engine.getFullState();
await saveGame(state, 'Save Name', 'Team Name');

// Load (App.tsx does this on startup)
const saves = await listSaves();      // Returns SaveRecord[] desc by date
const state = await loadGame(saveId);
await engine.loadState(state);
```

Saves are gzip-compressed JSON stored in IndexedDB. Auto-save triggers after each offseason completes.

---

## 8. Player Generation Parameters

```
Level       Count   OVR Range   Age Range   40-Man
─────────────────────────────────────────────────
MLB_ACTIVE   25/team  340-510    23-38       yes
MINORS_AAA   10/team  280-420    21-28       some
MINORS_AA    10/team  230-370    19-25       few
MINORS_APLUS  8/team  200-330    18-23       rare
MINORS_AMINUS 8/team  170-300    17-22       no
MINORS_ROOKIE 6/team  150-270    16-21       no
MINORS_INTL   6/team  120-230    16-17       no
```

Total: ~123 players per team × 30 teams = ~3,690 players

---

## 9. Priority Feature Backlog

These are sorted by impact-to-effort ratio. Codex should grab the engine pieces; Claude will wire up the UI.

### HIGH PRIORITY — Codex Engine Work

#### A. Injuries System
**Files**: Create `src/engine/injuries.ts`, modify `src/engine/sim/seasonSimulator.ts`, `src/engine/worker.ts`
```typescript
// New type needed in src/types/player.ts:
interface InjuryRecord {
  type: 'minor' | 'moderate' | 'severe';
  daysRemaining: number;
  description: string;   // "strained hamstring", "torn UCL", etc.
}
// Add to PlayerRosterData: currentInjury?: InjuryRecord

// Core logic in injuries.ts:
// - Per-game probability of injury (durability attribute gates it)
// - Severity distribution (70% minor/15d, 25% moderate/30-60d, 5% severe/90-180d)
// - Season simulator should: check injury each game, place on IL if injured,
//   decrement recovery, return to active when healed
```
**Gate to add**: leagueGamesOnIL: { min: 200, max: 400 } per season

#### B. Amateur Draft
**Files**: Create `src/engine/draft.ts`, `src/engine/player/draftEligible.ts`
```typescript
// At end of offseason, after FA, before next season:
// 1. Generate 200 draft-eligible players (DRAFT_ELIGIBLE status, teamId: -1)
// 2. Worst record drafts first (reverse standings order)
// 3. User gets to pick in their slot (UI: DraftBoard component)
// 4. AI teams auto-pick best available by need (position scarcity)
// 5. 10 rounds, ~30 teams = 300 picks total
// Drafted players start at MINORS_ROOKIE or MINORS_AMINUS
```

#### C. Coaching Staff Active Effects
**Files**: Modify `src/engine/sim/seasonSimulator.ts`, `src/engine/player/development.ts`
```typescript
// Currently staff is selected but effects are 0
// In src/data/frontOffice.ts, FOTraitId maps to FOAction
// Actions that need to be wired:
//   'hitter_dev' → boost hitter development speed by 5-15%
//   'pitcher_dev' → boost pitcher development speed
//   'analytics' → improve trade/FA evaluation accuracy
//   'scouting' → reveal hidden attributes (reduce fog-of-war)
//   'medical' → reduce injury probability
// Staff quality score (0.0-1.0) multiplies the effect magnitude
```

#### D. Arbitration System
**Files**: Create `src/engine/arbitration.ts`, `src/engine/worker.ts`
```typescript
// Arbitration-eligible: 3+ years service time, not yet FA eligible
// Pre-arb: salary = $700K (league minimum)
// Arb year 1: salary bumps to ~40% of market value
// Arb year 2: ~60% of market value
// Arb year 3: ~80% of market value
// Worker API: getArbitrationCases(), resolveArbitration(playerId, accept: boolean)
// If user rejects → AI resolves at midpoint (team always wins arbitration in this sim)
```

#### E. Improved Trade AI
**Files**: `src/engine/trading.ts`
```typescript
// Current AI: generates random offers targeting random user players
// Improved AI should:
// - Identify team needs (weak positions in rotation/lineup)
// - Target user's surplus (position they have too many of)
// - Weight prospect value correctly (cheap + young > expensive + old)
// - Add "package deals" (2-for-1, 3-for-2)
// - Respect no-trade clauses (players with 10-and-5 rights: hasTenAndFive = true)
```

### MEDIUM PRIORITY — Shared Work

#### F. Historical Stats Tracking
**Files**: `src/db/schema.ts`, `src/engine/worker.ts`
```typescript
// Currently: season stats are wiped on new season start
// Need: persist PlayerSeasonStats per season in IndexedDB
// Schema: { playerId, season, stats } with compound index
// Worker method: getCareerStats(playerId) → PlayerSeasonStats[]
// This unblocks career leaderboards, HOF tracking, etc.
```

#### G. Waiver Wire
**Files**: Create `src/engine/waivers.ts`, `src/components/offseason/WaiverWire.tsx`
```typescript
// DFA'd players go on 7-day waivers before becoming free agents
// Other teams can claim waiver players (reverse standings order priority)
// If claimed, previous team must trade or release
// Add to offseason phase (before FA opens)
```

### LOWER PRIORITY — Claude UI Work
- Finance screen (payroll breakdown, luxury tax tracker)
- Scouting reports (fog-of-war: show only known info about opponents)
- Player comparison tool
- Dark/rebuild mode visual themes
- Season simulation speed controls (faster animation)
- Mobile-responsive layout fixes

---

## 10. Testing Conventions

### Test File Locations
```
tests/engine/       ← Unit tests for engine subsystems
tests/validation/   ← gates.test.ts — system-level stat calibration
```

### Adding a New Test
```typescript
import { describe, it, expect } from 'vitest';

describe('MySystem — feature name', () => {
  it('does the thing correctly', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Gate Test Pattern
When adding a new major system (injuries, draft, etc.), add a gate to `src/utils/constants.ts`:
```typescript
GATES.leagueGamesOnIL = { min: 200, max: 400 }
```
Then add a test in `tests/validation/gates.test.ts` that simulates 3 seasons and checks the gate.

### Test Coverage Rules
- Engine math functions: **must have unit tests**
- Simulation output distributions: **validated by gates**
- UI components: no test requirement yet (integration testing via play)
- Worker API methods: tested implicitly through season simulation gates

---

## 11. Important Conventions

### The `_state` Pattern in worker.ts
```typescript
// Worker owns the canonical state as a module-level variable
let _state: LeagueState | null = null;
let _playerMap = new Map<number, Player>();

// Always call requireState() before accessing _state
function requireState(): LeagueState {
  if (!_state) throw new Error('No game loaded.');
  return _state;
}

// After mutating players array, always call rebuildMaps()
function rebuildMaps(): void {
  _playerMap = new Map(_state!.players.map(p => [p.playerId, p]));
  _teamMap   = new Map(_state!.teams.map(t => [t.teamId, t]));
}
```

### PRNG Usage (critical for determinism)
```typescript
import { createPRNG, deserializeState, serializeState, nextFloat } from './math/prng';
import type { RandomGenerator } from 'pure-rand';

// Always use the passed-in gen, never Math.random()
function simulateGame(gen: RandomGenerator): [GameResult, RandomGenerator] {
  const [roll, nextGen] = gen.next();
  const normalized = Number(roll) / 0xffffffff;
  // ...
  return [result, nextGen];
}

// Save state between sessions
state.prngState = serializeState(gen);
gen = deserializeState(state.prngState);
```

### Salary Scale Reference
```
Level         Annual Salary Range
────────────────────────────────────
Pre-arb       $700K (league minimum)
Arb Year 1    $1M–$5M
Arb Year 2    $3M–$12M
Arb Year 3    $6M–$20M
FA (avg)      $10M–$35M
FA (elite)    $30M–$45M
```

---

## 12. File Map (Alphabetical, Flat)

```
src/App.tsx                              — App init, tab lock, save loading, routing
src/components/dashboard/Dashboard.tsx  — [CLAUDE] Main game hub; season sim + phase orchestration
src/components/dashboard/DevGradeCard.tsx — [CLAUDE] Prospect development grades UI
src/components/dashboard/FranchisePanel.tsx — [CLAUDE] Owner patience + morale + news
src/components/dashboard/LegacyTimeline.tsx — [CLAUDE] Franchise history viz
src/components/dashboard/MFSNPanel.tsx  — [CLAUDE] Pre-season predictions display
src/components/dashboard/MomentsPanel.tsx — [CLAUDE] Season highlights
src/components/dashboard/PlayoffBracket.tsx — [CLAUDE] Playoff bracket UI
src/components/dashboard/PressConference.tsx — [CLAUDE] Press Q&A interaction
src/components/dashboard/ReputationCard.tsx — [CLAUDE] Team reputation display
src/components/dashboard/RivalryPanel.tsx — [CLAUDE] Rivalry tracking UI
src/components/dashboard/StaffPoachModal.tsx — [CLAUDE] Staff poaching events
src/components/dashboard/StandingsTable.tsx — [CLAUDE] League standings
src/components/dashboard/StoryboardPanel.tsx — [CLAUDE] Season arc narrative
src/components/dashboard/WeeklyCard.tsx — [CLAUDE] Weekly story summaries
src/components/layout/Shell.tsx         — [CLAUDE] Nav shell, SAVE/NEW GAME buttons
src/components/offseason/FreeAgencyPanel.tsx — [CLAUDE] FA market UI
src/components/offseason/TradeCenter.tsx — [CLAUDE] Trade UI
src/components/roster/RosterView.tsx    — [CLAUDE] 9-tab roster management
src/components/setup/SetupFlow.tsx      — [CLAUDE] New game wizard
src/components/stats/Leaderboards.tsx   — [CLAUDE] Stat leaderboards
src/components/stats/PlayerProfile.tsx  — [CLAUDE] Player detail view
src/data/frontOffice.ts                 — [CODEX] FO roles and traits data
src/data/nameDatabase.ts                — [CODEX] Player name pools
src/data/parkFactors.ts                 — [CODEX] 30 park factor profiles
src/data/positionalPriors.ts            — [CODEX] Bayesian attribute priors by position
src/data/pressConference.ts             — [CLAUDE] Press conference dialogue
src/data/re24Matrix.ts                  — [CODEX] Run expectancy values
src/data/scheduleTemplate.ts            — [CODEX] 162-game schedule generation
src/data/teams.ts                       — [CODEX] 30-team definitions
src/db/cache.ts                         — [CODEX] In-memory data cache
src/db/schema.ts                        — [SHARED] Dexie schema + saveGame/loadGame
src/db/streaming.ts                     — [CODEX] Save compression
src/db/tabGuard.ts                      — [CODEX] Multi-tab lock
src/engine/engineClient.ts              — [SHARED] getEngine() Comlink wrapper
src/engine/freeAgency.ts               — [SHARED] FA class generation + signing logic
src/engine/moments.ts                   — [CLAUDE] Season moments generation
src/engine/narrative.ts                 — [CLAUDE] Owner patience, morale, news generation
src/engine/playerTraits.ts              — [CODEX] Player personality traits
src/engine/predictions.ts               — [CLAUDE] MFSN prediction engine
src/engine/reputation.ts               — [CLAUDE] Team reputation system
src/engine/rivalry.ts                   — [CLAUDE] Rivalry tracking
src/engine/rosterActions.ts             — [SHARED] Promote/demote/DFA/release logic
src/engine/staffPoaching.ts             — [CLAUDE] Staff recruitment events
src/engine/storyboard.ts               — [CLAUDE] Season narrative arc engine
src/engine/trading.ts                   — [SHARED] Trade valuation + execution
src/engine/worker.ts                    — [SHARED] Comlink API — add methods, never remove
src/engine/math/bayesian.ts             — [CODEX] Pythagorean win%, Bayesian inference
src/engine/math/log5.ts                 — [CODEX] Log5 matchup formula, weighted rates
src/engine/math/prng.ts                 — [CODEX] Seedable PRNG wrapper
src/engine/player/attributes.ts         — [CODEX] OVR calculation, scouting scale
src/engine/player/awards.ts             — [CODEX] MVP/Cy Young/Gold Glove voting
src/engine/player/development.ts        — [CODEX] SDE aging + development curves
src/engine/player/generation.ts         — [CODEX] Initial player pool generation
src/engine/sim/fsm.ts                   — [CODEX] Game FSM (inning logic, pitching changes)
src/engine/sim/gameSimulator.ts         — [CODEX] Single-game orchestrator
src/engine/sim/markov.ts               — [CODEX] Base-running Markov chains
src/engine/sim/plateAppearance.ts       — [CODEX] PA outcome resolution (Log5 + attrs)
src/engine/sim/playoffSimulator.ts      — [SHARED] Playoff bracket simulation
src/engine/sim/seasonSimulator.ts       — [CODEX] 162-game season loop
src/store/gameStore.ts                  — [SHARED] Core game state + resetAll
src/store/leagueStore.ts                — [SHARED] League data + resetAll
src/store/uiStore.ts                    — [SHARED] Navigation + UI state
src/types/frontOffice.ts                — [SHARED] FO type definitions
src/types/game.ts                       — [SHARED] Game/PA/BoxScore types
src/types/league.ts                     — [SHARED] LeagueState, SeasonResult, etc.
src/types/player.ts                     — [SHARED] Player, attributes, roster status
src/types/team.ts                       — [SHARED] Team, division, record types
src/utils/constants.ts                  — [SHARED] GATES, scales, tuning values
src/utils/helpers.ts                    — [SHARED] Pearson correlation, formatting
tests/engine/markov.test.ts             — [CODEX] Markov chain unit tests
tests/engine/plateAppearance.test.ts    — [CODEX] PA outcome distribution tests
tests/validation/gates.test.ts          — [CODEX] System-level stat calibration (35 tests)
```

---

## 13. Commit Message Format

```
type(scope): short description

feat(engine): add injury probability calculation
fix(sim): correct ERA gate threshold from 4.40 to 4.50
test(gates): add leagueGamesOnIL gate
chore: update package-lock.json
refactor(worker): extract trade methods to separate module
```

Types: `feat`, `fix`, `test`, `chore`, `refactor`, `docs`, `style`

---

## 14. Quick Reference Card

```bash
# Start dev
npm run dev

# Before every commit
npm run typecheck && npm run test

# Run specific test file
npx vitest run tests/validation/gates.test.ts

# Run tests in watch mode
npm run test:watch

# Type check only
npm run typecheck

# Production build
npm run build
```

```typescript
// Get the worker engine
import { getEngine } from '../../engine/engineClient';
const engine = getEngine();

// Get standings
const { standings } = await engine.getStandings();

// Get a team's full roster (all 7 levels)
const roster = await engine.getFullRoster(teamId);

// Promote a player
const result = await engine.promotePlayer(playerId, 'MLB_ACTIVE');
if (!result.ok) console.error(result.error);

// Simulate a season
const seasonResult = await engine.simulateSeason((pct) => {
  console.log(`${Math.round(pct * 100)}% complete`);
});
```

---

*This document is the source of truth for the Mr. Baseball Dynasty codebase. Update it whenever you make significant architectural changes.*
