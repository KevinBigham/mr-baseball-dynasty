# Player Personality & Chemistry RFC v1

**Status:** Draft
**Owner:** Codex (spec) / Claude (implementation)
**Date:** 2026-03-09
**Scope:** Lightweight but real: morale, role acceptance, mentor/tension effects

---

## 1. Motivation

Chemistry v1 adds team-level and interpersonal dynamics that make roster decisions feel consequential beyond pure on-field stats. A clubhouse in turmoil should hurt; a team with strong veteran leadership and good role acceptance should overperform.

This is the first layer of "believability" in the sim. The system must be lightweight (no new UI screens required for alpha), integrate into existing decision loops, and avoid adding complexity that doesn't change decisions.

## 2. Design Principles

1. **Lightweight first** — minimal new state, no dedicated UI screen required
2. **Decision-relevant** — chemistry must affect outcomes players can observe
3. **Not a minigame** — no manual relationship management; chemistry emerges from roster moves
4. **Observable** — effects surface through existing channels (briefing, news feed, morale dial)
5. **Deterministic** — given the same roster state and PRNG seed, chemistry outcomes are reproducible

## 3. Data Model

### 3.1 Team Chemistry State

```typescript
interface TeamChemistryState {
  teamId: number;
  cohesion: number;        // 0–100, how well the team gels
  morale: number;          // 0–100, overall clubhouse mood
  lastUpdatedSeason: number;
}
```

**Cohesion** reflects roster stability and interpersonal fit. It increases with roster continuity and decreases with high turnover, toxic personalities, or role conflicts.

**Morale** reflects short-term sentiment. It fluctuates with wins/losses, trades, callups, injuries to key players, and championship runs. Already partially wired via `narrative.ts:getMoraleStatus()`.

### 3.2 Player Personality Traits

Already defined in `src/types/player.ts`:

| Trait | Type | Range | Stability |
|-------|------|-------|-----------|
| `workEthic` | number | 0–100 | Stable (personality) |
| `mentalToughness` | number | 0–100 | Increases with experience |

### 3.3 Derived Personality Archetypes

Computed from existing attributes, not stored:

| Archetype | Criteria | Chemistry Effect |
|-----------|----------|------------------|
| **Veteran Leader** | Age 30+, workEthic 70+, mentalToughness 75+ | +cohesion to young teammates |
| **Clubhouse Cancer** | workEthic < 30, mentalToughness < 40 | -cohesion to entire team |
| **Quiet Professional** | workEthic 60+, mentalToughness 60+ | Neutral; stabilizes cohesion |
| **Hot Head** | mentalToughness < 30, workEthic varies | -cohesion when losing; +morale when winning |
| **Young Star** | Age < 26, overall 400+, workEthic 50+ | +morale boost on breakout performances |

### 3.4 Clubhouse Events

```typescript
interface ClubhouseEvent {
  eventId: number;
  teamId: number;
  season: number;
  kind: string;          // e.g. 'mentor_bond', 'role_conflict', 'team_dinner', 'blowup'
  description: string;   // Narrative sentence for news feed
}
```

Events are generated during season simulation and offseason transitions. They feed into the news system and affect cohesion/morale.

## 4. Role Acceptance

Players have an implicit **expected role** based on their overall rating and roster position:

| Overall Range | Expected Role |
|--------------|---------------|
| 450+ | Starter / Ace |
| 350–449 | Regular / Setup |
| 250–349 | Platoon / Long Relief |
| < 250 | Bench / Mop-up |

**Role conflict** occurs when a player's actual usage doesn't match their expected role:
- A 450+ rated player stuck in AAA → morale -5/season, cohesion -2
- A veteran demoted to bench → morale -3, possible clubhouse event
- A young player promoted to starter role → morale +3 if performing, -2 if struggling

Role acceptance is modified by `mentalToughness`:
- High mentalToughness (70+): player accepts role changes gracefully
- Low mentalToughness (< 30): role conflicts generate clubhouse events

## 5. Mentor/Tension Effects

### 5.1 Mentor Bonds

When a **Veteran Leader** and a young player (age < 26) share the same position group (IF, OF, SP, RP), a mentor bond can form:

