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
- **Trade System** — AI-generated offers, counter-offers, deadline war room mode
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

### Audio & Game Feel

- **Procedural Soundscapes** — Context-sensitive ambient audio (crowd murmur during season, tension during draft, louder in playoffs). All synthesized via Web Audio API — zero audio files
- **UI Sound Effects** — Mechanical clicks, draft pick gavel, trade stamp, milestone chimes, save confirmation. Bloomberg terminal feel
- **Micro-Animations** — Stat tickers count up/down, progress bars animate, cards slide in, milestone moments pop with scale animation
- **The Decisive Click** — Major decisions (trades, draft picks, signings) get a 100ms pause + sound + visual confirmation flash
- **Settings Panel** — Volume slider, mute toggle, ambient toggle, reduce-motion accessibility toggle

### Celebration & Reward Systems

- **World Series Championship Sequence** — Multi-step cinematic: screen darkens, "CHAMPIONS" banner drops, CSS confetti (60 particles, 7 colors), MVP announcement, trophy case button
- **Milestone Banners** — Full-screen overlay for franchise milestones (playoff clinch, 100-win season, career records)
- **Season Moments Gallery** — Scrollable card gallery of top franchise moments, filterable by category (dynasty, breakout, heartbreak, record, upset, milestone)
- **Streak Indicators** — Win/loss streaks with intensity flames (W5 fire, W10 triple fire), player hot/cold badges

### Prospect Development

- **Prospect Dev Cards** — XP-style progress bars showing current vs ceiling for each tool (contact, power, eye, speed, fielding). Color-coded growth stages
- **Vision System** — 2-3 conflicting staff opinions on each prospect. Better staff = more accurate projections. Creates genuine uncertainty
- **Monthly Farm Reports** — Risers, fallers, promotion alerts, development stall warnings during the in-season monthly pulse
- **Development Programs** — 11 assignable programs (Power Focus, Contact Focus, Defensive Drills, etc.) that shape prospect growth trajectory
- **Player Traits** — 14 prospect badges (Late Bloomer, Toolsy, Glass Cannon, Ace Mentality, etc.) assigned by developmental profile

### Legacy & Long-Term Progression

- **Legacy Score** — Composite dynasty achievement metric (championships weighted most, sustained excellence counts). 6 tiers from UNPROVEN to LEGENDARY
- **GM Skill Tree** — 15 RPG-style skills across 5 categories (Scouting, Development, Negotiation, Analytics, Leadership). Unlocked by actions, not grinding
- **25 Achievements** — From "Ring Bearer" (first WS) to "Dynasty" (3 in 5 years) to "Moneyball" (90+ wins, bottom payroll). Progress tracking for in-progress achievements
- **Franchise History** — Season-by-season archive with career totals, award cabinet, playoff badges, key moments

### Narrative & Immersion

- **16 Narrative Event Templates** — Off-field drama: trade demands, clubhouse conflicts, mentor relationships, fan favorites nearing retirement, prospect hype, comeback stories. Each with 2-3 options with real tradeoffs
- **Owner Patience System** — Perform poorly and you get fired. Build a contender and earn runway
- **Team Morale & Chemistry** — Affects performance. Bounded chemistry system with cohesion and morale modifiers
- **Dynamic News Feed** — Contextual stories about trades, injuries, free agent signings, milestones
- **Transaction Ticker** — Bloomberg-style scrolling feed of league-wide transactions
- **Press Conferences** — Interactive Q&A with reporters after key moments
- **Rivalry System** — Track your biggest rivals with rivalry-specific events
- **Season Storyboard** — Narrative arcs that capture your season's journey
- **Seed Sharing** — Same seed = same universe. Challenge friends to beat your record with zero infrastructure

### Decision Spotlight

