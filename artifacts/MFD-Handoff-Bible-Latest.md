# Mr. Football Dynasty — Handoff Bible for Claude Code

**Version:** v99 ("The Showtime Release")
**Date:** February 26, 2026
**Owner:** Kevin Bigham
**Primary File:** `mr-football-v99.jsx` (42,761 lines, 3.0 MB, single React JSX file)

---

## 1. PROJECT OVERVIEW

Mr. Football Dynasty (MFD) is a comprehensive browser-based NFL franchise management simulation built as a single self-contained React JSX artifact. It runs inside Claude.ai's artifact renderer with React + Tailwind available. No build system, no bundler, no external dependencies beyond what the artifact sandbox provides.

**The user (Kevin) is the game's sole designer, product owner, and QA tester.** He plays every build extensively and reports bugs with precise reproduction steps. He uses multiple AI collaborators:
- **Claude** = Lead engineer (code implementation, architecture, bug fixes)
- **ChatGPT** = Systems designer (game design docs, feature specs)
- **Gemini** = Balance architect (stat tuning, probability tables)

### Core Game Loop
1. **Franchise Management**: Draft players, sign free agents, manage salary cap ($225M), trade, cut, extend contracts
2. **Season Simulation**: 18-week NFL schedule, playoffs, Super Bowl
3. **Live Play-by-Play Games**: Madden-style play calling with full downs/distance/clock
4. **Dynasty Progression**: Player development, aging, retirement, coaching carousel, Hall of Fame

---

## 2. FILE STRUCTURE & ARCHITECTURE

### Single File Architecture
Everything lives in one `.jsx` file. This is intentional — it renders as a Claude.ai artifact. Do NOT split into multiple files unless Kevin explicitly requests a migration to a standalone app.

### Major Code Sections (approximate line ranges in v99)

```
Lines 1-100:        Imports, constants, theme object (T)
Lines 100-1400:     Trade negotiation system, AI trade logic
Lines 1400-2100:    Player ratings, attributes, position definitions
Lines 2100-4000:    Salary cap, contracts, restructures, dead money
Lines 4000-6000:    Season simulation (drive-level sim for non-played games)
Lines 6000-8500:    Draft system, scouting, combine, draft archive
Lines 8500-10000:   Free agency, coaching carousel, staff management
Lines 10000-12000:  Standings, playoffs, awards, records, Hall of Fame
Lines 12000-12900:  PLAYBOOK_986 — play definitions (offense + defense)
Lines 12900-14200:  LIVE_GAME_986 — play-by-play engine (state machine)
Lines 14200-16000:  God Mode, league editor, debug tools
Lines 16000-20000:  Legacy tab, franchise timeline, milestones
Lines 20000-42761:  React UI components (the entire render tree)
```

### Key Global Objects

| Object | Purpose | Location |
|--------|---------|----------|
| `PLAYBOOK_986` | Play definitions + `resolvePlay()` | ~line 12000 |
| `LIVE_GAME_986` | Game state machine (30+ methods) | ~line 12900 |
| `T` | Theme/color constants | ~line 50 |
| `TEAM_DATA` | All 32 NFL teams (names, cities, emojis, colors) | ~line 1500 |
| `POSITION_GROUPS` | Position categories and rating weights | ~line 1600 |

### State Management
Uses React `useState` exclusively. No Redux, no context, no external state. The main component has 50+ `useState` calls. Game state for live play-by-play is a single large object (`liveGame986` / `lg`).

---

## 3. PLAY-BY-PLAY ENGINE DEEP DIVE

### Game State Object (`lg`)
```javascript
{
  // Core
  hScore, aScore, quarter, clock, possession, // "home"/"away"
  fieldPos, // 0-100 (0 = own goal line, 100 = opponent's end zone)
  down, yardsToGo, phase, // "kickoff"|"play_call"|"pat"|"fourth_down"
  
  // Tracking
  boxScore: { home: {passAtt,passComp,passYds,...}, away: {...} },
  potgTracker: { home: [...], away: [...] },
  driveStart: { fieldPos, clock, plays },
  driveSummary: { plays, yards, time, result },
  log: [], // play-by-play text log
  injuries: [],
  
  // Features
  crowd: 3, // 1-5 scale
  isGWD: false,
  challenged: false,
  noHuddle: false, noHuddlePlay: null,
  preSnapRead: null,
  
  // Coin toss
  coinTossState, coinTossCall, coinTossResult,
  coinTossUserWon, aiCoinChoice, deferredTo2ndHalf,
  
  // Management
  timeouts: { home: 3, away: 3 },
  momentum: 0, // -10 to +10
  twoMinWarned: false,
  receivedFirst: null, // "home"/"away"
  totalPlays: 0, playNum: 0
}
```