- **Probability:** 40% per season if both on MLB roster
- **Effect:** Young player gets +5% development rate bonus; team cohesion +2
- **Narrative:** Generates a `mentor_bond` clubhouse event

### 5.2 Tension

Tension arises from:
- **Roster competition:** Two players with similar overall competing for one spot → tension probability 20%
- **Personality clash:** Veteran Leader + Clubhouse Cancer on same team → automatic tension
- **Losing streak:** 8+ game losing streak → 15% chance of `blowup` event

Tension effects:
- Cohesion -3 per active tension pair
- Possible `blowup` clubhouse event (morale -5, news story generated)

## 6. On-Field Impact

Chemistry affects simulation outcomes through two modifiers:

### 6.1 Cohesion Modifier
Applied to close games (margin <= 2 runs):
- Cohesion 80+: +2% win probability in close games
- Cohesion 60–79: no modifier
- Cohesion 40–59: -1% win probability in close games
- Cohesion < 40: -3% win probability in close games

### 6.2 Morale Modifier
Applied to all plate appearances as a batting/pitching modifier:
- Morale 80+: +0.5% to batting contact, -0.3% to pitcher ERA
- Morale < 30: -0.5% to batting contact, +0.3% to pitcher ERA

These are deliberately small — chemistry is a tiebreaker, not a dominator.

## 7. Integration Points

### 7.1 Season Simulation (`advanceTeamChemistry`)
Called after each simulated game batch:
1. Compute personality archetypes for all active roster players
2. Evaluate role conflicts
3. Roll for mentor bonds and tension events
4. Update cohesion and morale
5. Generate clubhouse events
6. Apply on-field modifiers to next batch

### 7.2 Offseason
- Cohesion resets partially toward 50 (regression to mean)
- Major roster turnover (5+ departures) → cohesion -10
- Championship → morale +15, cohesion +5
- Playoff exit → morale -5

### 7.3 News Feed
Clubhouse events generate news stories via existing `newsFeed.ts` infrastructure:
- `mentor_bond` → "Veteran [name] takes [young player] under his wing"
- `blowup` → "Clubhouse tensions boil over after [event]"
- `team_dinner` → "[Team] holds team dinner to build chemistry" (high cohesion reward)
- `role_conflict` → "[Player] unhappy with reduced role"

### 7.4 Front Office Briefing
Morale already surfaces as "Clubhouse Temperature" in the briefing header. Chemistry v1 enriches this with:
- Cohesion indicator alongside morale
- Flagging active tensions or mentor bonds in the action queue

## 8. Implementation Phases

### Phase 1: Types & State (this sprint)
- Define `TeamChemistryState` and `ClubhouseEvent` in `src/types/chemistry.ts`
- Wire state into worker's game state (already partially done)

### Phase 2: Engine Logic
- Implement `advanceTeamChemistry()` in `src/engine/league/teamChemistry.ts`
- Compute archetypes, role conflicts, mentor/tension
- Generate clubhouse events

### Phase 3: On-Field Integration
- Apply cohesion/morale modifiers in plate appearance simulation
- Test that modifiers are small and don't break stat distributions

### Phase 4: Narrative Surface
- Connect clubhouse events to news feed
- Enrich briefing with cohesion data

## 9. Out of Scope for v1

- Player-to-player relationship graph (v2)
- Chemistry-specific UI screen (v2)
- Manager/coach personality effects (v2)
- Fan morale / attendance impact (v2)
- Trade deadline chemistry considerations in AI (v2)

## 10. Testing Strategy

- Unit tests for archetype classification
- Unit tests for role conflict detection
- Unit tests for cohesion/morale update math
- Integration test: full season sim with chemistry enabled produces stats within expected distribution
- Regression test: chemistry modifiers don't skew league-wide batting averages by more than +/- 0.003

## 11. References

- Architect spec: `docs/collaboration/MrBaseballDynasty_Master_Architect_Round5.md` section 4.C
- Existing morale: `src/engine/narrative.ts` lines 187–230
- Player traits: `src/types/player.ts` (workEthic, mentalToughness)
- Feature truth: `docs/collaboration/feature_truth_matrix.md` (team-chemistry = partial)
