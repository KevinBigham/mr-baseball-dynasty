# MR. FOOTBALL DYNASTY — UNIFIED COLLAB PLAN v2
## "The Dynasty Architects Council"
**Date:** February 17, 2026
**Current Build:** v34 (v32.0 "GLORY & GRIT") — 12,170 lines, single-file React JSX
**Director:** Kevin Bigham
**Council:** Claude (Anthropic) · ChatGPT (OpenAI) · Gemini (Google)

---

## 0. WHAT HAPPENED

Kevin gave all three AIs the same mission: read three Deep Research reports on the GOAT sports dynasty/franchise games (1999–2026), study the v34 codebase, and propose a collaboration plan. Here's what came back:

**Claude** produced the original collab plan — 5 design pillars, phased roadmap, data model specs, role assignments based on v34 track records.

**ChatGPT** came back with a disciplined systems-engineering approach: "Glass Box Trust" first (deterministic seeds, split RNG, explain panels, transaction journal), THEN economy, THEN fog-of-war, THEN owner mode. Defined itself as **Spec Writer + QA** — delivers JSON schemas, pseudocode, acceptance tests, and golden-seed regression checks. Proposed a repeatable sprint cadence: Spec → Balance Notes → Build → Verify → Ship.

**Gemini** came back swinging with an architect's vision: "The Iron Bank" (dead money + restructuring), "The Living World" (coaching carousel + owner mode), "The Fog" (scouting math + web worker migration). Defined itself as **Architect + Optimizer** — wants to design the scouting math, prep the web worker boundary, and stress-test sim balance.

**This document resolves the differences and locks in the plan all three AIs will follow.**

---

## 1. WHERE ALL THREE AGREE (The Unanimous Truths)

Every AI independently converged on the same core findings. These are non-negotiable design commitments:

### TRUTH 1: Economic Consequences Are the #1 Missing Feature
All three reports and all three plans put franchise economics at the top. Madden 2004 Owner Mode, MVP Baseball 2005's postgame revenue screen, OOTP's financial model — the GOAT games made every roster move *cost something beyond just cap space.* Dead money, contract restructuring, revenue levers, stadium investment. The economy must have teeth.

### TRUTH 2: Scouting Fog-of-War Transforms the Draft
Front Office Football's "scouted ratings" system is the single most-cited mechanic across all research. You shouldn't know exactly how good a player is. Your scouts' quality determines information accuracy. The draft becomes a genuine gamble instead of a spreadsheet exercise. All three AIs want this.

### TRUTH 3: Connected Constraints > More Sliders
ChatGPT said it best: the magic isn't 47 rating categories — it's that budgets affect scouting accuracy, scouting accuracy affects draft outcomes, draft outcomes affect cap, cap constrains FA, FA shapes roster, roster determines scheme fit, scheme fit drives game results. **One chain of consequences.** Every new system must plug into this chain or it doesn't ship.

### TRUTH 4: The League Must Feel Alive Beyond Your Team
Tony Bruno Show, team newspapers, coaching carousel, rivalries, records, awards — the research unanimously shows that narrative immersion (the league existing as a living world around you) is what makes players tell stories about their franchise 20 years later.

### TRUTH 5: Depth With Optional Micromanagement
ZenGM's design philosophy is the north star for all three AIs: meaningful depth presented through clean UI, with automation/templates so players choose their intensity level. No spreadsheet hell.

---

## 2. WHERE THEY DISAGREED (And How We Resolve It)

### DISAGREEMENT 1: Do we need a "Glass Box" trust layer first?

**ChatGPT says YES** — deterministic seeds, split RNG streams, explain panels, and full transaction journal BEFORE adding new systems. Without them, you can't debug why your 90 OVR team missed the playoffs in Year 12.

**Gemini says SKIP IT** — jump straight to Dead Money and economy features.

