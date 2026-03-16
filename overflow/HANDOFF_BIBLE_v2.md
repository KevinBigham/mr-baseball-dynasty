# Mr. Baseball Dynasty — MASTER HANDOFF BIBLE v2
> Last updated: 2026-03-12 by Claude (Opus 4.6)
> Game Version: Sprint 12+ (Cadence & Feedback + Dashboard Polish)
> Total Source: ~48,700 lines TypeScript/TSX across 235 files
> Build Status: CLEAN (0 TS errors in UI files, 48 precache entries)

---

## 0. EXECUTIVE SUMMARY — What You're Inheriting

**Mr. Baseball Dynasty** is a browser-based baseball franchise management simulator — think Football Manager meets OOTP Baseball, running entirely client-side with zero backend. React + TypeScript + Vite + Tailwind CSS SPA with a Comlink web worker architecture.

### What's DONE (Playable)
- 30 fictional teams, ~5,300 procedurally generated players (7 farm levels + MLB)
- Full 162-game season sim with Log5 matchup math + Markov base-running
- Interactive month-by-month pacing (sim 1 day / 1 week / 1 month / full season)
- Playoffs: WC (3-game) -> DS (5-game) -> CS (7-game) -> WS (7-game)
- Complete offseason: Free Agency, Arbitration, Waivers, Rule 5, Amateur Draft, International Signing
- Trade system (AI offers + player-proposed + shop players)
- Roster management: promote/demote/DFA/release/IL/depth chart
- Player Development Lab (training programs for prospects)
- Scouting reports with fog-of-war uncertainty
- Prospect Pipeline with farm grades and ETA
- Advanced stats: wOBA, wRC+, FIP, xFIP, WAR
- Financial system: payroll, luxury tax thresholds, contract details
- Award races: MVP, Cy Young, ROY (real-time tracking)
- Power Rankings, Pennant Race tracker (magic/elimination numbers)
- Franchise history, Hall of Fame, career leaderboards, franchise records
- Owner expectations + patience system (get fired if you underperform!)
- Coaching staff with specialist bonuses
- Team chemistry + clubhouse morale system
- Rivalry tracker (division heat, rivalry moments)
- Reputation card (franchise reputation gauge)
- MFSN broadcast network predictions + resolved picks
- Storyboard narrative arcs (Chapter 1: Year One, etc.)
- Tutorial system, First Week Coach, Front Office Briefing
- Auto-save / manual save / load / new game reset
- Toast notification system (celebrations, alerts, injuries)
- Season Timeline view (aggregated news/moments/trades)
- Transaction Log view (complete move history)
- Team Leaders Widget (top hitter/pitcher at a glance)
- Dynasty Milestones Panel (20 franchise achievements across 4 tiers)
- CoachTip hints in 14 views
- AgingBadge on 9 views
- Position Battles, Cut Advisor, Financial Advisor
- End-of-Day Digest, Weekly Stories, Press Conference

### What's NOT Done (Priority Backlog)
1. **BUG: TypeError in postseason flow** — `Cannot read properties of undefined (reading 'map')` after sim. Crashes the render tree and hides bottom-of-page panels (Rivalry, Reputation, Dynasty Milestones). HIGH PRIORITY.
2. **Award Race on HOME dashboard** — AwardRacePanel exists but isn't surfaced on home screen during season
3. **Hot/Cold Streak Tracker** — InSeasonDashboard has interrupt UI but no streak detection
4. **Season Game Log** — Per-game results viewer (box scores exist but no browse UI)
5. **Player Milestones during season** — detectMilestones() exists but not wired to in-season alerts
6. **Strength of Schedule display** — Remaining opponent records for standings context
7. **Injury Recovery Timeline** — Expected return dates with uncertainty
8. **Division Opponent Preview** — Head-to-head records, key players, trends
9. **Minor league rehab assignments**
10. **Compensatory draft picks**

---

