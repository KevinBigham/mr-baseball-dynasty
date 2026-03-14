# Mr. Baseball Dynasty — Deep Analysis Report

Prepared from a static audit of the uploaded repository plus targeted local validation (`npm ci`, `npm run typecheck --silent`, `npx vite build`, `npm test -- --run`) and spot code inspection of the hot paths you listed.

## Scope and methodology

I audited the repository shipped in `MRBD_HANDOFF_PACKAGE.zip`, with emphasis on the files you highlighted first and then the hot paths they touch.

Coverage:
- **235 TypeScript/TSX files**
- **48,683 lines** of TS/TSX under `src/`
- direct inspection of `worker.ts`, `Dashboard.tsx`, `useSeasonSimulation.ts`, `useInSeasonFlow.ts`, stores, playoff sim, game sim, draft generation, trade logic, and heavy UI screens
- build/test checks after installing dependencies
- targeted searches for DTO drift, undefined-array access, timer cleanup, silent catches, and mismatched worker/UI contracts

Validation snapshot:
- `npm run typecheck --silent` **fails**
- `npx vite build` **succeeds**, but emits important warnings
- `npm test -- --run` **fails** because there are **no test files**
- build warning: Tailwind `content` config is missing or empty
- build warning: `src/engine/engineClient.ts` and `src/db/schema.ts` are both dynamically and statically imported, so those modules do not split the way the code seems to intend
- emitted production CSS is only **5.53 kB**, and common utilities like `.flex`, `.grid`, `.text-orange-400`, `.bg-gray-900`, `.items-center`, `.justify-between`, and `.space-y-4` are absent from the built CSS while `.p-4` exists; that strongly suggests incomplete Tailwind generation
- there are **143 `getEngine()` call sites across 45 files**
- there are **110 `@ts-expect-error`** directives and **60 `as any`** casts under `src/`

## Executive summary

This project has the bones of a genuinely strong dynasty sim. The broad architecture choice is correct: heavy simulation in a worker, React UI on the main thread, Zustand for app/session state, and lazy-loaded feature surfaces.

The biggest problem is not the baseball math. It is **contract drift** between the worker and the UI.

That drift is responsible for:
1. the known **Dashboard postseason crash**,
2. empty or stale panels,
3. swallowed failures that quietly disable features,
4. `tsc` failures hidden behind `as any` and stale `@ts-expect-error`,
5. a season-flow pipeline that looks complete but is only partially wired.

The short version: the game is **closer to “playable alpha with strong design instincts” than “stable foundation ready for scale.”** The sim engine is promising. The app shell is promising. The seam between them is the gremlin nest.

### Overall ratings

| Area | Rating | Notes |
|---|---:|---|
| Architectural idea | 8/10 | Worker + React + Zustand is the right macro choice |
| Current implementation hygiene | 4/10 | Too much DTO drift, suppression debt, and hot-file coupling |
| Simulation realism (macro) | 7.5/10 | League environment is plausibly MLB-like already |
| Type/build health | 3/10 | `tsc` fails; suppressions are hiding real mismatches |
| UX completeness | 6/10 | Strong shell, but several loops feel thin or unfinished |
| Scalability as-is | 5/10 | Good concept, risky implementation |
| Scalability after contract cleanup + worker split | 8/10 | Very salvageable |

The fastest headline: the known Dashboard crash comes from a **playoff-bracket contract mismatch**. `src/engine/worker.ts` imports the stub playoff module from `src/engine/league/playoffs.ts`, but the UI expects the richer bracket shape from `src/engine/sim/playoffSimulator.ts`. After a season sim, `bracket.alTeams` / `bracket.nlTeams` are undefined, and the Dashboard hits `.map()` on them.

---

# A. Architecture Review

## Current architecture

At a high level the project is structured like this:
- **React 18 + TypeScript + Vite** for UI
- **Comlink + Web Worker** for simulation and data queries
- **Zustand** for app/game/league/UI slices
- **Feature-heavy component tree** with route-like lazy loading in `Shell.tsx`
- **Worker-owned canonical simulation state**, with UI polling/querying slices of that state

This is the right broad architecture for a client-side sports sim. The worker isolates heavy compute and protects frame time. Zustand fits a game shell better than a large enterprise reducer forest. The five-pillar navigation is coherent and genre-appropriate.

## Strengths

### 1) Main-thread / worker split is the right bet
Keeping season sim, roster logic, playoffs, draft, development, AI, and persistence orchestration off the UI thread is exactly what this game needs.

### 2) Navigation model is strong
`HOME → TEAM → FRONT OFFICE → LEAGUE → HISTORY` is intuitive for dynasty players and mirrors the mental model of franchise management.

### 3) Feature breadth is already strong for an alpha
The repo already has owner patience, morale, chemistry, fog-of-war scouting, staff/facilities, offseason systems, narrative/news, records/history, draft, trade center, AI roster movement, and autosaves. That is real design ambition.

### 4) Lazy loading exists
Large views are split, which is correct for a long-session browser game.

### 5) Several engine modules are healthier than the facade
`gameSimulator.ts`, `plateAppearance.ts`, `log5.ts`, `markov.ts`, `draftPool.ts`, `trading.ts`, `development.ts`, and `predictions.ts` are easier to reason about than the worker facade exposing them.

## Weaknesses

### 1) The worker/UI boundary has no authoritative DTO layer
This is the central architectural flaw.