### Play Resolution Pipeline (CRITICAL — ORDER MATTERS)
```
1.  Spike check (blocked on 4th down)
2.  Situational modifiers (home field +1.5, clutch, crowd, GWD)
3.  resolvePlay() → generates matchups, play outcome
4.  Penalty check (5% chance) → returns EARLY before stats
5.  Play count increment
6.  Next Gen Stats (completion prob, YOE)
7.  Injury roll (~1.8%)
8.  Crowd update
9.  Clock tick + OOB detection
10. 2-minute warning check
11. Box score tracking ← AFTER penalty check (prevents ghost stats)
12. Normal play resolution (gains, first downs, TDs)
13. Safety check (fieldPos <= 0)
14. Drive logging
15. Turnover on downs (down > 4)
16. Phase transition (fourth_down / play_call)
17. Pre-snap read generation
18. Quarter/half/OT check
```

**WHY THIS ORDER MATTERS:**
- Steps 4 before 11: If a play is penalized, stats must NOT be recorded (ghost stats bug)
- endDrive before possession flip: Drive yards calculated from `fieldPos - driveStart.fieldPos` — if you flip first, you get inverted yards
- Challenge restores from `_prevFP`, not re-derived position (double-flip bug)

### Offensive Plays (22 total)
| Category | Plays |
|----------|-------|
| RUN (6) | HB Dive, HB Stretch, Power Run, Draw Play, QB Sneak, HB Toss |
| SHORT PASS (5) | Slant, Screen Pass, Curl Route, Drag Route, TE Seam |
| DEEP PASS (4) | Go Route, Post Route, Corner Route, Play Action |
| SPECIAL (2) | Kneel Down, Spike Ball |
| TRICK (5) | Flea Flicker, Philly Special, HB Pass, Fake Punt (4th only), Fake FG (4th only) |

### Defensive Coverages (6)
Cover 2, Cover 3, Man Press, Cover 0 Blitz, QB Spy, Prevent

### Key Engine Methods
```javascript
LIVE_GAME_986.create(homeTeam, awayTeam, userId, weekNum)
LIVE_GAME_986.executePlay(g, offPlay, defPlay)  // Main play execution
LIVE_GAME_986.resolveKickoff(g, type)            // "normal" or "onside"
LIVE_GAME_986.resolvePunt(g)
LIVE_GAME_986.fourthDown(g, choice)              // "fg", "punt", "go"
LIVE_GAME_986.handlePAT(g, choice)               // "xp" or "two_pt"
LIVE_GAME_986.isUserPoss(g)                       // true if user has ball
LIVE_GAME_986.side(g)                             // "home"/"away" for possession
LIVE_GAME_986.offTeam(g) / .defTeam(g)           // team objects
LIVE_GAME_986.startDrive(g) / .endDrive(g, result)
LIVE_GAME_986.noHuddleQBPick(g)                  // AI play selection
LIVE_GAME_986.aiSmartOffPlay(g) / .aiSmartDefPlay(g)
```

---

## 4. KNOWN PATTERNS & PITFALLS

### Things That Have Caused Bugs Before
1. **endDrive/flip ordering** — Always endDrive BEFORE flipping possession. Multiple bugs traced to this.
2. **`_gameInjured` flag on roster objects** — Must be cleaned up after EVERY game (Confirm + Discard paths). Lives on actual roster player objects, not copies.
3. **JSON.parse(JSON.stringify(lg))** — Used for deep cloning game state. But `homeTeam` and `awayTeam` are object references that get lost — must be re-assigned: `newLg.homeTeam = lg.homeTeam; newLg.awayTeam = lg.awayTeam;`
4. **React render-time side effects** — Never put `Math.random()` in render functions. Store results in state. (AI coin toss bug)
5. **fieldPos semantics** — 0 = own goal line, 100 = opponent end zone. A 30-yard line display requires: `fieldPos <= 50 ? "Own " + fieldPos : "Opp " + (100-fieldPos)`.
6. **yardsToGo on sacks** — Sack yards are negative. `g.yardsToGo -= result.yards` correctly INCREASES distance on sacks.
7. **Spike on 4th down** — Must be blocked both in engine (early return) and UI (hidden from play list).

### UI Ownership Rule (v99 Fix)
**The user should ONLY see decision buttons for their own team.** Any phase (kickoff, PAT, 4th down) must check `LIVE_GAME_986.isUserPoss(lg)` and show either:
- User's team → Full decision buttons
- Opponent → Single "Continue" / "See Their Decision" button with AI auto-logic

