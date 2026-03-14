# MFD MEGA ROADMAP — 10 FEATURES ACROSS 5 SPRINTS
## v97.2 through v97.6

---

## SPRINT SEQUENCING PHILOSOPHY

**Order by:** engagement impact → existing foundation → dependency chains

Features that make the game MORE FUN TO PLAY come first. Features that add DEPTH TO EXISTING SYSTEMS come next. Endgame/cosmetic features come last. Each sprint is sized for 1-2 Codex sessions.

---

## SPRINT 1 — v97.2: "THE GAME DAY UPDATE"
### 🤝 Enhanced Trade Packages + 📊 Interactive Drive Sim
**Why first:** Multi-player trades from AI + conditional picks fills a gap (user-side multi-player already works!). The drive sim transforms every "Sim Week" click into a mini-game.

**Feature A: Enhanced Trade Packages (Conditional Picks + AI Multi-Player Proposals)**
- ✅ ALREADY DONE: User-initiated multi-player + multi-pick trades (tMyP/tAiP/tMyPk/tAiPk arrays)
- NEW: Conditional picks ("becomes a 2nd if they make playoffs") — add `condition` field to pick objects
- NEW: Pick swaps ("swap 1st round picks") — new trade asset type
- NEW: AI proposes multi-player deals in inbox (currently 1-for-1 only, upgrade AI trade generation at line ~18024 to bundle 2-for-1 and player+pick combos)
- NEW: Trade summary panel showing "Package Value" breakdown (per-asset value bars)
- NEW: "Sweeten the deal" button that auto-adds your best complementary asset to reach fairness threshold
- **Foundation:** `proposeTrade()` already handles arrays, `getTradeValue()` exists, AI trade generation at line ~18024

**Feature B: Interactive Drive Sim (Live Game)**
- When you sim a game, option to "Watch Live" instead of instant result
- Drive-by-drive ticker: "1st & 10 at OPP 35 — 12-yard pass to WR Smith"
- Key moments pause for coaching decisions:
  - 4th down: Go for it / Punt / FG
  - 2-minute drill: Aggressive / Conservative
  - Challenge flag: Challenge / Accept
  - Timeout management: Use timeout / Let clock run
- Decisions affect drive outcome using existing sim engine probabilities
- Can "Fast Forward" to skip to next key moment or end of game
- Post-game: full drive log saved (already exists as text array)
- **Foundation:** `simGame()` already generates drive-by-drive logs, `driveLog` array exists, halftime FX hook exists

**Estimated Codex sessions:** 2 (drive sim is the big one; trade enhancements are a lighter lift since multi-player foundation exists)

---

## SPRINT 2 — v97.3: "THE MONEY UPDATE"
### 🏦 Cap Restructures & Dead Money + 🏷️ Franchise Tags & Holdouts
**Why second:** Financial strategy is the engine of multi-season dynasties. These two features make every contract feel consequential for 3+ years.

**Feature A: Cap Restructures & Dead Money (EXPANSION)**
- `restructureContract()` already exists at line 442 — expand it:
  - Restructure: convert up to 60% of base salary to signing bonus (spread over remaining years)
  - Backloading: push cap hit to future years (cheaper now, expensive later)
  - Extension + restructure combo
  - Dead money: if you cut a restructured player, remaining prorated bonus accelerates onto current year cap
  - "Cap Cliff" warning: UI indicator showing future-year cap projections
  - AI GMs use restructures too (contenders backload, rebuilders stay flexible)
- Cap Lab tab shows multi-year cap projection chart (Year 1/2/3 obligations)

**Feature B: Franchise Tags & Holdout Expansion**
- One franchise tag per team per year
- Tag salary = top-5 positional average (calculated from league data)
- Tagged player reactions: Happy (play + chemistry neutral), Unhappy (play but -5 chemistry, media drama), Holdout (miss weeks 1-N, condition drops)
- Reaction weighted by: player age, chemistry, trait (loyal = happy, cancer = holdout)
- Transition tag option: lower salary but player can negotiate with other teams (you get right of first refusal)
- Holdout expansion: existing holdout trait gets more drama — media questions, owner pressure, fanbase reaction
- **Foundation:** `restructureContract()` exists, holdout traits exist, `holdoutStages80` tracked in save