The worker returns ad hoc shapes. UI code frequently casts them with `as any`. Types in `src/types/league.ts` do not consistently match runtime objects. `workerCache.ts` stores `unknown[]` and imports the wrong playoff type. There is **no single source of truth for cross-thread contracts**.

### 2) `src/engine/worker.ts` is a god file
At roughly **4.7k lines**, `worker.ts` is doing too much: public API, save/load migration, postseason orchestration, roster queries, profile shaping, in-season orchestration, cache invalidation, and season-state transitions.

### 3) Separation of concerns is inconsistent on the UI side
Some screens pull from Zustand, some fetch from the worker directly, some do both, and some compute local transformations from semi-typed payloads. `Dashboard.tsx` subscribes broadly to both `gameStore` and `leagueStore`, making it a rerender nexus.

### 4) IPC is chatty
There are **143 `getEngine()` call sites across 45 files**. That suggests the boundary is being used like a chatty REST client rather than a purpose-built game snapshot API.

### 5) Stub and real implementations coexist in dangerous ways
A few of the worst bugs come from “placeholder” modules still sitting in the execution path:
- `src/engine/league/playoffs.ts` stub is still wired into the worker
- `src/ai/tradeAI.ts` duplicates trade logic with a stub-heavy API
- `worker.getAwardRace()` returns winner data while the UI expects race data
- `getPlayoffMVP()` is exposed but stubbed to `null`

## Code organization and separation of concerns

### What is separated well
- core baseball math: `src/engine/math/log5.ts`
- plate appearance logic: `src/engine/sim/plateAppearance.ts`
- game sim orchestration: `src/engine/sim/gameSimulator.ts`
- draft generation: `src/engine/draft/draftPool.ts`
- trade valuation / team intelligence: `src/engine/trading.ts`, `src/engine/aiTeamIntelligence.ts`
- state slices are at least logically separated (`gameStore`, `leagueStore`, `uiStore`)

### What is not separated well
- DTO shaping is split between worker, UI components, and store consumers
- season-flow orchestration is split across hooks and dashboard render conditions
- playoff data contracts exist in incompatible forms
- trade logic exists in two places (`src/engine/trading.ts` and stub `src/ai/tradeAI.ts`)
- team metadata is duplicated in `predictions.ts`

## Scalability assessment

### As currently implemented: **5/10**
This architecture can handle “one clever developer shipping features quickly.” It does **not** yet handle “a multi-agent implementation sprint without stepping on landmines.”

### After a focused refactor: **8/10**
If you do these three things, the architecture becomes genuinely scalable:
1. **Create a shared DTO layer for every worker-facing response**
2. **Split `worker.ts` into domain adapters behind a thin Comlink facade**
3. **Replace chatty dashboard RPC patterns with a bundled snapshot endpoint**

That would turn the codebase from “hot-wired but talented” into “safely expandable.”

---

# B. Bug Report (critical)

Below is every **high-confidence** bug I identified from static review plus targeted validation. This is not a proof that no other bugs exist in ~48k lines, but it is a broad, actionable bug inventory with root causes and fixes.

## B1. Dashboard postseason crash — `Cannot read properties of undefined (reading 'map')`

**Severity:** Critical runtime crash

**Files / lines**
- `src/engine/worker.ts:22, 403-415`
- `src/engine/league/playoffs.ts:20-38`
- `src/engine/sim/playoffSimulator.ts:38-47, 176-263`
- `src/hooks/useSeasonSimulation.ts:14, 89-115`
- `src/components/dashboard/PlayoffBracket.tsx:122-125, 198-203`
- `src/engine/workerCache.ts:6, 15`

**Trigger**
- Simulate a full season and render postseason/home dashboard panels.

**Why it fails**
The worker imports the stub playoff module:

```ts
import { simulatePlayoffs, type PlayoffBracket } from './league/playoffs.ts';
```

That stub returns:

```ts
{
  season,
  wildCardSeries: [],
  divisionSeries: [],
  championshipSeries: [],
  worldSeries: null,
  champion: null
}
```

But the UI expects the richer real bracket shape from `src/engine/sim/playoffSimulator.ts`, including `alTeams`, `nlTeams`, `wildCardRound`, `championId`, and `championName`. So `bracket` is truthy but `bracket.alTeams` is undefined, and this line explodes:

```ts
...bracket.alTeams.map(t => t.teamId)
```

**Exact fix**
- Import the real playoff type from `./sim/playoffSimulator.ts`
- Convert standings to `StandingsRow[]`
- Call `simulateFullPlayoffs(...)`
- Add null-safe UI guards

```ts
// src/engine/worker.ts
import {
  simulateFullPlayoffs,
  type PlayoffBracket,
} from './sim/playoffSimulator.ts';
import type { StandingsRow } from '../types/league.ts';

function toUiStandingsRow(row: TeamStandingRow): StandingsRow {
  return {
    teamId: row.teamId,
    name: `${row.city} ${row.name}`,
    abbreviation: row.abbreviation,
    league: row.conferenceId === 0 ? 'AL' : 'NL',
    division: row.divisionId === 0 ? 'East' : row.divisionId === 1 ? 'Central' : 'West',
    wins: row.wins,
    losses: row.losses,
    pct: Number(row.pct),
    gb: 0,
    runsScored: row.runsScored,
    runsAllowed: row.runsAllowed,
    pythagWins: row.pythWins,
  };
}

async simulatePostseason(): Promise<PlayoffBracket | null> {
  if (latestTeamSeasons.length === 0) return null;

  const standings = buildStandings({
    teamSeasons: latestTeamSeasons,
    gameResults: latestGameResults,
  }).map(toUiStandingsRow);

  const bracket = simulateFullPlayoffs(standings, teams, players, rngSeed + currentSeason);
  if (!bracket) return null;

  latestPlayoffBracket = bracket;
  cache.invalidate();
  return bracket;
}
```

