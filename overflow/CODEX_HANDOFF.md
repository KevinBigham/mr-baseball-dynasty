# CODEX HANDOFF BIBLE — Mr. Baseball Dynasty

> **Repo**: `KevinBigham/mr-baseball-dynasty`
> **Primary Branch**: `claude/baseball-dynasty-sim-UjlF2`
> **Live Site**: GitHub Pages (deploys from `main`)
> **Last Updated**: 2026-03-03
> **Total Source**: ~34,800 lines TypeScript/TSX across 90+ files
> **Tests**: 56 test files, ~7,900 lines, 478+ passing tests

---

## TABLE OF CONTENTS

1. [What This Game Is](#1-what-this-game-is)
2. [What's Built (Complete Feature List)](#2-whats-built)
3. [What's NOT Built (Priority Backlog)](#3-whats-not-built)
4. [Tech Stack](#4-tech-stack)
5. [How to Run](#5-how-to-run)
6. [Architecture Deep-Dive](#6-architecture-deep-dive)
7. [The Engine (Web Worker)](#7-the-engine-web-worker)
8. [The Complete Worker API](#8-the-complete-worker-api)
9. [Type System Reference](#9-type-system-reference)
10. [State Management (Zustand Stores)](#10-state-management)
11. [Simulation Engine Internals](#11-simulation-engine-internals)
12. [Player System](#12-player-system)
13. [Season Flow (State Machine)](#13-season-flow)
14. [Offseason Flow](#14-offseason-flow)
15. [Database & Save System](#15-database--save-system)
16. [UI Components Map](#16-ui-components-map)
17. [Complete File Map (Every Source File)](#17-complete-file-map)
18. [Testing Guide](#18-testing-guide)
19. [Calibration & Gates](#19-calibration--gates)
20. [Design Language](#20-design-language)
21. [Critical Code Patterns](#21-critical-code-patterns)
22. [Known Gotchas & Landmines](#22-known-gotchas--landmines)
23. [Roadmap: Next Features to Build](#23-roadmap)
24. [Commit & Branch Conventions](#24-conventions)

---

## 1. What This Game Is

**Mr. Baseball Dynasty** is a browser-based baseball franchise management simulator. Think Football Manager meets OOTP Baseball, running entirely client-side with no backend server.

The player manages one of 30 fictional baseball teams through multiple seasons: drafting prospects, signing free agents, making trades, managing rosters across 7 minor league levels, and competing for championships. The game simulates a full 162-game season using a physics-inspired plate appearance engine with Log5 matchup math, Markov base-running chains, and realistic stat distributions validated against real MLB data.

**The vision**: The greatest sports dynasty simulator game of all-time. We're building something that rivals commercial products but runs free in a browser.

---

## 2. What's Built

### Core Gameplay Loop (COMPLETE)
- 30 fictional teams across AL/NL, 3 divisions each
- ~3,700 procedurally generated players across 7 minor league levels + MLB
- Full 162-game season simulation with interactive month-by-month pacing
- Sim controls: 1 day, 1 week, 1 month, or full remaining season
- Playoff bracket: Wild Card (3-game) -> Division Series (5-game) -> Championship Series (7-game) -> World Series (7-game)
- Playoff MVP selection

### Roster Management (COMPLETE)
- 26-man active roster / 40-man roster enforcement
- Promote/demote across all 7 levels (MLB, AAA, AA, High-A, Low-A, Rookie, International)
- DFA (Designated for Assignment) with waiver exposure
- Release players, IL stints (10-day and 60-day)
- Option year tracking (3 options, 20-day usage consumption)
- Depth chart visualization
- Lineup editor (9-man batting order)
- Rotation editor (5-man pitching rotation)
- Prospect pipeline board with farm grades and ETAs

### Transactions (COMPLETE)
- **Free Agency**: Full FA market with projected salary/years, AI competition, user bidding
- **Trades**: AI-generated offers + user-proposed trades + shop-a-player system
- **Amateur Draft**: 10-round draft with scouted prospects, fog-of-war grades, AI auto-picks
- **Rule 5 Draft**: Eligible player identification + selection UI
- **International Signing**: Bonus pool bidding for international prospects
- **Contract Extensions**: Offer/counter-offer negotiation system
- **Waivers**: DFA'd players exposed to waiver claims
- **Arbitration**: Salary arbitration for eligible players

### Statistics & Records (COMPLETE)
- Traditional stats (AVG, HR, RBI, ERA, W, K, etc.)
- Advanced stats (wOBA, wRC+, FIP, xFIP, WAR, OPS+, BABIP)
- League leaderboards with min-PA/IP filters
- Career stats tracking persisted across seasons
- Franchise records book (single-season and career)
- Hall of Fame system with voting simulation
- Award races (MVP, Cy Young, ROY, Gold Glove, Silver Slugger)

### Narrative & Immersion (COMPLETE)
- Owner patience system (get fired if you lose too much)
- Team morale tracker
- News feed with contextual stories
- Press conference Q&A interactions
- Rivalry system between teams
- Season storyboard arcs
- Weekly highlight cards
- Season moments gallery
- MFSN pre-season predictions
- Team reputation score
- Staff poaching events
- Breakout watch candidates
- Development grade cards for prospects
- Pennant race tracker (magic/elimination numbers)
- All-Star break midseason event
- Trade deadline phase
- Mid-season free agent market

### Infrastructure (COMPLETE)
- Auto-save after each offseason + manual save/load
- Gzip-compressed saves in IndexedDB
- Multi-tab lock (prevents data corruption)
- Error boundaries per route
- Crash recovery screen
- Tutorial overlay system
- PWA manifest (installable as app)
- GitHub Pages deployment via Actions
- WCAG accessibility attributes
- Mobile-responsive layout with mobile nav
- Loading skeletons
- Toast notification system
- Confirm modal system
- Offline indicator

---

## 3. What's NOT Built

### HIGH IMPACT (Engine Work)
1. **Player Personality & Chemistry** — Players have hidden `workEthic` and `mentalToughness` but these don't affect gameplay yet. Build a chemistry system where clubhouse dynamics impact team performance.
2. **Coaching Staff Active Effects** — Staff is selected during setup but effects are currently zero. Wire `FOTraitId` actions to actual bonuses (hitter dev +5-15%, pitcher dev boost, scouting fog reduction, medical injury reduction).
3. **Improved Trade AI** — Current AI generates somewhat random offers. Need: position-need targeting, surplus identification, prospect valuation weighting, package deals (2-for-1, 3-for-2), no-trade clause respect.
4. **Minor League Rehab Assignments** — MLB players recovering from injury should optionally do rehab stints in minors.
5. **Compensatory Draft Picks** — Teams losing big FAs should get comp picks in the next draft.

### MEDIUM IMPACT (Shared Work)
6. **Historical Season Browser** — View past season standings, stats, awards in a dedicated history tab.
7. **Manager/Coach Hiring UI** — Hire/fire coaching staff between seasons with salary costs.
8. **Expanded Narrative Events** — Trade rumors, press reactions to trades, rivalry game events, player milestone celebrations.
9. **Season Awards Ceremony** — End-of-season ceremony screen showing all award winners.
10. **Expanded Playoff Experience** — Game-by-game playoff simulation with box scores and highlights.

### LOWER IMPACT (Polish)
11. **Dark/rebuild mode visual themes** — Different UI themes based on team performance.
12. **Season simulation speed controls** — Faster/slower animation.
13. **Mobile layout refinements** — Some complex screens need better mobile treatment.
14. **Sound effects** — Optional audio for key events (home runs, strikeouts, wins).
15. **Multi-language support** — i18n framework.

---

## 4. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 18.3 | UI framework (functional components + hooks) |
| **TypeScript** | 5.6 | Type safety everywhere |
| **Vite** | 5.4 | Build tool + HMR dev server |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Zustand** | 5.0 | State management (3 stores: game, league, ui) |
| **Comlink** | 4.4 | Web Worker RPC (transparent async proxy) |
| **Dexie** | 3.2 | IndexedDB wrapper (save/load persistence) |
| **pure-rand** | 6.1 | Seedable PRNG for deterministic simulation |
| **pako** | 2.1 | Gzip compression for save data |
| **Recharts** | 2.12 | Charts/graphs for stats visualization |
| **react-window** | 1.8 | Virtualized lists for large player tables |
| **Vitest** | 2.1 | Test runner (Vite-native) |
| **jsdom** | 28.1 | DOM environment for component tests |
| **vite-plugin-pwa** | 1.2 | PWA/Service Worker generation |

**No backend. No database server. No API calls.** Everything runs in the browser. State lives in a Web Worker. Persistence is IndexedDB.

---

## 5. How to Run

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run all tests (must all pass before any commit)
npm run test

# TypeScript check (zero errors required)
npm run typecheck

# Production build
npm run build

# Run a specific test file
npx vitest run tests/validation/gates.test.ts

# Watch mode for tests
npm run test:watch
```

### THE GOLDEN RULE
Before pushing ANY change:
```bash
npm run typecheck && npm run test
```
Both must pass with ZERO errors. No exceptions.

---

## 6. Architecture Deep-Dive

```
BROWSER MAIN THREAD                         WEB WORKER THREAD
=======================                     ==================

React Components                            src/engine/worker.ts (Comlink API)
  |                                              |
  |--- Comlink proxy calls ------>               |--- sim/gameSimulator.ts
  |    (async, transparent)                      |--- sim/seasonSimulator.ts
  |                                              |--- sim/incrementalSimulator.ts
  |<-- Promise responses ---------               |--- sim/plateAppearance.ts
  |                                              |--- sim/markov.ts
  |                                              |--- sim/playoffSimulator.ts
Zustand Stores (3)                               |--- sim/fsm.ts
  gameStore.ts  -- phase, season, UI state       |
  leagueStore.ts -- standings, news, history     |--- player/generation.ts
  uiStore.ts   -- active tab, modals            |--- player/development.ts
  |                                              |--- player/attributes.ts
  |                                              |--- player/awards.ts
Dexie (IndexedDB)                                |
  db/schema.ts  -- saveGame/loadGame             |--- math/log5.ts
  db/cache.ts   -- in-memory caching             |--- math/bayesian.ts
  db/streaming.ts -- gzip compression            |--- math/prng.ts
  db/tabGuard.ts -- multi-tab protection         |
                                                 |--- freeAgency.ts
                                                 |--- trading.ts
                                                 |--- rosterActions.ts
                                                 |--- injuries.ts
                                                 |--- draft/draftPool.ts
                                                 |--- draft/draftAI.ts
                                                 |--- draft/rule5Draft.ts
                                                 |--- waivers.ts
                                                 |--- finances.ts
                                                 |--- internationalSigning.ts
                                                 |--- hallOfFame.ts
                                                 |--- franchiseRecords.ts
                                                 |--- advancedStats.ts
                                                 |--- scouting.ts
                                                 |--- devPrograms.ts
                                                 |--- staffEffects.ts
                                                 |--- aiRosterManager.ts
                                                 |--- narrative.ts
                                                 |--- storyboard.ts
                                                 |--- moments.ts
                                                 |--- predictions.ts
                                                 |--- reputation.ts
                                                 |--- rivalry.ts
                                                 |--- staffPoaching.ts
                                                 |--- playerTraits.ts
```

### Key Invariant
**The UI never directly mutates game state.** All mutations go through `engine.someMethod()` which modifies `_state` in the worker. The UI then re-fetches what it needs (standings, roster, etc.).

### How to call the engine from any component:
```typescript
import { getEngine } from '../../engine/engineClient';
const engine = getEngine();
const standings = await engine.getStandings();
```

---

## 7. The Engine (Web Worker)

**File**: `src/engine/worker.ts` (~2,547 lines) — This is the nerve center.

### Internal State (module-level variables in worker.ts):
```typescript
let _state: LeagueState | null = null;           // The canonical game state
let _playerMap = new Map<number, Player>();        // Quick player lookup
let _teamMap = new Map<number, Team>();            // Quick team lookup
let _playerSeasonStats = new Map<number, PlayerSeasonStats>();  // Current season stats
let _careerHistory = new Map<number, PlayerSeasonStats[]>();    // Career history
let _seasonResults: SeasonResult[] = [];           // All past season results
let _foStaff: FOStaffMember[] = [];               // Front office staff
let _lastAIRosterMoves: AIRosterMove[] = [];       // AI moves for display
let _cachedLeagueAverages: LeagueAverages | null = null;
let _retiredCareerHistory = new Map<number, RetiredPlayerRecord>();
let _hallOfFame: HallOfFameInductee[] = [];
let _franchiseRecords: FranchiseRecordBook | null = null;

// Draft state
let _draftState: InternalDraftState | null = null;

// International signing
let _intlProspects: IntlProspect[] = [];

// Dev Lab assignments
let _devAssignments = new Map<number, DevAssignment>();

// Scouting reports (fog-of-war)
let _scoutingReports = new Map<number, ScoutingReport>();

// Incremental season sim state
let _seasonSimState: SeasonSimState | null = null;

// User lineup/rotation
let _lineupOrder: number[] = [];    // 9 player IDs
let _rotationOrder: number[] = [];  // 5 starter IDs
```

### Critical Helper Functions:
```typescript
// Always call before accessing _state
function requireState(): LeagueState { ... }

// Always call after mutating players/teams arrays
function rebuildMaps(): void { ... }

// Scrub lineup/rotation when roster changes
function _scrubLineupRotation(): void { ... }
```

---

## 8. The Complete Worker API

Every method the UI can call, organized by category:

### Game Lifecycle
```typescript
newGame(seed: number, userTeamId: number): Promise<void>
getFullState(): Promise<LeagueState>
loadState(state: LeagueState): Promise<void>
ping(): Promise<string>
```

### Season Simulation
```typescript
simulateSeason(): Promise<SeasonResult>
initSeasonSim(): Promise<{ totalGames: number }>
simNextSegment(): Promise<ChunkResult>      // Month-by-month
simOneDay(): Promise<SimRangeResult>
simOneWeek(): Promise<SimRangeResult>
simOneMonth(): Promise<SimRangeResult>
simRemainder(): Promise<SimRangeResult>
finishSeason(): Promise<SeasonResult>       // Finalize after all chunks
getSeasonProgress(): Promise<{ completed: number; total: number; date: string }>
```

### Standings & Stats
```typescript
getStandings(): Promise<StandingsData>
getLeaderboard(stat: string, limit?: number): Promise<LeaderboardEntry[]>
getLeaderboardFull(options: LeaderboardFullOptions): Promise<LeaderboardFullEntry[]>
getAwardRace(category: string): Promise<AwardCandidate[]>
getCareerLeaderboard(stat: string, minSeasons?: number, limit?: number): Promise<...>
getSeasonResults(): Promise<SeasonResult[]>
getAdvancedHitting(playerId: number): Promise<AdvancedHittingStats>
getAdvancedPitching(playerId: number): Promise<AdvancedPitchingStats>
getStatGlossary(): Promise<Record<string, string>>
```

### Roster Operations
```typescript
getRoster(teamId: number): Promise<RosterData>
getFullRoster(teamId: number): Promise<{ active, il, aaa, aa, aPlus, aMinus, rookie, intl, dfa }>
promotePlayer(playerId: number, targetStatus: RosterStatus): Promise<TransactionResult>
demotePlayer(playerId: number, targetStatus: RosterStatus): Promise<TransactionResult>
dfaPlayer(playerId: number): Promise<TransactionResult>
releasePlayer(playerId: number): Promise<TransactionResult>
getLineupOrder(): Promise<number[]>
setLineupOrder(ids: number[]): Promise<void>
getRotationOrder(): Promise<number[]>
setRotationOrder(ids: number[]): Promise<void>
```

### Player Info
```typescript
getPlayerProfile(playerId: number): Promise<PlayerProfileData>
getPlayerCareerStats(playerId: number): Promise<PlayerSeasonStats[]>
```

### Playoffs
```typescript
simulatePlayoffs(): Promise<PlayoffBracket | null>
```

### Free Agency
```typescript
startOffseason(): Promise<void>
getFreeAgents(limit?: number): Promise<FAPlayer[]>
signFreeAgent(playerId: number, years: number, salary: number): Promise<TransactionResult>
finishOffseason(): Promise<{ aiSignings: AISigningRecord[] }>
```

### Trades
```typescript
getTradeOffers(): Promise<TradeProposal[]>
getTeamPlayers(teamId: number): Promise<TradePlayerInfo[]>
proposeTrade(partnerTeamId: number, userIds: number[], partnerIds: number[]): Promise<TradeResult>
acceptTradeOffer(partnerTeamId: number, userIds: number[], partnerIds: number[]): Promise<TradeResult>
shopPlayer(playerId: number): Promise<TradeProposal[]>
findTradesForNeed(position: string): Promise<TradeProposal[]>
```

### Draft
```typescript
startDraft(): Promise<{ prospects: DraftProspect[]; draftOrder: number[]; totalRounds: number }>
getDraftBoard(): Promise<DraftBoardState>
userDraftPick(playerId: number): Promise<DraftPick>
aiDraftUntilUser(): Promise<DraftPick[]>
completeDraft(): Promise<void>
```

### Rule 5 Draft
```typescript
getRule5Eligible(): Promise<Rule5Selection[]>
userRule5Pick(playerId: number): Promise<Rule5Selection>
conductRule5AI(): Promise<Rule5Selection[]>
```

### International Signing
```typescript
startIntlSigning(): Promise<IntlProspect[]>
signIntlProspect(prospectIdx: number): Promise<TransactionResult>
finishIntlSigning(): Promise<void>
```

### Extensions & Arbitration
```typescript
getExtensionCandidates(): Promise<ExtensionCandidate[]>
offerExtension(playerId: number, years: number, salary: number): Promise<...>
getArbitrationCases(): Promise<ArbitrationCase[]>
resolveArbitration(playerId: number, accept: boolean): Promise<...>
```

### Waivers
```typescript
getWaiverPlayers(): Promise<WaiverPlayer[]>
claimWaiverPlayer(playerId: number): Promise<WaiverClaim>
processAIWaivers(): Promise<WaiverClaim[]>
```

### Finances
```typescript
getPayrollReport(teamId: number): Promise<PayrollReport>
```

### AI Roster Management
```typescript
getAIRosterMoves(): Promise<AIRosterMove[]>
```

### Hall of Fame & Records
```typescript
getHallOfFame(): Promise<HallOfFameInductee[]>
getFranchiseRecords(): Promise<FranchiseRecordBook>
```

### Scouting & Development
```typescript
getScoutingReport(playerId: number): Promise<ScoutingReport>
getDevAssignment(playerId: number): Promise<DevAssignment | null>
setDevAssignment(playerId: number, program: DevProgram): Promise<void>
```

---

## 9. Type System Reference

### Player (`src/types/player.ts`)
```typescript
interface Player {
  playerId: number;
  teamId: number;        // -1 = free agent
  name: string;
  age: number;
  position: Position;    // 'C'|'1B'|'2B'|'3B'|'SS'|'LF'|'CF'|'RF'|'DH'|'SP'|'RP'|'CL'
  bats: BatSide;         // 'L'|'R'|'S'
  throws: ThrowSide;     // 'L'|'R'
  nationality: 'american' | 'latin' | 'asian';
  isPitcher: boolean;
  hitterAttributes: HitterAttributes | null;
  pitcherAttributes: PitcherAttributes | null;
  overall: number;       // 0-550 internal scale (NOT 0-100!)
  potential: number;     // Peak projection (0-550)
  development: DevelopmentData;
  rosterData: PlayerRosterData;
}
```

**IMPORTANT**: `overall` is on a 0-550 internal scale. Display with `toScoutingScale(overall)` -> 20-80 scouting grade. MLB average is ~400. AAA average is ~300.

### Hitter Attributes (each 0-550):
`contact`, `power`, `eye`, `speed`, `baserunningIQ`, `fielding`, `armStrength`, `durability`, `platoonSensitivity` (-1 to 1), plus hidden: `offensiveIQ`, `defensiveIQ`, `workEthic` (0-100), `mentalToughness` (0-100)

### Pitcher Attributes (each 0-550):
`stuff`, `movement`, `command`, `stamina`, `pitchArsenalCount` (2-5), `gbFbTendency` (0-100), `holdRunners`, `durability`, `recoveryRate`, `platoonTendency` (-1 to 1), `pitchTypeMix` ({fastball, breaking, offspeed} fractions), plus hidden: `pitchingIQ`, `workEthic`, `mentalToughness`

### Roster Statuses (14 types):
`MLB_ACTIVE`, `MLB_IL_10`, `MLB_IL_60`, `MINORS_AAA`, `MINORS_AA`, `MINORS_APLUS`, `MINORS_AMINUS`, `MINORS_ROOKIE`, `MINORS_INTL`, `DFA`, `WAIVERS`, `FREE_AGENT`, `RETIRED`, `DRAFT_ELIGIBLE`

### Player Roster Data:
```typescript
interface PlayerRosterData {
  rosterStatus: RosterStatus;
  isOn40Man: boolean;
  optionYearsRemaining: number;      // 0-3
  optionUsedThisSeason: boolean;
  minorLeagueDaysThisSeason: number; // 20+ = option consumed
  demotionsThisSeason: number;       // Max 5
  serviceTimeDays: number;           // 172 days = 1 service year
  serviceTimeCurrentTeamDays: number;
  contractYearsRemaining: number;
  salary: number;                    // Annual in dollars
  arbitrationEligible: boolean;
  freeAgentEligible: boolean;
  hasTenAndFive: boolean;
  currentInjury?: InjuryRecord;
  rule5Selected: boolean;
  // ...more fields
}
```

### Team (`src/types/team.ts`)
```typescript
interface Team {
  teamId: number;
  name: string;            // "River City Wolves"
  abbreviation: string;    // "RCW"
  city: string;
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  parkFactorId: number;
  budget: number;          // Annual payroll in dollars
  scoutingQuality: number; // 0.4-1.0
  coaching: { hittingCoachQuality: number; pitchingCoachQuality: number };
  strategy: 'contender' | 'fringe' | 'rebuilder';
  seasonRecord: TeamRecord;
  rotationIndex: number;
  bullpenReliefCounter: number;
}
```

### LeagueState (`src/types/league.ts`)
```typescript
interface LeagueState {
  season: number;
  teams: Team[];
  players: Player[];
  schedule: ScheduleEntry[];
  environment: LeagueEnvironment;
  prngState: number[];
  userTeamId: number;
  careerHistory?: Record<string, PlayerSeasonStats[]>;
  retiredPlayers?: Record<string, RetiredPlayerRecord>;
  hallOfFame?: HallOfFameInductee[];
  franchiseRecords?: FranchiseRecordBook;
  playerSeasonStats?: Record<string, PlayerSeasonStats>;
  draftState?: { ... };
  lineupOrder?: number[];
  rotationOrder?: number[];
  seasonResults?: SeasonResult[];
  seasonSimState?: SeasonSimState;
  devAssignments?: Record<string, DevAssignment>;
  scoutingReports?: Record<string, ScoutingReport>;
}
```

### SeasonResult
```typescript
interface SeasonResult {
  season: number;
  teamSeasons: TeamSeasonStats[];
  playerSeasons: PlayerSeasonStats[];
  boxScores: BoxScore[];
  leagueBA: number;
  leagueERA: number;
  leagueRPG: number;
  teamWinsSD: number;
  awards?: SeasonAwards;
  divisionChampions?: DivisionChampion[];
  developmentEvents?: DevelopmentEvent[];
  injuryEvents?: InjuryEvent[];
}
```

---

## 10. State Management

Three Zustand stores. All in `src/store/`.

### `gameStore.ts` — Core game state
```
season: number (starts 2026)
userTeamId: number
gamePhase: 'preseason' | 'in_season' | 'simulating' | 'postseason' | 'offseason' | 'fired'
seasonPhase: 'early' | 'allstar' | 'deadline' | 'stretch' | 'complete'
gameStarted: boolean
seasonsManaged: number
ownerPatience: number (0-100)
teamMorale: number (0-100)
difficulty: 'rookie' | 'normal' | 'hard'
tutorialActive: boolean
currentSegment: number (0-4, which month chunk)
inSeasonPaused: boolean
gamesCompleted: number
totalGames: number
```

### `leagueStore.ts` — League data
```
standings: StandingsData | null
roster: RosterData | null
leaderboard: LeaderboardEntry[]
newsItems: NewsItem[] (max 50)
rivals: RivalRecord[]
franchiseHistory: SeasonSummary[] (max 30)
moments: SeasonMoment[] (max 100)
weeklyStories: WeeklyStory[]
presserAvailable / presserDone: boolean
mfsnReport: MFSNReport | null
```

### `uiStore.ts` — Navigation & UI
```
activeTab: 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile'
+ various modal/filter states
```

### Rules for modifying stores:
1. Add new fields to the interface AND initial state AND implement the setter
2. Never rename existing fields (breaks save compatibility)
3. Always provide both `setX(value)` and `adjustX(delta)` for numeric values

---

## 11. Simulation Engine Internals

### Plate Appearance Resolution (`src/engine/sim/plateAppearance.ts`)
The heart of the entire simulation. Uses Log5 matchup formula to resolve each plate appearance.

**Critical calibration values** (touch with extreme care, run ALL tests after):
- `stuffFactor` exponent: **1.3** — raises elite pitcher K rate separation
- `powerFactor` exponent: **1.8** — HR rate scaling
- `PITCHER_WEIGHTS.strikeout`: **0.75** — pitchers own 75% of K outcome

### Game Simulator (`src/engine/sim/gameSimulator.ts`)
Orchestrates a single 9-inning game:
1. Selects starting pitchers from rotation
2. Runs plate appearances via `resolvePlateAppearance()`
3. Manages pitching changes (TTO threshold, pitch count, fatigue)
4. Handles extra innings with Manfred runner (runner on 2B from 10th inning)
5. Returns a complete `BoxScore` with play-by-play log

### Season Simulator (`src/engine/sim/seasonSimulator.ts`)
Loops through the 162-game schedule:
1. For each game, calls `gameSimulator`
2. Tracks cumulative `PlayerSeasonStats`
3. Processes injuries each game
4. Returns aggregate `SeasonResult` with league-level stats

### Incremental Simulator (`src/engine/sim/incrementalSimulator.ts`)
Enables month-by-month interactive play:
- `SEGMENTS` = 5 chunks (roughly monthly)
- `simulateChunk()` runs one segment
- `simulateRange()` runs to a specific game target
- UI calls `simOneDay()`, `simOneWeek()`, etc.

### Markov Base-Running (`src/engine/sim/markov.ts`)
State machine for base-runner advancement on hits/outs. Uses the RE24 run expectancy matrix from `src/data/re24Matrix.ts`.

### Log5 Math (`src/engine/math/log5.ts`)
Classic Bill James Log5 formula for matchup resolution. Adjusts for:
- Batter vs pitcher attribute matchup
- Park factors
- Platoon advantage
- Times Through Order penalty
- Fatigue effects

### PRNG (`src/engine/math/prng.ts`)
Seedable PRNG using `pure-rand` library. **NEVER use `Math.random()` in game logic.** Always pass the generator through and return the next state:
```typescript
const [roll, nextGen] = gen.next();
const normalized = Number(roll) / 0xffffffff;
return [result, nextGen];
```

---

## 12. Player System

### Generation (`src/engine/player/generation.ts`)
Creates ~3,690 players at game start:

| Level | Count/Team | OVR Range | Age Range | 40-Man |
|-------|-----------|-----------|-----------|--------|
| MLB_ACTIVE | 25 | 340-510 | 23-38 | yes |
| MINORS_AAA | 10 | 280-420 | 21-28 | some |
| MINORS_AA | 10 | 230-370 | 19-25 | few |
| MINORS_APLUS | 8 | 200-330 | 18-23 | rare |
| MINORS_AMINUS | 8 | 170-300 | 17-22 | no |
| MINORS_ROOKIE | 6 | 150-270 | 16-21 | no |
| MINORS_INTL | 6 | 120-230 | 16-17 | no |

### Development (`src/engine/player/development.ts`)
Uses Stochastic Differential Equations (SDE) with Ornstein-Uhlenbeck process:
- **Prospect phase**: High growth rate, high volatility
- **Ascent phase**: Moderate growth, moderate volatility
- **Prime phase**: Near-zero growth, low volatility
- **Decline phase**: Negative growth, low volatility
- **Retirement phase**: Steep decline

### Awards (`src/engine/player/awards.ts`)
Computes: MVP, Cy Young, Rookie of the Year, Gold Glove (per position), Silver Slugger, Division Champions

### Attributes (`src/engine/player/attributes.ts`)
- `computeOverall()` — Calculates OVR from individual attributes
- `toScoutingScale(ovr)` — Converts 0-550 to 20-80 scouting grade

---

## 13. Season Flow (State Machine)

```
SetupFlow (gameStarted=false)
    |
    v
'preseason' ──[User clicks SIM or uses granular controls]──> 'in_season'
    ^                                                              |
    |                                        [Month chunks via simNextSegment()]
    |                                        [Or: simOneDay/Week/Month/Remainder]
    |                                                              |
    |                                                              v
    |                                                    'postseason'
    |                                                         |
    |                                              [simulatePlayoffs()]
    |                                                         |
    |                                                         v
    |                                                    'offseason'
    |                                                         |
    |                               [7-phase offseason flow (see below)]
    |                                                         |
    └────────────[finishOffseason() + advance season]─────────┘

Special: If ownerPatience hits 0 -> 'fired' (game over screen)
```

### In-Season Pacing
The season is divided into 5 segments (roughly monthly). Between segments, the game pauses to show:
- Monthly recap with user team record
- Mid-season events (All-Star break at segment 2, Trade Deadline at segment 3)
- Pennant race updates
- Player of the month highlights

---

## 14. Offseason Flow

Seven phases in sequence:

1. **Postseason Report** — Season summary, awards, development events
2. **Arbitration** — Resolve salary cases for arb-eligible players
3. **Rule 5 Draft** — Select unprotected minor leaguers
4. **Free Agency** — Sign free agents (user + AI)
5. **International Signing** — Bid on international prospects
6. **Contract Extensions** — Negotiate extensions with current players
7. **Amateur Draft** — 10-round draft of new prospects

After all phases: `finishOffseason()` processes AI signings, AI roster moves, advances service time, runs development (aging + progression), generates new season schedule.

---

## 15. Database & Save System

### Schema (`src/db/schema.ts`)
```typescript
// Dexie (IndexedDB) schema
db.version(1).stores({
  saves: '++id, name, teamName, season, timestamp'
});

// Save game
await saveGame(state: LeagueState, name: string, teamName: string): Promise<number>

// Load game
await loadGame(saveId: number): Promise<LeagueState>

// List saves (descending by timestamp)
await listSaves(): Promise<SaveRecord[]>

// Delete save
await deleteSave(saveId: number): Promise<void>
```

### Save Format
- Full `LeagueState` serialized to JSON
- Compressed with pako (gzip)
- Stored as `Uint8Array` in IndexedDB
- Auto-save triggers after each offseason
- Manual save available anytime via Shell header button

### Cache (`src/db/cache.ts`)
In-memory LRU cache for frequently accessed data (standings, roster). Invalidated on state mutations.

### Tab Guard (`src/db/tabGuard.ts`)
BroadcastChannel-based lock prevents multiple tabs from corrupting IndexedDB writes.

---

## 16. UI Components Map

### Core Layout
- `src/App.tsx` — Entry point, tab lock, save loading, routes to SetupFlow or Shell
- `src/components/layout/Shell.tsx` — Main nav shell, SAVE/NEW GAME buttons, tab navigation
- `src/components/layout/MobileNav.tsx` — Bottom nav for mobile
- `src/components/layout/ErrorBoundary.tsx` — Per-route error catching
- `src/components/layout/ConfirmModal.tsx` — Reusable confirmation dialog
- `src/components/layout/ToastContainer.tsx` — Toast notifications
- `src/components/layout/SaveManager.tsx` — Save/load UI
- `src/components/layout/ScrollableTable.tsx` — Virtualized table wrapper
- `src/components/layout/Skeleton.tsx` — Loading skeleton components
- `src/components/layout/CrashScreen.tsx` — Fatal error recovery
- `src/components/layout/LoadingFallback.tsx` — Suspense fallback
- `src/components/layout/OfflineIndicator.tsx` — Offline status banner

### Dashboard (The Main Game Screen)
- `Dashboard.tsx` — Phase router (dispatches to Preseason/InSeason/Offseason dashboards)
- `PreseasonDashboard.tsx` — Pre-season view with predictions, roster overview
- `InSeasonDashboard.tsx` — Active season with sim controls, monthly events
- `OffseasonDashboard.tsx` — Offseason phase manager
- `PostseasonReport.tsx` — End-of-season summary
- `MonthRecap.tsx` — Monthly performance summary between chunks
- `PlayoffBracket.tsx` — Visual playoff bracket
- `StandingsTable.tsx` — League standings display
- `PennantRace.tsx` — Division race with magic/elimination numbers
- `SeasonProgressBar.tsx` — Visual season progress indicator
- `AllStarBreak.tsx` — Mid-season All-Star event
- `TradeDeadline.tsx` — Trade deadline phase
- `MidSeasonCheckIn.tsx` — Mid-season performance review
- `MidSeasonFAPanel.tsx` — Mid-season free agent market
- `SeasonHighlights.tsx` — Season highlight moments
- `PreseasonPanel.tsx` — Preseason preview info

### Dashboard Narrative Panels
- `FranchisePanel.tsx` — Owner patience, morale, news feed
- `MFSNPanel.tsx` — Pre-season predictions
- `MomentsPanel.tsx` — Season moments gallery
- `StoryboardPanel.tsx` — Season narrative arc
- `WeeklyCard.tsx` — Weekly story summaries
- `PressConference.tsx` — Interactive press Q&A
- `RivalryPanel.tsx` — Rivalry tracking
- `ReputationCard.tsx` — Team reputation score
- `DevGradeCard.tsx` — Prospect development grades
- `StaffPoachModal.tsx` — Staff poaching events
- `LegacyTimeline.tsx` — Franchise history visualization
- `AwardRacePanel.tsx` — Live award race tracking
- `AITransactionsPanel.tsx` — AI team transaction log
- `TeamDetailModal.tsx` — Click-through team detail
- `CareerSummary.tsx` — Player career summary card
- `FiredScreen.tsx` — Game over (owner fired you)

### Offseason
- `FreeAgencyPanel.tsx` — Free agent market with bidding
- `TradeCenter.tsx` — Trade proposal and offer management
- `ArbitrationPanel.tsx` — Salary arbitration cases
- `ExtensionPanel.tsx` — Contract extension negotiations
- `IntlSigningPanel.tsx` — International signing period
- `Rule5Panel.tsx` — Rule 5 draft interface
- `WaiversPanel.tsx` — Waiver wire claims
- `OffseasonSummary.tsx` — Offseason recap

### Draft
- `DraftRoom.tsx` — Full draft experience with scouted prospects
- `AnnualDraft.tsx` — Draft board and pick management

### Roster
- `RosterView.tsx` — 9-tab roster management (active, IL, AAA through INTL, DFA)
- `DepthChart.tsx` — Position-by-position depth chart
- `ProspectPipeline.tsx` — Top prospects board with farm grades
- `ILManagement.tsx` — Injured list management
- `DevLab.tsx` — Player development program assignment
- `ScoutingReports.tsx` — Fog-of-war scouting reports

### Stats
- `Leaderboards.tsx` — Stat leaderboards with filters
- `PlayerProfile.tsx` — Detailed player view with grades + stats
- `CareerStatsTable.tsx` — Multi-season career stats
- `CompareModal.tsx` — Side-by-side player comparison
- `FinanceView.tsx` — Team payroll and finances
- `FranchiseRecordsView.tsx` — All-time franchise records
- `HallOfFameGallery.tsx` — Hall of Fame inductees
- `HistoryView.tsx` — Season history browser

### Setup & Tutorial
- `SetupFlow.tsx` — New game wizard (team select, difficulty, staff, etc.)
- `TutorialOverlay.tsx` — Step-by-step tutorial system

---

## 17. Complete File Map

### `/src/engine/` — Game Engine (Worker Thread)
```
worker.ts                    [2547 lines] Main Comlink API - THE most important file
engineClient.ts              Comlink client wrapper (getEngine())

sim/gameSimulator.ts         Single-game simulation orchestrator
sim/seasonSimulator.ts       162-game season loop
sim/incrementalSimulator.ts  Month-by-month chunked simulation
sim/plateAppearance.ts       PA outcome resolution (Log5 + attributes)
sim/markov.ts                Base-running state transitions
sim/playoffSimulator.ts      Playoff bracket simulation
sim/fsm.ts                   Game flow finite state machine

player/generation.ts         Initial player pool creation
player/development.ts        SDE aging + progression curves
player/attributes.ts         OVR calculation, scouting scale conversion
player/awards.ts             MVP/Cy Young/Gold Glove voting

math/log5.ts                 Log5 matchup formula
math/bayesian.ts             Pythagorean win%, Bayesian inference
math/prng.ts                 Seedable PRNG wrapper

draft/draftPool.ts           Draft class generation + scouting
draft/draftAI.ts             AI draft pick selection logic
draft/rule5Draft.ts          Rule 5 draft logic

freeAgency.ts                FA class generation + signing
trading.ts                   Trade valuation + execution
rosterActions.ts             Promote/demote/DFA/release
injuries.ts                  Injury system
waivers.ts                   Waiver wire logic
finances.ts                  Payroll reports + arbitration
internationalSigning.ts      International prospect signing
hallOfFame.ts                HOF candidacy + voting
franchiseRecords.ts          Franchise record tracking
advancedStats.ts             wOBA, wRC+, FIP, xFIP, WAR calculations
scouting.ts                  Fog-of-war scouting reports
devPrograms.ts               Player development lab programs
staffEffects.ts              Coaching staff bonus computation
aiRosterManager.ts           AI team roster management
narrative.ts                 Owner patience, morale, news generation
storyboard.ts                Season narrative arc engine
moments.ts                   Season moments generation
predictions.ts               MFSN prediction engine
reputation.ts                Team reputation system
rivalry.ts                   Rivalry tracking
staffPoaching.ts             Staff recruitment events
playerTraits.ts              Player personality traits
```

### `/src/types/` — TypeScript Interfaces
```
player.ts    Player, attributes, roster status, season stats, injury
team.ts      Team, division, coaching, records
league.ts    LeagueState, SeasonResult, standings, roster, leaderboards
game.ts      PAResult, PlayEvent, BoxScore, GameResult, ScheduleEntry
frontOffice.ts  FO roles, traits, staff members
```

### `/src/data/` — Static Data
```
teams.ts              30 team definitions
nameDatabase.ts       Player name pools (American, Latin, Asian)
parkFactors.ts        30 park factor profiles
positionalPriors.ts   Bayesian attribute priors by position
re24Matrix.ts         Run expectancy values (24 base-out states)
scheduleTemplate.ts   162-game schedule generation algorithm
frontOffice.ts        FO role definitions and trait effects
pressConference.ts    Press conference dialogue trees
teamOptions.ts        Team selection options for setup
```

### `/src/store/` — Zustand State
```
gameStore.ts     Core game state (phase, season, UI flags)
leagueStore.ts   League data (standings, news, history)
uiStore.ts       Navigation and modal states
```

### `/src/db/` — Persistence
```
schema.ts        Dexie schema + saveGame/loadGame/listSaves
cache.ts         In-memory LRU cache
streaming.ts     Gzip compression for saves
tabGuard.ts      Multi-tab lock
```

### `/src/components/` — React UI (see Section 16 for details)
```
dashboard/    (32 files) Main game screen + narrative panels
layout/       (12 files) Shell, nav, error handling, modals
offseason/    (8 files) FA, trades, arbitration, extensions
draft/        (2 files) Draft room + annual draft
roster/       (6 files) Roster management, depth chart, pipeline
stats/        (8 files) Leaderboards, profiles, records, HOF
setup/        (1 file) New game wizard
tutorial/     (1 file) Tutorial overlay
```

### `/tests/` — Test Suites
```
engine/       (38 files) Unit tests for all engine subsystems
components/   (14 files) Component tests
store/        (2 files) Store tests
validation/   (1 file) gates.test.ts — system-level stat calibration
setup.ts      Test setup/config
```

### Root Config
```
package.json         Dependencies + scripts
vite.config.ts       Vite + PWA + code splitting config
tsconfig.json        TypeScript config
tailwind.config.ts   Tailwind theme extensions
vitest.workspace.ts  Test workspace config
postcss.config.js    PostCSS config
index.html           Entry HTML with CSP headers
vercel.json          Vercel routing config
start-dev.sh         Dev startup script
.github/workflows/ci.yml      CI pipeline (typecheck + test + build)
.github/workflows/deploy.yml  GitHub Pages deployment
```

---

## 18. Testing Guide

### Test Locations
```
tests/engine/       — Unit tests for engine subsystems (38 files)
tests/components/   — React component tests (14 files)
tests/store/        — Zustand store tests (2 files)
tests/validation/   — System-level calibration gates (1 file, critical)
```

### Running Tests
```bash
npm run test                    # Run all 478+ tests
npx vitest run tests/validation/gates.test.ts   # Just gates
npx vitest run tests/engine/injuries.test.ts    # Specific file
npm run test:watch              # Watch mode
```

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('MySystem - feature', () => {
  it('does the thing correctly', () => {
    // Arrange
    const input = ...;
    // Act
    const result = myFunction(input);
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Gate Test Pattern
When adding a new major system, add a validation gate:
1. Add threshold to `src/utils/constants.ts` GATES object
2. Add test in `tests/validation/gates.test.ts` that simulates and checks
3. Gate tests simulate 1-3 full seasons and verify statistical distributions

---

## 19. Calibration & Gates

The game's statistical output is calibrated against real MLB data. Gates in `src/utils/constants.ts`:

```typescript
GATES = {
  leagueERA:          { min: 3.80, max: 4.50 },  // Real MLB: 3.96-4.51
  leagueBA:           { min: 0.245, max: 0.265 },
  leagueRPG:          { min: 4.2, max: 4.8 },
  teamWinsSD:         { min: 7, max: 14 },        // Real MLB: 12-15
  teamsOver100Wins:   { min: 0, max: 5 },
  teamsUnder60Wins:   { min: 0, max: 4 },
  playersWith40HR:    { min: 2, max: 14 },         // Real MLB: 3-10
  playersWith200K:    { min: 15, max: 35 },         // Real MLB: 20-30
  pitchersWith200IP:  { min: 5, max: 20 },
  pythagCorrelation:  { min: 0.85 },
  singleGameMs:       { max: 50 },                  // Performance
  fullSeasonMs:       { max: 5000 },
}
```

### Other Key Constants
```typescript
GAMES_PER_SEASON = 162
TEAMS_IN_LEAGUE = 30
ACTIVE_ROSTER_SIZE = 26
FORTY_MAN_SIZE = 40
ATTR_MAX = 550                    // Internal attribute ceiling
ATTR_MLB_AVERAGE = 400
SERVICE_DAYS_PER_YEAR = 172
FA_ELIGIBLE_YEARS = 6
ARBI_ELIGIBLE_YEARS = 3
```

---

## 20. Design Language

**Bloomberg Terminal aesthetic**:
- Background: `#0a0a0f` (near-black)
- Primary accent: `#f97316` (orange-500)
- Font: Monospace throughout
- CSS classes: `bloomberg-border`, `bloomberg-header`, `bloomberg-btn` (defined in `src/index.css`)
- Headers: ALL CAPS
- Body text: Sentence case
- No emojis in UI (except narrative moments)

---

## 21. Critical Code Patterns

### Getting the Engine (from any component)
```typescript
import { getEngine } from '../../engine/engineClient';
const engine = getEngine();
const result = await engine.someMethod();
```

### Worker State Access
```typescript
// Always call requireState() before accessing _state
function requireState(): LeagueState {
  if (!_state) throw new Error('No game loaded.');
  return _state;
}

// Always call rebuildMaps() after mutating players/teams arrays
function rebuildMaps(): void {
  _playerMap = new Map(_state!.players.map(p => [p.playerId, p]));
  _teamMap   = new Map(_state!.teams.map(t => [t.teamId, t]));
}
```

### PRNG (Determinism is Sacred)
```typescript
// NEVER use Math.random() in game logic
import { createPRNG, serializeState, deserializeState } from './math/prng';

function gameLogic(gen: RandomGenerator): [Result, RandomGenerator] {
  const [roll, nextGen] = gen.next();
  const normalized = Number(roll) / 0xffffffff;
  return [result, nextGen];
}

// Save PRNG state for save/load
state.prngState = serializeState(gen);
gen = deserializeState(state.prngState);
```

### Adding a New Worker API Method
1. Add the method inside the `api` object in `worker.ts`
2. Add return type annotation
3. The Comlink proxy automatically exposes it
4. Call it from UI: `await engine.newMethod(args)`

### Salary Scale
```
Pre-arb:       $700K (league minimum)
Arb Year 1:    $1M-$5M
Arb Year 2:    $3M-$12M
Arb Year 3:    $6M-$20M
FA (average):  $10M-$35M
FA (elite):    $30M-$45M
```

---

## 22. Known Gotchas & Landmines

1. **Overall scale is 0-550, NOT 0-100.** Always use `toScoutingScale()` for display.
2. **PRNG must be threaded through.** Every random call must use the passed generator and return the next state. `Math.random()` breaks determinism and save/load reproducibility.
3. **`rebuildMaps()` after ANY mutation** to the players or teams arrays. Forgetting this causes stale lookups.
4. **`_scrubLineupRotation()`** must be called after roster changes (promote, demote, trade, DFA). Stale player IDs in lineup crash the sim.
5. **plateAppearance.ts calibration values** are extremely sensitive. Changing the stuff exponent from 1.3 to 1.4 can break 5+ validation gates. Always run full test suite after PA changes.
6. **Worker methods are async.** All engine calls return Promises via Comlink. Always `await`.
7. **Save format compatibility.** Never rename fields in `LeagueState` or sub-types. Add new optional fields instead. Old saves must still load.
8. **40-man roster limit.** The game enforces 40-man limits. Promoting a player who isn't on the 40-man auto-adds them. If 40-man is full, the promote will fail.
9. **Option year tracking.** Players have 3 option years. Demoting a player with 0 options remaining requires outright waivers (DFA path).
10. **The `dist/` folder** is the production build output. Don't edit it directly.

---

## 23. Roadmap

### Immediate High-Value Targets
1. **Wire coaching staff effects** — The data structures exist (`src/engine/staffEffects.ts`, `src/data/frontOffice.ts`), just need to multiply bonuses into dev speed, sim outcomes
2. **Smarter trade AI** — Position-need analysis, prospect valuation, package deals
3. **Player chemistry system** — Use existing `workEthic` + `mentalToughness` hidden attrs
4. **Rehab assignments** — Minor league stints for recovering MLB players
5. **Comp draft picks** — Qualifying offers -> compensatory picks

### Medium-Term Vision
6. Historical season browser (all data exists in `_seasonResults`)
7. Manager/coach hiring with salaries
8. Expanded narrative events (trade rumors, milestone celebrations)
9. Playoff series detail view with box scores
10. Season awards ceremony screen

### Long-Term Dream Features
11. Online leagues (multiplayer via WebSocket)
12. Custom team creation
13. Real MLB historical data import
14. AI manager mode (watch the AI run your team)
15. Streaming/content creator mode with overlay support

---

## 24. Conventions

### Commit Messages
```
type(scope): short description

feat(engine): add injury probability calculation
fix(sim): correct ERA gate threshold
test(gates): add leagueGamesOnIL gate
chore: update dependencies
refactor(worker): extract trade methods
docs: update handoff bible
```

### Branch
- Main development: `claude/baseball-dynasty-sim-UjlF2`
- Production: `main`

### CI/CD
- `.github/workflows/ci.yml`: Runs on push to `main` and `claude/**` branches
  - `npm ci` -> `npm run typecheck` -> `npm test` -> `npm run build`
- `.github/workflows/deploy.yml`: Deploys `dist/` to GitHub Pages on push to `main`

---

## FINAL NOTES

This game has been built over 18 iterative rounds of development. Each round added significant depth:

- **Rounds 1-4**: Core engine, generation, simulation, basic UI
- **Rounds 5-8**: Deep gameplay (draft, AI, advanced stats, dynasty legacy)
- **Rounds 9-12**: Ship polish (save/load, error handling, PRNG determinism, a11y)
- **Rounds 13-16**: Engine hardening (lineup wiring, stat tracking, awards, empty states)
- **Rounds 17-18**: Player Development Lab, scouting fog-of-war, tutorial, mobile UX

The foundation is rock solid. The simulation produces realistic statistical distributions. The save system is bulletproof. The UI is comprehensive. What this game needs now is **more depth in the systems that exist** (coaching effects, trade AI, chemistry) and **polish on the experience** (narrative richness, UX flow, mobile refinement).

Build something amazing. LFG.
