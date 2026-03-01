# MR. BASEBALL DYNASTY — HANDOFF BIBLE
## For Claude Sonnet 4.6 (or any successor agent)
### Written by Claude Opus 4.6 — March 2026

---

## THE VISION

Mr. Baseball Dynasty is being built to be **the greatest sports management simulation game ever created**. Think Bloomberg Terminal meets OOTP meets Football Manager — a deep, authentic baseball dynasty experience with a dark, professional aesthetic inspired by financial trading platforms. The user (Kevin Bigham) is building this as a passion project and has given full creative autonomy to AI agents to develop it at maximum speed.

---

## ARCHITECTURE OVERVIEW

### Tech Stack
- **React 18** + **TypeScript 5.6** — UI framework
- **Vite 5** — Build tool and dev server (`npm run dev`)
- **Vitest 2** — Testing framework (`npm run test`)
- **Zustand 5** — State management (two stores: `useGameStore`, `useUIStore`)
- **Comlink** — Web Worker communication (engine runs off main thread)
- **Dexie** — IndexedDB wrapper for save games
- **pure-rand** — Deterministic PRNG (critical for sim reproducibility)
- **Recharts** — Chart library (available but most views use inline styles)
- **Tailwind CSS 3** — Utility CSS (used in Shell.tsx header/nav, but most views use inline styles)
- **react-window** — Virtualized lists

### Project Structure
```
mr-baseball-dynasty/
├── src/
│   ├── engine/          # 395 TypeScript engine files across 45+ subdirectories
│   │   ├── sim/         # Core simulation (59 files — gameSimulator, plateAppearance, markov, etc.)
│   │   ├── game/        # Game state management
│   │   ├── analytics/   # 80+ analytics engine modules
│   │   ├── pitching/    # Pitching-specific engines
│   │   ├── trade/       # Trade engine + valuation
│   │   ├── player/      # Player generation, attributes, progression
│   │   ├── prospects/   # Farm system, scouting, development
│   │   ├── contracts/   # Salary, arbitration, luxury tax
│   │   ├── draft/       # Draft logic
│   │   ├── scouting/    # Scouting systems
│   │   └── [40+ more subdirs]
│   ├── components/      # 374 React component files across 34 subdirectories
│   │   ├── layout/      # Shell.tsx (THE central routing/navigation hub — 1323 lines)
│   │   ├── analytics/   # 80+ analytics view components
│   │   ├── pitching/    # Pitching views
│   │   ├── trade/       # Trade views
│   │   ├── prospects/   # Prospect/farm views
│   │   ├── contracts/   # Contract views
│   │   ├── dashboard/   # Main dashboard
│   │   └── [27+ more subdirs]
│   ├── store/
│   │   ├── gameStore.ts # Game state (season, teams, players, sim progress)
│   │   └── uiStore.ts   # UI state (activeTab NavTab union type — 350+ tabs)
│   └── workers/         # Web Worker entry points
├── tests/
│   ├── engine/          # 3 test files (markov, plateAppearance, stolenBase)
│   └── validation/      # 1 test file (gates.test.ts — 13 validation gates)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### File Counts (as of Wave 100)
- **Engine files**: 395 `.ts` files
- **Component files**: 374 `.tsx` files
- **Total source files**: 794
- **Test files**: 4 (40 tests, all passing)
- **Git commits**: 208

---

## THE CORE ENGINE (DO NOT MODIFY)

### CRITICAL RULE: PRNG Determinism
The simulation engine in `src/engine/sim/` uses **pure-rand** for deterministic pseudo-random number generation. **The same seed MUST produce the same season results.** This is validated by Gate 11 in the test suite.

**NEVER modify files in `src/engine/sim/` unless you are 100% certain you won't break determinism.**

### Core Sim Files (src/engine/sim/)
- `gameSimulator.ts` — Full game simulation
- `plateAppearance.ts` — Plate appearance resolution (Markov chain)
- `seasonSimulator.ts` — 162-game season loop
- `markov.ts` — Base state transitions
- `fsm.ts` — Game state machine
- `stolenBase.ts` — Stolen base model
- 50+ modifier files (clutch, weather, platoon, fatigue, etc.)

### Internal Attribute Scale
- **0-550 internal scale** (400 = MLB average)
- **Display as 20-80 scouting scale** for UI
- All player attributes stored internally at 0-550

### Validation Gates (tests/validation/gates.test.ts)
13 gates that MUST pass before every commit:
- Gate 11: Determinism (same seed = same results)
- Gate 13: Performance (162-game season in ≤ 5000ms)
- Plus 11 other statistical calibration gates

---

## THE WAVE SYSTEM

Development follows a **wave pattern**: 3 features per wave, committed together.

Each wave = **3 engine files** + **3 UI view files** + wiring into Shell.tsx

### Wave Workflow
1. Create 3 engine `.ts` files with typed interfaces + `generateDemo*()` data generators
2. Create 3 UI `.tsx` view components importing from those engines
3. Add NavTab types to `src/store/uiStore.ts`
4. Add imports to `src/components/layout/Shell.tsx`
5. Add nav items to appropriate NAV_GROUPS in Shell.tsx
6. Add switch cases to `renderContent()` in Shell.tsx
7. Run `npx vitest run` — must be 40/40
8. Commit all 8+ files together
9. Push to branch

### Wave Progress
- **Waves 1-82**: Completed in earlier sessions
- **Waves 83-85**: Commit `ca6180d`
- **Waves 86-88**: Commit `a54f601`
- **Waves 89-91**: Commit `dcf7777`
- **Waves 92-94**: Commit `8db4f8f`
- **Waves 95-97**: Commit `6cce37b`
- **Waves 98-100**: Commit `0fd909b` (MILESTONE!)

**Total: 100 waves = 300 feature systems**

---

## UI / AESTHETIC RULES

### Bloomberg Terminal Dark Theme
Every view MUST follow this aesthetic:
- **Background**: `#030712` (near-black) or `#111827` (dark gray cards)
- **Text**: `#e5e7eb` (light gray)
- **Accent**: `#f59e0b` (orange — headers, labels, highlights)
- **Success**: `#22c55e` (green)
- **Warning**: `#f59e0b` (orange/amber)
- **Danger**: `#ef4444` (red)
- **Info**: `#3b82f6` (blue)
- **Muted**: `#6b7280` or `#9ca3af`
- **Font**: `fontFamily: 'monospace'`
- **All inline styles** (no CSS modules, no styled-components)
- Dense, data-rich layouts — think trading terminal, not mobile app