```ts
// src/hooks/useSeasonSimulation.ts
const playoffTeams =
  bracket && 'alTeams' in bracket && 'nlTeams' in bracket
    ? [...(bracket.alTeams ?? []), ...(bracket.nlTeams ?? [])]
    : [];
```

## B2. Standings contract mismatch makes standings panels silently empty

**Severity:** Critical data-contract bug / broken UI

**Files / lines**
- `src/engine/worker.ts:1015-1020`
- `src/types/league.ts:75-93`
- `src/hooks/useInSeasonFlow.ts:75-81`

**Trigger**
- Any flow that calls `engine.getStandings()` and stores it as `StandingsData`.

**Why it fails**
The worker returns a flat `TeamStandingRow[]` array with `conferenceId`, `divisionId`, and `pct: string`. The UI expects:

```ts
interface StandingsData {
  season: number;
  standings: StandingsRow[];
}
```

So `setStandings(standingsData as any)` stores a lie, and `setDivisionStandings((standingsData as any).standings ?? null)` commonly resolves to `null`.

**Exact fix**

```ts
// src/engine/worker.ts
async getStandings(): Promise<StandingsData> {
  const raw = buildStandings({ teamSeasons: latestTeamSeasons, gameResults: latestGameResults });
  const rows = addGamesBack(raw.map(row => ({
    teamId: row.teamId,
    name: `${row.city} ${row.name}`,
    abbreviation: row.abbreviation,
    league: row.conferenceId === 0 ? 'AL' : 'NL',
    division: row.divisionId === 0 ? 'East' : row.divisionId === 1 ? 'Central' : 'West',
    wins: row.wins,
    losses: row.losses,
    pct: Number(row.pct),
    gb: 0,
    runsScored: row.runsScored,
    runsAllowed: row.runsAllowed,
    pythagWins: row.pythWins,
  })));

  return { season: currentSeason, standings: rows };
}
```

Then remove the `as any` casts in `useInSeasonFlow.ts`.

## B3. `refreshBreakoutWatch()` calls the wrong roster API and silently fails

**Severity:** High runtime bug, currently swallowed

**Files / lines**
- `src/hooks/useSeasonSimulation.ts:159-169, 321-326`
- `src/engine/worker.ts:1023-1067`
- `src/engine/worker.ts:2546-2597`

**Trigger**
- End-of-season sim when breakout watch is resolved
- Initial breakout-watch generation

**Why it fails**
`getRoster(teamId)` returns a flat array, but the hook assumes a grouped object with `.active`, `.minors`, and `.il`:

```ts
const roster = await engine.getRoster(userTeamId);
const allPlayers = [...roster.active, ...roster.minors, ...roster.il];
```

That throws, and the `catch` swallows it, so breakout-watch resolution quietly never happens.

**Exact fix**

```ts
const roster = await engine.getFullRoster(userTeamId);
const allPlayers = [
  ...roster.active,
  ...roster.il,
  ...roster.dfa,
  ...roster.aaa,
  ...roster.aa,
  ...roster.aPlus,
  ...roster.aMinus,
  ...roster.rookie,
  ...roster.intl,
];
const resolved = resolveBreakoutWatch(breakoutWatch, allPlayers);
```

## B4. Award race API returns winners, while UI expects candidate arrays

**Severity:** High runtime bug / broken feature

**Files / lines**
- `src/engine/worker.ts:2923-2933`
- `src/components/dashboard/AwardRacePanel.tsx:10-15`
- `src/components/dashboard/PostseasonReport.tsx:52-56, 88-94`

**Trigger**
- Postseason report or award-race panel when `awardRaceData` is set from `engine.getAwardRace()`.

**Why it fails**
The worker returns a winners object:

```ts
{
  season,
  alMVP, nlMVP, alCyYoung, nlCyYoung, alROY, nlROY
}
```

The UI expects:

```ts
{
  mvp: { al: AwardCandidate[]; nl: AwardCandidate[] };
  cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
  roy: { al: AwardCandidate[]; nl: AwardCandidate[] };
}
```

So `data.mvp.al` is undefined.

**Exact fix**
Implement a real race DTO, or hide the panel until it exists.

```ts
async getAwardRace(): Promise<{
  mvp: { al: AwardCandidate[]; nl: AwardCandidate[] };
  cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
  roy: { al: AwardCandidate[]; nl: AwardCandidate[] };
}> {
  return buildAwardRace(players, latestPlayerSeasons, teams);
}
```

## B5. `PlayerProfileData` type exported by worker does not match what the worker actually returns

**Severity:** High type/build bug with runtime drift risk

**Files / lines**
- `src/engine/worker.ts:1126-1182`
- `src/types/league.ts:170-198`
- `src/components/stats/PlayerProfile.tsx:480-507`

**Trigger**
- Typechecking or future refactors touching profile plumbing.

**Why it fails**
The worker effectively returns a richer custom object with `grades`, roster status, salary, service time, options, and trade value, while the type imported by the UI is different. The component then adds more casts around a `scoutingInfo` field that is not part of the declared shared contract.

**Exact fix**
Use one shared DTO in `src/types/league.ts` and import it from both worker and UI.

