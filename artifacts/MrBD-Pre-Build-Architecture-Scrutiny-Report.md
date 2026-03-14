# MR. BASEBALL DYNASTY — Scrutiny Report
## Pre-Build Architecture Review | February 2026

---

# TIER 1: CRITICAL FLAWS (Will Break the Game If Not Fixed)

---

## 1. The Log5 Normalization Is Mathematically Incomplete

Your Log5 formula:

```
BaseProb_i = (batter_i × pitcher_i) / league_i
P(Event_i) = BaseProb_i / Σ(all BaseProb_j)
```

**The problem:** Standard Log5 is designed for *binary* outcomes (batter wins vs. pitcher wins). You're extending it to 12 simultaneous outcome categories, but the formula above doesn't account for **which agent controls which outcome.**

In real baseball:
- **Pitchers** dominate K%, BB%, HR% (the "Three True Outcomes")
- **Batters** dominate batted-ball outcomes (GB%, FB%, LD%)
- **Neither dominates** BABIP — it's a shared outcome with massive context dependency

Your formula treats all 12 outcomes as symmetrically contested between batter and pitcher. This means your engine gives the batter and pitcher *equal influence* over strikeout rate, which contradicts decades of sabermetric research showing pitchers control ~80% of K% variance.

**The fix:** Weight the batter/pitcher influence per outcome category:

```
BaseProb_i = (batter_i^w_batter × pitcher_i^w_pitcher) / league_i
```

Where `w_batter + w_pitcher = 1` for each outcome `i`, derived from real variance decomposition:

| Outcome | Pitcher Weight | Batter Weight |
|---------|---------------|---------------|
| K-swing | 0.75 | 0.25 |
| K-look  | 0.70 | 0.30 |
| BB      | 0.55 | 0.45 |
| HBP     | 0.85 | 0.15 |
| HR      | 0.55 | 0.45 |
| GB-out  | 0.50 | 0.50 |
| FB-out  | 0.45 | 0.55 |
| LD-out  | 0.40 | 0.60 |
| 1B      | 0.35 | 0.65 |
| 2B      | 0.40 | 0.60 |
| 3B      | 0.30 | 0.70 |
| DP      | 0.55 | 0.45 |

Without this, your simulation will produce **unrealistically uniform pitcher profiles**. A Greg Maddux type (low K, low BB, extreme GB) and a Nolan Ryan type (high K, high BB, high FB) will feel far too similar because the batter's profile dilutes the pitcher's identity on every outcome.

**Severity: CRITICAL.** This affects every single plate appearance in the game.

---

## 2. The SDE Model Has an Unaddressed Absorbing Boundary Problem

Your SDE:
```
dX_t = θ(μ - X_t)dt + σdW_t
```

You mention "rating floor/ceiling clamps" as a mitigation. **This is insufficient and introduces a worse problem than the one it solves.**

Hard clamps on an Ornstein-Uhlenbeck process create **reflecting boundaries** that distort the stationary distribution. When a player's X_t hits the clamp, it bounces back, which:

1. **Concentrates probability mass at the boundaries** — you'll see unnatural clustering of players at exactly the floor/ceiling values
2. **Breaks the SDE's variance properties** — the expected σ of the process changes near boundaries, making players near the ceiling artificially stable and players near the floor artificially volatile
3. **Creates invisible asymmetric risk** — a player rated 79 (near a hypothetical 80 ceiling) behaves completely differently than a player rated 59 (far from the floor), even if their θ/σ parameters are identical

**The fix:** Replace hard clamps with **soft boundaries via a nonlinear drift term:**

```
dX_t = θ(μ - X_t)dt - κ·∇V(X_t)dt + σdW_t
```

Where `V(X_t)` is a potential function that increases steeply near the boundaries (e.g., a quartic well). This keeps the SDE mathematically well-behaved while preventing escape. The rating "feels" the wall before hitting it.

Alternatively, and much simpler for implementation: **transform to logit space.** Run the SDE on `logit(X_t)` where X is normalized to [0,1], then back-transform for display. The logit naturally compresses near boundaries and can never escape [0,1]. This is computationally cheaper and mathematically cleaner.