- **Monthly Pulse** — After each advance, 1-3 contextual decisions surface: injuries, 40-man crunch, trade deadline buyer/seller, September callups, cold streaks
- **Pacing Controls** — Monthly (~6 advances/season), Weekly (~26), or Fast Forward (auto to next event). All deterministic
- **Action Queue** — Priority-colored (red/yellow/blue) with attention pulse on critical items

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety (strict mode, zero errors) |
| Vite | 5.4.10 | Build system + HMR |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| Zustand | 5.0.1 | State management (4 stores) |
| Comlink | 4.4.1 | Web Worker RPC |
| Dexie | 3.2.7 | IndexedDB persistence |
| pure-rand | 6.1.0 | Seedable PRNG (determinism) |
| pako | 2.1.0 | Gzip save compression |
| recharts | 2.12.7 | Data visualization |
| react-router-dom | 7.13.1 | Client-side routing |
| Vitest | 2.1.4 | Testing (888 tests) |
| Web Audio API | native | Procedural audio (zero files) |

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
| Lines of TypeScript/TSX | ~37,000+ |
| Source files | 130+ |
| Test suites | 95 |
| Passing tests | 888 |
| Lines of test code | ~11,500 |
| Teams | 30 |
| Generated players | ~3,700 |
| Farm levels | 7 |
| Games per season | 162 |
| Draft rounds | 10 |
| Achievements | 25 |
| GM Skills | 15 |
| Narrative event templates | 16 |
| Dev programs | 11 |
| Prospect traits | 14 |
| Sound effects | 9 |
| Ambient modes | 5 |
| CSS animations | 9 |
| Custom fonts | 3 (Bebas Neue, Space Grotesk, JetBrains Mono) |

---

## Architecture

```
BROWSER MAIN THREAD              WEB WORKER THREAD
───────────────────              ─────────────────
React Components          ──►   engine/worker.ts (Comlink API)
Zustand Stores (4)        ◄──┐
Dexie (IndexedDB)              ├► sim/plateAppearance.ts
Web Audio API                  ├► sim/gameSimulator.ts
react-router-dom               ├► sim/seasonSimulator.ts
                               ├► sim/playoffSimulator.ts
                               ├► sim/markov.ts
                               ├► player/generation.ts
                               ├► player/development.ts
                               ├► math/log5.ts
                               └► math/prng.ts
```

**Key invariant:** The UI never directly mutates game state. All mutations flow through the engine worker via Comlink RPC. The UI re-fetches what it needs after each action.

**Design aesthetic:** Bloomberg Terminal — dark backgrounds (#060B14), orange accents (#f97316), Space Grotesk + Bebas Neue + JetBrains Mono typography, ALL CAPS headers.

---

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # Zero-tolerance TypeScript check
npm run test         # All 889 tests must pass
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

## The GOAT Game Development Plan

This codebase was built through a structured 10-round development plan:

| Round | Name | Theme | Key Features |
|-------|------|-------|-------------|
| 1 | Foundation Lock | Stability | wOBA/FIP/WAR, trade execution, URL routing |
| 2 | October Glory | Playoffs | Full postseason bracket, WS MVP, franchise history |
| 3 | The Pulse | Game Loop | Monthly pacing, Decision Spotlight, action queue |
| 4 | Sound & Fury | Audio | Procedural Web Audio, ambient soundscapes, micro-animations |
| 5 | Big Moments | Celebration | Championship sequence, confetti, milestone banners, streaks |
| 6 | The Farm | Prospects | XP dev cards, Vision System, farm reports, dev programs |
| 7 | War Room | Transactions | Deadline engine, transaction ticker, league trades |
| 8 | Legacy Engine | Progression | Legacy Score, GM Skill Tree, 25 achievements |
| 9 | The Wire | Narrative | 16 event templates, seed sharing, narrative drama |
| 10 | GOAT Polish | Launch | Tooltips, empty states, accessibility polish |

137 new tests added across all 10 rounds. Zero regressions. Zero determinism violations.

---

## How This Was Built

This project is an experiment in **AI-collaborative game development**. The workflow:

- **ChatGPT 5.4** serves as the project architect — designing systems, planning features, and coordinating the build
- **Claude Code Opus 4.6** owns UI/dashboard, narrative systems, offseason flows, roster management, stats display, and executed all 10 GOAT rounds
- **OpenAI Codex** owns the simulation engine, player systems, math layer, data files, and test coverage

Each AI has a dedicated ownership map to prevent merge conflicts. Handoff documentation ensures any collaborator (human or AI) can pick up where the last one left off.

The humans vibe. The AIs build. The games ship.

---

## Status

**Fully playable. Feature-complete through the 10-round GOAT Game Development Plan.** TypeScript strict mode. 888 tests passing. 127KB gzipped bundle. Active development continues — UI evolution with premium typography (Bebas Neue, Space Grotesk), refined panel system, and ambient polish.

---

## License

This project is a personal passion project by Kevin Bigham. All rights reserved.