```ts
export interface PlayerProfileData {
  player: {
    playerId: number;
    name: string;
    age: number;
    position: string;
    bats: string;
    throws: string;
    overall: number;
    potential: number;
    grades: Record<string, number>;
    rosterStatus: string;
    serviceTimeDays: number;
    salary: number;
    contractYearsRemaining: number;
    isPitcher: boolean;
    teamId: number;
    teamAbbr: string;
    optionYearsRemaining: number;
    tradeValue: number;
  };
  seasonStats: Record<string, number> | null;
  careerStats: PlayerSeasonStats[];
  scoutingInfo?: { confidence: number; scouted: boolean };
}
```

## B6. Stat lines are stringly typed in the worker but numeric in the UI types

**Severity:** High type/build bug + data-corruption risk in UI math

**Files / lines**
- `src/engine/worker.ts:4617-4664`
- `src/types/league.ts:119-126`
- `src/components/stats/FinanceView.tsx:211-224`
- `src/components/offseason/ExtensionPanel.tsx:301`
- `src/components/dashboard/TeamLeadersWidget.tsx:55-128`

**Trigger**
- Typechecking, finance view, extension panel, or any UI math on stat fields.

**Why it fails**
The worker returns formatted strings for `avg`, `obp`, `slg`, `era`, `ip`, `k9`, `whip`, while UI types declare numbers. That creates:
- `tsc` failures
- string concatenation risks
- broken qualification logic
- wrong aggregate math

**Exact fix**
Return **raw numbers** from the worker and format only in the UI.

```ts
// worker-side example
return {
  avg: ps.ab > 0 ? ps.hits / ps.ab : 0,
  obp: pa > 0 ? (ps.hits + bb + hbp) / pa : 0,
  slg: ps.ab > 0 ? tb / ps.ab : 0,
  era: ps.ip > 0 ? calcERA(ps.earnedRuns, ps.ip) : 0,
  ip: ps.ip,
  k9: innings > 0 ? (ps.kPitching / innings) * 9 : 0,
  whip: innings > 0 ? ((ha + bba) / innings) : 0,
};
```

## B7. Interactive in-season flow does not hand off correctly into postseason/offseason

**Severity:** High broken flow

**Files / lines**
- `src/hooks/useInSeasonFlow.ts:155-159, 187-195, 247-250, 304-307, 326-332`
- `src/engine/worker.ts:2605-2610`
- `src/components/dashboard/Dashboard.tsx:315-323`

**Trigger**
- Finish a season via the incremental sim path instead of one-shot season sim.

**Why it fails**
`engine.finalizeSeason()` returns **void**, but the hook treats it as a `SeasonResult`. Separately, `simAllRemaining()` stores `{ done: true, gamesPlayed }` in `fullResult`, which is also not a `SeasonResult`. The incremental flow and one-shot flow never converge on one canonical season-result state.

**Exact fix**
Make `finalizeSeason()` return a real `SeasonResult`, and write both flows into the same store slot.

```ts
async finalizeSeason(): Promise<SeasonResult> {
  const result = buildSeasonResultFromCurrentState();
  cache.invalidate();
  const saveState = buildPersistedState();
  if (saveState) createAutosave(saveState, 'Season Finalized');
  return result;
}
```

## B8. `simRemainingChunks()` overcounts progress

**Severity:** Medium logic bug

**Files / lines**
- `src/engine/worker.ts:2797-2814`

**Trigger**
- Fast-forward remaining chunks.

**Why it fails**
This line adds a cumulative value each loop:

```ts
totalGamesPlayed += result.partialResult.gamesCompleted;
```

So total progress is inflated.

**Exact fix**
Track the starting value and subtract.

```ts
const startCompleted = incrementalSimState.gamesCompleted;
// ...run simulation...
return { done: true, gamesPlayed: incrementalSimState.gamesCompleted - startCompleted };
```

## B9. `simToNextEvent()` claims interrupt support but never actually generates interrupts

**Severity:** Medium broken feature

**Files / lines**
- `src/engine/worker.ts:2678-2735`
- `src/engine/worker.ts:2739-2795`

**Trigger**
- Use “sim to next event” expecting hot streak / cold streak / milestone pauses.

**Why it fails**
`simRange()` builds `interrupts`. `simToNextEvent()` just returns `result.interrupts ?? []`, but that path never builds them.

**Exact fix**
Extract interrupt generation into a shared helper and call it from both methods.

```ts
function buildSimInterrupts(result: SimRangeResult) {
  const interrupts = [];
  // milestone detection
  // hot/cold streak detection
  return interrupts;
}
```

## B10. Save/load migration references `INITIAL_TEAMS`, which is not imported

**Severity:** High runtime bug on load path

**Files / lines**
- `src/engine/worker.ts:4448-4465`

**Trigger**
- Save/load migration path that normalizes team metadata.

**Why it fails**
The worker references `INITIAL_TEAMS`, but it is not imported in `worker.ts`. TypeScript already flags it, and if that path executes it becomes a runtime failure too.

**Exact fix**

```ts
const canonical = new Map(TEAMS.map(t => [t.teamId, t]));
```

## B11. Forfeit logic always awards the away team a 9–0 win

**Severity:** Medium simulation bug

**Files / lines**
- `src/engine/sim/gameSimulator.ts:405-415`

**Trigger**
- A simulated game where either side lacks a starter or a full lineup.

**Why it fails**
The branch hardcodes:

```ts
homeScore: 0,
awayScore: 9,
```

even if the **away** team is the invalid one.

**Exact fix**