### Navigation Architecture (Shell.tsx)
6 navigation groups in dropdown menus:
1. **GAME** — Dashboard, standings, schedule, play game, sim, etc.
2. **TEAM** — Roster, lineup, pitching staff, bullpen management
3. **MOVES** — Trade center, free agents, draft, waivers, offseason, contracts
4. **STATS** — Leaderboards, analytics, advanced stats, comparison tools
5. **ORG** — Finance, coaching, prospects, scouting, farm system, owner
6. **HISTORY** — Franchise, records, timeline, awards, milestones

### Adding New Views
1. Add NavTab type to `uiStore.ts` (line ~35, end of the union type)
2. Add import to `Shell.tsx` (around line 340-360, before the nav group definitions comment)
3. Add nav item `{ id: 'newtab', label: 'TAB LABEL' }` to appropriate NAV_GROUP
4. Add `case 'newtab': return <NewView />;` to renderContent() switch statement

### Naming Collision Handling
Many view names already exist from earlier waves. Before creating a file, **check with Glob first**:
```
Glob: src/components/**/*ViewName*.tsx
```
If it exists, rename yours (e.g., `WinProbChartView` instead of `WinProbabilityView`).

---

## KEY FILES TO READ BEFORE EVERY EDIT

### MUST READ before editing:
1. **`src/store/uiStore.ts`** — Contains the NavTab type union. Read to find the end of the type before adding new tabs.
2. **`src/components/layout/Shell.tsx`** — 1323 lines. Read relevant sections:
   - Lines ~340-360: Import section (add new imports here)
   - Lines ~370-720: NAV_GROUPS array (add nav items to groups)
   - Lines ~1090-1210: renderContent() switch statement (add cases here)

