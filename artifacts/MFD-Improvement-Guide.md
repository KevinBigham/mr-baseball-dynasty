# MR. FOOTBALL DYNASTY — Improvement Guide
### Living Document | Last Updated: March 12, 2026 (Late PM)

---

## STATUS LEGEND
- ✅ SHIPPED — Live in game
- 🔨 IN PROGRESS — Currently building
- 📋 QUEUED — Next up
- 💡 IDEA — Future consideration

---

## PRIORITY QUEUE (Ranked by Player Impact)

| # | Feature | Status | Impact | Notes |
|---|---------|--------|--------|-------|
| 1 | Post-Game Recap Screen | ✅ SHIPPED | 🔴 Critical | Broadcast-quality MFSN post-game modal. Score, stat leaders, anchor quotes, trench battle analysis. Auto-triggers after every sim. |
| 2 | MFSN Weekly Show Upgrade | ✅ SHIPPED | 🔴 Critical | Weekly show now opens as a full-screen MFSN broadcast panel with anchor desk, expand/collapse segment cards, and interactive press conference choices. |
| 3 | Schedule Screen Visual Overhaul | ✅ SHIPPED | 🟡 High | Schedule tab now leads with a broadcast next-game preview, streak context, division snapshot, and cleaner W/L/upcoming/bye styling. |
| 4 | Dashboard Pre-Game Matchup Card | ✅ SHIPPED | 🟡 High | Home tab matchup card now includes MFSN pick/spread, win probability, rivalry heat, and key matchup comparisons. |
| 5 | Roster Screen Inline Expand | ✅ SHIPPED | 🔴 Critical | Roster rows now expand in place with ratings bars, season/career stat twins, contract summary, trait chips, and action buttons while the player name still opens the full modal. |
| 6 | Player Comparison Tool | ✅ SHIPPED | 🟡 High | Compare now arms from roster/detail and opens a side-by-side evaluation modal for ratings, contract, career, and trajectory decisions. |
| 7 | Championship Celebration Screen | ✅ SHIPPED | 🟡 High | User championships now trigger a full-screen gold celebration with confetti, trophy, Marcus Cole line, MVP, highlights, and offseason CTA. |
| 8 | Playoff Bracket Tree | ✅ SHIPPED | 🟡 High | Playoffs now render as a responsive SVG bracket with completed scores, MFSN spread lines, user-team glow, and conference seed panels. |
| 9 | Broadcast Emoji Strip (Phase 4) | 🔨 IN PROGRESS | 🟡 High | `addN()`, shared headline generators, weekly show headlines, news feed, drive log, inbox text, and awards rendering now sanitize visible strings. Remaining backlog is older non-broadcast/team-icon text outside those surfaces. |
| 10 | Cap Visualization Surface | 💡 | 🟢 Medium | `src/systems/cap-visualization.js` exists but never wired into monolith. |
| 11 | Win Probability v2 in Live Game | 💡 | 🟢 Medium | `src/systems/win-probability.js` — advanced model needs Live Game wiring. |
| 12 | Wire obMode to Dashboard | 💡 | 🟢 Medium | Novice players get simplified view with MFSN anchor guidance. |

---

## COMPLETED IMPROVEMENTS

### Session 3: UI Design Bible (March 12, 2026 - AM)
| Feature | Description |
|---------|-------------|
| ✅ Design System CSS | Inter font, custom properties, 14px radius, deep navy surfaces |
| ✅ Color Revolution | Gold → Teal/Cyan for interactive. Gold reserved for MFSN/trophies only |
| ✅ OVR Rating System | 5-tier PFF-inspired scale with color washes |
| ✅ Micro-Interactions | fadeIn, slideUp, slideIn, pulse, clockPulse, shimmer, tickerScroll animations |
| ✅ MFSN Onboarding Flow | 4-step broadcast cold open with Marcus Cole, Diana Chen, Big Trev |
| ✅ Live Game Viewer Styling | Teal possession highlights, cyan TD entries |