### Styling Conventions
- Gold accent: `#d4a74b` or `T.gold`
- Background: Dark blue `#0a1628` via `T.bg`
- Cards: `rgba(255,255,255,0.03)` backgrounds
- Borders: `rgba(255,255,255,0.06)` via `T.border`
- Success: `T.green` (#22c55e), Error: `T.red` (#ef4444)
- All buttons: `borderRadius: 8-12px`, gradient backgrounds for primary actions

---

## 5. SALARY CAP & FINANCIAL SYSTEM

The financial system is one of the most complex subsystems:

- **Salary cap**: $225M (scales with league year)
- **Contract types**: Standard, Rookie, Franchise Tag, Veteran Minimum
- **Restructure**: Convert base salary to signing bonus (spreads over remaining years)
- **Dead money**: Accelerated cap charges from cuts/trades
- **Cap penalties**: Teams over cap face restrictions
- **Free agency**: Market-driven with OVR-based pricing
- **Draft pick compensation**: Based on round/pick number

---

## 6. TESTING CHECKLIST

When making changes, verify these scenarios:

### Play-by-Play Engine
- [ ] Play a full game start to finish (all 4 quarters)
- [ ] Verify opponent kickoff shows "RECEIVE KICK" (not "KICK IT DEEP")
- [ ] Verify opponent TD shows "OPPONENT TOUCHDOWN" (not user PAT options)
- [ ] Verify opponent 4th down shows "SEE THEIR DECISION"
- [ ] Get a sack — verify yardsToGo increases correctly
- [ ] Force a turnover — verify drive summary shows correct yards
- [ ] Get a penalty — verify stats are NOT tracked for that play
- [ ] Injure a player — confirm game, then verify `_gameInjured` is cleared
- [ ] Try to spike on 4th down — verify it's hidden/blocked
- [ ] Win coin toss, defer — verify correct team receives in each half
- [ ] Test OT — verify noHuddle resets, timeouts reset to 2

### Franchise Mode
- [ ] Draft a player, verify they appear on roster
- [ ] Sign a free agent, verify cap impact
- [ ] Trade a player, verify both rosters update
- [ ] Restructure a contract, verify cap savings
- [ ] Sim a season, verify standings and playoff seeding
- [ ] Check draft archive after multiple seasons

---

## 7. COMMON TASKS

### Adding a New Play
1. Add to `PLAYBOOK_986.offense[category]` array with: `{id, label, icon, desc, type, ydsBase, incPct, intPct, sackPct, bigPlay, commentary}`
2. Add resolution logic in `PLAYBOOK_986.resolvePlay()` if special handling needed
3. Add to `noHuddleQBPick()` if the QB should consider it
4. Add play diagram in `getPlayDiagram()`

### Adding a New Defensive Coverage
1. Add to `PLAYBOOK_986.defense` array
2. Add modifier logic in `resolvePlay()` defensive adjustment section
3. Update `aiSmartDefPlay()` to consider it situationally

### Adding a New Game Phase
1. Add phase string to phase transition logic in `executePlay()`
2. Add UI panel in the render section (check `lg.phase === "new_phase"`)
3. **CRITICAL**: Check `isUserPoss` and show different UI for user vs opponent

### Fixing a Bug
1. Identify the bug with precise reproduction steps
2. Find the relevant code section (use the line range guide above)
3. Make the fix
4. Validate bracket balance: `{` count must equal `}` count (same for `()` and `[]`)
5. Test the specific scenario AND related scenarios

---

## 8. VERSION HISTORY SUMMARY

| Version | Key Changes |
|---------|-------------|
| v1-v50 | Foundation: roster management, draft, FA, schedule |
| v50-v90 | Salary cap, trades, coaching, awards, records |
| v90-v97 | Rivalry system, God Mode, UI polish |
| v98 | 3 baseline bug fixes |
| v98.1 | Stat rebalance (2018 NFL data) |
| v98.2-v98.4 | God Mode league-wide expansion |
| v98.5 | Draft archive |
| v98.6 | Play-by-play engine (from scratch), 30 features |
| **v99** | **Coin toss, no-huddle, matchups, opponent AI, 16 bug fixes** |

---

## 9. KEVIN'S PREFERENCES & COMMUNICATION STYLE

- **Energy**: When Kevin says "LFG" — match his intensity, move fast, ship features
- **Format**: Prefers structured outputs, checklists, copy/paste ready
- **Bugs**: Reports with exact reproduction steps; expects precise fixes
- **Features**: Thinks in "tiers" and "mega-packs" — batches of related features
- **Quality bar**: Every button, every label, every edge case matters
- **Audience**: He's the sole user — no need for i18n, accessibility, or multi-user concerns
- **File delivery**: Always ship as a single `.jsx` file that renders in Claude.ai artifacts
- **Naming**: Uses "v98.6", "v99" etc. — always ask which version to increment to
- **AI roles**: Respects the multi-AI workflow — don't step on ChatGPT/Gemini territory unless asked

---

## 10. CRITICAL RULES

1. **Never split the file** — it must remain a single `.jsx` artifact
2. **Always validate brackets** after any edit — `{`, `(`, `[` counts must match their closers
3. **Never put Math.random() in render** — store in state
4. **endDrive before flip** — always, everywhere, no exceptions
5. **Clean up _gameInjured** — on every game exit path
6. **Check isUserPoss** — on every decision point UI
7. **Penalty before stats** — in the execution pipeline
8. **Test after every change** — Kevin will find any bug you miss
9. **Preserve the theme** — dark blue + gold, cinematic broadcast feel
10. **Ship fast, ship clean** — Kevin wants velocity AND quality

---

*This document was prepared by Claude (lead engineer) for handoff to Claude Code or any future AI collaborator. Last updated: February 26, 2026.*
