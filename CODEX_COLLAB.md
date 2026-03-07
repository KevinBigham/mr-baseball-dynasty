# Hey Codex! Welcome to Mr. Baseball Dynasty

> **From**: Claude (Opus 4.6) on branch `claude/baseball-dynasty-sim-UjlF2`
> **To**: Codex (our new collaborator)
> **Date**: 2026-03-07
> **Mission**: Get a fully working, playable copy of Mr. Baseball Dynasty running and polished. LFG!

---

## What Is This?

**Mr. Baseball Dynasty** is a browser-based baseball franchise management simulator — think Football Manager meets OOTP Baseball, running entirely client-side with zero backend. The player manages one of 30 fictional teams through multiple seasons: drafting prospects, signing free agents, making trades, managing rosters across 7 minor league levels, and competing for championships.

The sim engine uses **Log5 matchup math**, **Markov base-running chains**, and a **physics-inspired plate appearance engine** validated against real MLB stat distributions. It's ambitious, it's deep, and it's mostly built — we need to get it across the finish line.

---

## Current State of the Project

### What's Working (Our Branch: `claude/baseball-dynasty-sim-UjlF2`)
- **150 source files** (~34,800 lines TypeScript/TSX)
- **478 passing tests** across 56 test files — ALL GREEN
- **TypeScript compiles clean** — zero errors
- **Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Web Worker (Comlink)
- **Persistence**: IndexedDB via Dexie with gzip-compressed saves
- **Deployment**: GitHub Pages via Actions

### Complete Feature List (Already Built)
| Category | Features |
|----------|----------|
| **Core Gameplay** | 30 teams, ~3,700 generated players, 162-game seasons, month-by-month sim, granular sim controls (1 day/week/month), full playoff bracket (WC -> DS -> CS -> WS) |
| **Roster Mgmt** | 26/40-man rosters, promote/demote across 7 levels, DFA, IL stints, option tracking, lineup editor, rotation editor, depth chart, prospect pipeline |
| **Transactions** | Free agency, trades, 10-round amateur draft, Rule 5 draft, international signing, contract extensions, waivers, arbitration |
| **Stats** | Traditional + advanced (wOBA, wRC+, FIP, xFIP, WAR, OPS+, BABIP), leaderboards, career tracking, franchise records, Hall of Fame, awards (MVP, Cy Young, ROY, Gold Glove, Silver Slugger) |
| **Narrative** | Owner patience, team morale, news feed, press conferences, rivalry system, storyboard arcs, weekly cards, moments gallery, MFSN predictions, reputation, staff poaching, breakout watch, pennant race, All-Star break, trade deadline |
| **Infrastructure** | Auto-save, multi-tab lock, error boundaries, crash recovery, tutorial system, PWA manifest, WCAG a11y, mobile-responsive, toast/confirm systems |

### Architecture (The Important Stuff)
```
BROWSER (Main Thread)              WEB WORKER
=========================          =========================
React Components                   src/engine/worker.ts (nerve center)
  |-- Comlink proxy calls -->        |-- sim/plateAppearance.ts
  |<-- Promise responses --          |-- sim/seasonSimulator.ts
                                     |-- sim/markov.ts
Zustand Stores (3):                  |-- player/generation.ts
  gameStore (phase, season)          |-- player/development.ts
  leagueStore (standings)            |-- trading.ts, freeAgency.ts
  uiStore (tabs, modals)            |-- draft/, injuries, finances...

Dexie (IndexedDB)
  db/schema.ts (save/load)
  db/cache.ts, db/streaming.ts
```

**Key Invariant**: The UI NEVER directly mutates game state. All mutations go through `engine.someMethod()` in the worker. UI re-fetches after mutations.

---

## The Other Branch: What Happened There

There's another branch (`claude/baseball-dynasty-game-suTnB`) with **209 commits** and **100 "waves"** of feature additions. It diverged from main and added ~125,000 lines across 926 changed files — mostly analytical overlay features (pitch tunneling, spray charts, clutch indices, etc.). It has NOT been merged to main. Our branch (`claude/baseball-dynasty-sim-UjlF2`) IS the canonical merged-to-main branch with the stable, tested codebase.

---

## What Needs Doing (Priority Order)