### Session 3: Gameplay + Icons (March 12, 2026 - PM)
| Feature | Description |
|---------|-------------|
| ✅ Story Choices Shape Rosters | Playoff Ready / One Star One Mess / Full Rebuild with real mechanical effects |
| ✅ Post-Game Stats Fixed | tape object now has passTD, rushYds, sacks, turnovers per team |
| ✅ Live Game Fast-Forward | 4 buttons: End of Drive / Quarter / Half / Game via advanceTo() engine |
| ✅ Prior Season Career Stats | Synthetic career histories for all non-rookies + Pro Bowl/All-Pro/Vet badges |
| ✅ SVG Icon System (45+ icons) | Custom inline SVGs: nav, traits, actions, players, data, alerts |
| ✅ Nav Bar SVG Icons | 5 pillars: home/team/office/acquire/league with stacked SVG + text |
| ✅ Player Card SVG Traits | devIco() + traitIco() replace all emoji renders in roster/depth/chemistry |
| ✅ Section Header Cleanup | 50+ headers stripped of emojis, clean text only |
| ✅ Button Label Cleanup | Shop, Trade Pick, Confirm, Sim All, etc. → clean text |
| ✅ Player Detail Modal SVG | Traits render as SVG, archetype emoji removed, section headers cleaned |
| ✅ Win Probability Sparkline | SVG polyline chart tracks full game arc in Live Game Viewer |
| ✅ Momentum Bar Cleanup | Fire/lightning emojis → clean text labels |
| ✅ Post-Game Recap Modal | MFSN broadcast-style full-screen recap after every sim with score, stat leaders, anchor quotes, trench battle, streak tracking |

### Session 4: Broadcast Surface Upgrade (March 12, 2026 - PM)
| Feature | Description |
|---------|-------------|
| ✅ MFSN Weekly Show Panel | Full-screen broadcast overlay with live banner, anchor desk portraits, expandable segment cards, and interactive press conference |
| ✅ Home/Inbox Broadcast Teasers | Weekly show now enters through compact "Go Live" teasers instead of a long flat render block |
| ✅ Dashboard Matchup Intel | Home pre-game card now shows MFSN pick/spread, win probability, rivalry heat, and key matchup boards |
| ✅ Schedule Broadcast Header | Schedule tab now highlights the next matchup, current streak, and division standings before the week-by-week list |
| 🔨 Emoji Strip Phase 4 | Broadcast labels are cleaner across the weekly show, press rooms, and game-day overlays, but the larger narrative-text cleanup pass is still queued |

### Session 5: Roster + Championship + Bracket Upgrade (March 12, 2026 - Late PM)
| Feature | Description | Source Range |
|---------|-------------|--------------|
| ✅ Inline Roster Expansion | Row tap now expands the roster card in place with top-5 ratings bars, current-season vs career stat columns, contract mini-summary, trait chips, and quick actions while the underlined player name still opens the legacy modal. | `game.js:32366-32430`, `game.js:51265-51560` |
| ✅ Player Comparison Tool | Compare can be armed from the roster or detail modal, then opens a side-by-side comparison view with dual rating bars, contract/career/trajectory sections, and a “better at” summary. | `game.js:12846-12874`, `game.js:51265-51403`, `game.js:60545-60581`, `game.js:61897-61900` |
| ✅ Championship Celebration Screen | Championship wins now trigger a full-screen trophy moment with gold confetti, team banner, Marcus Cole quote, championship MVP, season highlights, and a one-click offseason continuation flow. | `game.js:12875-12905`, `game.js:41255`, `game.js:44467`, `game.js:60504-60543` |
| ✅ Playoff Bracket Visualization | The old bracket cards are replaced with a responsive SVG tree showing completed scores, upcoming MFSN lines, user-team glow, and a centered championship trophy banner. Save-safe scope keeps the live `CONF_4X2` / `LEGACY_8` playoff formats intact. | `game.js:31243-31550` |
| 🔨 Broadcast Emoji Strip Phase 4 | Shared visible-string sanitization now runs through toasts, headline generators, weekly show top stories, news/ticker surfaces, inbox, drive log, and awards presentation. Remaining backlog is older non-broadcast text that still renders raw team icons or legacy emoji copy. | `game.js:10078-10080`, `game.js:12573-12575`, `game.js:12788-12798`, `game.js:14314-14317`, `game.js:17791-17794`, `game.js:29709-29718`, `game.js:33087-33100`, `game.js:49024-49795`, `game.js:55720-55734`, `game.js:64019-64105` |

---

## ICON SYSTEM STATUS