**Severity: CRITICAL.** This will produce visibly broken career arcs by Season 5-10 of a dynasty. You'll see clusters of players stuck at rating floors/ceilings with no natural way to escape.

---

## 3. IndexedDB Will Hit a Hard Wall and You Haven't Planned for It

You write: "Target: save file < 10MB after 20 seasons."

**This target is almost certainly unreachable with your current schema, and even if met, IndexedDB has worse problems than raw size.**

Let's do the math on your `player_seasons` store alone:
- 30 teams × 40 roster players = 1,200 active players
- With minor leagues: ~3,000-4,000 players per season (you mention 780 initially, but player generation over 20 seasons with minor leagues will easily hit 4,000+)
- Each `player_seasons` record with the stats object you need (traditional + advanced + batted ball + splits): ~2-4 KB per record when serialized
- 20 seasons × 4,000 players × 3 KB = **240 MB** for player_seasons alone

Even with compression of older seasons, you're looking at 50-100 MB by Season 20. And that's before `box_scores` and `games`.

**But the real killer isn't size — it's IndexedDB transaction performance on large object stores.** Dexie.js `bulkPut()` degrades nonlinearly as store size grows. At 100K+ records in a single store, you'll see multi-second transaction times that block the Worker. At 500K+ records (entirely plausible by Season 30), you risk transaction timeouts and data corruption.

**Browser storage quotas** are the other landmine:
- Chrome: ~60% of available disk (generous but not infinite)
- Firefox: ~2 GB per origin, then prompts the user
- Safari: **1 GB hard cap per origin, and it silently evicts data under storage pressure.** Safari will literally delete your user's 30-year dynasty without warning.

**The fix (multi-part):**
1. **Implement a tiered storage strategy now, not later:**
   - Hot tier: Current season + 2 prior seasons in full fidelity (IndexedDB)
   - Warm tier: Seasons 3-10 with aggregated stats only (IndexedDB, compressed)
   - Cold tier: Seasons 11+ as a single compressed blob per season (export to file)
2. **Add an explicit "export dynasty" feature from v0.1** that serializes the entire state to a downloadable JSON/binary file. This is your hedge against every browser storage failure mode.
3. **Plan for the Safari 1 GB cap as your binding constraint.** Test against it early.
4. **Partition `player_seasons` by season** — use a separate Dexie store per season range (e.g., `player_seasons_s1_s10`, `player_seasons_s11_s20`). This keeps individual store sizes manageable and allows you to evict cold tiers cleanly.

**Severity: CRITICAL.** This is the #1 reason browser-based dynasty games die. Your user's 30-year dynasty evaporating because Safari purged the origin storage will generate permanent negative word-of-mouth.

---

## 4. No Free Agent Market = Broken Dynasty by Season 2

You list free agency as NOT in v0.1. This is a much bigger problem than you may realize.

Without free agency:
- Players whose contracts expire... go where? Nowhere? Stay on their team forever?
- If they just stay, contracts are meaningless → payroll is meaningless → the entire GM simulation collapses
- If they vanish, rosters deplete every season with no replenishment mechanism
- AI teams cannot rebuild (no way to acquire players outside of trades, which are also not in v0.1)

You also have **no draft** in v0.1. So you have:
- No free agency (no player acquisition)
- No draft (no player acquisition)
- No trades (no player movement)
- No minor league system (no player development pipeline)

**This means v0.1 is a static league with fixed rosters that plays one season.** That's fine as a tech demo for validating the at-bat engine, but you should be explicit about this in your build plan. The document implies v0.1 is a "Single Playable Season" with dynasty implications, but it's actually a statistical sandbox with no persistence.

**The fix:** Either:
- (a) Accept v0.1 as a pure sim-engine validator with no roster management (fine, but reframe expectations), OR
- (b) Move a **minimal free agency system** into v0.1 — even something as simple as "expiring contracts auto-renew at market rate" to keep rosters alive across seasons

**Severity: CRITICAL for dynasty playability.** Not critical for the sim engine, which is what v0.1 actually validates.

---

# TIER 2: SIGNIFICANT ISSUES (Will Cause Major Problems If Ignored)

---

## 5. Fatigue + TTO Penalty: You ARE Double-Counting