## 1. TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5.4 |
| Styling | Tailwind CSS 3 |
| State | Zustand (3 stores: gameStore, leagueStore, uiStore) |
| Engine | Web Worker via Comlink (all sim logic isolated) |
| Database | Dexie (IndexedDB wrapper) for save/load |
| Randomness | pure-rand (seeded, deterministic) |
| Compression | pako (save file compression) |
| Testing | Vitest |
| Deploy | GitHub Pages (PWA with service worker) |

### Dev Commands
```bash
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # TypeScript check + production build
npm run typecheck    # TSC only (no emit)
npm run test         # Run test suite
```

---

## 2. ARCHITECTURE — The Big Picture

```
┌─────────────────────────────────────────────────────┐
│                    React UI Layer                     │
│  Shell.tsx → Dashboard / Team / FrontOffice / League  │
│            / History (5-pillar navigation)            │
├─────────────────────────────────────────────────────┤
│              Zustand State Stores                     │
│  gameStore (season, phase, sim state)                 │
│  leagueStore (news, moments, franchise history)       │
│  uiStore (navigation, toasts, selected player)        │
├─────────────── Comlink Bridge ──────────────────────┤
│              Web Worker (engine)                      │
│  worker.ts → 4,700+ lines, ~80 API methods           │
│  Sim engine, roster logic, trade AI, draft system     │
│  Player generation, stats, aging, development         │
│  Save/load, schedule generation, award computation    │
└─────────────────────────────────────────────────────┘
```

### Critical Architecture Rules
- **UI code NEVER imports engine internals directly** — always goes through `getEngine()` Comlink proxy
- **Worker is the source of truth** — UI reads from worker, worker writes state
- **Zustand stores hold UI-side state** (navigation, news feed, franchise history)
- **Lazy-loaded routes** — Components loaded via `React.lazy()` for code splitting
- **Bloomberg-style design system** — `.bloomberg-border`, `.bloomberg-header`, `.bloomberg-row` CSS classes

---

## 3. FILE MAP — Every Important File

### Root Config
```
CLAUDE.md              — AI collaboration rules (lanes, do-not-touch)
HANDOFF_BIBLE_v2.md    — THIS FILE
CODEX_HANDOFF.md       — Previous comprehensive handoff (still valid for engine details)
AGENTS.md              — Codex agent configuration
package.json           — Dependencies and scripts
vite.config.ts         — Build config (base path: /mr-baseball-dynasty/)
tailwind.config.js     — Design tokens
tsconfig.json          — TypeScript config (strict mode)
```

