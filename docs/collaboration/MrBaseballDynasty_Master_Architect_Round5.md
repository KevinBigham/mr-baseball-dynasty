# Mr. Baseball Dynasty — Master Architect Brief (Round 5 of 5)

Date: 2026-03-07  
Owner: Architect  
Audience: Kevin, Claude Code, Codex

## 1. The North Star

**Mr. Baseball Dynasty will become the most believable long-horizon baseball decision engine a player can use in a browser.**

The game wins when a normal week in May is compelling, not just Opening Day or October.

## 2. The five laws of the project

1. **Sim truth over feature count.** If the world feels fake, the game dies.
2. **Decision pressure over menu density.** Every week should surface one or two meaningful choices.
3. **Memory over novelty.** Trades, owner pressure, player arcs, rivalry scars, and playoff heartbreak must stick.
4. **Legibility over spreadsheet fog.** Every core screen must answer: what changed, why do I care, what can I do now?
5. **Alpha-loop reliability over expansion.** New game -> sim -> move -> transaction -> save/load -> offseason -> next season must be rock solid.

## 3. The playable-alpha target

A playable alpha is not “lots of tabs.” A playable alpha is this loop:

1. Start a new franchise.
2. Understand the franchise situation in under two minutes.
3. Sim forward until a meaningful decision appears.
4. Make at least one roster / transaction / development choice.
5. Save, load, and resume safely.
6. Reach the offseason and advance into the next year without blocker-level crashes.

## 4. What ships in CORE

These items directly strengthen the weekly heartbeat and the reliability spine.

### A. Reliability Spine
- Feature manifest / intake registry as the source of truth for feature status.
- Core Mode vs All Mode.
- Readiness + integrity audit endpoints.
- Save migration safety, recovery, and smoke-flow coverage.
- Runtime guards for worker bridge responses.
- One-click resume last session.

### B. Cadence Spine
- **Front Office Briefing** on Home.
- **Action Queue** with urgent baseball tasks.
- **End-of-Day / End-of-Week Digest**.
- **Core onboarding** for the first in-game week.
- **Sim to Next Decision** (or, if full implementation is not ready yet, the stop-condition contract and UI shell for it).

### C. Believability v1
- **Trade AI targeting v1** (needs, surplus, controllable value, package sanity).
- **Chemistry v1** (lightweight but real: morale, role acceptance, mentor/tension effects).
- **Scouting uncertainty v1** (confidence bands / reports / partial fog, not omniscience).
- **Rehab assignments v1**.
- **Historical browser v1** (enough to make seasons feel remembered).
- **Narrative digest v1** (owner pressure, trade buzz, rivalry/milestone surfacing).

## 5. What stays ADVANCED for now

These can exist, but they do **not** get promoted to core unless they improve the weekly decision loop.

- Deep analytics overlays.
- Highly specialized pitch / zone / tunneling / contact dashboards.
- Advanced finance overlays that do not change current decision-making.
- Secondary narrative toys that are cool but not load-bearing.
- Cosmetic theme variants beyond minimal polish.

## 6. What gets SHELVED until after alpha

Do not spend alpha time here.

- Loot-like reward structures or anything gambling-adjacent.
- Grind-based retention systems.
- Decorative feature waves that create tabs without decisions.
- Mini-games / unlock systems / novelty side systems that do not strengthen sim truth, pressure, memory, or clarity.
- Blind bulk-merging of the large analytics-heavy branch.

## 7. The shared architecture decision

We will run two lanes in parallel.

### Claude lane
Claude owns **player-facing cadence and legibility**:
- Briefing
- action queue
- digest
- onboarding
- core navigation / core empty states
- narrative surfacing

### Codex lane
Codex owns **control plane and alpha reliability**:
- manifest / intake / readiness
- integrity / save safety / runtime guards
- smoke tests / invariants / release gates
- truth audit of built vs partial vs unmerged vs shelved
- engine-side stop conditions and non-UI reliability work

## 8. Hot-file policy

These files are treated as hot files and only change in explicit windows:
- `src/components/layout/Shell.tsx`
- `src/store/uiStore.ts`
- `src/engine/worker.ts`
- `src/types/*`
- save / schema files

Rule: **additive-first, batch edits, one owner at a time.**

## 9. The first two sprint outcomes

### Sprint 1 outcome
By the end of Sprint 1, the repo should have:
- a feature truth matrix,
- a manifest skeleton,
- readiness/integrity plumbing,
- smoke-flow tests,
- a working Home briefing stack,
- a working action queue and digest UI,
- a clear Core Mode experience.

### Sprint 2 outcome
By the end of Sprint 2, the repo should have:
- trade AI targeting v1,
- chemistry v1,
- scouting uncertainty v1,
- rehab assignments v1,
- a basic historical browser,
- and at least one “sim to next decision” stop path fully live.

## 10. The product doctrine

**Make baseball hard, interface easy, consequences human, and unanswered questions irresistible.**

That is the GOAT path.