```ts
const homeInvalid = !homeSP || homeLineup.length < 9;
const awayInvalid = !awaySP || awayLineup.length < 9;

if (homeInvalid || awayInvalid) {
  return {
    gameId: input.gameId,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: awayInvalid && !homeInvalid ? 9 : 0,
    awayScore: homeInvalid && !awayInvalid ? 9 : 0,
    innings: 9,
    boxScore: makeEmptyBoxScore(input),
  };
}
```

## B12. Run-crediting can misattribute runs to the wrong player

**Severity:** Medium stat-accounting bug

**Files / lines**
- `src/engine/sim/gameSimulator.ts:230-255, 277-283`

**Trigger**
- Multi-run plate appearances or fallback run-credit path.

**Why it fails**
The fallback logic uses:

```ts
const alreadyCredited = credited > 0;
```

That checks whether *someone* was already credited, not whether the **same runner** was. Also `markRunScored()` depends on an existing line.

**Exact fix**

```ts
const creditedRunnerIds = new Set<number>();
if (!creditedRunnerIds.has(runnerId)) {
  markRunScored(batterStats, runnerId);
  creditedRunnerIds.add(runnerId);
  credited++;
}
```

```ts
function markRunScored(stats: Map<number, PlayerGameStats>, playerId: number): void {
  const s = stats.get(playerId) ?? blankBatterStats(playerId);
  s.r++;
  stats.set(playerId, s);
}
```

## B13. `TeamLeadersWidget` computes aggregates from fields the worker never returns

**Severity:** High broken UI math

**Files / lines**
- `src/components/dashboard/TeamLeadersWidget.tsx:55-70, 79-84, 109-128`
- `src/engine/worker.ts:4617-4664`

**Trigger**
- Render the home dashboard team-leaders card.

**Why it fails**
The component reads `s.h`, `s.ab`, `s.er`, `s.so`, `s.wins`, `s.losses`, but the worker `StatLine` DTO does not consistently provide those, and `s.ip` is currently a formatted string.

**Exact fix**
After normalizing stats to numbers, rewrite the widget to only use fields that exist.

```ts
const ops = (s.obp ?? 0) + (s.slg ?? 0);
const innings = s.ip ?? 0;
const era = s.era ?? 99;
```

If aggregate BA/ERA is desired, either return raw `H/AB/ER/OUTS` in the DTO or compute aggregates from raw `PlayerSeason` data in a dedicated worker method.

## B14. Home command center “welcome” card never appears

**Severity:** Low UX bug

**Files / lines**
- `src/components/dashboard/HomeCommandCenter.tsx:87-96`

**Trigger**
- First preseason after starting a franchise.

**Why it fails**
The condition is:

```ts
if (gamePhase === 'preseason' && season === 1)
```

But the game starts in a modern season number, not literal season 1.

**Exact fix**

```ts
if (gamePhase === 'preseason' && seasonsManaged === 0) {
  // welcome card
}
```

## B15. Home command center recent-trade detection uses `category`, but news items use `type`

**Severity:** Low broken feature

**Files / lines**
- `src/components/dashboard/HomeCommandCenter.tsx:121, 198-200`

**Trigger**
- Recent trade/rumor story in the home feed.

**Why it fails**
The component does:

```ts
const recentTrade = newsItems.find(n => n.category === 'trade');
```

But the home-card pipeline treats items as `{ headline, type }`. The card is effectively dead.

**Exact fix**

```ts
const recentTrade = newsItems.find(n => n.type === 'trade' || n.type === 'rumor');
```

## B16. Tutorial auto-start effect has stale dependencies and can miss first-load conditions

**Severity:** Low-to-medium UX bug

**Files / lines**
- `src/components/dashboard/Dashboard.tsx:88-94`

**Trigger**
- Fresh save/start where `difficulty` or `seasonsManaged` land after mount.

**Why it fails**
The effect uses an empty dependency array, so if those values change after mount the tutorial may never auto-start.

**Exact fix**

```ts
useEffect(() => {
  if (shouldAutoStartTutorial(difficulty, seasonsManaged) && !tutorialActive) {
    setTutorialActive(true);
  }
}, [difficulty, seasonsManaged, tutorialActive, setTutorialActive]);
```

## B17. Timeouts are created without cleanup in several components

**Severity:** Low memory/state-after-unmount risk

**Files / lines**
- `src/components/layout/Shell.tsx:99-100`
- `src/components/layout/SaveManager.tsx:72, 141`
- `src/components/roster/DepthChart.tsx:256`

**Trigger**
- Navigate away immediately after save/import/rotation-save success message.

**Why it fails**
These components schedule timeouts but do not clear them on unmount.

**Exact fix**

```ts
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
}, []);

if (timeoutRef.current) clearTimeout(timeoutRef.current);
timeoutRef.current = setTimeout(() => setSaveFlash(false), 2000);
```

## B18. Tailwind production styling is misconfigured; the built CSS is likely incomplete

**Severity:** High production UX/build bug

**Files / lines**
- repo root: **missing `tailwind.config.*`**
- `postcss.config.js`
- `src/index.css`

**Trigger**
- Production build.

**Why it fails**
`npx vite build` warns that Tailwind `content` is missing or empty. The built CSS is tiny and missing common utility classes.

**Exact fix**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

## B19. Typecheck/build is broken by stale `@ts-expect-error` directives and mismatched DTOs

**Severity:** Critical engineering bug

