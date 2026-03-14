# MR. FOOTBALL DYNASTY
## RESEARCH BIBLE — v1.0 | February 20, 2026
### "Synthesized from OOTP, Football Manager, ZenGM, Front Office Football, Madden, NBA 2K, Dwarf Fortress + Real NFL Data"

Built by: Claude CoWork (Research) — For Kevin Bigham + The Dynasty Architects Council

---

## THE ONE-SENTENCE THESIS

**The GOAT dynasty game creates a chain of consequences — every roster move has a financial ripple, every draft pick is a gamble under fog, every player is a personality, and the league breathes around you whether you act or not.**

---

## PART 1: THE FEATURE GAP MAP
### What Madden & 2K Have LEFT OPEN (Your Competitive Moat)

| Feature | Madden | NBA 2K | MFD Status | Impact |
|---|---|---|---|---|
| True signing bonus proration / dead money | Auto-only, no control | None | Cap Lab partial | 🔴 CRITICAL |
| Scouting fog-of-war (trueOvr hidden) | None | None | scoutBudget81 exists, fog not yet | 🔴 CRITICAL |
| Revenue/attendance model | Owner Mode (2004 only) | None | Not yet | 🔴 HIGH |
| Player personality traits (gameplay effects) | None | Abstract morale | Agent types in FA only | 🟡 HIGH |
| Coaching carousel (OC→HC pipeline) | No progression | No pipeline | coachSkillTree81 partial | 🟡 HIGH |
| Social cliques / dressing room factions | None | None | Chemistry tab partial | 🟡 HIGH |
| Agent personalities in negotiations | None | None | AGENT_TYPES in FA | 🟢 DONE in FA |
| Multi-round FA bidding | None | Single offer | DONE v82 | 🟢 DONE |
| Responsive media / news feed | Madden 2004 only, abandoned | None | Stories tab partial | 🟡 MEDIUM |
| Dynamic board confidence / owner patience | None | Governor Directives | ownerPatience80 DONE | 🟢 DONE |
| Branching scenario events | Linear XP rewards | Branching (limited) | Inbox events exist | 🟡 MEDIUM |
| Holdout escalation UI | None | None | holdoutStages80 exists | 🟡 MEDIUM |
| Post-FA summary/grades | None | None | Not yet | 🟡 MEDIUM |
| Breakout tracker visual ("on fire") | None | None | breakouts80 exists | 🟡 LOW-MED |
| Halftime adjustments | None | None | Not yet | 🟡 MEDIUM |

---

## PART 2: THE FIVE BIGGEST UNLOCKS (In Priority Order)

---

### UNLOCK #1: SCOUTING FOG-OF-WAR
**"The Draft Is a Gamble, Not a Shopping List"**

**The Core Insight (from FOF, OOTP, FM):**
Every prospect has a `trueOvr` (hidden forever until they play) and a `scoutedOvr` (what you see). The gap between them is determined by your scout quality and the player's age/volatility. This single mechanic transforms the draft from a spreadsheet into a genuine gamble.