### Files you'll modify every wave:
- `src/store/uiStore.ts` (add NavTab types)
- `src/components/layout/Shell.tsx` (imports, nav items, switch cases)

---

## LANE SEPARATION (Claude vs Codex)

- **Claude (you)**: New feature modules, UI views, creative game systems
- **Codex**: Stability, integration, testing, bug fixes (on branch `codex/mrbaseballdynasty53` — may not be available on remote)

**DO NOT modify core engine sim files. DO NOT modify existing test files.**

---

## ENGINE FILE PATTERN

Every engine file follows this pattern:
```typescript
// ── Feature Name ────────────────────────────────────────────
// Description of what this feature does

export interface MainDataType {
  // typed fields
}

export interface SupportType {
  // typed fields
}

export function getColorHelper(value: number): string {
  // color utility for the UI
}

export function generateDemoFeatureName(): MainDataType {
  // Returns realistic demo data for the UI view
  // This is the data source until real sim integration
}
```

---

## UI VIEW PATTERN

Every UI view follows this pattern:
```tsx
import { generateDemoFeatureName, getColorHelper } from '../../engine/category/featureName';

const data = generateDemoFeatureName();

export default function FeatureNameView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>FEATURE NAME</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Subtitle description</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

---

## WHAT HAS BEEN BUILT (Feature Categories)

### Core Game Systems
- Full 162-game season simulation with deterministic PRNG
- Plate appearance resolution via Markov chain
- Stolen base model, defensive shifts, bullpen management
- Lineup optimization, platoon matchups, pinch hit logic
- Weather, umpire, park factor modifiers
- Clutch, momentum, team chemistry modifiers
- Pitcher fatigue, workload, rest systems
- 7-level minor league system
- Draft, free agency, trade engine
- Player aging, progression, retirement
- Owner patience, GM reputation, coaching staff

### Analytics & Stats (80+ systems)
- WAR breakdown, advanced defensive metrics, batting profiles
- Spray charts, exit velocity, park-adjusted stats
- Clutch performance indices, run expectancy
- Win probability, leverage indices, game scripts
- Pitcher arsenal analysis, spin rates, tunnel effectiveness
- Catcher framing, blocking, game calling
- Base running efficiency, stolen base models
- Season projections, playoff simulators
- Double play analysis, defensive shift optimization
- Home/away splits, platoon advantage tracking
- Streak analysis, power rankings, roster construction grading

### Pitching Systems (25+ systems)
- Pitch arsenal comparison, effectiveness tracking
- Bullpen arm health monitoring, reliever matchup engine
- Starter game plan builder, pitch sequence optimizer
- Pitch tip detection, fatigue prediction
- Pitch tunnel analysis, spin rate analysis
- Pitch grading, pitch movement profiles

### Scouting & Prospects (20+ systems)
- Farm system grading, prospect tool grader
- Minor league standings, development plans
- Prospect ETA, scouting reports, comparisons
- International signing tracker, draft boards
- Call-up readiness, prospect graduation impact

### Trade & Contracts (20+ systems)
- Trade value calculator, trade deadline simulator
- Contract negotiation engine, salary arbitration predictor
- Luxury tax calculator, option year analyzer
- Trade chip ranking, trade package builder
- Buyout analyzer, extension calculator

### Finance & Organization (15+ systems)
- Revenue forecasting, franchise value tracker
- Payroll planning, salary cap simulation
- Stadium upgrades, front office management
- GM reputation, owner personality, coaching tree
- Scout network, scout budget management

### Narrative & History (10+ systems)
- News feed, story arcs, career milestones
- Hall of Fame monitor, franchise records
- Ring of honor, manager legacy
- Transaction log, postseason history

---

## GIT & BRANCH INFO

- **Branch**: `claude/baseball-dynasty-game-suTnB`
- **Remote**: `origin` → `http://127.0.0.1:23492/git/KevinBigham/mr-baseball-dynasty`
- **GitHub**: `https://github.com/KevinBigham/mr-baseball-dynasty`
- **Latest commit**: `0fd909b` (Wave 100 Milestone)
- **Total commits**: 208
- **Always push with**: `git push -u origin claude/baseball-dynasty-game-suTnB`