### Source Structure (src/)
```
App.tsx                — Root: save/load orchestration, router
main.tsx               — Entry point, React mount
index.css              — Tailwind + custom Bloomberg styles

components/
  layout/
    Shell.tsx          — 5-PILLAR NAV (HOME/TEAM/FO/LEAGUE/HISTORY) + sub-tab routing
    Skeleton.tsx       — Loading skeletons
    ScrollableTable.tsx — Reusable scrollable table
    LoadingFallback.tsx — Suspense fallback
    ConfirmModal.tsx   — Confirmation dialogs
    ErrorBoundary.tsx  — Crash recovery with save protection

  dashboard/ (35 files — HOME tab)
    Dashboard.tsx      — Master coordinator, delegates to phase sub-components
    HomeCommandCenter.tsx — Action queue, health tiles, news feed
    InSeasonDashboard.tsx — Interactive sim pacing (day/week/month buttons)
    PreseasonDashboard.tsx — Pre-sim view
    PostseasonReport.tsx — Season results, awards, bracket
    OffseasonDashboard.tsx — 9-phase offseason router
    AwardRacePanel.tsx — Live MVP/Cy Young/ROY tracker
    PowerRankings.tsx  — League power rankings
    StandingsTable.tsx — Sortable division standings
    PennantRace.tsx    — Division rank, GB, magic/elimination numbers
    SeasonProgressBar.tsx — Month-by-month progress
    MonthRecap.tsx     — Monthly results snapshot
    RivalryPanel.tsx   — Division rivalry heat tracker
    ReputationCard.tsx — Franchise reputation gauge
    LegacyTimeline.tsx — Cross-season history
    MomentsPanel.tsx   — Highlight cards gallery
    WeeklyCard.tsx     — "This Week in MRBD" stories
    FranchisePanel.tsx — Owner patience, morale, breakout watch, news
    StoryboardPanel.tsx — Season narrative arcs
    MFSNPanel.tsx      — Network predictions
    PressConference.tsx — Owner pressure interview
    TeamLeadersWidget.tsx — *** NEW *** Team top hitter/pitcher + aggregates
    DynastyMilestonesPanel.tsx — *** NEW *** 20 franchise achievements (4 tiers)
    PlayoffBracket.tsx — Bracket visualization
    AllStarBreak.tsx   — All-Star event
    TradeDeadline.tsx  — July 31 deadline UI
    MidSeasonCheckIn.tsx — All-Star break check-in
    StaffPoachModal.tsx — Staff poaching events
    AITransactionsPanel.tsx — League AI roster moves
    FiredScreen.tsx    — Game over screen
    CareerSummary.tsx  — Career stats summary
    DevGradeCard.tsx   — Development grades
    SeasonHighlights.tsx — Season stat leaders
    TeamDetailModal.tsx — Team info modal
    MidSeasonFAPanel.tsx — In-season free agents

  team/ (via roster/, stats/)
    roster/
      RosterView.tsx   — Main roster table + sub-tabs (TABLE/DEPTH/PIPELINE/SCOUTING/DEV LAB/RATINGS)
      DepthChart.tsx   — Positional depth with AgingBadge
      ProspectPipeline.tsx — Farm system board
      ScoutingReports.tsx — Fog-of-war scouting
      DevLab.tsx       — Training program assignments
      FranchiseRatings.tsx — Team-wide ratings view
      PositionBattles.tsx — Starter vs challenger matchups
      CutAdvisor.tsx   — DFA/release recommendations

    stats/
      Leaderboards.tsx — League batting/pitching leaders
      PlayerProfile.tsx — Full player page (stats, contract, milestones)
      FinanceView.tsx  — Payroll, luxury tax, contracts
      FinancialAdvisor.tsx — Budget analysis with AgingBadge
      HistoryView.tsx  — FRANCHISE ARCHIVE (5 sub-tabs: Franchise/Timeline/Moves/Records/HoF)
      FranchiseRecordsView.tsx — Team records
      HallOfFameGallery.tsx — Hall of Fame display

  history/
    SeasonTimeline.tsx — *** NEW *** Rich scrollable timeline
    TransactionLog.tsx — *** NEW *** Complete transaction history

  frontoffice/ (via offseason/)
    offseason/
      TradeCenter.tsx  — Trade proposal + AI offers
      FreeAgencyPanel.tsx — FA signings
      ExtensionPanel.tsx — Contract extensions

  league/ (via dashboard/)
    StandingsView.tsx  — League-wide standings (routed from Shell)

  shared/
    CoachTip.tsx       — Contextual hint component (14 sections)
    AgingBadge.tsx     — Age indicator (rising/prime/declining)
    MilestoneCard.tsx  — Career milestone display
    SortHeader.tsx     — Sortable column headers

  draft/
    DraftRoom.tsx      — Amateur draft UI with toast wiring

  home/
    FrontOfficeBriefing.tsx — Daily briefing dashboard
    EndOfDayDigest.tsx — Daily summary

  setup/
    DelegationPanel.tsx — Management scope toggles
    FirstWeekCoach.tsx — Rookie week tutorial

  tutorial/
    TutorialOverlay.tsx — Guided onboarding

engine/ (Web Worker — 46 files)
  engineClient.ts    — Comlink singleton wrapper
  worker.ts          — *** THE BEAST *** 4,700+ lines, all game logic
  bridge.ts          — Worker API type bridge

  sim/
    season.ts        — 162-game season simulation
    plateAppearance.ts — Log5 matchup engine
    baseRunning.ts   — Markov chain base-runner transitions
    gameSimulator.ts — Single game simulation
    schedule.ts      — Schedule generation (162 games, balanced)

  player/
    generator.ts     — Procedural player generation
    attributes.ts    — Rating system (0-550 → 20-80 scouting scale)
    aging.ts         — SDE aging curves
    awards.ts        — MVP, Cy Young, ROY computation
    development.ts   — Prospect development

  roster/
    rosterManager.ts — Promote/demote/DFA/release
    depthChart.ts    — Position depth ordering
    injuries.ts      — Injury system

  league/
    standings.ts     — Win%, GB, tiebreakers
    playoffs.ts      — Playoff bracket generation + simulation
    freeAgency.ts    — FA market simulation
    trading.ts       — Trade evaluation AI
    eventLog.ts      — Event logging system

  draft/
    draftEngine.ts   — Draft board + pick logic

  math/
    distributions.ts — Statistical distributions
    random.ts        — Seeded PRNG utilities

  persistence/
    saveLoad.ts      — IndexedDB save/load via Dexie

  ai/
    gmAI.ts          — AI team management decisions
    tradeAI.ts       — Trade evaluation logic

  narrative.ts       — Owner archetypes, pressure system
  predictions.ts     — MFSN prediction generation
  storyboard.ts      — Season arc narrative engine
  chemistry.ts       — Team chemistry system
  tutorial.ts        — Tutorial state machine
  devPrograms.ts     — Player development programs
  finances.ts        — Payroll reports, luxury tax

store/
  gameStore.ts       — Season, phase, sim state, owner patience
  leagueStore.ts     — News items, moments, franchise history, trade history
  uiStore.ts         — Navigation, toasts, selected player, modal state

hooks/
  useSeasonSimulation.ts — Season sim orchestration + toast wiring
  useOffseasonFlow.ts — Offseason phase state machine
  useInSeasonFlow.ts — Interactive in-season pacing
  useSort.ts         — Generic sort hook

types/
  league.ts          — Team, Player, SeasonResult, Awards, etc.
  game.ts            — ScheduleEntry, BoxScore, GameResult
  events.ts          — GameEvent (stub)
  + various others

data/
  teamOptions.ts     — 30 team definitions (city, name, abbr, division)
  + name databases, constants
```