Your document asks whether the 0.28 mph/inning degradation and the Times-Through-Order penalty interact correctly. **They don't, and you likely are double-counting.**

Here's why: The empirical TTO penalty (+.019 wOBA for 2nd time, +.031 for 3rd time) *already includes* the effect of fatigue. When researchers measured TTO effects, they measured them on real pitchers who were also fatiguing. The TTO effect is partially caused by:
- Batter familiarity with pitch sequencing (~60% of the effect)
- Pitcher fatigue degrading stuff (~40% of the effect)

If you apply **both** a fatigue-based velocity penalty **and** a full TTO penalty, you're counting the fatigue component twice. A pitcher in the 7th inning of your sim gets:
- Velocity degraded by ~1.7 mph (6 innings × 0.28)
- xwOBA penalty from that velocity loss
- PLUS the full 3rd-time-through +.031 wOBA penalty (which itself partially comes from velocity loss)

**The fix:** Scale the TTO penalty to only the **familiarity** component:

```
TTO_adjusted = TTO_raw × 0.60
```

Apply the fatigue model independently. This separates the two mechanisms cleanly.

Alternatively, use TTO as your **only** degradation mechanism and drop the velocity model entirely for v1. The TTO effect is better-documented and easier to validate. The velocity model adds realism but also adds a compounding error surface. You can add it in v2 once the base engine is validated.

**Severity: SIGNIFICANT.** This will make your starting pitchers look ~15% worse than they should in late innings, compressing the gap between starters and relievers.

---

## 6. The Surplus Value Trade AI Will Produce Boring, Predictable Markets

Your trade AI is surplus-value-only. Every team calculates:

```
Surplus Value = Projected Performance Value - Contract Cost
```

**The problem:** When every AI team uses the same valuation model, trades only happen when there's a mathematical surplus to distribute — and both sides know the math. This produces a trade market that:

1. **Converges to efficiency immediately** — no team is ever "wrong" about a player's value in a way that creates interesting market dynamics
2. **Produces symmetric trades** — every trade is roughly fair by construction, which means no blockbuster deals, no fleecing, no "how did they get him for THAT?"
3. **Cannot model organizational preferences** — a team desperate for a catcher values a C differently than a team with two good catchers, but pure surplus value doesn't capture positional scarcity at the team level

**The fix:** Add **idiosyncratic valuation noise** per team:

```
Team_Value = Surplus_Value × (1 + team_bias + positional_need_modifier + recency_noise)
```

Where:
- `team_bias`: persistent per-team tendency to over/undervalue certain player types (±5-15%)
- `positional_need_modifier`: scales value based on roster depth at that position (+10-30% for positions of need, -10% for positions of surplus)
- `recency_noise`: small random perturbation (±3%) to prevent perfect convergence

Also give AI GMs **personality traits** that map to systematic biases: a "stats-driven" GM undervalues veteran leadership; a "gut-feel" GM overvalues recent hot streaks; a "draft-and-develop" GM systematically undertrades prospects.

**Severity: SIGNIFICANT.** A boring trade market kills the 500-hour player. Trades are where narratives are born.

---

## 7. Your WAR Formula Will Produce Misleading DH and Catcher Valuations

Your positional adjustments:
```
C +12.5, SS +7.5, 2B/3B/CF +2.5, LF/RF -7.5, 1B -12.5, DH -17.5
```

**Problems:**
1. These are per-162-game adjustments, but you don't specify how to prorate for partial seasons. A catcher who plays 100 games gets the full +12.5 or a prorated +7.7? If prorated by games, catchers who rest frequently get penalized twice (fewer games AND lower positional adjustment per game).

2. The DH penalty of -17.5 is brutal and will make your AI systematically undervalue DHs in trades. In your fictional universe without real injury data, DHs exist purely because the user puts them there. A 6-WAR bat at DH shows as ~4.3 WAR. If the trade AI uses this WAR, it will never pay market rate for a DH, and the human player can exploit this by acquiring elite DH bats for pennies.

3. **You have no defensive component.** WAR = Offense + Positional Adjustment + Replacement. But without a defensive rating model, you're saying all shortstops provide identical defensive value. This collapses a major dimension of player differentiation.