---

## TESTING PROTOCOL

Before EVERY commit:
```bash
npx vitest run
```
Expected output: **40 tests, 4 test files, ALL PASSING**

If tests fail, DO NOT commit. Fix the issue first.

---

## WHAT COMES NEXT (Future Vision)

### Immediate (Waves 101+)
Continue adding feature systems. Here are categories that could use more depth:
- **Gameplay UI**: In-game play-by-play view, boxscore view, game recap
- **Draft Experience**: Mock draft, draft day war room
- **Offseason Flow**: Full offseason walkthrough with events
- **Multiplayer Foundations**: League creation, commissioner tools
- **Tutorial/Onboarding**: New manager experience, guided first season
- **Achievement System**: Unlockables, challenges, milestones

### Medium-term
- **Real sim integration**: Replace `generateDemo*()` functions with actual game data from `useGameStore`
- **Interactive features**: Make views respond to user actions (set lineups, make trades, etc.)
- **Save/Load**: Dexie integration for persistent save games
- **Performance**: Lazy-load views, code-split the massive Shell.tsx

### Long-term
- **Mobile-responsive UI**
- **Multiplayer online leagues**
- **Historical mode** (replay real MLB seasons)
- **Mod support** (custom leagues, rules, attributes)
- **Expansion/contraction** (create/remove teams)

### The Ultimate Goal
Kevin's vision: **THE GREATEST SPORTS VIDEO GAME OF ALL TIME.** Not just baseball — the greatest SPORTS game. Bloomberg-terminal-level depth. OOTP-level simulation fidelity. Football Manager-level immersion. And a game that is truly, genuinely FUN to play.

---

## IMPORTANT QUIRKS & GOTCHAS

1. **"File has not been read yet"**: You MUST `Read` a file before `Write` or `Edit` on it. After context compaction, you may need to re-read files you read earlier.

2. **Shell.tsx is massive** (1323 lines): Read specific line ranges, not the whole file. Key sections:
   - ~340-360: Imports
   - ~370-720: NAV_GROUPS
   - ~1090-1210: Switch cases

3. **NavTab union type grows every wave**: It's now ~350+ members. Always add to the END of the type.

4. **View naming collisions**: Many similar names exist. Always Glob before creating. If `FooView.tsx` exists, name yours `FooBarView.tsx` or similar.

5. **All UI uses inline styles**: Don't use CSS modules, styled-components, or Tailwind classes in view components. Tailwind is only used in Shell.tsx header/nav.

6. **Demo data pattern**: All views currently use `generateDemo*()` — this is intentional. Real data integration comes later.

7. **No engine sim modifications**: The Claude lane is UI/features only. Don't touch `src/engine/sim/`.

8. **Commit message format**: List all features added, include wave numbers, include the session URL.

---

## USER CONTEXT

Kevin Bigham is the creator and visionary. He is:
- Extremely enthusiastic and encouraging ("LFGLFGLFG!!!!")
- Often coaching (away from desk) and gives full autonomy
- Wants maximum output per session
- Appreciates "Namaste" energy
- Loves seeing feature counts and progress milestones
- Trusts AI agents to make creative decisions
- The branch MUST start with `claude/` and end with the session ID suffix

---

## CLOSING NOTES

This game has grown from a blank canvas to **794 source files** across **208 commits** with **300+ feature systems**. The core simulation engine is rock-solid (40/40 tests), the UI aesthetic is consistent and professional, and there is an incredible foundation for what will become a truly legendary game.

The next agent picking this up should:
1. Read this bible
2. Read `uiStore.ts` and scan `Shell.tsx` for current state
3. Continue the wave pattern (Wave 101+)
4. Always test before committing
5. Push to the same branch
6. Keep Kevin's dream alive

**Namaste. Build something beautiful.**

---
*Written with love by Claude Opus 4.6 — Wave 100 complete.*