---

## 4. STATE MANAGEMENT — The Three Zustand Stores

### gameStore (src/store/gameStore.ts)
- `season: number` — Current season number
- `userTeamId: number` — Player's team ID
- `gamePhase: 'preseason' | 'in_season' | 'postseason' | 'offseason'`
- `seasonPhase: 'playing' | 'allstar' | 'deadline' | 'complete'`
- `isSimulating: boolean` — Is simulation running?
- `simProgress: number` — 0-1 progress
- `ownerPatience: number` — 0-100, get fired at 0
- `teamMorale: number` — 0-100
- `seasonsManaged: number`
- `difficulty: 'easy' | 'normal' | 'hard'`
- `ownerArchetype: string`
- `tutorialActive: boolean`

### leagueStore (src/store/leagueStore.ts)
- `newsItems: NewsItem[]` — Rolling news feed
- `moments: SeasonMoment[]` — Memorable season moments
- `franchiseHistory: SeasonSummary[]` — Per-season records
- `tradeHistory: TradeHistoryRecord[]` — All trades made
- `weeklyStories: WeeklyStory[]` — This Week in MRBD
- `clubhouseEvents: ClubhouseEvent[]`
- Various setters

### uiStore (src/store/uiStore.ts)
- `activeTab: string` — Current pillar
- `activeSubTab: string` — Current sub-tab
- `selectedPlayer: number | null`
- `toasts: ToastItem[]` — Active toast notifications
- `navigate(tab, sub?)` — Navigation function
- `addToast(message, type, opts?)` — Toast creator
- `setSelectedPlayer(id)` — Player selection

---

## 5. THE WORKER API — Complete Method List

The engine exposes ~80+ methods via Comlink. Key ones:

### Game Flow
- `newGame(seed, teamId)` — Initialize new game
- `simulateCurrentSeason()` — Full season sim
- `simulatePostseason()` — Playoff bracket
- `computeAwards()` — End-of-season awards
- `advanceSeason()` — Offseason + new season prep
- `startInSeason()` — Begin interactive season mode
- `startOffseason()` — Begin offseason flow

### Data Retrieval
- `getStandings()` — League standings
- `getRoster(teamId)` — Full roster with stats
- `getBattingLeaders(limit)` — Batting leaderboard
- `getPitchingLeaders(limit)` — Pitching leaderboard
- `getPlayerProfile(playerId)` — Detailed player data
- `getTeams()` — All 30 teams
- `getAwardRace()` — Current award leaders
- `getPennantRace()` — Division position + WC
- `getCurrentScheduleInfo()` — Schedule progress
- `getNewsFeed()` — News stories
- `getRecentEvents(limit, teamId?)` — Event log
- `getYearInReview()` — Season summary
- `getTopProspects()` — Prospect rankings
- `getPlayoffBracket()` — Current bracket
- `getSeasonAwards()` — Computed awards
- `getOwnerState(teamId)` — Owner evaluation
- `getHOFCandidates()` — Hall of Fame ballot
- `getHallOfFame()` — Inducted members
- `getFranchiseRecords(teamId)` — Team records
- `getPayrollReport(teamId)` — Financial report
- `getCareerLeaderboard(stat)` — All-time leaders
- `getAdvancedStats(playerId)` — wOBA, wRC+, FIP, WAR
- `getLeaderboard(category?, limit?)` — Combined leaders

### Roster Actions
- `getFreeAgents()` — Available FAs
- `signFreeAgent(playerId, teamId, years, salary)`
- `proposeTrade(offer)` — Submit trade
- `acceptTradeOffer(offerId)` — Accept AI offer
- `shopPlayer(playerId)` — Shop player on block
- `offerExtension(playerId, years, salary)`
- `scoutPlayer(playerId)` — Reveal true ratings
- `assignDevProgram(playerId, programId)`
- `removeDevProgram(playerId)`

### Draft
- `startDraft()` / `startAnnualDraft()` — Begin draft
- `completeDraft()` / `completeAnnualDraft()` — Finish
- `getDraftBoard()` — Available picks

### Offseason
- `processWaivers()` — Waiver claims
- `resolveArbitrationCase(playerId, salary)`
- `getArbitrationCases()` — Arb-eligible players
- `conductRule5Draft()` — Rule 5
- `userRule5Pick(playerId)` — User's Rule 5 selection
- `signIntlProspect(playerId)` — International signing
- `getAIRosterMoves()` — What AI teams did

---

## 6. DESIGN SYSTEM — Bloomberg Terminal Aesthetic

### CSS Classes
- `bloomberg-border` — `border border-[#1E2A4A] rounded bg-[#0A1628]`
- `bloomberg-header` — `bg-[#0D1628] border-b border-[#1E2A4A] px-4 py-2 text-orange-500 text-[10px] font-bold tracking-[0.2em] uppercase`
- `bloomberg-row` — `border-b border-[#1E2A4A30] px-4 py-2 hover:bg-[#1E2A4A20]`

### Color Palette
- Primary accent: `orange-500` / `orange-400`
- Success: `green-400` / `green-500`
- Warning: `yellow-400` / `orange-400`
- Error: `red-400` / `red-500`
- Background: `#0A1628` (deep navy)
- Surface: `#0F1930` / `#0D1628`
- Border: `#1E2A4A`
- Text primary: `gray-200` / `gray-300`
- Text secondary: `gray-500`
- Text muted: `gray-600`

### Typography
- Headers: `text-[10px] font-bold tracking-[0.2em] uppercase`
- Body: `text-xs` to `text-sm`
- Stats: `tabular-nums font-bold`
- Badges: `text-[8px] px-1.5 py-0.5 rounded tracking-wider`

---

## 7. KNOWN BUGS & GOTCHAS

### Critical
1. **TypeError: Cannot read properties of undefined (reading 'map')** — Occurs after sim in Dashboard. Error boundary catches it but hides bottom panels. Likely in StoryboardPanel or MomentsPanel trying to `.map()` over an undefined array after the season result shape changes.