**Estimated Codex sessions:** 2

---

## SPRINT 3 — v97.4: "THE STAFF & PRESEASON UPDATE"
### 👔 Coaching Carousel + 🏫 Rookie Minicamp & Preseason Expansion
**Why third:** Fills the offseason and preseason dead zones with real decisions.

**Feature A: Coaching Carousel**
- End-of-season: fired coaches hit the market, teams with openings interview candidates
- Your coordinators can get poached for HC jobs (comp draft pick if they leave)
- You can poach other teams' assistants (costs scout points + relationship hit)
- Coach personality types affect scheme compatibility and player development
- "Hot seat" warning for your own staff based on unit performance
- Coordinator promotions: promote your position coach to OC/DC (cheaper, loyalty bonus, but less experienced)
- Annual "Coaching Carousel" news segment in MFSN
- **Foundation:** `COACHING_TREE_LOG`, `coachSkillTree81`, `staffPoachTargets81` all exist

**Feature B: Rookie Minicamp & Preseason Expansion**
- Currently: 3 preseason weeks with auto-sim and a report
- Expand to: interactive 3-game preseason with depth chart management
  - Game 1: Starters play 1st half (injury risk if you leave them in longer)
  - Game 2: Mixed — evaluate bubble players
  - Game 3: Backups and rookies only
- Minicamp phase before preseason: +2-5 OVR boost for rookies based on scheme fit
- Cut day: trim to 53-man roster, waiver wire for other teams' cuts
- UDFA surprise: 1-2 undrafted players emerge as legit contributors
- **Foundation:** Preseason phase exists, `simGame()` has `isPreseason` flag, roster cap enforced

**Estimated Codex sessions:** 2

---

## SPRINT 4 — v97.5: "THE MEDIA & DRAFT UPDATE"
### 📺 Weekly SportsCenter Show + 🎙️ Post-Draft Press Conference
**Why fourth:** These are "feel" features that make the league feel alive. Best added after core mechanics are deep.

**Feature A: Weekly SportsCenter / MFSN Broadcast Expansion**
- Current: broadcast recap focused on your team with power rankings
- Expand to: full league-wide "MFSN Weekly" segment
  - Top 5 headlines (upsets, blowouts, playoff implications, records broken)
  - "Game of the Week" highlight with key plays
  - Rivalry Watch: hottest rivalries heating up this week
  - Injury Report: league-wide star injuries
  - Trade Rumors: AI teams making moves (foreshadows deadline deals)
  - "Hot Take Corner": analyst debates (fun flavor text)
  - Playoff Race tracker: bubble teams, magic numbers, clinch scenarios
- 5-6 rotating segments so it doesn't feel repetitive
- **Foundation:** `buildBroadcastRecap()`, `pickGameOfTheWeek()`, `pickPlayersOfWeek()` all exist

**Feature B: Post-Draft Press Conference & Grades**
- After each draft round, MFSN grades your picks (A-F)
- Full class grade after draft completes
- Press conference: media asks about your strategy ("You took a QB when you have a franchise QB — explain?")
- Your responses affect: owner mood, media perception, fanbase trust
- League-wide draft grades for all 30 teams
- "Steal of the Draft" and "Biggest Reach" callouts
- Year-later "Re-Grade": at Week 8, MFSN re-evaluates last year's draft class based on actual performance
- **Foundation:** `mfsnDraftGrade80` exists in save, press conference system exists

**Estimated Codex sessions:** 2

---

## SPRINT 5 — v97.6: "THE LEGACY UPDATE"
### 🏟️ Relocation & Stadium Builder + 🧬 Dynasty Legacy Score
**Why last:** These are endgame features for players deep into multi-decade dynasties. They reward long-term play.

