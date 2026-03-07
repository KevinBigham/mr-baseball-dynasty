# Feature Truth Matrix

Date: 2026-03-07
Owner: Codex

## Scope and evidence order

Truth order used for this matrix:
1. current source tree in this repo
2. `README.md`
3. `CODEX_HANDOFF.md`
4. `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md`
5. architect assignment packet

## Known mismatches
- `HANDOFF_BIBLE.md` is referenced by collaboration docs but is not present in this local checkout.
- `CODEX_HANDOFF.md` correctly describes broad engine coverage, but some player-facing cadence surfaces it references as future work are not present in `src/components/**` here.
- Claude Sprint 01 surfaces are documented in collaboration notes, but they are not present in the current source tree, so they are recorded as intake-only.

## Status legend
- `canonical`: implemented in current source tree and part of present playable loop
- `partial`: implemented but not fully surfaced or not fully trusted in active loop
- `intake-only`: documented on Claude lane / future branch work, not present here as canonical code
- `duplicate / superseded`: exists conceptually but should not be treated as current source of truth
- `shelved`: intentionally deferred for alpha core

| featureId | title | area | source | status | evidence | notes | recommendedTier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dashboard | Dynasty Dashboard | home | source tree | canonical | `src/components/dashboard/Dashboard.tsx`, `src/engine/worker.ts#getDashboardBundle` | Main home surface and save controls are wired. | core |
| standings | Standings | league | source tree | canonical | `src/components/dashboard/StandingsTable.tsx`, `src/engine/worker.ts#getStandings` | Stable core read surface. | core |
| roster | Roster Management | team | source tree | canonical | `src/components/roster/RosterView.tsx`, `src/engine/roster/rosterManager.ts` | Core transaction loop exists. | core |
| player | Player Profile | stats | source tree | canonical | `src/components/stats/PlayerProfile.tsx`, `src/engine/worker.ts#getPlayerProfile` | Routed indirectly from roster and leaders, not top-nav. | advanced |
| leaderboards | Leaderboards | stats | source tree | canonical | `src/components/stats/Leaderboards.tsx`, `src/engine/worker.ts#getBattingLeaders` | Useful but not required for alpha heartbeat. | advanced |
| playoffs | Playoff Bracket | league | source tree | canonical | `src/components/playoffs/PlayoffBracketView.tsx`, `src/engine/league/playoffs.ts` | End-to-end postseason path exists. | core |
| awards | Awards | history | source tree | canonical | `src/components/awards/AwardsView.tsx`, `src/engine/league/awards.ts` | Stable seasonal readout. | advanced |
| history | History | history | source tree + handoff | partial | `src/components/history/HistoryView.tsx`, `src/store/gameStore.ts`, `CODEX_HANDOFF.md` | View exists, but handoff notes say some history stores remain incomplete. | advanced |
| news | News Feed | league | source tree | canonical | `src/components/news/NewsFeedView.tsx`, `src/engine/league/newsFeed.ts` | Core consequence surfacing already in place. | core |
| offseason-pipeline | Offseason Orchestration | engine | source tree | canonical | `src/engine/roster/offseason.ts`, `src/engine/worker.ts#advanceSeason` | Retirements, Rule 5, arbitration, FA, draft, resets all run. | core |
| save-manager | Save/Load + Migration | persistence | source tree | canonical | `src/engine/persistence/saveManager.ts`, `src/engine/persistence/migrations.ts` | Additive metadata and preflight are already present. | core |
| manifest-control-plane | Feature Manifest / Readiness Spine | control-plane | source tree | canonical | `src/features/*`, `src/engine/worker.ts` readiness endpoints | Seed version exists; still needs broader intake adoption. | core |
| owner-goals | Owner Pressure / Mandates | engine | source tree + handoff | partial | `src/engine/league/ownerGoals.ts`, `src/engine/worker.ts#getOwnerState` | Engine is real; dedicated cadence UI is still absent. | advanced |
| team-chemistry | Team Chemistry | engine | source tree + handoff | partial | `src/engine/league/teamChemistry.ts`, `src/engine/worker.ts#getTeamChemistry` | Engine is real; canonical player-facing loop is not settled. | advanced |
| trade-desk | Trade Suggestions / Counter / Execute | roster-market | source tree | canonical | `src/engine/worker.ts#getTradeSuggestions`, `src/components/roster/RosterView.tsx` | Real baseball decisions, part of alpha spine. | core |
| free-agent-board | Free Agent Offers | roster-market | source tree | canonical | `src/engine/worker.ts#getFreeAgentBoard`, `src/components/roster/RosterView.tsx` | Wired through roster screen. | core |
| draft-board | Amateur Draft Board API | engine | source tree | partial | `src/engine/draft.ts`, `src/engine/worker.ts#getDraftBoard` | Engine/API exists; dedicated UI still pending. | advanced |
| front-office-briefing | Front Office Briefing | cadence-ui | Claude Sprint 01 docs | intake-only | `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md` | Documented for Claude lane, not present in source tree here. | experimental |
| action-queue | Action Queue | cadence-ui | Claude Sprint 01 docs | intake-only | `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md` | Intake candidate for Integration Window 01. | experimental |
| end-of-day-digest | End-of-Day / End-of-Week Digest | cadence-ui | Claude Sprint 01 docs | intake-only | `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md` | Not canonical until merged and validated. | experimental |
| first-week-onboarding | First-Week Onboarding | cadence-ui | Claude Sprint 01 docs | intake-only | `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md` | Good alpha candidate, but not merged here. | experimental |
| core-empty-states | Core Empty State System | cadence-ui | Claude Sprint 01 docs | intake-only | `docs/collaboration/MrBaseballDynasty_ClaudeCode_Assignment_01.md` | Needed for intake safety, but still branch-only. | experimental |
| analytics-heavy-wave-branch | 100-wave analytics branch | branch reference | collaboration docs | duplicate / superseded | architect packet, collaboration docs | Reference material only. Do not treat as canonical baseline. | shelved |

## Immediate conclusions
- The current canonical alpha loop is built around dashboard, standings, roster, trades, saves, postseason, and offseason.
- History, chemistry, owner pressure, and draft UI are real but not yet fully promoted as reliable player-facing core.
- Claude Sprint 01 work should be intake-merged deliberately, not treated as already canonical.