### Important
2. **Team AVG shows .000 in preseason** — TeamLeadersWidget shows .000 for team batting in preseason because no plate appearances have occurred. Expected behavior but could show "N/A" instead.
3. **Pre-existing TS errors** — ~20 unused `@ts-expect-error` directives in files from earlier sprints. Not blocking.
4. **Port conflict** — Vite sometimes fails to start if port 5173 is occupied. Kill with `lsof -ti :5173 | xargs kill -9`.

### Design Debt
5. **History stub** — `src/components/history/HistoryView.tsx` (79 bytes) is a dead stub. The real routing goes through `src/components/stats/HistoryView.tsx`.
6. **Duplicate naming** — There's a `HistoryView.tsx` in both `history/` and `stats/`. The `stats/` version is the real one.

---

## 8. RECENT SPRINT HISTORY (What Claude Built)

### Sprint 10: Feature Port (10 components)
- PositionBattles, CutAdvisor, AgingBadge, FinancialAdvisor
- MilestoneCard, PowerRankings, CoachTip
- FranchiseRatings table, Pipeline integration

### Sprint 11: Wiring Pass
- CoachTip spread to 14 views
- AgingBadge spread to 9 views
- PowerRankings into StandingsTable

### Sprint 12: Cadence & Feedback
- Toast notification system (useSeasonSimulation, DraftRoom, PlayerProfile)
- SeasonTimeline component (history/SeasonTimeline.tsx)
- TransactionLog component (history/TransactionLog.tsx)
- Integrated into HistoryView as TIMELINE + MOVES tabs

### Sprint 13: Dashboard Polish
- TeamLeadersWidget (team top hitter/pitcher + aggregates)
- DynastyMilestonesPanel (20 milestones, 4 tiers, progress bar)

---

## 9. RECOMMENDED NEXT MOVES (Priority Order)

1. **Fix the TypeError bug** — Most impactful. Search for `.map(` calls in Dashboard.tsx render tree that don't guard against undefined. Likely in `moments.map()` or `weeklyStories.map()`.

2. **Wire AwardRacePanel to HOME** — The component exists (`AwardRacePanel.tsx`). Add it to `Dashboard.tsx` during `in_season` phase, gated by `gamePhase === 'in_season'`.

3. **Hot/Cold Streak Detection** — Add streak tracking in `InSeasonDashboard.tsx`. Track consecutive wins/losses and surface alerts.

4. **Season Game Log Browser** — Box scores exist in `gameStore` after sim. Build a simple paginated table showing game results with expandable box scores.

5. **Fix TeamLeadersWidget batting** — The `.ab` threshold might not match the engine's stat key format. Verify `p.stats.ab` returns correctly from `getRoster()`.

6. **Clean up dead stub** — Remove or redirect `src/components/history/HistoryView.tsx` (the 79-byte stub).

---

## 10. HOW TO CONTRIBUTE

### Lane Rules (from CLAUDE.md)
- **UI lane**: Dashboard, views, components, hooks, stores — SAFE to edit
- **Engine lane**: `worker.ts`, `sim/`, `engine/` core — COORDINATE before editing
- **Types**: `types/` — Can add new types, be careful modifying existing

### Coding Standards
- TypeScript strict mode
- Tailwind CSS for all styling (no CSS modules)
- Zustand for state management
- All engine calls go through `getEngine()` Comlink proxy
- Use `bloomberg-border`/`bloomberg-header`/`bloomberg-row` for panel styling
- Toast notifications via `useUIStore.getState().addToast(message, type, opts?)`
- Toast opts: `{ accent: string, icon: string, duration: number }`
- Lazy load route-level components with `React.lazy()`
- Sort headers via `useSort` hook + `SortHeader` component

### Build Verification
```bash
npx tsc --noEmit                    # Must pass (ignore pre-existing @ts-expect-error warnings)
npx vite build                       # Must produce clean build
# Current: 48 precache entries
```