**The fix for v1:** Add a simple defensive rating (1-100 scale per position, affects batted-ball-in-play outcomes). Even a crude model is better than none, because the trade AI and GM advisor need to differentiate between a Gold Glove SS and a bat-first SS.

**Severity: SIGNIFICANT.** Without defense, positional flexibility means nothing and WAR becomes a misleading GM tool.

---

## 8. The Bayesian Prior Approach Needs Positional Archetypes, Not Global Means

Your document asks: "Should rookies regress toward a positional archetype mean rather than the global league mean?"

**Yes. Emphatically yes.** And here's the specific damage if you don't:

Regressing a rookie catcher toward the global league mean for HR% treats him as if he's equally likely to be a power hitter as a slap hitter. But catchers have a well-documented HR% distribution that's distinctly lower than 1B/DH. If you regress toward the global mean, your catchers will *appear* to have more power early in their careers than their true talent supports, and then "decline" to their actual level as the Bayesian update kicks in. This creates a systematic illusion of catcher power decline in the early career that doesn't reflect anything real.

**The fix:** Maintain per-position prior distributions for at minimum these outcomes:
- HR% (positional power expectations differ dramatically)
- K% (catchers/SS have different K profiles than 1B/DH)
- BB% (patient positions vs. aggressive positions)
- BABIP (speed-position correlation)

Global mean is fine for the other outcomes.

**Severity: SIGNIFICANT.** Will produce unrealistic early-career stat lines that confuse the scouting fog-of-war system.

---

# TIER 3: DESIGN RISKS AND MISSING SYSTEMS

---

## 9. No Defensive Model = Half a Baseball Simulation

This is conspicuously absent from the entire document. You detail hitting, pitching, fatigue, baserunning (via Markov states), and development. But **defense is never specified.**

Questions you haven't answered:
- Does fielding quality affect BABIP? (It must, or defense is cosmetic)
- Does a player's defensive rating convert batted balls in play into outs at different rates by position?
- Are errors modeled? If so, how?
- Does range matter? Can a slow 1B get to balls that a fast 1B can?
- Does catcher framing affect called strike probability?