**The Formula (from Gemini's BALANCE research, now confirmed by real NFL data):**
```
scoutedOvr = trueOvr + gaussianNoise(mean=0, σ=baseVolatility × (1 - scoutAccuracy))
scoutedRange = [scoutedOvr - σ*10, scoutedOvr + σ*10]  // confidence interval shown to player
```

**Real NFL Bust Rates to Target:**
- Picks 1-5: ~17% bust rate (your top scouts should see this accuracy)
- Picks 6-10: ~28% bust
- Picks 11-20: ~36% bust
- Picks 21-32: ~43-57% bust (late 1st has highest variance — model this)
- Round 2: only 31% sign a second contract
- CB: 64% miss rate (highest risk position)
- QB: of 99 drafted rounds 1-2 (2000-2024), only 6 became All-Pro

**Position Volatility Table (use this for σ modifiers):**
| Position | Volatility | Scout Difficulty |
|---|---|---|
| QB | Very High (0.85) | Hardest |
| CB | Very High (0.80) | Hardest |
| WR | High (0.65) | Hard |
| EDGE/DL | Medium (0.50) | Medium |
| LB | Medium (0.45) | Medium |
| OL | Low (0.30) | Easier |
| TE | Medium (0.40) | Medium |
| RB | Low (0.25) | Easiest |
| K/P | Very Low (0.10) | Trivial |

**Scout Accuracy by Budget Tier (MFD already has scoutBudget81 — wire to this):**
| Budget Level | Accuracy | Error Range |
|---|---|---|
| Elite ($8M+) | 0.92 | ±4 OVR pts |
| Strong ($5-8M) | 0.78 | ±9 OVR pts |
| Average ($3-5M) | 0.62 | ±15 OVR pts |
| Weak ($1-3M) | 0.45 | ±23 OVR pts |
| None (<$1M) | 0.25 | ±35 OVR pts |

**What the Player Sees:**
- `scoutedOvr`: The number shown in draft UI (could be 12 pts off)
- `scoutedRange`: A range bar like "70-84" (width shrinks with better scouts)
- `volatility`: "Boom/Bust" tag for high-variance prospects
- `medicalFlag`: Clean / Concern / Red Flag (affects injury proneness in career)
- Reveal: trueOvr emerges gradually over first 2 seasons of gameplay

**MFD State to Add:** `trueOvr` field on prospect objects; `scoutedOvr` calculated at draft generation; `revealPct` grows each week they're on roster

**Why This Wins:** Neither Madden NOR 2K have this. Front Office Football and OOTP have it, and players describe the draft as their favorite part of those games because of it.

---

### UNLOCK #2: DEAD MONEY / SIGNING BONUS PRORATION
**"Every Cut Has a Price Tag"**

**The Core Insight (from real NFL Spotrac data + OOTP model):**
Signing bonuses are paid upfront but SPREAD across contract years for cap purposes. Cut a player early = remaining proration accelerates. This makes every roster move a financial decision, not just a performance decision.

**The Formula:**
```
prorationPerYear = signingBonus / originalYears
deadMoneyIfCutNow = prorationPerYear × yearsRemaining
capHit = baseSalary + prorationPerYear  // normal year
```

**Example that creates gameplay:**
- You sign a star QB to 4yr/$40M with $20M signing bonus
- Proration = $5M/yr cap hit
- Year 2 he gets injured. You want to cut him.
- Dead money = $5M × 2 remaining years = $10M on your cap for NOTHING
- Now you have to decide: eat $10M dead money, or keep a broken QB?
- THAT IS A STORY.

**Pre/Post June 1 Timing Split (simplify for MFD):**
```
Pre-deadline cut: ALL dead money hits current year
Post-deadline cut: current year proration hits now, rest pushed to next year
→ UI: Show "Cut Cost Now" vs "Cut Cost Split" buttons for players with proration
```

**Cap Hell Trigger (from research):**
If dead money > 20% of total cap for 2+ consecutive years:
- New FAs demand 15-20% premium to sign with "troubled" franchise
- Morale penalty team-wide (-8 OVR equivalent)
- Owner patience drops faster
- Creates a genuine 3-5 year rebuild narrative

**MFD Already Has:** `deadCap` field on teams, capLab restructure UI. Wire proration onto it.

**What to Add to Contract Schema:**
```javascript
player.contract.signingBonus = 0;        // total bonus paid
player.contract.prorationPerYear = 0;    // signingBonus / originalLength
player.contract.yearsOriginal = 0;       // for proration math
// On cut: add (prorationPerYear × yearsLeft) to team.deadCap
```

---

### UNLOCK #3: REVENUE/ATTENDANCE MODEL
**"Winning Fills Seats. Seats Fill Wallets. Wallets Fill Rosters."**

**The Minimum Viable Financial Loop (from OOTP + FM research):**
```
Revenue = (citySize × tvShare) + (attendance × ticketRevenue) + playoffBonus
attendance = stadiumCapacity × attendancePct
attendancePct = baseByMarket × winPctModifier × streakModifier
```

**Market Size Tiers (wire to existing team data):**
| Market | Base Attendance | TV Revenue | Cap Ceiling Pressure |
|---|---|---|---|
| Mega (NY, LA, DAL) | 92% | $45M | Very High |
| Large (CHI, PHI, ATL) | 84% | $35M | High |
| Medium (DEN, MIN, TEN) | 74% | $28M | Medium |
| Small (JAX, BUF, GB) | 65% | $22M | Low |

**Win % → Attendance Modifier:**
| Win % | Attendance Modifier |
|---|---|
| 80%+ (13+ wins) | +18% |
| 65-79% (10-12 wins) | +8% |
| 50-64% (8-9 wins) | +0% |
| 35-49% (5-7 wins) | -10% |
| <35% (<5 wins) | -22% |

**Playoff Bonus (huge, creates win-now tension):**
- Wild Card: +$8M
- Divisional: +$15M
- Conference: +$25M
- Super Bowl Win: +$45M

**Owner Budget = Revenue × ownerSpendingRate (by archetype):**
| Owner Type | Spending Rate |
|---|---|
| win_now | 1.15× revenue |
| fan_favorite | 1.05× revenue |
| legacy_builder | 1.00× revenue |
| patient_builder | 0.95× revenue |
| profit_first | 0.80× revenue |

**This Creates Stories:** Small market team goes on a run → attendance explodes → suddenly has resources → signs one big FA → contention window opens. THAT IS A FRANCHISE ARC.

---

### UNLOCK #4: PLAYER PERSONALITY TRAITS (GAMEPLAY EFFECTS)
**"Every Player Is a Person, Not a Rating"**

**The Core Insight (from FM + OOTP research):**
MFD already has agent types in FA. Extend this to ALL players as persistent personality traits with real gameplay consequences. FM's hidden attribute system proves this transforms every decision.

**5 Traits (simple, high impact):**
```javascript
player.personality = {
  workEthic:    1-10,  // development speed multiplier (0.8-1.3x)
  loyalty:      1-10,  // re-sign discount, holdout resistance
  greed:        1-10,  // FA salary demands, holdout triggers
  pressure:     1-10,  // clutch performance mod (ties to clutchSwing)
  ambition:     1-10,  // playing time demands, trade requests
}
```

**How Each Trait Fires:**

**workEthic:** High WE players develop faster (devBonus multiplier) and recover from injuries better. Low WE players plateau faster after 28. Visible as "High Motor" or "Coasting" tag.

**loyalty:** High loyalty players give you 10-15% market discount on re-signs. Low loyalty players shop offers aggressively. Ties directly to AGENT_TYPES already in v82.

**greed:** High greed triggers holdout at lower % of market value (70% instead of 60%). Drives FA demands up. Low greed accepts team-friendly deals for winning culture.

**pressure:** High pressure = players hit their ceiling in playoff games. Low pressure = performance dips in high-stakes moments. Wire to simGame's clutchSwing.

**ambition:** High ambition players demand starter role explicitly. If benched, morale drops faster. Low ambition players accept backup role gracefully.

**Social Clique System (from FM research — big narrative unlock):**
```
Players form cliques: same nationality, similar age (within 3 years), high loyalty + high ambition combo
Each clique has a "leader" (highest OVR in group)
If leader is unhappy → clique is unhappy → morale cascades
If leader is traded → clique morale drops for 4 weeks
```

**This Creates:** The captain holding the locker room together. The disruptive star poisoning the well. Trading the wrong person cascading into a season collapse. These are the STORIES players tell about their franchises.

---

### UNLOCK #5: COACHING CAROUSEL + COORDINATOR PIPELINE
**"Your OC Becomes a Rival HC. That's a Story."**

**The Core Insight (from FM research):**
Coaches should have careers that extend beyond your roster. A great OC you develop gets poached by another team and becomes their HC. You face them in the playoffs. THAT IS EMERGENT NARRATIVE for free.

**Coordinator Career Arc System:**
```
Each coordinator has: prestige(0-100), yearsExperience, archetype(scout/developer/strategist), teamHistory[]
Each offseason: if prestige > 70 → HC vacancy check → 30% chance another team offers HC role
If they leave → you get coordinator hire market → your player dev is disrupted 1 season
If you block them (contract) → prestige penalty → eventual demand to leave
```

**Coaching Tree (from Madden 22/FM research):**
- Your HC trains your coordinators → they eventually become HCs
- When they become HCs, they carry your "coaching DNA" → slightly higher chance their teams run your scheme
- Storyline: "Coach X, who learned under you in 2027, just won the championship in 2034"

**Prestige → Player Development Wire:**
| Coordinator Prestige | Dev Speed Modifier |
|---|---|
| Elite (85+) | +15% |
| Strong (70-84) | +8% |
| Average (50-69) | +0% |
| Weak (30-49) | -8% |
| Rookie (<30) | -15% |

---

## PART 3: SYSTEMS THAT ALREADY EXIST IN MFD (Polish First)

These are HIGH VALUE because the STATE exists — they just need UI/wiring:

### 1. Breakout Tracker Visual ("On Fire" Indicator)
- `breakouts80` state exists
- Need: Visual badge in roster view — flame emoji + "BREAKOUT SZEASON" tag
- Wire to: Awards Race tab, weekly broadcast, story generation
- Build time: 2-3 hours

### 2. Holdout Negotiation UI Polish
- `holdoutStages80` 5-stage escalation exists
- Need: Dedicated negotiation interface (counter-offer, franchise tag option, trade block)
- Current stage labels need player-facing narrative flavor
- Build time: 4-6 hours

### 3. RFA AI Bidding
- Logic stub exists in `simFABidRound`
- Need: Wire `faRFA82` state to the bid round so AI teams actually counter-tender
- Build time: 2-3 hours

### 4. Post-FA Summary Screen
- State: `faSignings82` already tracks all completed signings
- Need: End-of-FA screen with your class grade, positional grades, cap efficiency
- Build time: 3-4 hours

### 5. Halftime Adjustments UI
- Need: Modal that appears at halftime of played games
- Three scheme options: Run-Heavy / Balanced / Pass-Heavy
- Affects Q3/Q4 by adjusting DIFF_SETTINGS.clutchSwing modifier
- Build time: 3-4 hours

---

## PART 4: EMERGENT NARRATIVE PRINCIPLES
### (From Dwarf Fortress + FM + XCOM Research)

**The 5 Laws of Story Generation:**

**LAW 1: SYSTEMS COLLIDE — not scripts.**
Don't write the story. Build overlapping systems that create unpredictable interactions. The championship window (multiple aging stars peaking simultaneously) colliding with a cap crunch (dead money from a bad trade) colliding with a coach departure (OC got poached) = a season of drama, zero scripting.

**LAW 2: RANDOMNESS + FRAMING = NARRATIVE.**
Random injury hits differently when your news feed says "BREAKING: Your franchise QB goes down Week 6." Players apply apophenia — they make meaning from randomness. The framing IS the story.

**LAW 3: HIDDEN INFORMATION CREATES INVESTMENT.**
When the player doesn't know if their rookie prospect is a future star or a bust, they check their development every week. That tension IS engagement. Never show everything.

**LAW 4: CONSEQUENCES COMPOUND.**
Bad draft → cap hit for wasted pick → can't afford FA → team weakens → owner patience drops → coach fired → new scheme doesn't fit roster → losing streak → attendance drops → revenue drops → less cap room next year. ONE bad decision should echo for 3-5 seasons.

**LAW 5: THE LEAGUE BREATHES WITHOUT YOU.**
Other teams should make moves that surprise you. An AI team going on a dynasty run (3 titles in 5 years) should feel like a real rival. An AI rebuilding team should feel like they're building toward something. The world shouldn't pause while you make decisions.

---

## PART 5: RECOMMENDED FEATURE SPRINT ORDER

### Sprint 1 (Quick Wins — Polish Existing State)
1. Breakout tracker visual badge (2-3 hrs)
2. Post-FA summary screen (3-4 hrs)
3. RFA AI bidding wired (2-3 hrs)
4. Halftime adjustments modal (3-4 hrs)
**Result: v82.2 — feels noticeably more complete**

### Sprint 2 (Medium Build — Personality Layer)
5. Player personality traits (5 traits, simple generation, wire to existing systems)
6. Personality effects on: development, re-sign, holdout triggers, clutch
7. Locker room chemistry tab shows personality breakdown
**Result: v83 — every player has a character**

### Sprint 3 (Big Build — Financial Consequences)
8. Signing bonus proration + dead money on cuts
9. Dead cap visual in capLab (already exists, wire the math)
10. Cap Hell trigger (dead cap > 20% → FA demand premium)
**Result: v84 — every contract has stakes**

### Sprint 4 (Big Build — Scouting Fog)**
11. trueOvr hidden on all prospects
12. scoutedOvr with noise based on scoutBudget81
13. Reveal system: trueOvr → actual OVR over first 2 seasons
14. Draft board shows ranges, not point values
**Result: v85 — the draft becomes a gamble**

### Sprint 5 (Big Build — Revenue Model)
15. City-size attendance/revenue model
16. Owner budget = revenue × archetype rate
17. Playoff revenue bonus
18. Financial Report tab
**Result: v86 — winning fills your wallet**

### Sprint 6 (Narrative Engine)
19. Coaching carousel (OC departure → rival HC)
20. Social cliques (personality-based faction formation)
21. Responsive news feed (events wire to stories tab more aggressively)
**Result: v87 — the league breathes**

---

## PART 6: THE FOUR-QUESTION TEST (From the Unified Plan)
### Applied to Each Proposed Feature

| Feature | Creates Stories? | Legible? | Optional Depth? | Compounds? | Ship? |
|---|---|---|---|---|---|
| Scouting Fog-of-War | YES (bust/steal drama) | YES (ranges visible) | YES (casual ignores math) | YES (scouts improve) | ✅ SHIP |
| Dead Money | YES (cap hell arcs) | YES (cut cost shown) | YES (auto-manage option) | YES (echoes 3-5 yrs) | ✅ SHIP |
| Revenue Model | YES (small market runs) | YES (financial tab) | YES (sim-only mode) | YES (dynasty finances) | ✅ SHIP |
| Personality Traits | YES (locker room drama) | YES (visible tags) | YES (ignore or deep dive) | YES (cliques form) | ✅ SHIP |
| Coaching Carousel | YES (rival HC story) | YES (coaching tree) | YES (auto-fill option) | YES (coaching DNA) | ✅ SHIP |

---

## PART 7: THE ONE-PAGER PITCH
### "What Makes MFD the GOAT"

**Madden 2004's Owner Mode** showed the world that financial consequences make franchise mode addictive. Then EA abandoned it.

**Football Manager** proved that personality-driven players and chained systems create stories players tell for 20 years. But FM is soccer and intimidates casual players.

**OOTP** showed that scouting fog-of-war transforms the draft from a spreadsheet into genuine drama. But OOTP is baseball and buried under complexity.

**ZenGM** showed that elegant architecture and clean UI can make a deep sim accessible to anyone in a browser. But it lacks the NFL feel.

**MFD is building the convergence:**
- NFL license feel + ZenGM's browser accessibility
- OOTP's scouting uncertainty + FM's personality depth
- Madden 2004's financial consequences + FM's chained systems
- All in one single-file JSX artifact anyone can play in Claude.ai

**The gap in the market is real. The game is real. Let's build it.**

---

*Research compiled by Claude CoWork — Feb 20, 2026*
*Sources: OOTP Wiki/Manual, ZenGM Developer Blog, Football Manager Wiki, Front Office Football Documentation, Spotrac/OverTheCap (real NFL contracts), NFL Football Operations, Operation Sports Forums, Reddit r/Madden + r/NBA2k + r/footballmanagergames, GDC Vault, academic papers on emergent narrative, ESPN combine data, RotoWire draft bust rate analysis*