### HIGH PRIORITY — Engine Work
1. **Player Personality & Chemistry** — Hidden `workEthic`/`mentalToughness` attrs exist but don't affect gameplay. Wire them up so clubhouse dynamics impact performance.
2. **Coaching Staff Active Effects** — Staff is selectable but effects are zero. Wire `FOTraitId` to actual bonuses (hitter dev +5-15%, pitcher dev boost, scouting fog reduction, medical injury reduction).
3. **Improved Trade AI** — Current AI generates somewhat random offers. Need position-need targeting, surplus identification, prospect valuation, package deals (2-for-1, 3-for-2).
4. **Minor League Rehab Assignments** — MLB players recovering from injury should optionally do rehab stints.
5. **Compensatory Draft Picks** — Teams losing big FAs should get comp picks.

### MEDIUM PRIORITY — Shared Work
6. **Historical Season Browser** — View past seasons' standings, stats, awards.
7. **Manager/Coach Hiring UI** — Hire/fire staff between seasons.
8. **Expanded Narrative Events** — Trade rumors, press reactions, milestone celebrations.
9. **Season Awards Ceremony** — End-of-season ceremony screen.
10. **Expanded Playoff Experience** — Game-by-game playoff sim with box scores.

### POLISH
11. Dark/rebuild themes, sim speed controls, mobile refinements, sound effects, i18n.

---

## How to Run

```bash
# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# THE GOLDEN RULE — run before ANY push:
npm run typecheck && npm run test
# Both must pass with ZERO errors. No exceptions.

# Build for production
npm run build
```

---

## Critical Code Patterns to Know

1. **Engine calls**: `const engine = getEngine(); const data = await engine.someMethod();`
2. **PRNG**: All randomness uses `pure-rand` seeded PRNG. Never use `Math.random()`.
3. **Maps rebuild**: After mutating `_state.players` or `_state.teams`, always call `rebuildMaps()`.
4. **Scrub lineup**: After roster changes, call `_scrubLineupRotation()`.
5. **Save format**: State is JSON-serialized, gzip-compressed, stored in IndexedDB via Dexie.
6. **Worker API**: All public methods in `worker.ts` are exposed via Comlink. Adding a new engine method = add it to worker.ts + expose in the Comlink API object at the bottom of the file.

---

## Key Files to Know

| File | What It Does |
|------|-------------|
| `src/engine/worker.ts` | The engine nerve center (~2,547 lines). ALL game state lives here. |
| `src/engine/sim/plateAppearance.ts` | Core PA simulation — Log5, BABIP, HR physics |
| `src/engine/sim/seasonSimulator.ts` | Season simulation orchestrator |
| `src/engine/sim/markov.ts` | Base-running state machine |
| `src/engine/player/generation.ts` | Procedural player generation |
| `src/engine/player/development.ts` | Player aging, progression, regression |
| `src/engine/trading.ts` | Trade logic and AI trade generation |
| `src/engine/freeAgency.ts` | Free agent market simulation |
| `src/store/gameStore.ts` | Main UI state (Zustand) |
| `src/store/leagueStore.ts` | Standings, news, league-wide state |
| `src/App.tsx` | Root component, routing, phase-based rendering |
| `src/types/index.ts` | Complete type definitions |
| `tests/validation/gates.test.ts` | 13 statistical validation gates |

---

## Collaboration Plan

Here's how I suggest we work together:

1. **You take ownership of a feature area** — pick from the priority list above.
2. **I'll work on a complementary area** — we split and conquer.
3. **We both follow the golden rule** — `typecheck && test` must pass before any push.
4. **Branch strategy**: We're both working through `claude/baseball-dynasty-sim-UjlF2` which merges to `main`.
5. **Communication**: Update this doc or CODEX_HANDOFF.md when making significant architectural changes.

---

## Detailed Docs Available

- **`CODEX_HANDOFF.md`** — The full 1,200-line bible with every type definition, every worker API method, every component, every test file documented.
- **`HANDOFF_BIBLE.md`** — Additional architecture and handoff context.

Read those before diving deep into any area. They'll save you hours.

---

## The Vision

> *"The greatest sports dynasty simulator game of all-time. Something that rivals commercial products but runs free in a browser."*

We're closer than you think. The engine is solid, the UI is comprehensive, the tests are green. What we need now is **polish, gameplay depth, and bug hunting** to make it truly playable and addictive.

Let's build something legendary. LFG!

— Claude (Opus 4.6)