**Files / lines**
- `src/components/dashboard/PreseasonPanel.tsx:151,162,164`
- `src/components/dashboard/TeamDetailModal.tsx:57,65`
- `src/components/offseason/ExtensionPanel.tsx:278,280,282,284,286`
- `src/components/offseason/FreeAgencyPanel.tsx:271`
- `src/components/stats/FinanceView.tsx:214,216,218,220,222,224`
- `src/components/stats/PlayerProfile.tsx:480,503`
- plus the real DTO mismatches behind them

**Trigger**
- `npm run typecheck`
- `npm run build`

**Why it fails**
Some suppressions are now unused, so `tsc` fails on the directives themselves. Others hide real DTO mismatches.

**Exact fix**
Fix the underlying DTO mismatches (B2, B4, B5, B6), then remove the stale directives. Do **not** replace them with `@ts-ignore`.

## B20. `getPlayoffMVP()` is a stub, but the postseason UI treats it like a real feature

**Severity:** Medium incomplete feature / false affordance

**Files / lines**
- `src/engine/worker.ts:3015`
- `src/components/dashboard/PlayoffBracket.tsx:108-117, 159-164`

**Trigger**
- Champion banner / postseason summary.

**Why it fails**
`getPlayoffMVP()` always returns `null`, so the UI implies a feature that never actually appears.

**Exact fix**
Either implement a basic World Series MVP selector or hide the UI until ready.

## B21. Season summary stores stale owner patience and morale end values

**Severity:** Low logic bug

**Files / lines**
- `src/hooks/useSeasonSimulation.ts:146-156, 188-198`

**Trigger**
- End-of-season summary generation.

**Why it fails**
The hook calls `adjustOwnerPatience()` and `adjustTeamMorale()`, then stores `ownerPatienceEnd: ownerPatience` and `teamMoraleEnd: teamMorale` using stale closure values.

**Exact fix**
Compute projected values before the update, or read fresh values from the store afterward.

```ts
const projectedOwnerPatience = ownerPatience + calcOwnerPatienceDelta(...);
const projectedTeamMorale = teamMorale + calcMoraleDelta(...) + staffBonuses.moraleBonus;
```

---

# C. Performance Analysis

## What is already good
- heavy simulation runs in a worker
- some view-level lazy loading is present
- a worker cache exists
- the sim engine itself is not obviously doing catastrophic per-play allocations
- the macro sim appears fast enough to support repeated simulation

## What is currently expensive

### 1) Dashboard/home screen is chatty
`HomeCommandCenter`, `TeamLeadersWidget`, standings, postseason panels, and flow hooks independently fetch overlapping data from the worker. The UI does not freeze, but you still pay serialization, promise overhead, and state churn.

### 2) Dashboard subscribes broadly to stores
`Dashboard.tsx` destructures large portions of both `gameStore` and `leagueStore`, making it a rerender nexus.

### 3) IPC is more granular than it should be
There are **143 `getEngine()` call sites across 45 files**. That is not automatically wrong, but it strongly suggests the boundary is being used like a chatty service layer rather than a game snapshot API.

### 4) Worker cache is undercut by weak typing and wrong imports
`workerCache.ts` stores `unknown[]` and imports the wrong playoff type, reducing the value of the cache.

## Heavy computations worth memoizing or bundling

### UI-side
- team leader selection and aggregate stat computation
- action-queue building and repeated derived home cards
- standings grouping/sorting on each render
- season-summary derivations from stable result objects

### Worker-side / IPC-side
- dashboard home snapshot
- combined standings + pennant race + roster counts
- player-profile bundles (profile + advanced stats + scouting)
- postseason report bundle (bracket + awards + AI moves)

## Bundle/build findings

Chunk sizes from `npx vite build`:
- `index-*.js`: **336.90 kB**
- `vendor-react`: **133.93 kB**
- `vendor-db`: **122.13 kB**
- `worker-*.js`: **190.59 kB**
- `RosterView`: **71.49 kB**
- `OffseasonDashboard`: **43.28 kB**
- `PlayerProfile`: **32.84 kB**
- `PostseasonReport`: **26.49 kB**
- `TradeCenter`: **21.10 kB**

That is not outrageous for a sim game, but it is heavier than it needs to be for first load.

### Code splitting is partially defeated
Build warnings show these modules are both dynamically and statically imported:
- `src/engine/engineClient.ts`
- `src/db/schema.ts`

So Vite warns that the dynamic import **will not actually move those modules into separate chunks**.

## Recommended performance fixes
1. **Add a single `getDashboardBundle()` / `getHomeSnapshot()` worker endpoint**
2. **Use narrow Zustand selectors with shallow comparison**
3. **Stop formatting numbers in the worker**; send raw numeric DTOs
4. **Memoize derived leaderboard/team-leader calculations**
5. **Move player-profile dependent fetches into one endpoint**
6. **Fix Tailwind config so the built UI resembles the app you think you shipped**

---

# D. UX / Game Design Improvements

## Where the game already feels good
- the Bloomberg-terminal styling idea is distinctive
- the five-pillar nav is coherent
- there is real managerial fantasy here, not just stats tables
- owner patience / morale / scouting uncertainty are all excellent dynastic levers

## Where it feels thin or incomplete

### 1) The season loop lacks enough “story payoff” in the middle
Players need more reasons to care between “simulate” and “final report.”

### 2) Postseason needs more juice
You need:
- series recaps
- clinching-game headlines
- upset narratives
- postseason heroes/goats
- quick box-score summaries