**Feature A: Relocation & Stadium Builder**
- Trigger: owner mood below 30 for 3+ consecutive seasons → relocation threat
- OR: voluntary relocation if you convince the owner (costs $50M+)
- City selection: 8-10 fictional cities with different market sizes, weather, and fanbase personality
- Stadium tiers: Budget (low capacity, cheap), Standard, Premium (high capacity, expensive, +attendance)
- Relocation effects:
  - Lose all existing rivalries (reset to 0)
  - New geographic division rivalries form
  - Fanbase drops to 30, rebuilds based on wins
  - New team name/icon (or keep existing)
  - 3-year "honeymoon" period where owner mood is boosted
- Stadium upgrades: independent of relocation (improve current stadium without moving)
- **Foundation:** `attendance`, `facilities.stad`, owner mood system all exist

**Feature B: Dynasty Legacy Score & Coaching Tree**
- Cumulative "Dynasty Score" calculated from:
  - Championships (50 pts each)
  - Division titles (15 pts)
  - Playoff appearances (8 pts)
  - Player development (rookies who become 85+ OVR: 5 pts each)
  - Draft hits (players who become All-Pro: 10 pts)
  - Hall of Famers developed (25 pts)
  - Financial health (net positive cash seasons: 3 pts)
  - Staff hired away as HCs (8 pts each — your coaching tree spreading)
  - Losing seasons (-5 pts)
- Legacy tiers: Rookie GM → Established → Elite → Legendary → GOAT
- Coaching Tree visual: see where your former assistants ended up, their records
- "Legacy Comparison": how you stack up vs AI dynasty GMs in the league
- Dynasty Timeline: visual journey of your franchise across all seasons
- Unlock cosmetic rewards at milestones (custom team colors, special draft effects, etc.)
- **Foundation:** `COACH_LEGACY_LOG`, `hallOfFame`, `RING_OF_HONOR_LOG`, `history` all exist with rich data

**Estimated Codex sessions:** 2

---

## FULL TIMELINE

| Sprint | Version | Name | Features | Sessions |
|--------|---------|------|----------|----------|
| 0 | v97.1 | QoL Patch | Scout pts, trade counter, pipeline, training, chemistry | 1 |
| 1 | v97.2 | Game Day | Enhanced trades (conditional picks, AI multi-player) + Interactive drive sim | 2 |
| 2 | v97.3 | Money Update | Cap restructures/dead money + Franchise tags/holdouts | 2 |
| 3 | v97.4 | Staff & Preseason | Coaching carousel + Minicamp/preseason expansion | 2 |
| 4 | v97.5 | Media & Draft | MFSN Weekly + Post-draft press conference | 2 |
| 5 | v97.6 | Legacy Update | Relocation/stadium + Dynasty legacy score | 2 |

**Total: ~11 Codex sessions across 5 sprints**

---

## DEPENDENCY MAP

```
v97.1 (QoL) ──→ v97.2 (Trades + Sim)
                    │
                    ├──→ v97.3 (Money) ──→ v97.4 (Staff + Preseason)
                    │                           │
                    └──→ v97.5 (Media) ─────────┘
                                                │
                                                └──→ v97.6 (Legacy)
```

- v97.2 can start immediately after v97.1
- v97.3 depends on v97.2 (multi-player trades need cap restructures to feel complete)
- v97.4 depends on v97.3 (coaching carousel affects cap/contracts)
- v97.5 can run parallel to v97.3/v97.4 (media is independent)
- v97.6 depends on everything (legacy scoring needs all systems contributing data)

---

## RISK NOTES

1. **File size:** At 35,721 lines, we're approaching limits for single-file React apps. Sprint 3+ may need to consider splitting into modules or at minimum aggressive comment cleanup.
2. **Save file bloat:** Each feature adds state. Keep save data lean — compress where possible, don't save UI-only state.
3. **AI GM complexity:** Multi-player trades + restructures + franchise tags = significantly more complex AI decision-making. Budget extra testing time for Sprint 2.
4. **Interactive sim performance:** Drive-by-drive rendering needs to be smooth. Use requestAnimationFrame or setTimeout chains, not synchronous loops.

---

*Mr. Football Dynasty — Mega Roadmap*
*10 Features • 5 Sprints • ~11 Codex Sessions*
*Game by Kevin Bigham*