Without a defensive model:
- Gold Glove awards are meaningless (you can't compute defensive value)
- Positional scarcity collapses (a SS with no glove plays the same as a SS with elite glove)
- WAR is offense-only (as noted above)
- The simulation is incomplete as a representation of baseball

**The fix:** For v1, implement a simple **Defensive Runs Saved** analog:
- Each fielder has a `defense` rating (1-100) per position
- On each batted ball in play, the defense rating of the relevant fielder modifies the probability of the ball becoming a hit (via the BABIP calculation in your Log5 engine)
- Formula: `BABIP_modifier = (league_avg_defense - fielder_defense) × 0.002`
- This is crude but functional and gives defense meaningful gameplay impact

**Severity: SIGNIFICANT for v1 completeness.** Not blocking for v0.1 engine validation.

---

## 10. The "Single .jsx File" Constraint Will Break Before You Ship

You describe the entire game as a single .jsx file with the Worker inlined as a Blob URL. Let's be concrete about what this file will contain by v1.0:

- React UI components for 12+ screens
- Full simulation engine (Log5, Markov, SDE, fatigue, TTO)
- Trade AI, Manager AI, Draft AI
- Procedural generation (names, backstories, personalities)
- Dexie.js database layer
- Schedule generator
- Statistical calculation library
- All Comlink bridging code

**This will be a 15,000-30,000+ line file.** Even with Vite handling bundling, the development experience of working in a single file of that size is untenable. Debugging, version control diffs, and collaborative development all suffer catastrophically.

**The real question:** What does "single file" mean to you? If it means "ships as a single HTML file to the end user," Vite already handles that — you can develop in 50 modules and bundle to one output. If it means "developed as a single file," that's a self-imposed constraint that will slow development by 30-50% with no user-facing benefit.

**The fix:** Develop modularly (standard src/ directory with components, engine, AI, db modules). Configure Vite to produce a single output bundle. The user gets the "single file" experience. You get sane development.

**Severity: MODERATE but affects velocity significantly.**

---

## 11. The RE24 Matrix Should Be Semi-Dynamic, Not Static or Fully Dynamic

Your document asks whether the RE24 matrix should update dynamically. The answer is **semi-dynamic with guardrails.**

- **Fully static** (seeded from real MLB forever): The matrix becomes increasingly disconnected from the simulation's actual run environment. If your sim's league ERA drifts to 3.50 (from the 4.20 seed), the RE24 matrix will systematically overvalue baserunners and undervalue run prevention.
- **Fully dynamic** (recalculated each season from sim data): Feedback loop risk. If a random season produces high scoring, the matrix updates to value runs less, which changes AI valuations, which changes roster construction, which changes scoring... this can oscillate or diverge.

**The fix:** Recalculate the RE24 matrix every **5 seasons** using a blend:
```
RE24_new = 0.7 × RE24_from_sim_data + 0.3 × RE24_real_MLB_anchor
```

The anchor prevents runaway divergence. The 5-season cadence smooths single-season anomalies. This gives you a matrix that adapts to the sim's reality while remaining grounded.

---

## 12. Missing System: Injury Model

Not a single mention of injuries in the entire document. In a dynasty sim, injuries are:
- The primary source of roster management decisions
- The reason depth matters
- The mechanism that creates opportunity for prospects
- The driver of half of all trade deadline moves

Without injuries:
- Every team plays its optimal lineup every game forever
- Minor league depth is irrelevant (no one ever gets called up due to injury)
- The IL doesn't exist → roster construction has no risk management dimension
- Pitching staffing is trivial (no one ever gets hurt)

**Even a crude injury model is essential for v1.** Something like:
- Per-game injury probability based on position and age
- Duration drawn from a distribution (DL stints: 10-day, 60-day)
- Pitcher injury risk correlated with fatigue/workload

**Severity: HIGH for dynasty play.** Without injuries, the dynasty has no chaos, and without chaos, there's no need to manage.

---

## 13. Missing System: Aging Curves for Physical Attributes

Your SDE handles overall talent development, but you don't specify how **speed/athleticism** ages independently of skill.

In real baseball, a player's bat speed might hold steady through age 34 but their sprint speed declines starting at 27-28. This means:
- Triples should decline faster than doubles with age
- Infield hit probability should drop
- Defensive range should narrow
- Stolen base success should decrease

If your SDE drives a single X_t that encompasses both skill and athleticism, you'll get 35-year-old players who are equally likely to hit triples as 25-year-olds with the same overall rating. This feels wrong.

**The fix:** Split development into at least two SDE tracks:
1. **Skill** (contact, plate discipline, pitch command): peaks ~28-30, decays slowly
2. **Athleticism** (speed, range, arm strength): peaks ~25-27, decays faster and more deterministically

Map specific outcomes to specific tracks. Triples depend heavily on athleticism. Walk rate depends almost entirely on skill.

---

## 14. The Prefix Sum Optimization Is Over-Engineering

Your document dedicates a full subsection to O(log 12) vs O(12) outcome selection. Let me be direct: **this does not matter.**

12 outcomes. A linear scan is 6 comparisons on average. A binary search is ~3.6 comparisons. At 185,000 PA per season, you save roughly:
```
185,000 × (6 - 3.6) comparisons × ~1ns per comparison = 0.44 milliseconds per season
```

Less than half a millisecond. The prefix sum array construction, caching, and invalidation logic will cost more in developer time than the optimization saves in runtime over the entire lifetime of the game.

**The fix:** Use a simple linear scan with a smart ordering (most common outcomes first: flyout, groundout, single, strikeout at the top). Ship it. Never think about this again.

---

## 15. Procedural Name Generation: Use a Curated Data-Driven Approach, Not Algorithmic Generation

Your concern about culturally offensive names is valid. The failure modes of algorithmic name generation for baseball are severe:
- Random syllable combination produces names that sound like slurs in languages you didn't consider
- "Regionally flavored" names risk mapping ethnicity to geography in stereotypical ways
- Spanish surname generators that don't understand patronymic conventions produce gibberish

**The fix:** Don't generate names algorithmically. Instead:
- Curate a database of ~2,000 first names and ~2,000 last names, drawn from real baseball history and census data
- Tag each name with regional/cultural origin
- Combine randomly within culturally compatible pools
- Have a human review the initial output for a few hundred generated names to catch pathological combinations

This is less "clever" than procedural generation but categorically safer and more realistic. Real names feel more real than generated ones. Period.

---

# TIER 4: RESPONSES TO YOUR EMBEDDED SCRUTINY QUESTIONS

---

## Q: SharedWorker persistence within single-file constraint?
**Service Worker with Cache API.** A Service Worker can be registered from a Blob URL (in Chrome/Firefox, not Safari), persist across page refreshes, and cache the simulation state. However, Safari doesn't support Blob URL Service Workers, so this is not cross-browser. Your current approach is the correct pragmatic choice. The re-initialization cost on page refresh is negligible if you serialize the Worker state to IndexedDB on each season boundary (which you're already doing). Accept the Blob URL Worker and move on.