### ICO Library (45+ icons)
**Nav:** home, team, office, acquire, league
**Actions:** play, skip, check, x, swap, cart, cut, arrowUp, arrowDown
**Player/Game:** star, superstar, fire, shield, brain, heartbeat, football, trophy
**Data/UI:** tv, mic, chart, money, target, gear, alert, trending, users, bolt, clipboard, signal
**Traits:** loyal, coin, captain, toxic, snowflake, ambulance, horse, book, pepper, mask, megaphone, fist, crown, sprout, wave, injured

### Emoji Replacement Progress
| Zone | Status | Count |
|------|--------|-------|
| Nav bar + tab icons | ✅ Done | 9 → SVG |
| Player cards + roster rows | ✅ Done | ~45 render sites → SVG |
| Buttons + action labels | ✅ Done | ~50 → clean text |
| Section headers | ✅ Done | ~50 → clean text |
| Player detail modal | ✅ Done | ~15 → SVG |
| Momentum bar | ✅ Done | 3 → text |
| MFSN broadcast narrative | 🔨 In Progress | Core broadcast/news/inbox surfaces now sanitized; legacy team-icon text remains elsewhere |

---

## ARCHITECTURE NOTES

### Key File Locations
- **Source of Truth:** `MFD-CODEX-HANDOFF/game.js`
- **Mirror 1:** `MFD-CODEX-HANDOFF/FILE2--mr-football-dynasty--game.js`
- **Mirror 2:** `MFD-CODEX-HANDOFF/FILE3--public-legacy--game.js`
- **Design Bible:** `MFD-UI-DESIGN-BIBLE.md`
- **Handoff Bible:** `MFD-HANDOFF-BIBLE-v25.md`

### Design System Tokens
```
--bg-page: #0B1020    --accent: #0E7490      --success: #22C55E
--bg-card: #0F1930    --accent-bright: #22D3EE --warning: #F97316
--bg-elev: #142447    --accent-2: #F59E0B     --danger: #F43F5E
--text-head: #F8FAFC  --text-body: #E2E8F0    --text-sec: #A7B3C7
--border-subtle: #1C2A46  --border-strong: #5A7BB5
```

### Style Helpers (Lines ~43567-43590)
- `bS(color, textColor)` — button style
- `cS` — card style (14px radius, navy bg)
- `oS(ovr)` — OVR badge (5-tier PFF scale)
- `pS` — primary button (teal gradient)
- `thS` / `tdS` — table header/cell styles
- `traitIco(traitId, size)` — SVG trait icon
- `devIco(devTrait, size)` — SVG dev trait icon
- `ICO.xxx(size, color)` — general SVG icon library

### Buried Treasure (Dormant Systems)
1. Cap Visualization (`src/systems/cap-visualization.js`)
2. Playoff Bracket Tree (`src/systems/bracket-tree.js`)
3. Premium/Ko-fi (`src/systems/premium.js`)
4. Win Probability v2 (`src/systems/win-probability.js`)
5. Coach Media Persona — computed but never displayed
6. Defining Moments — tiny badges, no career highlight gallery

---

## GAMEPLAY SYSTEMS INVENTORY

### Core Loop
Title → Onboarding → Team Pick → Draft Mode → Game Guide → Play
Weekly: Practice Focus → Pre-Game Speech → Sim/Live Game → Halftime → Post-Game → Inbox → Repeat

### Screens
- **Home:** Dashboard, Inbox, Stories, Schedule, Calendar, News Feed
- **Team:** Roster, Depth Chart, Injuries, Training, Chemistry, Staff, Gameplan
- **Office:** Overview, Cap Lab, Trades, Transactions, Ledger, Owner, Facilities, GM Intel, War Room
- **Acquire:** Scouting, Pipeline, Free Agents, (Re-Sign), (Combine), (Draft)
- **League:** My Stats, League, My Players, All Players, Playoffs, Rankings, Awards, Leaderboard, Rivalries, HoF, Ring of Honor, Timeline, Drafts, Box Scores, Records, Archives, Settings

### Live Game Viewer Features
- Play-by-play with offensive/defensive play calling
- Watch Drive mode (AI plays, you pick coverage)
- Fast-forward: End of Drive / Quarter / Half / Game
- Win Probability bar + SVG sparkline chart
- Momentum indicator
- Drive log with TD/turnover coloring
- Scoreboard with quarter scores and timeouts
- Box score with stat leaders

---

*This document is updated every session. Start next session by referencing it for context.*
