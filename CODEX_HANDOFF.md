# CODEX HANDOFF BIBLE: Mr. Baseball Dynasty

> **For**: OpenAI Codex (or any agent picking up this codebase)
> **From**: Claude (Anthropic), who built the v0.1 engine proof
> **Date**: February 2026
> **Status**: Playable MVP -- 21.7K LOC across 95 TypeScript/React files

---

## TABLE OF CONTENTS

1. [Mission Brief](#1-mission-brief)
2. [Quick Start](#2-quick-start)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Map](#4-directory-map)
5. [The Type System](#5-the-type-system)
6. [The Web Worker Engine](#6-the-web-worker-engine)
7. [Game Simulation Deep Dive](#7-game-simulation-deep-dive)
8. [Player System](#8-player-system)
9. [Dynasty Management Systems](#9-dynasty-management-systems)
10. [Narrative & Immersion Systems](#10-narrative--immersion-systems)
11. [UI Architecture](#11-ui-architecture)
12. [State Management](#12-state-management)
13. [Persistence Layer](#13-persistence-layer)
14. [Testing & Validation](#14-testing--validation)
15. [Performance Characteristics](#15-performance-characteristics)
16. [Known Limitations & Rough Edges](#16-known-limitations--rough-edges)
17. [MR FOOTBALL DYNASTY FEATURE PORT (PRIMARY TASK)](#17-mr-football-dynasty-feature-port-primary-task)
18. [Coding Conventions](#18-coding-conventions)
19. [Git History & Commit Style](#19-git-history--commit-style)
20. [Dependency Reference](#20-dependency-reference)

---

## 1. MISSION BRIEF

**Mr. Baseball Dynasty** is a browser-based baseball franchise management simulation. Think OOTP meets Football Manager meets Bloomberg Terminal aesthetics. The user controls one of 30 fictional teams across a multi-season dynasty, managing rosters, trades, drafts, finances, and coaching staff while an AI-driven league plays around them.

**Tech Stack**: React 18 + TypeScript 5 + Vite + Zustand + Comlink Web Worker + Dexie (IndexedDB) + Tailwind CSS + Recharts

**What exists today (v0.1)**:
- 162-game season simulation with Log5 plate appearance model + Markov baserunning
- 30 fictional teams, ~900 generated players, 7-level minor league system
- Full 12-team modern playoff bracket (WC -> DS -> CS -> WS)
- SDE (stochastic differential equation) player development with aging curves
- 14-tab management UI (roster, lineup, trades, draft, FA, prospects, finance, analytics, coaching, history, etc.)
- Narrative systems (owner patience, press conferences, rivalries, storyboard arcs, moments gallery)
- Persistence via IndexedDB with gzip compression

---

## 2. QUICK START

```bash
# Install dependencies
npm install

# Run dev server (port 5173)
npm run dev

# Run tests (3 suites, 13 validation gates)
npm test

# Type check without building
npm run typecheck

# Production build
npm run build
```

**First run flow**: User sees SetupFlow wizard -> picks team -> chooses start mode -> hires front office staff -> enters Shell (main game). Click "SIMULATE SEASON" on Dashboard to run 162 games + playoffs + offseason.

---

## 3. ARCHITECTURE OVERVIEW

```
                    BROWSER MAIN THREAD
  ┌──────────────────────────────────────────────┐
  │                                              │
  │   React Components (14 tabs)                 │
  │       ↕                                      │
  │   Zustand Stores (game, league, ui)          │
  │       ↕                                      │
  │   engineClient.ts  ←── Comlink proxy ──┐     │
  │       ↕                                │     │
  │   db/schema.ts (Dexie/IndexedDB)       │     │
  │   db/cache.ts (dirty-check cache)      │     │
  │   db/tabGuard.ts (BroadcastChannel)    │     │
  │                                        │     │
  └────────────────────────────────────────│─────┘
                                           │
                    WEB WORKER THREAD       │
  ┌────────────────────────────────────────│─────┐
  │                                        │     │
  │   worker.ts (1,159 LOC) ←── Comlink ───┘     │
  │       │                                      │
  │   Canonical LeagueState                      │
  │   Player/Team Maps                           │
  │   Season Stats Maps                          │
  │   Trade/Draft/Finance History                │
  │       │                                      │
  │   ┌───┴───────────────────────┐              │
  │   │ sim/gameSimulator.ts      │              │
  │   │ sim/plateAppearance.ts    │              │
  │   │ sim/markov.ts             │              │
  │   │ sim/seasonSimulator.ts    │              │
  │   │ sim/playoffs.ts           │              │
  │   │ sim/fsm.ts                │              │
  │   ├───────────────────────────┤              │
  │   │ player/generation.ts      │              │
  │   │ player/development.ts     │              │
  │   │ player/attributes.ts      │              │
  │   │ player/awards.ts          │              │
  │   ├───────────────────────────┤              │
  │   │ trade/tradeEngine.ts      │              │
  │   │ trade/valuation.ts        │              │
  │   │ trade/tradeDeadline.ts    │              │
  │   ├───────────────────────────┤              │
  │   │ offseason/freeAgency.ts   │              │
  │   │ offseason/arbitration.ts  │              │
  │   │ offseason/rule5Draft.ts   │              │
  │   │ offseason/intlSigning.ts  │              │
  │   ├───────────────────────────┤              │
  │   │ draft/draftEngine.ts      │              │
  │   │ scouting/prospectRankings │              │
  │   │ finance/financeEngine.ts  │              │
  │   │ history/careerStats.ts    │              │
  │   │ history/awardsHistory.ts  │              │
  │   │ analytics/sabermetrics.ts │              │
  │   │ coaching/coachingStaff.ts │              │
  │   │ chemistry/teamChemistry   │              │
  │   │ contracts/extensions.ts   │              │
  │   │ waivers/waiverWire.ts     │              │
  │   │ injuries/injuryEngine.ts  │              │
  │   │ owner/ownerGoals.ts       │              │
  │   └───────────────────────────┘              │
  │                                              │
  │   math/prng.ts (xoroshiro128+)               │
  │   math/log5.ts                               │
  │   math/bayesian.ts                           │
  │                                              │
  └──────────────────────────────────────────────┘
```

**Key architectural principle**: The worker thread owns ALL canonical game state. The UI thread never mutates game data directly -- it sends commands via Comlink RPC and reads results back. This keeps the UI responsive during heavy simulation (2,430 games take <5 seconds).

---

## 4. DIRECTORY MAP

```
src/
├── App.tsx                          # Root component: tab guard, save loading, setup/shell routing
├── main.tsx                         # React DOM mount point
├── index.css                        # Tailwind base + custom styles
│
├── components/                      # React UI (all .tsx)
│   ├── layout/Shell.tsx             # Main game shell: header, nav tabs, content routing
│   ├── setup/SetupFlow.tsx          # New game wizard (589 LOC)
│   ├── dashboard/
│   │   ├── Dashboard.tsx            # Main hub: sim button, season results, sub-panels (581 LOC)
│   │   ├── FranchisePanel.tsx       # Owner patience, morale, breakout watch, news feed
│   │   ├── PlayoffBracket.tsx       # Visual 12-team bracket
│   │   ├── StandingsTable.tsx       # Division standings
│   │   ├── PressConference.tsx      # Dialogue tree system
│   │   ├── MFSNPanel.tsx            # Pre-season predictions network
│   │   ├── RivalryPanel.tsx         # Division rivalries
│   │   ├── LegacyTimeline.tsx       # Franchise history scroller
│   │   ├── StoryboardPanel.tsx      # Narrative arcs
│   │   ├── MomentsPanel.tsx         # Season highlights gallery
│   │   ├── WeeklyCard.tsx           # Player card recap
│   │   ├── DevGradeCard.tsx         # Development tracking
│   │   ├── ReputationCard.tsx       # Coach reputation
│   │   └── StaffPoachModal.tsx      # Poaching event dialog
│   ├── roster/RosterView.tsx        # 26-man, IL, minors, DFA management (456 LOC)
│   ├── lineup/LineupEditor.tsx      # Batting order, rotation, closer (372 LOC)
│   ├── trade/TradeCenter.tsx        # Trade proposals with AI evaluation
│   ├── draft/DraftRoom.tsx          # 5-round amateur draft board (314 LOC)
│   ├── offseason/FreeAgentMarket.tsx# FA bidding and signing
│   ├── prospects/ProspectRankings.tsx# FV 20-80 scouting reports
│   ├── finance/FinanceDashboard.tsx # Payroll, revenue sharing, luxury tax
│   ├── analytics/AdvancedStats.tsx  # WAR, wRC+, FIP, OPS+, ERA+, wOBA
│   ├── coaching/CoachingStaffView.tsx# Hire/fire coaches, 14 specialties
│   ├── history/InjuryTransactions.tsx# Transaction log, injuries, milestones
│   └── stats/
│       ├── Leaderboards.tsx         # League-wide stat leaders
│       └── PlayerProfile.tsx        # Individual player detail card
│
├── engine/                          # Simulation logic (all .ts, runs in Web Worker)
│   ├── worker.ts                    # ** CENTRAL FILE ** 1,159 LOC -- all RPC methods
│   ├── engineClient.ts             # Comlink singleton wrapper
│   ├── sim/
│   │   ├── gameSimulator.ts         # Single game: lineup, pitcher mgmt, box score (472 LOC)
│   │   ├── seasonSimulator.ts       # 162-game loop, stat accumulation (310 LOC)
│   │   ├── plateAppearance.ts       # PA outcome resolution (317 LOC) -- THE HEART
│   │   ├── markov.ts                # Baserunner advancement state machine
│   │   ├── fsm.ts                   # Game flow finite state machine
│   │   └── playoffs.ts             # 12-team bracket (WC/DS/CS/WS) (311 LOC)
│   ├── player/
│   │   ├── generation.ts            # Player generation & draft eligibles (452 LOC)
│   │   ├── development.ts           # SDE aging curves (321 LOC)
│   │   ├── attributes.ts            # 0-550 internal <-> 20-80 scouting conversion
│   │   └── awards.ts               # MVP, Cy Young, ROY scoring (238 LOC)
│   ├── trade/
│   │   ├── tradeEngine.ts          # Trade proposal, evaluation, execution (207 LOC)
│   │   ├── valuation.ts            # Player value formula
│   │   └── tradeDeadline.ts        # Mid-season AI trades
│   ├── offseason/
│   │   ├── freeAgency.ts           # FA market + AI bidding (200 LOC)
│   │   ├── arbitration.ts          # Salary arbitration hearings
│   │   ├── rule5Draft.ts           # Rule 5 draft mechanics (212 LOC)
│   │   └── intlSigning.ts          # J2 international signing period (329 LOC)
│   ├── draft/draftEngine.ts         # Amateur draft: generation, AI picks (479 LOC)
│   ├── scouting/prospectRankings.ts # FV grades, risk/ceiling (319 LOC)
│   ├── finance/financeEngine.ts     # Revenue, expenses, luxury tax (265 LOC)
│   ├── history/
│   │   ├── careerStats.ts          # Career tracking, HOF evaluation (364 LOC)
│   │   └── awardsHistory.ts        # Awards/champion/transaction log
│   ├── analytics/sabermetrics.ts    # WAR, wRC+, FIP, OPS+, ERA+ (301 LOC)
│   ├── coaching/coachingStaff.ts    # Coach generation, effects, contracts (282 LOC)
│   ├── contracts/extensions.ts      # Pre-FA contract lockups (269 LOC)
│   ├── waivers/waiverWire.ts        # DFA claims, clearing waivers (190 LOC)
│   ├── chemistry/teamChemistry.ts   # Morale, leadership, clubhouse (324 LOC)
│   ├── injuries/injuryEngine.ts     # 12 hitter + 11 pitcher injury types (229 LOC)
│   ├── owner/ownerGoals.ts          # Mandates, job security, evaluations (337 LOC)
│   ├── narrative.ts                 # Owner patience, news feed, breakout watch (422 LOC)
│   ├── storyboard.ts               # Season narrative arcs (416 LOC)
│   ├── moments.ts                   # Season highlight moments (222 LOC)
│   ├── rivalry.ts                   # Division rivalry tracking (224 LOC)
│   ├── predictions.ts              # Pre-season projections (227 LOC)
│   ├── reputation.ts               # Coach reputation system
│   ├── staffPoaching.ts            # Staff poaching events
│   ├── playerTraits.ts             # Player personality traits
│   └── math/
│       ├── prng.ts                  # xoroshiro128+ via pure-rand (immutable, serializable)
│       ├── log5.ts                  # Log5 matchup probability model
│       └── bayesian.ts             # Pythagenpatc expected wins
│
├── data/                            # Static game data
│   ├── teams.ts                     # 30 fictional teams (AL/NL, 6 divisions)
│   ├── parkFactors.ts              # 30 park factor scalars (HR-friendly to pitcher-friendly)
│   ├── positionalPriors.ts          # Position-specific development curves
│   ├── nameDatabase.ts             # Name generator (american/latin/asian pools)
│   ├── scheduleTemplate.ts         # 162-game balanced schedule
│   ├── re24Matrix.ts               # Run expectancy matrices (24 states)
│   ├── pressConference.ts          # Dialogue trees (462 LOC)
│   └── frontOffice.ts              # FO role/trait definitions (320 LOC)
│
├── store/                           # Zustand state management
│   ├── gameStore.ts                 # Core: season, userTeamId, simulating, owner patience, setup flow
│   ├── leagueStore.ts              # Live: standings, roster, news, franchise history, events
│   └── uiStore.ts                  # Navigation: activeTab, selectedPlayer/Team, modals
│
├── types/                           # TypeScript type definitions
│   ├── game.ts                      # PAOutcome, PAResult, PlayEvent, BoxScore, GameResult, ScheduleEntry
│   ├── player.ts                    # Player, HitterAttributes, PitcherAttributes, PlayerSeasonStats, etc.
│   ├── team.ts                      # Team, TeamRecord, CoachingStaff, TeamSeasonStats
│   ├── league.ts                    # LeagueState, SeasonResult, StandingsRow, RosterData, etc.
│   ├── trade.ts                     # LineupData, TradeablePlayer, re-exports from engine
│   └── frontOffice.ts              # FO roles, traits, staff members, start modes
│
├── utils/
│   ├── constants.ts                 # 50+ tuning constants, validation gates, roster rules
│   └── helpers.ts                  # Formatters, stat calculators, math utilities
│
└── db/                              # Persistence layer
    ├── schema.ts                    # Dexie IndexedDB schema, save/load functions
    ├── cache.ts                     # Generation-based dirty-check cache
    ├── streaming.ts                # Gzip export/import (.mrbd files)
    └── tabGuard.ts                 # BroadcastChannel multi-tab prevention
```

---

## 5. THE TYPE SYSTEM

All types are in `src/types/`. Here are the critical ones:

### Player (types/player.ts)

```typescript
Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP' | 'CL'

RosterStatus = 'MLB_ACTIVE' | 'MLB_IL_10' | 'MLB_IL_60'
             | 'MINORS_AAA' | 'MINORS_AA' | 'MINORS_APLUS' | 'MINORS_AMINUS' | 'MINORS_ROOKIE' | 'MINORS_INTL'
             | 'DFA' | 'WAIVERS' | 'FREE_AGENT' | 'RETIRED' | 'DRAFT_ELIGIBLE'

Player = {
  playerId, teamId, name, age, position, bats, throws, nationality,
  isPitcher, hitterAttributes | pitcherAttributes,
  overall (0-550), potential (0-550),
  development: { theta, sigma, phase },
  rosterData: { rosterStatus, isOn40Man, optionYearsRemaining, serviceTimeDays,
                salary, contractYearsRemaining, arbitrationEligible, freeAgentEligible, ... }
}
```

### Attribute Scales
- **Internal**: 0-550 (0=non-existent, 300=AAA average, 400=MLB average, 550=elite)
- **Scouting display**: 20-80 (linear mapping from internal)
- Hitters have: contact, power, eye, speed, baserunningIQ, fielding, armStrength, durability + hidden: offensiveIQ, defensiveIQ, workEthic, mentalToughness
- Pitchers have: stuff, movement, command, stamina, pitchArsenalCount, gbFbTendency, holdRunners, durability, recoveryRate + hidden: pitchingIQ, workEthic, mentalToughness

### Game Simulation (types/game.ts)

```typescript
PAOutcome = 'BB' | 'HBP' | 'K' | 'HR' | '1B' | '2B' | '3B'
          | 'GB_OUT' | 'FB_OUT' | 'LD_OUT' | 'PU_OUT' | 'GDP' | 'SF'

BoxScore = {
  gameId, season, date, homeTeamId, awayTeamId, homeScore, awayScore, innings,
  homeBatting[], awayBatting[], homePitching[], awayPitching[], playLog[]
}
```

### League State (types/league.ts)

```typescript
LeagueState = {
  season, teams[], players[], schedule[], environment, prngState[], userTeamId
}

SeasonResult = {
  season, teamSeasons[], playerSeasons[], boxScores[],
  leagueBA, leagueERA, leagueRPG, teamWinsSD,
  awards?, divisionChampions?, developmentEvents?, playoffBracket?, freeAgencySignings?
}
```

---

## 6. THE WEB WORKER ENGINE

**`src/engine/worker.ts`** (1,159 LOC) is the most important file. It's the centralized game engine running in a dedicated Web Worker thread.

### Worker-Side State (mutable singletons)
```typescript
_state: LeagueState              // THE canonical game state
_playerMap: Map<number, Player>  // Fast lookup by ID
_teamMap: Map<number, Team>      // Fast lookup by ID
_playerSeasonStats: Map<number, PlayerSeasonStats>
_seasonResults: SeasonResult[]
_tradeHistory: TradeRecord[]
_lineups: Map<number, LineupData>
_draftState: DraftState | null
_financialHistory: Map<number, FinancialHistory[]>
_teamCash: Map<number, number>
_luxuryTaxYears: Map<number, number>
_seasonInjuries: Injury[]
_arbHistory: ArbitrationCase[]
_rule5History: Rule5Selection[]
_deadlineDeals: DeadlineDeal[]
_intlProspects: IntlProspect[]
_coachingStaff: Map<number, Coach[]>
_coachingPool: Coach[]
_extensionHistory: ExtensionResult[]
_waiverHistory: WaiverClaim[]
_ownerGoals: OwnerGoalsState | null
```

### Full API Surface (50+ RPC methods)

**Game Lifecycle**:
- `newGame(seed, userTeamId)` - Create universe with PRNG seed
- `simulateSeason(onProgress?)` - Run 162 games + playoffs + full offseason pipeline
- `getFullState()` / `loadState(state)` - Serialize/deserialize
- `ping()` - Health check

**Query Methods** (read-only):
- `getStandings()` - League standings with Pythagorean wins
- `getRoster(teamId)` - Active/IL/minors/DFA breakdown
- `getLeaderboard(stat, limit)` - Stat leaders (hr, rbi, avg, era, k, wins, whip, obp, sb)
- `getPlayerProfile(playerId)` - Scouting grades + season/career stats
- `getTeamFinancials(teamId)` / `getLeagueFinancials()` / `getFinancialHistory(teamId)`
- `getAllTimeLeaders(stat)` / `getCareerStats(playerId)` / `getHOFCandidates()` / `getFranchiseRecords(teamId)`
- `getAdvancedStats()` - WAR, wRC+, FIP, OPS+, ERA+
- `getTeamChemistry(teamId)` - Morale and clubhouse dynamics
- `getOwnerGoals()` - Owner mandates and job security
- `getCoachingStaff(teamId)` / `getCoachingPool()`
- `getInjuryReport()` / `getArbitrationHistory()` / `getRule5History()` / `getDeadlineDeals()`
- `getAwardHistory()` / `getChampionHistory()` / `getTransactionLog()` / `getMilestones()`
- `getExtensionCandidates()` / `getExtensionHistory()` / `getWaiverPlayers()` / `getWaiverHistory()`
- `getIntlProspects()` / `getLeagueProspects()` / `getOrgProspects(teamId)`
- `getFreeAgents()` / `getTradeablePlayers(teamId)` / `getTradeHistory()`
- `getDraftState()` / `getLineup(teamId)`

**Mutation Methods** (change game state):
- `promotePlayer(playerId)` / `demotePlayer(playerId)` / `dfaPlayer(playerId)` - Roster moves
- `setLineup(lineup)` - Set batting order + rotation + closer
- `evaluateTrade(proposal)` / `executeTrade(proposal)` - Trade system
- `signFreeAgent(playerId, salary, years)` / `runAIFreeAgency()` - Free agency
- `startDraft()` / `makeDraftPick(prospectId)` / `simDraftToNextUserPick()` - Draft
- `hireCoach(coachId)` / `fireCoach(coachId)` - Coaching staff
- `offerExtension(offer)` - Contract extensions
- `claimWaiverPlayer(playerId)` - Waiver claims
- `protectFromRule5(playerId)` - 40-man protection

### Season Simulation Pipeline (inside `simulateSeason()`)

This is the mega-function that advances one full year:

```
1. resetSeasonCounters() - Clear per-season tracking
2. simulateSeason() - Run 2,430 games (162 * 15 matchups)
3. processSeasonInjuries() - Mid-season injury events
4. simulateTradeDeadline() - AI deadline trades
5. computeAwards() - MVP, Cy Young, ROY scoring
6. computeDivisionChampions() - Division winners
7. simulatePlayoffs() - Full 12-team bracket
8. advanceServiceTime() - 172 game-days
9. advanceOffseason() - SDE player development + aging
10. recordSeasonAwards() + recordChampion() + checkMilestones()
11. processArbitration() - Salary hearings
12. runRule5Draft() - Minor league protection
13. generateIntlClass() + runAIIntlSigning() - J2 signings
14. runAIFreeAgency() - AI teams sign FAs
15. processWaivers() - DFA claims
16. runAIExtensions() - AI contract extensions
17. advanceCoachContracts() - Coach contract years
18. evaluateGMSeason() - Owner/GM goal evaluation
19. rebuildMaps() - Refresh lookup tables
20. recordSeasonStats() - Career stat tracking
21. computeTeamFinancials() - Financial history for all 30 teams
22. state.season++ - Advance calendar
```

---

## 7. GAME SIMULATION DEEP DIVE

### Plate Appearance Resolution (plateAppearance.ts -- THE HEART)

Every at-bat resolves through probability calculation:

```
Input: batter attributes, pitcher attributes, park factor, game context

1. Walk rate = f(batter.eye, pitcher.command)
2. Strikeout rate = f(batter.contact, pitcher.stuff)
3. HR rate = f(batter.power, pitcher.movement, parkFactor)
4. Hit distribution = LD% / GB% / FB% from pitcher.gbFbTendency
5. Apply platoon effect (+/- 25 OPS points for handedness advantage)
6. Apply TTO penalty (0%, 2.6%, 6.6% for 1st/2nd/3rd time through order)
7. Apply pitcher fatigue (pitch count / stamina)
8. Sample from categorical distribution -> PAOutcome
```

### Markov Baserunner Advancement (markov.ts)

24 states (8 runner configs x 3 outs). For each PA outcome:
- Walk/HBP: Force-play cascade logic
- Singles: Speed-dependent scoring from 2nd/3rd
- Doubles: Speed-dependent scoring from 1st
- Triples/HR: Deterministic clearing
- Outs: GDP possible with runner on 1st, SF possible with runner on 3rd

### Game Flow (gameSimulator.ts + fsm.ts)

```
1. buildLineup() - Top 9 hitters by composite (contact + power*0.8 + eye*0.6)
2. pickStarter() - Rotate through 5-man rotation
3. For each inning (9+):
   a. For each half-inning:
      - Resolve PAs until 3 outs
      - Track pitcher fatigue (pitch count)
      - Pull starter at: 110 pitches, or TTO=3, or big deficit
      - Bring in relievers/closer (closer in 9th with lead <=3)
4. Extra innings: Manfred runner on 2nd starting inning 10
5. Return BoxScore with full play log + batting/pitching stats
```

### Playoff Bracket (playoffs.ts)

Modern 12-team format:
- 3 division winners + 3 wild cards per league
- Wild Card Round: Best of 3 (#3 vs #6, #4 vs #5)
- Division Series: Best of 5 (#1 vs lowest remaining, #2 vs other)
- Championship Series: Best of 7
- World Series: Best of 7

---

## 8. PLAYER SYSTEM

### Generation (player/generation.ts, 452 LOC)

Creates ~900 players for 30 teams:
- 26 MLB active + minors pipeline per team
- Nationality distribution: 60% American, 28% Latin, 12% Asian
- Position distribution follows realistic ratios
- Attributes generated from positional priors + random variance
- Names from nationality-specific name pools

### Development (player/development.ts, 321 LOC)

Ornstein-Uhlenbeck SDE process:
```
Phase transitions: prospect -> ascent -> prime -> decline -> retirement

For each attribute:
  delta = agingDelta(age, attribute) + noise(sigma)
  delta *= workEthicMultiplier (if growing)
  newValue = clamp(current + delta, 50, 550)

Typical peaks:
  Contact: 27-29    Power: 27-30     Eye: 29-32
  Speed: 23-26      Stuff: 25-28     Command: 29-33
```

### Awards (player/awards.ts)

Computed after season, before aging:
- MVP (AL/NL): Weighted composite of batting stats
- Cy Young (AL/NL): Weighted composite of pitching stats
- ROY (AL/NL): Best player with <2 years service time

---

## 9. DYNASTY MANAGEMENT SYSTEMS

### Roster Management
- **26-man active roster** with strict enforcement
- **40-man roster** with Rule 5 protection implications
- **7 minor league levels**: Intl -> Rookie -> Low-A -> High-A -> AA -> AAA -> MLB
- **Options system**: 3 career options, consumed by MLB->minors demotion
- **Service time**: 172 days = 1 year; 3 years = arbitration; 6 years = free agency
- **10-and-5 rights**: 10 years MLB + 5 with team = full no-trade clause

### Trade System (trade/)
- **Valuation formula**: production * scarcity * age + potential_premium + contract_value
- **Position scarcity**: C/SS/CF = 1.10-1.15x; DH = 0.75x
- **AI evaluation**: Rejects lopsided trades, considers team strategy (contender/rebuilder)
- **Trade deadline**: AI-driven mid-season dealing based on standings

### Free Agency (offseason/freeAgency.ts)
- Players with 6+ service years and expired contracts
- Market salary = exponential curve based on overall rating + age factor
- AI teams bid competitively
- User can sign with salary/years offer

### Draft (draft/draftEngine.ts, 479 LOC)
- 5-round amateur draft
- Inverse standings order
- Scouting quality affects prospect evaluation accuracy (fog of war)
- AI drafting considers team needs and strategy
- Drafted players enter minor league system

### Salary Arbitration (offseason/arbitration.ts)
- Players with 3-6 years service time
- Settle or go to hearing
- Hearing outcomes: player wins or team wins

### Rule 5 Draft (offseason/rule5Draft.ts)
- Unprotected minor leaguers eligible after certain time
- Selected players must stay on MLB 26-man roster
- User can protect players by adding to 40-man

### International Signing (offseason/intlSigning.ts, 329 LOC)
- J2 signing period with bonus pools
- AI teams sign international prospects
- Age 16-17 prospects enter MINORS_INTL level

### Contract Extensions (contracts/extensions.ts)
- Pre-free-agency lockup offers
- AI evaluates based on player value vs. offer
- Accepted extensions update contract terms

### Waivers (waivers/waiverWire.ts)
- DFA'd players placed on waivers
- Other teams can claim
- Unclaimed players become free agents or outright to minors

### Financial System (finance/financeEngine.ts)
- Revenue: gate receipts, TV deals, merchandise (function of market size + wins)
- Expenses: payroll, operations, scouting
- Luxury tax: CBT threshold with escalating penalties
- Revenue sharing: Small-market supplement

### Coaching Staff (coaching/coachingStaff.ts)
- Roles: manager, hitting coach, pitching coach, trainer, scout director, etc.
- Quality ratings affect player development speed
- Contract terms with expiration
- Hiring pool refreshes each offseason
- Staff poaching events from rival teams

### Owner/GM Goals (owner/ownerGoals.ts)
- Owner archetypes: win-now, patient builder, penny-pincher
- Mandates: "Make playoffs", "Develop prospects", "Cut payroll"
- Job security meter (0-100): ECSTATIC -> PLEASED -> CONTENT -> CONCERNED -> HOT_SEAT -> CRISIS
- Season evaluation adjusts security based on mandate fulfillment

---

## 10. NARRATIVE & IMMERSION SYSTEMS

### Owner Patience (narrative.ts, 422 LOC)
- Tracks patience 0-100 with archetype-weighted reactions
- Playoff appearance = +5, World Series = +10, missing playoffs = -10
- Status tiers affect available resources and urgency

### Press Conference (PressConference.tsx + pressConference.ts)
- Context-aware dialogue trees based on season outcome
- Reporter questions with branching responses
- Affects owner mood and public perception

### Rivalry System (rivalry.ts)
- Division rivals with head-to-head tracking
- Intensity escalation based on meaningful games

### Storyboard Arcs (storyboard.ts, 416 LOC)
- Auto-generated narrative arcs from season events
- Dynasty runs, comeback stories, heartbreak endings

### Moments Gallery (moments.ts)
- Highlight reel of season's best moments
- Categories: dynasty, breakout, heartbreak, record, upset, milestone

### MFSN Predictions (predictions.ts)
- Pre-season projections with win ranges
- Upset indicators for overperforming teams

### Reputation & Staff Poaching (reputation.ts, staffPoaching.ts)
- Coach credibility tracking across seasons
- Rival teams attempt to hire away successful coaches

---

## 11. UI ARCHITECTURE

### Shell Navigation (14 tabs)

| Tab ID | Component | Description |
|--------|-----------|-------------|
| `dashboard` | Dashboard | Main hub with sim button + all narrative panels |
| `standings` | StandingsTable | Division standings with Pythagorean wins |
| `roster` | RosterView | 26-man, 40-man, minors, IL management |
| `lineup` | LineupEditor | Batting order, rotation, closer assignment |
| `trades` | TradeCenter | Propose/evaluate trades with AI |
| `draft` | DraftRoom | 5-round amateur draft board |
| `freeagents` | FreeAgentMarket | FA market with salary/years offers |
| `prospects` | ProspectRankings | FV scouting grades by org |
| `finance` | FinanceDashboard | Team P&L, luxury tax, revenue sharing |
| `analytics` | AdvancedStats | WAR, wRC+, FIP, OPS+, ERA+ tables |
| `frontoffice` | CoachingStaffView | Coaching hire/fire, quality ratings |
| `history` | InjuryTransactions | Transaction log, injuries, milestones |
| `stats` | Leaderboards | League-wide stat leaders |
| `profile` | PlayerProfile | Individual player detail card |

### Design System
- **Aesthetic**: Bloomberg terminal / dark theme (gray-950 base)
- **Font**: JetBrains Mono -> Fira Code -> Consolas -> monospace
- **Accent**: Orange (#f97316) for highlights and active states
- **Tables**: react-window for virtualized scrolling (30px row height)
- **Charts**: Recharts for financial/performance visualizations

---

## 12. STATE MANAGEMENT

Three Zustand stores, all in `src/store/`:

### gameStore.ts (Core game state)
- `season`, `userTeamId`, `gameStarted`, `seasonsManaged`
- `isSimulating`, `simProgress` (0-1 float)
- `setupScreen` for new game wizard flow
- `ownerArchetype`, `ownerPatience` (0-100), `teamMorale` (0-100)
- `breakoutWatch[]` for prospect tracking
- `startMode`, `frontOffice[]`, `foBudget`, `difficulty`

### leagueStore.ts (League data + franchise history)
- `standings`, `roster`, `leaderboard` (live query results)
- `newsItems[]` (capped at 50)
- `franchiseHistory[]` (capped at 30 seasons)
- `rivals[]`, `mfsnReport`, `poachEvent`, `moments[]`, `weeklyStories[]`
- `presserAvailable`, `presserDone`

### uiStore.ts (Navigation)
- `activeTab` (NavTab union type)
- `selectedTeamId`, `selectedPlayerId`
- `leaderboardStat`, `modalOpen`

---

## 13. PERSISTENCE LAYER

### IndexedDB (db/schema.ts)
```typescript
// Dexie schema
saves: '++id, name, season, timestamp'

SaveSlot = {
  id: number,           // auto-increment
  name: string,         // slot name
  season: number,       // current season
  userTeamName: string, // for display
  timestamp: number,    // Date.now()
  stateBlob: string     // JSON stringified LeagueState
}
```

### Cache (db/cache.ts)
- Generation-based dirty-check: cache invalidated when worker state version changes
- Keys: `standings(season)`, `roster(teamId)`, `leaderboard(stat,season)`, `playerProfile(playerId)`

### Compression (db/streaming.ts)
- Export: gzip via pako -> `.mrbd` file download
- Import: decompress + validate version -> restore state
- Chunked writes for large datasets

### Tab Guard (db/tabGuard.ts)
- BroadcastChannel "ping"/"alive" protocol
- 300ms detection window on startup
- 2s heartbeat interval
- Blocks duplicate tabs with error screen

---

## 14. TESTING & VALIDATION

### Test Files (579 LOC total)

**tests/engine/markov.test.ts** (131 LOC):
- Baserunner force-play mechanics
- Runner advancement on singles/doubles
- State transitions for all 24 states

**tests/engine/plateAppearance.test.ts** (226 LOC):
- PA outcome distributions match expected ranges
- Contact/power/eye attribute effects
- Park factor and platoon adjustments

**tests/validation/gates.test.ts** (222 LOC):
- Runs full season simulation
- 13 calibration gates:

| Gate | Min | Max | Description |
|------|-----|-----|-------------|
| leagueERA | 3.80 | 4.40 | League-wide ERA |
| leagueBA | 0.245 | 0.265 | League batting average |
| leagueRPG | 4.2 | 4.8 | Runs per game |
| teamWinsSD | 7 | 14 | Std dev of team wins |
| teamsOver100Wins | 0 | 5 | Elite teams |
| teamsUnder60Wins | 0 | 4 | Tanking teams |
| playersWith40HR | 2 | 14 | Power hitters |
| playersWith200K | 15 | 35 | Strikeout pitchers |
| pitchersWith200IP | 5 | 20 | Workhorse starters |
| pythagCorrelation | 0.85 | - | Run differential predictiveness |
| singleGameMs | - | 50 | Performance: one game |
| fullSeasonMs | - | 5000 | Performance: full season |

### Running Tests
```bash
npm test          # Run once
npm run test:watch  # Watch mode
```

---

## 15. PERFORMANCE CHARACTERISTICS

- **Single game**: < 50ms
- **Full 162-game season** (2,430 total games): < 5 seconds
- **Web Worker**: All heavy computation off main thread
- **PRNG**: xoroshiro128+ via pure-rand (immutable, serializable for save/load)
- **Virtualized tables**: react-window renders only visible rows
- **Cache**: Prevents redundant worker RPC between renders

---

## 16. KNOWN LIMITATIONS & ROUGH EDGES

### Functional Gaps
- **Lineup AI is basic**: Sorts by composite rating, no platoon splits or situational optimization
- **Trade AI is simple**: Value-based comparison without sophisticated motivation modeling
- **No multi-season career stat accumulation in worker**: Career stats tracked in `history/careerStats.ts` module but `careerStats` in player profile just echoes current season
- **Save/load doesn't persist all worker-side state**: `_coachingStaff`, `_financialHistory`, `_ownerGoals`, and other maps are lost on reload (only `LeagueState` is serialized)
- **No pitcher matchup strategy**: No lefty/righty bullpen decisions, no pinch hitting
- **No stolen base attempts during simulation**: Speed attribute affects baserunning advancement but no explicit steal mechanic
- **Comments are sparse**: Worker methods lack JSDoc
- **Error handling is minimal**: Few try/catch blocks in UI; worker errors surface as rejected promises

### UI Gaps
- No mobile responsiveness
- No drag-and-drop lineup management
- No in-game play-by-play viewer (box scores exist but no live view)
- No team comparison tools
- No trade finder ("who would trade for X?")

### Architecture Concerns
- `worker.ts` at 1,159 LOC is getting large -- could be split into domain-specific worker modules
- All worker-side state is mutable singletons -- no undo/redo capability
- No optimistic UI updates -- all mutations require worker round-trip

---

## 17. MR FOOTBALL DYNASTY FEATURE PORT (PRIMARY TASK)

### THE BIG ASK

**Repository**: `KevinBigham/mr-football-dynasty` on GitHub

**Instructions**: Clone the Mr Football Dynasty repository and go through it **line by line**. For every feature, system, UI pattern, or design decision that could enhance Mr Baseball Dynasty, port it over. The football game was built first and likely has features, polish, and ideas that the baseball game hasn't caught up with yet.

### How to Approach This

1. **Clone the football repo** alongside this one:
   ```bash
   git clone https://github.com/KevinBigham/mr-football-dynasty.git ../mr-football-dynasty
   ```

2. **Read every file systematically**. Start with the football game's equivalent of our `worker.ts`, then types, then engine modules, then UI components.

3. **For each feature you find**, ask: "Does Mr Baseball Dynasty have an equivalent? If yes, is the football version better/deeper? If no, would this enhance the baseball game?"

4. **Categories of features to look for** (non-exhaustive):

   **Simulation Depth**:
   - Does football have more detailed play-by-play? Port the equivalent depth.
   - Any advanced game strategy systems (play calling, formations)? Baseball equivalent = manager strategy (bunt, steal, shift, pitch selection).
   - Weather/stadium effects? Could add to park factors.
   - Momentum/hot-streak mechanics? Could enhance baseball sim.

   **Player Systems**:
   - More detailed attribute models? Compare attribute counts and hidden attributes.
   - Better development curves? Check their SDE implementation.
   - Combine/workout system? Baseball equivalent = spring training showcase.
   - Player personality/character traits? Compare trait depth.
   - Injury model differences? Port any improvements.

   **Dynasty Management**:
   - Salary cap implementation details (hard cap vs luxury tax)
   - Practice squad / taxi squad mechanics -> compare to our minor leagues
   - Franchise tag equivalent? Baseball has qualifying offers.
   - Compensatory draft picks? Could add to our draft system.
   - More sophisticated AI trade logic? Port improvements.

   **Front Office / Coaching**:
   - Coaching tree / coordinator system? Port org chart depth.
   - Scouting department mechanics? Could enhance our scouting system.
   - Analytics department progression? Port if exists.
   - Staff chemistry/compatibility? Port if exists.

   **Narrative & Immersion**:
   - Any narrative systems we don't have? Port them.
   - Social media / fan engagement? Cool addition.
   - Media day / combine interviews? Baseball = spring training pressers.
   - Award ceremonies / HOF induction UI? Port if richer.
   - Season storylines or drama events? Compare to our storyboard.

   **UI/UX**:
   - Better table designs, sorting, filtering?
   - More informative dashboards or data visualizations?
   - Better onboarding / tutorial flow?
   - Notification system for events?
   - Settings / preferences screen?
   - Better save/load UI?
   - Theme customization?

   **Quality of Life**:
   - Undo/redo for roster moves?
   - Batch operations (mass promote, mass protect)?
   - Keyboard shortcuts?
   - Search/filter across players?
   - Compare players side-by-side?
   - Export stats to CSV?
   - Season sim speed controls (sim week, sim month, sim to date)?

   **Multi-Season Features**:
   - Dynasty rankings / GM score?
   - Historical database browser?
   - Records book improvements?
   - Retired number ceremonies?
   - Hall of Fame induction with speeches?

5. **When porting a feature**:
   - Translate football concepts to baseball equivalents (e.g., "salary cap" -> "luxury tax CBT threshold")
   - Maintain our existing architecture (worker thread, Comlink RPC, Zustand stores)
   - Add new engine modules in the appropriate `src/engine/` subdirectory
   - Add new UI components in the appropriate `src/components/` subdirectory
   - Add new types to the appropriate `src/types/` file
   - Wire new worker methods through the existing `api` object in `worker.ts`
   - Expose new data through Zustand stores if the UI needs it

6. **What NOT to do**:
   - Don't break existing validation gates (run `npm test` regularly)
   - Don't change the PRNG system (reproducibility is critical)
   - Don't restructure the worker/UI split architecture
   - Don't remove existing features to make room for new ones
   - Don't change the 30-team fictional league structure

### Sport-Specific Translation Guide

| Football Concept | Baseball Equivalent |
|-----------------|---------------------|
| Salary cap (hard) | Luxury tax (CBT) threshold |
| Practice squad | Minor league taxi squad |
| Franchise tag | Qualifying offer |
| Compensatory picks | Competitive balance picks |
| Combine | Spring training / showcase |
| OTAs/Training camp | Spring training |
| Bye week | All-Star break |
| Playoffs (14 teams) | Playoffs (12 teams) |
| Super Bowl | World Series |
| Pro Bowl | All-Star Game |
| 53-man roster | 26-man active roster |
| IR | Injured List (10/60 day) |
| Cap hit / dead money | Salary + deferred money |
| Offensive/Defensive coordinator | Bench coach, pitching coach, hitting coach |
| Position coach | Infield coach, outfield coach, bullpen coach |
| Snap counts | Plate appearances / innings pitched |
| Playbook | Pitch sequencing / shift strategy |

---

## 18. CODING CONVENTIONS

- **TypeScript strict mode** with no implicit any
- **Functional style** in engine code (pure functions where possible)
- **Mutable state** only in worker.ts singletons and Zustand stores
- **File organization**: One module per concern, co-located types with implementations
- **Naming**: camelCase for functions/variables, PascalCase for types/components
- **Imports**: Type-only imports with `import type` where possible
- **Constants**: ALL_CAPS in `utils/constants.ts`
- **No classes**: Entire codebase uses functions + interfaces (no OOP classes)
- **React**: Functional components only, hooks for all state/effects
- **Styling**: Tailwind utility classes inline, no separate CSS modules
- **Path alias**: `@/*` maps to `src/*` (configured in tsconfig.json)

---

## 19. GIT HISTORY & COMMIT STYLE

14 commits building from zero to full MVP:

```
6b6fcb0 feat: Advanced analytics, coaching staff, extensions, waivers, chemistry, owner goals
0a457c6 feat: Injuries, arbitration, Rule 5, trade deadline, intl signing, awards history
5156ffe feat: Amateur draft, prospect rankings, finances, career stats
63d8501 feat: Trade system, free agency market, and lineup editor
aaa4d5b feat: Full playoff bracket engine + roster management actions
6d8797e feat: Storyboard arcs, Moments Gallery, Weekly Card, Player Traits
ea61b69 feat: MFSN predictions, Dev Grade, Staff Poaching, Reputation Score
e5cd512 feat: Press Conference, Rivalry System, Legacy Timeline
5a4c449 feat: Owner Patience, Team Morale, News Feed, Breakout Watch
eaad5f2 feat: full SetupFlow wizard + 7-level minor league system
c2bcdd4 feat: SDE aging, awards, division champions, offseason report
98d9107 fix: pass all 13 v0.1 validation gates with calibrated engine
efc2fed feat: initial Phase 0 build -- Mr. Baseball Dynasty v0.1
```

**Commit style**: `feat:` / `fix:` / `chore:` prefix with descriptive summary.

---

## 20. DEPENDENCY REFERENCE

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| zustand | ^5.0.1 | Lightweight state management (3 stores) |
| comlink | ^4.4.1 | Web Worker RPC (transparent async proxy) |
| dexie | ^3.2.7 | IndexedDB wrapper (save/load) |
| pure-rand | ^6.1.0 | xoroshiro128+ PRNG (deterministic, serializable) |
| react-window | ^1.8.10 | Virtualized list rendering |
| recharts | ^2.12.7 | Charts and data visualization |
| pako | ^2.1.0 | Gzip compression for save files |
| tailwindcss | ^3.4.14 | Utility-first CSS framework |
| typescript | ^5.6.3 | Type system |
| vite | ^5.4.10 | Build tool + dev server |
| vitest | ^2.1.4 | Test runner (Vite-native) |

---

## FINAL NOTES

This codebase is a working, playable baseball dynasty simulator. It was built in a series of intensive sessions, each adding a major system. The simulation produces realistic statistical output (validated by 13 calibration gates), the management features cover the full spectrum of baseball operations, and the narrative systems add immersion beyond raw numbers.

The biggest opportunity for improvement is **depth**: making each system smarter, more nuanced, and more interactive. The Mr Football Dynasty codebase likely has innovations in several of these areas that can be directly ported with sport-appropriate translations.

Good luck, Codex. Build something amazing. The quest continues.

---

*Generated by Claude (Anthropic) for the Mr. Baseball Dynasty project*
*Repository: KevinBigham/mr-baseball-dynasty*
*Sister project: KevinBigham/mr-football-dynasty*