## Q: 6-store schema normalized correctly for 30-50 year dynasty?
**No.** See my IndexedDB critique above. Specifically: you need a composite index on `[season, teamId]` for `player_seasons` from Day 1. Without it, "show me all player stats for the 2045 Yankees" requires a full table scan. Also add `[season, position]` for leaderboard queries. These are painful to retrofit because Dexie.js schema migrations on large stores are slow and error-prone.

## Q: Should AI have perfect or imperfect knowledge of true_talent?
**Imperfect, but better than the human.** Give each AI team a scouting quality rating (60-90). The AI sees `true_talent + N(0, σ_ai)` where `σ_ai < σ_human_scout`. This creates a meaningful information asymmetry: the human can invest in scouting to close the gap, and different AI teams will evaluate the same player differently, which is what creates a functioning trade market. Perfect AI knowledge produces an omniscient market where the human can never find an edge — that's not fun.

## Q: Are the five SDE archetypes validated against real MLB curves?
**Not enough archetypes, and you're missing the most important one: the injury-prone talent.** A player with elite ceiling but chronic fragility (think: a fictional Strasburg or Buxton) doesn't map cleanly to your five archetypes. You need a sixth:

| Archetype | θ | σ | Special Rule |
|-----------|---|---|-------------|
| Fragile Star | 0.4 | 0.15 | μ decay accelerated by 50%; random "setback" events reduce X_t by 5-15 points 1-2× per career |

Also missing: the "Toolsy Bust" — high ceiling, high σ, but θ that trends *away* from μ rather than toward it. This is the player whose tools never translate to production. It's one of baseball's most recognizable archetypes and your model can't produce it without a negative or near-zero θ for certain players.

## Q: Auto-calibration suppressing historic seasons?
**Yes, and here's the specific mechanism.** If your calibration pass sees league BA at .270 (above .260 target) and applies a -0.010 global modifier, it suppresses EVERY hitter equally — including the one hitter having a legitimate .380 season. The fix: apply calibration at the **distribution level**, not the mean level. Instead of shifting the mean, compress the distribution's upper tail while preserving the lower tail. This brings the league average down without clipping individual outliers as aggressively. Specifically:

```
calibrated_stat = league_target + (individual_stat - league_actual) × compression_factor
```

Where `compression_factor < 1.0` when the league is running hot.

## Q: Is the 4-level minor league system right for v1?
**Start with 2 levels: AAA and Rookie.** Here's why: each additional level multiplies your roster management complexity, AI roster decision logic, and player development pipeline testing surface. AAA gives you "ready but blocked" players. Rookie gives you "raw prospects." The middle levels (AA, A) add granularity that matters in Season 10 but clutters the experience in Season 1-3. Add AA in v1.5 and A in v2.0.

---

# SUMMARY: TOP 5 ACTIONS BEFORE WRITING CODE

1. **Fix the Log5 weighting** — add pitcher/batter influence weights per outcome category
2. **Switch SDE to logit space** — eliminates the boundary problem elegantly
3. **Design the IndexedDB tiered storage strategy now** — including export-to-file from v0.1
4. **Add a minimal defensive model** — even crude defense unlocks WAR, positional value, and roster differentiation
5. **Add a minimal injury model** — without it, roster management has no stakes

Everything else can iterate. These five cannot be easily retrofitted.