### 3) Trade and roster management need more negotiation texture
TradeCenter has breadth, but the trade AI does not yet feel like dealing with real front offices.

### 4) The onboarding path is not fully landable
The first-season welcome logic is bugged, tutorial auto-start can miss, and the home page does not always turn uncertainty into actionable next steps.

### 5) Information density is uneven
- HOME sometimes feels sparse relative to what the sim knows
- TEAM / stats surfaces can feel dense without enough hierarchy
- some panels are rich in chrome but poor in decision support

## Highest-impact UX additions
1. **Daily/weekly decision digest** — what changed, why it matters, what to do next
2. **Better postseason storytelling** — short series summaries, key games, upset alerts, trophy moment
3. **Box scores and game logs** — the sim needs memorable individual games, not just season totals
4. **Owner-mandate transparency** — show why owner patience moved
5. **More visible scouting uncertainty** — confidence badges, report age, estimated vs known visuals
6. **Better trade feedback** — tell the player why a deal was rejected in baseball terms

## Confusing UI flows
- one-shot season sim and incremental season flow do not converge cleanly
- postseason/report/offseason transitions are more brittle than they should be
- some home widgets imply live insight but are fed by fragile or stale data
- silent catches hide failures instead of telling the player

## Information-density rating
**Current density:** 6.5/10
- not too much globally
- too little in the home loop
- too much in some specialist views
- not enough decision-oriented hierarchy

A good rule for future UI work:
> every major surface should answer “what happened, why it matters, what I can do now.”

---

# E. Code Quality Report

## The biggest code-quality problem: contract drift
This codebase’s main quality problem is not style. It is **contract integrity**.

Symptoms:
- duplicate or incompatible interfaces
- DTOs defined in multiple places
- `unknown[]` in cache
- `@ts-expect-error` on hot-path UI
- `as any` when reading worker responses
- UI code depending on properties the worker never promised

## Duplication that should be extracted
1. **Worker ↔ UI DTO adapters** — move to a shared DTO layer
2. **Team metadata** — `predictions.ts` should consume canonical team data, not hardcode it again
3. **Trade logic** — there are effectively two trade engines (`src/engine/trading.ts` and `src/ai/tradeAI.ts`)
4. **Interrupt generation** — exists inline in one sim path and is missing in another

## Overly complex files that need refactoring
Highest priority:
- `src/engine/worker.ts`
- `src/components/offseason/TradeCenter.tsx`
- `src/components/stats/PlayerProfile.tsx`
- `src/components/roster/RosterView.tsx`
- `src/components/setup/SetupFlow.tsx`

These files are risky because they combine orchestration, transformation, rendering, and feature branching.

## Inconsistent patterns
- some components fetch worker data directly
- some rely on store state
- some do both
- some errors are surfaced toasts
- some are swallowed
- some contracts are typed
- some are cast through the fog

That inconsistency increases maintenance cost.

## Dead/stub code worth removing or replacing
- `src/engine/league/playoffs.ts` stub (currently harmful)
- `src/ai/tradeAI.ts` stub duplication
- `worker.getPlayoffMVP()` stub
- `worker.getTeamNeeds()` empty-object stub
- `worker.getAwardRace()` legacy-winner shape masquerading as race data
- stale `@ts-expect-error` directives once DTOs are fixed

## Missing error handling
There are many `catch { /* non-fatal */ }` blocks. Some are fine. Many are hiding broken features. In a sim game, silent failure is bad UX because players interpret missing output as “no event happened,” not “the app glitched.”

A reasonable rule:
- silent catch only for truly optional flourish data
- anything decision-relevant should surface a toast/log/fallback state

## Type-safety gaps
The counts tell the story:
- `@ts-expect-error`: **110**
- `as any`: **60**

Those numbers are not automatically disqualifying in a sprint branch, but in this repo they line up with actual bugs.

## Build health
`npm run build` fails because `tsc` fails first. That means the repo is not in a “ship one clean change safely” state yet.

---

# F. Simulation Engine Audit

## F1. Is the Log5 matchup math implemented correctly?
**Verdict: Yes, broadly.**

`src/engine/math/log5.ts` is fundamentally sound:
- proper odds-ratio form in `log5Single()`
- clamping to avoid pathological 0/1 probabilities
- normalized multi-outcome probabilities in `log5MultiOutcome()`
- sensible asymmetric influence weights for K/BB/HR/etc.
- squashed modifiers to stop fatigue/TTO/platoon stacks from going feral

This is a respectable implementation.

## F2. Are stat distributions realistic?
**Verdict: Macro environment is plausible; some micro-accounting bugs remain.**

Targeted season probes run during the audit produced MLB-ish macro environments:

| Seed | BA | ERA | RPG | Wins SD | Min wins | Max wins |
|---|---:|---:|---:|---:|---:|---:|
| 12345 | .2588 | 4.2969 | 4.2619 | 11.42 | 55 | 107 |
| 67890 | .2637 | 4.5363 | 4.5086 | 10.48 | 57 | 100 |
| 24680 | .2584 | 4.2625 | 4.2298 | 12.52 | 60 | 101 |

That sits in a believable MLB-ish band. Leaderboards from the probes were also plausible: HR leaders in the low/mid 40s, strikeout leaders around 230–260, elite ERAs around 1.7–2.4.

What still needs cleanup:
- individual run attribution
- forfeit logic
- some UI stat interpretation because of string DTOs

## F3. Is the aging curve reasonable?
**Verdict: Reasonable foundation, but coarse.**

