# Mr. Baseball Dynasty

**A sabermetrically credible baseball franchise simulator. Entirely in your browser.**

Manage one of 30 teams through 162-game seasons, 10-round amateur drafts, free agency bidding wars, trade deadline chaos, and October playoff runs. Track wOBA, wRC+, FIP, and WAR. Develop prospects through 7 minor league levels. Navigate owner patience, team morale, and arbitration hearings. Build a dynasty that earns its place in the Hall of Fame — no backend, no downloads, no excuses.

> **Play Now:** [mr-baseball-dynasty](https://kevinbigham.github.io/mr-baseball-dynasty/)

---

## What Is This?

Mr. Baseball Dynasty is a deep baseball management sim that takes the statistical rigor of OOTP and wraps it in a sleek, Bloomberg Terminal-inspired browser experience. Every plate appearance is resolved using the Log5 matchup formula. Player development follows stochastic differential equations with Ornstein-Uhlenbeck processes. Statistical distributions are gate-tested against real MLB data.

This is not a casual clicker. This is a franchise simulator for people who care about FIP vs xFIP and whether their Rule 5 pick can stick on the 26-man.

### Core Gameplay Loop

- **162-Game Seasons** — Simulate day-by-day, week-by-week, or month-by-month with interactive pacing
- **30 Teams** — AL/NL structure with 3 divisions each, wild card races, and full playoff brackets
- **3,700+ Players** — Procedurally generated across 7 farm levels (MLB through International)
- **10-Round Amateur Draft** — Fog-of-war scouting grades, AI auto-picks, draft strategy
- **Free Agency Market** — Salary projections, AI bidding, competitive market dynamics
- **Trade System** — AI-generated offers, user proposals, shop-a-player mechanics
- **Roster Management** — 26-man/40-man enforcement, options tracking, DFA/waivers, IL stints, promote/demote across all levels
- **Arbitration** — Salary arbitration for 3+ service year players with realistic escalation
- **Contract Extensions** — Offer/counter-offer negotiation mechanics
- **Rule 5 Draft** — Unprotected minor league player selection
- **International Signing Period** — Bonus pool bidding for young international talent

### Advanced Statistics

Full sabermetric implementation — not approximations:

- **Hitting:** AVG, OBP, SLG, OPS, wOBA, wRC+, OPS+, BABIP, WAR
- **Pitching:** ERA, FIP, xFIP, WHIP, K/9, BB/9, WAR
- **Career tracking** across multiple seasons with franchise record books
- **League leaderboards** with minimum PA/IP qualification filters
- **Award races:** MVP, Cy Young, Rookie of the Year, Gold Glove, Silver Slugger

### Narrative & Immersion

- **Owner Patience System** — Perform poorly and you get fired. Build a contender and earn runway.
- **Team Morale** — Affects performance. Winning streaks build momentum; losing streaks erode chemistry.
- **Dynamic News Feed** — Contextual stories about trades, injuries, free agent signings, milestones
- **Press Conferences** — Interactive Q&A with reporters after key moments
- **Rivalry System** — Track your biggest rivals with rivalry-specific events
- **Season Storyboard** — Narrative arcs that capture your season's journey
- **MFSN Pre-Season Predictions** — Expert predictions for your team before opening day
- **Pennant Race Tracker** — Magic numbers, elimination numbers, wild card positioning
- **Hall of Fame** — Voting simulation for retired players. Build a franchise worth remembering.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety (strict mode, zero errors) |
| Vite | 5.4.10 | Build system + HMR |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| Zustand | 5.0.1 | State management (3 stores) |
| Comlink | 4.4.1 | Web Worker RPC |
| Dexie | 3.2.7 | IndexedDB persistence |
| pure-rand | 6.1.0 | Seedable PRNG (determinism) |
| pako | 2.1.0 | Gzip save compression |
| recharts | 2.12.7 | Data visualization |
| Vitest | 2.1.4 | Testing (752+ tests) |

**Zero backend. Everything runs client-side.** State lives in a Web Worker. Saves compress to IndexedDB.

---

## Simulation Engine

The simulation engine is the heart of the project, running entirely in a Web Worker to keep the UI responsive.

**Plate Appearance Resolution** uses the **Log5 formula** (Bill James matchup math) incorporating batter vs pitcher attributes, park factors, platoon advantages, times-through-order penalty, and pitcher fatigue.

**Base-Running** uses a **Markov state machine** with the RE24 run expectancy matrix (24 base-out states) for realistic advancement logic.

**Player Development** follows **Stochastic Differential Equations** with an Ornstein-Uhlenbeck process across four career phases: prospect (high growth/volatility), ascent (moderate growth), prime (stability), and decline (negative drift).

**Statistical Calibration** — Gate tests validate simulation output against real MLB distributions:

```
League ERA:        3.80 – 4.50  (Real: 3.96–4.51)
League BA:         .245 – .265
Runs Per Game:     4.2 – 4.8
Players w/ 40 HR:  2 – 14      (Real: 3–10)
Players w/ 200 K:  15 – 35     (Real: 20–30)
Team Wins SD:      7 – 14      (Real: 12–15)
```

---

## By The Numbers

| Metric | Value |
|--------|-------|
| Lines of TypeScript/TSX | ~34,800 |
| Source files | 90+ |
| Test suites | 85 |
| Passing tests | 752+ |
| Lines of test code | ~9,200 |
| Teams | 30 |
| Generated players | ~3,700 |
| Farm levels | 7 |
| Games per season | 162 |
| Draft rounds | 10 |
| Development rounds completed | 18 |

---

## Architecture

```
BROWSER MAIN THREAD              WEB WORKER THREAD
───────────────────              ─────────────────
React Components          ──►   engine/worker.ts (Comlink API)
Zustand Stores (3)        ◄──┐
Dexie (IndexedDB)              ├► sim/plateAppearance.ts
                               ├► sim/gameSimulator.ts
                               ├► sim/seasonSimulator.ts
                               ├► sim/markov.ts
                               ├► player/generation.ts
                               ├► player/development.ts
                               ├► math/log5.ts
                               └► math/prng.ts
```

**Key invariant:** The UI never directly mutates game state. All mutations flow through the engine worker via Comlink RPC. The UI re-fetches what it needs after each action.

**Design aesthetic:** Bloomberg Terminal — dark backgrounds (#0a0a0f), orange accents (#f97316), monospace everything, ALL CAPS headers.

---

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # Zero-tolerance TypeScript check
npm run test         # All 752+ tests must pass
npm run build        # Production build → dist/
npm run verify       # typecheck + test in one shot (run before any push)
```

**Golden rule before any push:** `npm run verify` — both typecheck and tests must pass with zero errors.

---

## Deployment

**Live URL:** [https://kevinbigham.github.io/mr-baseball-dynasty/](https://kevinbigham.github.io/mr-baseball-dynasty/)

### How it works

1. Code is developed on a feature branch (e.g. `task/mbd-repo-stabilize`)
2. Once verified (typecheck + tests + build all green), the branch is merged to `main`
3. A push to `main` triggers `.github/workflows/deploy.yml` automatically
4. The workflow runs: `npm ci` → `npm run typecheck` → `npm test` → `npm run build` → publishes `dist/` to GitHub Pages
5. GitHub Pages serves the new bundle (usually live within ~2 minutes of push)

### Build → Pages path

```
src/ → npm run build → dist/ → actions/upload-pages-artifact → GitHub Pages
```

- **Build output dir:** `dist/` (gitignored locally; built fresh by CI on every deploy)
- **Vite base path:** `/mr-baseball-dynasty/` (matches the GitHub Pages repo sub-path)
- **Pages source:** GitHub Actions artifact (configured in repo Settings → Pages → Source)
- **Trigger:** push to `main` OR manual `workflow_dispatch` from the Actions tab

### If Pages is showing a stale bundle

1. Confirm the fix branch has been merged to `main` — the deploy only fires on `main` push
2. Check the [Actions tab](https://github.com/KevinBigham/mr-baseball-dynasty/actions) to see if the deploy workflow ran and succeeded
3. If the workflow hasn't run, trigger it manually via `workflow_dispatch` from the Actions tab
4. If the workflow failed, check the build logs — typecheck or test failures block deploy

### Manual trigger (no code change needed)

Go to **Actions → Deploy to GitHub Pages → Run workflow** and select `main`. This is useful when you want to re-deploy the current `main` state without making a code change.

---

## How This Was Built

This project is an experiment in **AI-collaborative game development**. The workflow:

- **ChatGPT 5.4** serves as the project architect — designing systems, planning features, and coordinating the build
- **Claude Code** owns UI/dashboard, narrative systems, offseason flows, roster management, and stats display
- **OpenAI Codex** owns the simulation engine, player systems, math layer, data files, and test coverage

Each AI has a dedicated ownership map to prevent merge conflicts. Handoff documentation ensures any collaborator (human or AI) can pick up where the last one left off. 18 rounds of iterative development and counting.

The humans vibe. The AIs build. The games ship.

---

## Status

**Fully playable.** TypeScript strict mode. 752+ tests passing. Active development with a deep feature backlog.

---

## License

This project is a personal passion project by Kevin Bigham. All rights reserved.
