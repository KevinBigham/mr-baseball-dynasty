# Feature Truth Matrix

Date: 2026-03-15
Owner: Codex

## Scope and evidence order

Truth order used for this matrix:
1. current source tree in this repo
2. `README.md`
3. `CODEX_HANDOFF.md`
4. collaboration docs

## Known mismatches
- Some collaboration docs still describe chemistry Slice 1B as future work; current source is ahead of those notes.
- Save/persistence files still use several stubbed helpers internally, but chemistry persistence, playoff artifact persistence, and dashboard hydration paths are present in source.

## Status legend
- `canonical`: implemented in current source tree and part of present playable loop
- `partial`: implemented and surfaced, but still missing gameplay depth or broader cleanup
- `duplicate / superseded`: reference only, not current source of truth
- `shelved`: intentionally deferred for alpha core

| featureId | title | area | source | status | evidence | notes | recommendedTier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dashboard | Dynasty Dashboard | home | source tree | canonical | `src/components/dashboard/Dashboard.tsx`, `src/engine/worker.ts#getDashboardBundle` | Dashboard bundle is now the canonical home/dashboard read contract. | core |
| standings | Standings | league | source tree | canonical | `src/components/dashboard/StandingsTable.tsx`, `src/engine/worker.ts#getStandings` | Worker row shape now satisfies both UI and playoff consumers. | core |
| roster | Roster Management | team | source tree | canonical | `src/components/roster/RosterView.tsx`, `src/engine/worker.ts#getFullRoster` | Dashboard/home surfaces hydrate roster summaries from canonical worker data. | core |
| player | Player Profile | stats | source tree | canonical | `src/components/stats/PlayerProfile.tsx`, `src/engine/worker.ts#getPlayerProfile` | Stable detailed player read surface. | advanced |
| leaderboards | Leaderboards | stats | source tree | canonical | `src/components/stats/Leaderboards.tsx`, `src/engine/worker.ts#getBattingLeaders` | Stable supporting read surface. | advanced |
| playoffs | Playoff Bracket | league | source tree | canonical | `src/components/dashboard/PlayoffBracket.tsx`, `src/components/playoffs/PlayoffBracketView.tsx`, `src/engine/sim/playoffSimulator.ts` | Standalone Playoffs tab now renders the real bracket artifact when available. | core |
| awards | Awards | history | source tree | canonical | `src/components/awards/AwardsView.tsx`, `src/engine/league/awards.ts` | Stable seasonal readout. | advanced |
| history | History | history | source tree | partial | `src/components/history/HistoryView.tsx`, `src/components/history/SeasonTimeline.tsx` | Timeline reads a broader news/event union now, but history still depends on several stubbed upstream feeds. | advanced |
| news | News Feed | league | source tree | canonical | `src/components/news/NewsFeedView.tsx`, `src/engine/league/newsFeed.ts` | Worker news now syncs directly into dashboard/home surfaces. | core |
| offseason-pipeline | Offseason Orchestration | engine | source tree | canonical | `src/engine/roster/offseason.ts`, `src/engine/worker.ts#advanceSeason` | Retirements, Rule 5, arbitration, FA, draft, and resets are in the active loop. | core |
| save-manager | Save/Load + Migration | persistence | source tree | canonical | `src/engine/persistence/saveManager.ts`, `src/engine/worker.ts#buildPersistedState` | Chemistry and playoff artifacts are already persisted in current worker state. | core |
| manifest-control-plane | Feature Manifest / Readiness Spine | control-plane | source tree | canonical | `src/features/*`, `src/engine/worker.ts` readiness endpoints | Present and still additive. | core |
| owner-goals | Owner Pressure / Mandates | engine | source tree | partial | `src/engine/league/ownerGoals.ts`, `src/components/dashboard/FranchisePanel.tsx` | Engine/read surfaces exist; mandate depth remains modest. | advanced |
| team-chemistry | Team Chemistry | engine + cadence UI | source tree | partial | `src/engine/league/teamChemistry.ts`, `src/engine/worker.ts#getDashboardBundle`, `src/components/home/FrontOfficeBriefing.tsx` | Worker-owned chemistry is now surfaced across dashboard/home/franchise panels; gameplay modifiers are still the next task. | advanced |
| trade-desk | Trade Suggestions / Counter / Execute | roster-market | source tree | canonical | `src/engine/trading.ts`, `src/components/offseason/TradeCenter.tsx` | TradeCenter error path is quieter/safer; deeper AI targeting is still future work. | core |
| free-agent-board | Free Agent Offers | roster-market | source tree | canonical | `src/engine/worker.ts#getFreeAgentBoard`, `src/components/offseason/FreeAgencyPanel.tsx` | Stable offseason decision loop. | core |
| draft-board | Amateur Draft Board API | engine | source tree | partial | `src/engine/draft.ts`, `src/components/draft/DraftRoom.tsx` | Core engine/UI exists; active branch work is still landing here. | advanced |
| front-office-briefing | Front Office Briefing | cadence-ui | source tree | canonical | `src/components/home/FrontOfficeBriefing.tsx`, `src/utils/briefingAdapter.ts` | Uses worker-owned chemistry as the canonical clubhouse input. | core |
| action-queue | Action Queue | cadence-ui | source tree | canonical | `src/components/home/ActionQueuePanel.tsx`, `src/components/dashboard/HomeCommandCenter.tsx` | Now surfaces chemistry-driven warnings in addition to roster/owner pressure. | core |
| end-of-day-digest | End-of-Day / End-of-Week Digest | cadence-ui | source tree | canonical | `src/components/home/EndOfDayDigest.tsx` | Includes cohesion/morale pulse plus recent clubhouse notes. | core |
| first-week-onboarding | First-Week Onboarding | cadence-ui | source tree | canonical | `src/components/setup/FirstWeekCoach.tsx` | Present in current source tree. | advanced |
| analytics-heavy-wave-branch | 100-wave analytics branch | branch reference | collaboration docs | duplicate / superseded | collaboration notes only | Reference material, not canonical source. | shelved |

## Immediate conclusions
- Source truth is ahead of the planning docs: chemistry Slice 1B, worker persistence, and dashboard/home surfaces are already implemented.
- The canonical alpha loop now includes worker-owned chemistry reads, real postseason bracket rendering, and deterministic front-office candidate generation.
- The next real gap is gameplay depth: bounded chemistry effects and follow-on AI/coaching balance work.