**RESOLUTION: ChatGPT is right, but v34 already has most of it.**
v34 already has: the LEDGER system (transaction journal), league seed, save/load with full state, and the ledger logs every cap/cash/trade transaction. What's missing: split RNG streams (play/draft/injury/dev/trade), a postgame "Why Did We Lose?" explain panel, and golden-seed regression checks. **We fold the missing pieces into v35 alongside Dead Money — not as a separate version.** ChatGPT writes the RNG spec, Claude implements it as part of the v35 build.

### DISAGREEMENT 2: When does Owner Mode / Stadium happen?

**Gemini says v36** (early) — alongside coaching carousel.
**ChatGPT says v37** (later) — after scouting is done.
**Claude's original plan said v35** (earliest) — as the economy engine.

**RESOLUTION: Split it.** The *financial model* (revenue/expenses/budget math) goes into v35 with Dead Money because they're the same system — money in, money out, consequences. The *Owner Mode UI* (stadium upgrades, relocation, visual dashboard) goes into v37 after the core economy is battle-tested. Don't build a pretty dashboard for a model that hasn't been tuned yet.

### DISAGREEMENT 3: Web Worker migration?

**Gemini wants it at v37** — move sim engine off the main thread.
**ChatGPT doesn't mention it.**
**Claude's assessment:** Not yet. We're a single-file JSX artifact running in a sandboxed environment. Web Workers require separate files and a different deployment model. This is a **v50+ concern** when we have 20+ seasons of history. For now, we optimize the sim loop to be fast enough on the main thread. Gemini's worker boundary analysis is valuable *as documentation* for the future, but we don't build it yet.

**RESOLUTION: Gemini documents the worker boundary (which functions should eventually move) as a tech spec appendix. No implementation until performance actually degrades.**

### DISAGREEMENT 4: Role definitions

**ChatGPT sees itself as:** Spec Writer + QA (schemas, pseudocode, acceptance tests, golden-seed checks)
**Gemini sees itself as:** Architect + Optimizer (system design, scouting math, balance testing, UX/narrative)
**Claude's original plan had:** ChatGPT = Narrative/Broadcast, Gemini = Analytics/Dashboard

**RESOLUTION: Respect what each AI asked to do.** Both ChatGPT and Gemini shifted away from pure UI work and toward system design + spec work. That's actually better — Claude is the most experienced with the codebase and should remain the primary code implementer. The new role split:

| AI | Primary Role | Delivers |
|---|---|---|
| **Claude** | Lead Engineer + Integrator | Working code in the .jsx file. Implements specs. Merges everything. |
| **ChatGPT** | Systems Designer + QA | JSON schemas, pseudocode, acceptance tests, UX copy, "bug magnet" scans |
| **Gemini** | Balance Architect + Narrative | Tuning math, scouting formulas, balance stress-tests, story surface design, UI review |

---

## 3. THE UNIFIED ROADMAP

### v35: "THE IRON BANK" — Economy + Trust Foundation
**Theme:** Every roster move has financial consequences. Every outcome is explainable.

#### Claude Builds:
- **Dead Money Engine:** Signing bonus proration. Cut a player → remaining bonus accelerates onto current + next year's cap. Restructure a contract → convert base salary to bonus to clear immediate cap space at cost of future flexibility.
- **Revenue/Expense Model:** Revenue streams (tickets, concessions, merch, sponsorships, TV deal revenue sharing). Expenses (salaries, coaching staff, facilities, scouting budget, marketing). Market size modifier. Weekly financial tick integrated into simWeek.
- **Phase State Machine:** Refactor `season.phase` into strict enforcement. Can't sign FAs during Draft. Can't trade after Week 10. Each phase has defined legal actions. Phase transitions logged to LEDGER.
- **Split RNG Streams:** Separate seeded streams for play outcomes, draft, injuries, development, and trade AI. All sourced from league seed for reproducibility.
- **Financial Report Tab:** Revenue vs. expense breakdown, cap situation with dead money visualized, projected cap space for next 3 years.