What is good:
- different peaks for contact/power/eye/speed/fielding
- pitchers and hitters have different curves
- work ethic and uncertainty exist
- phases (`prospect`, `ascent`, `prime`, `decline`) are explicit

What is weak:
- annual deltas are a bit board-game-ish
- decline is mostly age-shaped, not workload- or injury-shaped
- retirement pressure is serviceable but blunt

## F4. Does the trade AI make sensible decisions?
**Verdict: Partially.**

`src/engine/trading.ts` and `src/engine/aiTeamIntelligence.ts` contain usable heuristics and real baseball-ish concepts. The problem is coherence:
- there is also a stub duplicate trade layer in `src/ai/tradeAI.ts`
- negotiation depth is still shallow
- feedback/explanations are not yet rich enough
- competitive-window reasoning is present, but not convincingly surfaced

## F5. Is draft prospect generation balanced?
**Verdict: No; annual classes are underpowered relative to the initial universe.**

Audit probe results:
- annual draft class average overall: **~148**
- annual draft class average potential: **~225–229**
- initial MLB-active average overall: **~360**
- initial MLB-active average potential: **~383**
- initial minors average overall: **~222**
- initial minors average potential: **~266**

That is a major replenishment mismatch. The likely root cause lives in `src/engine/draft/draftPool.ts:140-197`, where high-school players only get `+30 potential / -20 overall`.

## F6. Are playoff odds properly weighted?
**Verdict: No; they are heuristic presentation odds, not real playoff odds.**

`src/engine/predictions.ts` uses:

```ts
const basePlayoffOdds = Math.max(0, Math.min(95, (predictedWins - 72) * 6));
```

That is a display-friendly heuristic, not an actual probability model.

## F7. Overall simulation audit
**Bottom line:** the **baseball engine is in better shape than the app contract layer**.

That is good news. You do not need to reinvent the sim from scratch. You need to harden the transport layer, fix stat DTOs, clean up a few accounting issues, and then tune long-run talent generation.

---

# G. Top 20 Improvements (ranked by impact)

| Rank | Improvement | Impact | Difficulty | Why it matters |
|---|---|---:|---:|---|
| 1 | Fix postseason bracket contract and dashboard crash | Very high | Medium | Stops the known fatal bug and unblocks postseason UX |
| 2 | Create shared worker↔UI DTOs for standings, roster, awards, profile, stats | Very high | High | Removes the biggest systemic source of bugs |
| 3 | Repair interactive in-season → postseason/offseason pipeline | Very high | Medium | Makes the pacing loop coherent |
| 4 | Normalize stat DTOs to raw numbers and fix UI consumers | Very high | Medium | Fixes build errors and bad math simultaneously |
| 5 | Restore `tsc` health and remove hot-path suppression debt | Very high | Medium | Makes future work safe instead of spooky |
| 6 | Add dashboard/home snapshot endpoint to reduce Comlink chatter | High | Medium | Big responsiveness and maintainability win |
| 7 | Add smoke tests for season sim, postseason render, save/load | High | Medium | Prevents the same regression class from reappearing |
| 8 | Fix save/load migration bug (`INITIAL_TEAMS`) | High | Low | Save corruption paths are existential for sim games |
| 9 | Fix `simToNextEvent()` interrupts and `simRemainingChunks()` progress | High | Low | Makes the incremental sim loop trustworthy |
| 10 | Add Tailwind config and validate production CSS | High | Low | Prevents shipping a visually broken build |
| 11 | Implement real award-race candidate data | Medium-high | Medium | Turns a fake panel into a compelling one |
| 12 | Retune annual draft class generation | Medium-high | Medium | Preserves long-run league health |
| 13 | Consolidate trade engine and remove stub duplication | Medium-high | Medium | Improves both AI quality and code clarity |
| 14 | Fix TeamLeadersWidget and HomeCommandCenter logic | Medium | Low | Improves first-screen trust and usefulness |
| 15 | Add postseason series recaps / playoff storytelling | Medium | Medium | Huge engagement multiplier |
| 16 | Implement real playoff/pennant odds model | Medium | Medium-high | Upgrades “TV flavor” into meaningful analysis |
| 17 | Split `worker.ts` into domain adapters with thin facade | Medium | High | Big architectural payoff, but not first-week work |
| 18 | Improve onboarding and owner mandate transparency | Medium | Low-medium | Better first-session retention |
| 19 | Add box scores / game logs / signature moments | Medium | Medium-high | Increases emotional memory of seasons |
| 20 | Replace silent catches with player-visible fallback states | Medium | Low | Makes failures diagnosable and less confusing |

## Recommended implementation order
1. **Postseason crash + playoff DTO unification**
2. **Standings/roster/profile/stat DTO cleanup**
3. **Interactive season-flow repair**
4. **Typecheck/build restoration**
5. **Save/load fix + sim progress/interrupt fixes**
6. **Tailwind production config**
7. **Smoke tests**
8. **Dashboard snapshot / RPC reduction**
9. **Draft balance**
10. **Trade system consolidation**
11. **Award-race and postseason storytelling upgrades**

## Closing assessment

This project is **not** a broken toy. It is a high-ambition sim with good instincts and a dangerous seam. The core simulation work is promising. The UI concept is promising. The thing holding it back is not “lack of features”; it is **lack of a disciplined contract boundary** between worker and UI.

Fix that seam, and the project gets dramatically better very quickly.

Right now the baseball is trying to be smart while the plumbing is trying to improvise jazz. Fun jazz, occasionally, but jazz with exposed wiring.