#### ChatGPT Delivers (SPEC.md):
- **Contract Schema:** JSON spec for guarantees, signing bonus, proration schedule, restructure rules, cut/trade cap consequences. 3 worked examples (star restructure, veteran cut with dead money, rookie deal structure).
- **Phase Calendar Spec:** State machine definition with legal actions per phase, transition triggers, and edge cases (what happens if you're over the cap entering Free Agency?).
- **RNG Stream Spec:** How to split the seed, which functions use which stream, invariants that must hold.
- **Acceptance Tests:** 5 golden-seed scenarios that must produce identical outcomes. Invariants: every money change has a LEDGER entry, cap never goes negative without consequence, dead money sums correctly across years.
- **Postgame Explain Panel Copy:** Template for "Why did we lose?" — 3 concrete metrics + 1 actionable fix, sourced from drive data/OL-DL matchups/coverage/run lanes.

#### Gemini Delivers (BALANCE.md):
- **Economy Tuning Defaults:** Starting cash by market size, revenue curves (how attendance responds to ticket price × win%), facility maintenance cost curves, salary cap growth model. All with rationale for why these numbers create interesting decisions.
- **Dead Money Edge Cases:** What happens when dead money exceeds cap space? How do AI teams handle cap hell? Stress-test scenarios for 10-season sims.
- **UI Layout Review:** Information hierarchy for the Financial Report tab. One-screen decision principle — what do you need to see to make a financial decision without switching tabs?

---

### v36: "THE FOG" — Scouting Uncertainty + Draft Overhaul
**Theme:** You don't know what you don't know. The draft is a gamble, not a shopping list.

#### Claude Builds:
- **Scout Staff System:** Head scout + 2 regional scouts. Each has accuracy rating (0.5–0.95), specialty position, and cost. Hire/fire scouts in offseason. Better scouts cost more (ties into economy).
- **Fog-of-War Ratings:** Every prospect has `trueOvr` (hidden) and `scoutedOvr` (displayed). Scouted OVR = trueOvr + noise based on scout accuracy and prospect volatility. Error bars shown to player. Combine reveals partial truth (athletic measurables become accurate, mental traits stay foggy).
- **Draft Day Surprises:** Busts and steals emerge organically from the fog system. A "sure thing" 88 OVR prospect might actually be 74. A "project" 68 might be 79. Reveals happen gradually over first 2 seasons.
- **Scouting Budget Integration:** Scouting expense from v35 economy determines how many prospects you can evaluate per draft cycle. Low budget = fewer evaluated = bigger blind spots.

#### ChatGPT Delivers (SPEC.md):
- **Scouting Schema:** JSON spec for scout staff, prospect evaluation states (unevaluated → partially scouted → fully scouted → drafted → revealed). Worked examples of noise calculation.
- **Draft Show Enhancement:** Spec for draft day broadcast — board visualization, phone-call trade offers, pick announcement cards with scouted vs. consensus ranking, recap cards showing your class grade.
- **Acceptance Tests:** Fog invariants — trueOvr never visible in UI before reveal, scouted range narrows with investment, bust/steal rate falls within expected distribution (roughly 15% busts, 10% steals in first round).

#### Gemini Delivers (BALANCE.md):
- **Scouting Math:** The actual volatility formula. `scoutedOvr = trueOvr + N(0, σ)` where `σ = baseVolatility × (1 - scoutAccuracy) × positionFactor`. Tuning tables for σ by position, by scout tier. Distribution curves showing expected bust/steal rates at each accuracy level.
- **Balance Stress-Test Results:** Run 100 simulated drafts with the formula. Report: How often does the #1 pick bust? How often does a late-rounder become a star? Does scout investment have diminishing returns at the right point?
- **Narrative Surfaces:** How to surface fog-of-war stories — "Draft Day Reactions" (media hot takes on your picks that age well or poorly), "Scout Report Card" (end-of-year accuracy review for your scouts), "Steal of the Draft" award in season recap.

---

### v37: "THE LIVING WORLD" — Coaching Depth + Narrative Immersion
**Theme:** The league breathes. Coaches get poached. Rivals form. Stories write themselves.

#### Claude Builds:
- **Coaching Carousel:** Coordinators have age, prestige, specialty, scheme. Successful OCs/DCs get hired as HCs by other teams. You lose good coordinators to promotion. You can poach coordinators from other teams. Coaching staff affects player development speed and scheme effectiveness.
- **Coach XP & Skill Trees:** Three archetypes (Scout/Developer/Strategist). Earn XP from game objectives (rushing for 150 yards with a Developer coach = XP). Unlock traits that affect scouting, development, and in-game performance.
- **Media Layer v1:** Weekly headline generator that references YOUR recent decisions + league-wide events. Power ranking commentary with personality. Rivalry tracker (heat builds from repeated matchups, playoff eliminations, traded players).
- **Storyline Tracker:** Data structure that detects and logs emergent narratives — dynasties (3+ titles), Cinderella runs (worst-to-first), revenge games (eliminated by same team again), coaching trees (your former OC is now a HC and you face them).

#### ChatGPT Delivers (SPEC.md):
- **Coaching Carousel Schema:** JSON spec for coach objects, promotion logic, poaching rules, scheme compatibility scoring, prestige calculation formula.
- **Media/Headline Templates:** Library of headline templates with variable slots. "{{TEAM}} shocks the league with blockbuster {{PLAYER}} trade" — categorized by event type (trade, upset, streak, injury, record, draft). Tone variants (hype, critical, analytical).
- **Storyline Detection Rules:** Pseudocode for detecting each narrative type. When does a "dynasty" trigger? How much "heat" does a playoff elimination add to a rivalry? When does a coaching tree storyline surface?
- **Acceptance Tests:** Coaching carousel invariants — teams never have 0 coordinators, prestige changes are bounded, poaching follows offseason phase rules.

#### Gemini Delivers (BALANCE.md):
- **Coaching Impact Tuning:** How much should a great OC actually improve offensive output? Proposed ranges and curves. How fast should prestige grow/decay?
- **Narrative Priority System:** When multiple storylines are active, which ones surface first? Ranking logic so the media layer doesn't spam the player with 15 headlines.
- **Coach Carousel UI Review:** Layout for the coordinator hiring market screen. Interview process flow. One-screen decision: who to hire, what they cost, what they bring.
- **Rivalry Heat Curves:** Math for how rivalry intensity builds and decays. Playoff elimination = +20 heat, regular season win = +3, years without playing = -5/year. Threshold for "heated rivalry" vs "rivalry" vs "neutral."

---

### v38: "THE LEGACY" — History, Records, and Long-Horizon Persistence
**Theme:** Year 20 feels different from Year 1. Your franchise has a story worth reading.

#### Claude Builds:
- **Record Book:** All-time franchise records (single-season, career) and league records. Auto-updates after every season. Records broken trigger special notifications + media headlines.
- **Ring of Honor & Retired Numbers:** Ceremony screen for franchise legends. Criteria-based nomination (HOF induction, franchise records, championship MVPs).
- **Franchise Value Tracker:** Value changes based on wins, market, stadium, attendance, financial health. Visualized over time. League-wide comparison.
- **Decade in Review:** Every 10 seasons, special recap screen showing era-defining moments, dominant teams, league evolution.

#### ChatGPT Delivers: Record book schema, HOF/Ring criteria spec, acceptance tests for record tracking integrity.
#### Gemini Delivers: Franchise value formula tuning, decade recap narrative templates, history UI layout review.

---

### v39+: "THE SANDBOX" — Commissioner Tools + QoL
**Theme:** Let players customize their experience. Depth without mandatory micromanagement.

- Auto-manage toggles (auto re-sign, auto depth chart, auto cut)
- Simulation speed/difficulty sliders
- Custom league rules (cap amount, roster sizes, playoff format)
- Import/export save files
- **Worker boundary migration** (if performance requires it by this point)

---

## 4. DATA MODELS (All AIs Build to These Specs)

ChatGPT refines these into full SPEC.md documents. Claude implements. Gemini validates balance.

### Contract Schema (v35)
```javascript
player.contract = {
  years: 4,              // remaining years
  baseSalary: [8, 9, 10, 11],  // per year ($M)
  signingBonus: 20,      // total bonus ($M)
  prorated: 5,           // annual bonus charge (bonus / original years)
  guaranteed: 28,        // total guaranteed ($M)
  deadMoney: function(yearsLeft) {
    return this.prorated * yearsLeft;  // accelerated if cut
  },
  restructurable: true   // false if already restructured this year
}

// CUT CONSEQUENCES:
// Cut Year 1 of 4-year deal: $15M dead money (3 years of proration)
// Cut Year 3 of 4-year deal: $5M dead money (1 year of proration)
// Restructure: convert $6M salary to bonus → saves $6M now,
//   adds $1.5M/yr to remaining years
```

### Economy Schema (v35)
```javascript
team.economy = {
  revenue: {
    tickets:      { price: 85, fillRate: 0.78 },
    concessions:  { tier: "standard" },  // budget/standard/premium/luxury
    merch:        { tier: "standard" },
    sponsorships: 0,    // auto: f(market, wins, fanLoyalty)
    tvShare:      0     // league-wide, equal split
  },
  expenses: {
    salaries:   0,      // sum of roster
    staff:      0,      // coaching + scouts
    facilities: 0,      // stadium maintenance + upgrades
    scouting:   0,      // determines # of draft evals
    marketing:  0       // boosts attendance + merch
  },
  stadium: {
    level: 1,           // 1-5
    capacity: 65000,
    condition: 100,     // degrades yearly
    upgrades: []        // "luxury_suites", "jumbotron", "club_seats"
  },
  market: "medium",     // small / medium / large / mega
  fanLoyalty: 50,       // 0-100
  franchiseValue: 100,  // index, grows/shrinks
  cash: 50              // operating cash ($M)
}
```

### Scout Schema (v36)
```javascript
team.scouts = {
  head:     { name: "...", accuracy: 0.85, specialty: "QB", salary: 2 },
  regional: [
    { name: "...", accuracy: 0.70, region: "South", salary: 1 },
    { name: "...", accuracy: 0.65, region: "West", salary: 1 }
  ],
  budget: 5   // determines max evaluations per draft cycle
}

prospect = {
  trueOvr: 78,            // HIDDEN from player
  scoutedOvr: 82,         // shown (trueOvr + noise)
  scoutedRange: [76, 88], // confidence interval
  volatility: 0.3,        // how "boom or bust" this prospect is
  evalLevel: 0,           // 0=unscouted, 1=combine, 2=interview, 3=full
  revealedTraits: ["speed","arm"],
  hiddenTraits: ["injury_prone","leader"],
  scoutNotes: "High ceiling, questionable consistency"
}
```

### Coach Schema (v37)
```javascript
coach = {
  name: "...",
  age: 48,
  role: "OC",              // HC / OC / DC
  prestige: 65,            // 0-100
  scheme: "west_coast",
  specialty: "passing",
  xp: 0,
  level: 1,
  archetype: "developer",  // scout / developer / strategist
  skills: {
    talentEye: 0,          // scouting accuracy boost
    playerGrowth: 0,       // development speed
    clutchBoost: 0,        // playoff performance
    schemeBonus: 0,        // scheme effectiveness
    recruiting: 0          // FA pitch success
  },
  mentor: "Bill Belichick", // coaching tree
  history: [{ team: "KC", years: "2024-2026", record: "32-16" }]
}
```

### Storyline Schema (v37)
```javascript
league.storylines = {
  rivalries: [
    {
      teams: ["KC", "LV"],
      heat: 78,            // 0-100
      origin: "2027 AFC Championship",
      history: [
        { year: 2027, event: "playoff_elimination", delta: +25 },
        { year: 2028, event: "trade_betrayal", delta: +15 }
      ]
    }
  ],
  dynasties: [
    { team: "KC", titles: [2026, 2028, 2029], active: true }
  ],
  cinderellas: [
    { team: "JAX", year: 2029, prevRecord: "3-14", result: "Conference Finals" }
  ],
  coachingTrees: [
    { mentor: "Andy Reid", branches: ["OC Smith → HC Jacksonville"] }
  ]
}
```

---

## 5. SPRINT WORKFLOW (Repeatable Cadence)

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Kevin assigns version target + feature set     │
│                                                         │
│  STEP 2: ChatGPT delivers SPEC.md                       │
│     → JSON schemas + pseudocode + 3 worked examples     │
│     → Acceptance tests + invariants                     │
│     → UX copy (labels, tooltips, explain panel text)    │
│                                                         │
│  STEP 3: Gemini delivers BALANCE.md                     │
│     → Tuning defaults + math formulas                   │
│     → Balance edge cases + stress-test scenarios         │
│     → UI layout review + narrative surface design        │
│                                                         │
│  STEP 4: Claude builds (with SPEC + BALANCE in hand)    │
│     → Surgical insertions into .jsx file                │
│     → Preserves existing systems + save compatibility    │
│     → Integrates all pieces                             │
│                                                         │
│  STEP 5: Verification                                   │
│     → Systems checklist + golden seed spot-check         │
│     → Kevin playtests                                   │
│                                                         │
│  STEP 6: Ship Notes                                     │
│     → Changelog + what to test + known tradeoffs        │
└─────────────────────────────────────────────────────────┘
```

### Handoff Format
- **ChatGPT → Claude:** `SPEC.md` — schemas + pseudocode + examples + invariants
- **Gemini → Claude:** `BALANCE.md` — tuning + formulas + UI notes + edge cases
- **Claude → Kevin:** Updated `.jsx` file + `CHANGELOG.md` + test checklist

### Code Delivery Standard (All AIs)
```
// ═══ v[XX]: [FEATURE] (credit: [AI] — [what], Claude — integration) ═══
// SPEC: [link to ChatGPT's spec if applicable]
// BALANCE: [link to Gemini's tuning if applicable]
```

---

## 6. FIRST MOVES — RIGHT NOW

### Kevin's Move
Send this document to ChatGPT and Gemini. Tell them:

**To ChatGPT:**
> "The Council has aligned. Here's the unified plan. Your first deliverable: write SPEC.md for v35 'The Iron Bank'. I need the contract/dead money schema, phase state machine definition, RNG stream spec, and 5 acceptance test scenarios. Deliver as a downloadable file."

**To Gemini:**
> "The Council has aligned. Here's the unified plan. Your first deliverable: write BALANCE.md for v35 'The Iron Bank'. I need economy tuning defaults (revenue curves, market size effects, attendance sensitivity), dead money edge cases for 10-season stress tests, and UI layout notes for the Financial Report tab. Deliver as a downloadable file."

### Claude's Move (Once Kevin has SPEC.md + BALANCE.md)
Build v35 "The Iron Bank" — dead money engine, revenue/expense model, phase state machine, split RNG streams, financial report tab. All wired into existing phase loop and LEDGER system. Ship as updated .jsx file.

---

## 7. THE FOUR-QUESTION TEST

Every feature must pass before it ships:

1. **Does it create stories?** Will the player tell someone what happened in their franchise because of this?
2. **Is it legible?** Can the player understand WHY something happened, not just THAT it happened?
3. **Is it optional depth?** Can a casual player ignore it, while a hardcore player dives deep?
4. **Does it compound over time?** Is it more interesting in Year 10 than Year 1?

All four = ship it. Missing any = redesign.

---

**The Dynasty Architects Council has spoken. The research is in. The plan is locked.**

**Let's build the GOAT. 🏈🏆🚀**

*Claude × ChatGPT × Gemini — Orchestrated by Kevin Bigham*
*Mr. Football Dynasty — Making the game the NFL won't.*
