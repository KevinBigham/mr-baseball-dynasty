# MBD Reconciliation Audit

Date: 2026-03-15

Canonical repo of record:
- `/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean`

Donor/reference workspace:
- `/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE`

Scope guardrails honored:
- audit only
- no runtime/gameplay imports
- no deploy
- no push
- no deletes/moves

## Truth sources used

Primary truth:
- canonical repo working tree
- canonical repo-local docs (`README.md`, `HANDOFF_BIBLE_v2.md`, `docs/IMPROVEMENT_GUIDE.md`, `docs/collaboration/**`)

Secondary/reference only:
- donor tree structure, mtimes, and content
- donor docs for intent/context only

Unavailable hint paths named in prompt:
- `/Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-canonical-vs-handoff.txt`
- `/Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-canonical-latest-src.txt`
- `/Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-handoff-latest-src.txt`
- `/Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-post-verify-status.txt`

All four hint files were absent locally, so they were not used.

## Repo state summary

Canonical repo facts:
- git root: `/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean`
- branch: `task/mbd-repo-stabilize`
- dirty worktree: 34 modified, 29 untracked

Tree comparison summary (excluding `.git`, `node_modules`, `dist`; donor also excluded `archive`, `overflow`):
- canonical files scanned: 372
- donor files scanned: 353
- common files: 251
- common identical files: 205
- common different files: 46
- canonical-only files: 121
- donor-only files: 102
- donor-only docs/scripts: 14
- donor-only `src`/`public`: 88

Important nuance:
- 37 dirty canonical files are already byte-identical to donor copies, so they do not need donor re-import; they need canonical tracking/cleanup decisions.

## Verification results

Canonical repo:
- `npm run typecheck`: failed
- `npm run build`: failed for the same TypeScript errors
- `npm run test`: failed in 5 files / 13 tests

Canonical failure clusters confirmed from local run:
- stale `@ts-expect-error` usage and roster typing mismatches in:
  - `src/components/dashboard/PreseasonPanel.tsx`
  - `src/components/dashboard/TeamDetailModal.tsx`
  - `src/components/offseason/ExtensionPanel.tsx`
  - `src/components/stats/FinanceView.tsx`
  - `src/components/stats/PlayerProfile.tsx`
- worker/type drift in:
  - `src/engine/worker.ts`
- failing tests:
  - `tests/engine/draft.test.ts`
  - `tests/engine/careerStats.test.ts`
  - `tests/components/a11yAttributes.test.tsx`
  - `tests/components/CareerStatsTable.test.tsx`
  - `tests/validation/gates.test.ts`

Donor repo:
- structure and docs verified
- local `./scripts/verify-mbd.sh` did not reproduce because the donor workspace lacks a usable local TypeScript install and exits at `npx tsc --noEmit`
- donor docs claim a successful verify on 2026-03-14, but that claim was not reproducible from the donor tree as checked today

## Files clearly newer in donor and likely import candidates

High-confidence donor candidates are limited to files whose diffs are small, local, and directly line up with canonical type failures:

1. `src/components/dashboard/PreseasonPanel.tsx`
- donor removes dead `@ts-expect-error` directives and uses typed roster counts
- directly matches current canonical typecheck failures

2. `src/components/dashboard/TeamDetailModal.tsx`
- donor maps `Team` into modal state explicitly and removes dead suppressions
- directly matches current canonical typecheck failures

3. `src/components/offseason/ExtensionPanel.tsx`
- donor adds a typed extension-offer result shape and removes stale roster suppressions
- directly matches current canonical typecheck failures

4. `src/components/stats/FinanceView.tsx`
- donor aligns the roster shape with `getFullRoster()` instead of suppressing type errors
- directly matches current canonical typecheck failures

5. `src/components/dashboard/StandingsTable.tsx`
- donor removes an obsolete `@ts-expect-error` around `getStandings()`
- low-risk type-alignment candidate

6. `src/components/stats/CompareModal.tsx`
- donor removes stale `@ts-expect-error` usage and narrows leaderboard/profile handling cleanly
- low-risk type-alignment candidate

7. `src/components/dashboard/MidSeasonFAPanel.tsx`
- donor removes stale suppressions around `getFreeAgents()`/`signFreeAgent()`
- low-risk type-alignment candidate

8. `src/components/dashboard/PowerRankings.tsx`
- donor uses `standings.standings` instead of treating standings as a raw array
- likely newer shape alignment, but lower confidence than items 1-7 because it depends on current worker return shape

Notes:
- these are recommendations only; no imports were performed
- many other donor-different files are newer by mtime, but they are not safe high-confidence imports because they participate in a broader architectural slice

## Files clearly newer in canonical and should be kept

Keep canonical as the source of truth for:

- repo governance and collaboration docs:
  - `CODEX_COLLAB.md`
  - `CODEX_HANDOFF.md`
  - `HANDOFF_BIBLE.md`
  - `HANDOFF_BIBLE_v2.md`
  - `docs/collaboration/**`
  - `docs/IMPROVEMENT_GUIDE.md`

- CI/deploy/test infrastructure:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`
  - `vitest.workspace.ts`
  - `tests/**`

- styling/config truth:
  - `tailwind.config.ts`
    - donor version is materially smaller and would regress canonical theme tokens/focus styling

- canonical README/handoff truth:
  - `README.md`
    - donor README hardcodes the donor package as canonical root, which is false for this audit

- existing canonical worktree files already present and identical to donor:
  - keep the canonical copies already in place; do not re-import from donor
  - examples include `src/components/dashboard/DynastyMilestonesPanel.tsx`, `src/components/history/TransactionLog.tsx`, `src/components/shared/GameIcon.tsx`, `src/constants/icons.ts`, `src/engine/player/fakeStats.ts`

## Files that should stay donor-only

These files should not be imported into the canonical repo because they redefine repo truth around the donor workspace itself:

- `ACTIVE_WORKING_SET.md`
- `BACKLOG.md`
- `CALIBRATION_LOG.md`
- `CURRENT_PASS.md`
- `DECISIONS.md`
- `DOCS.md`
- `HANDOFF.md`
- `HOME_PANEL_RULES.md`
- `IMPLEMENT.md`
- `PLAN.md`
- `REPO_MAP.md`
- `SPEC.md`
- `VERIFY.md`
- `scripts/verify-mbd.sh`

Also keep donor-only / ignore:
- `src/components/.DS_Store`

Reason:
- these files name `/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE` as the canonical root
- that is incompatible with the real tracked repo truth for this audit

## Human-decision conflicts

These donor areas are newer, but should not be imported piecemeal without a deliberate human decision because they are a coordinated feature/system slice:

1. Save/schema/worker contract expansion
- `src/types/league.ts`
- `src/engine/worker.ts`
- `src/engine/persistence/saveManager.ts`
- `src/db/schema.ts`
- `src/utils/saveExport.ts`
- reason: donor introduces a large persisted-state expansion (`CURRENT_SCHEMA_VERSION = 9`) plus new dashboard/onboarding/front-office/clubhouse/game-day/talent state

2. HOME/dashboard snapshot architecture
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/HomeCommandCenter.tsx`
- `src/engine/dashboard/**`
- `src/hooks/useDashboardSnapshot.ts`
- `src/hooks/useGameDayEvidence.ts`
- `src/engine/workerCache.ts`
- reason: donor switches large parts of HOME to `DashboardSnapshot`-driven rendering and new engine APIs

3. Donor-only narrative/game-day/front-office/onboarding/talent feature slice
- donor-only `src/components/dashboard/*` panels such as:
  - `OpeningWeekPanel.tsx`
  - `FrontOfficeDeskPanel.tsx`
  - `DecisionFalloutPanel.tsx`
  - `PlayerWatchPanel.tsx`
  - `TalentDeskPanel.tsx`
  - `WhyNextSeriesMattersPanel.tsx`
- donor-only engine modules:
  - `src/engine/clubhouse/**`
  - `src/engine/frontOffice/**`
  - `src/engine/gameday/**`
  - `src/engine/onboarding/**`
  - `src/engine/season/**`
  - `src/engine/talent/**`
- reason: this is a broad product slice, not a file-by-file patch

4. Player/profile/history views tied to the new slice
- `src/components/stats/PlayerProfile.tsx`
- `src/components/history/SeasonTimeline.tsx`
- `src/components/stats/HistoryView.tsx`
- `src/components/roster/DevLab.tsx`
- `src/components/roster/ScoutingReports.tsx`
- reason: donor versions depend on new league types, talent snapshot APIs, or extended history structures

5. Simulation/history coupling
- `src/engine/sim/gameSimulator.ts`
- `src/engine/sim/incrementalSimulator.ts`
- `src/engine/sim/seasonSimulator.ts`
- `src/engine/yearInReview.ts`
- `src/store/leagueStore.ts`
- `src/App.tsx`
- reason: these appear to support the donor’s broader archive/snapshot/history flow and should be reviewed as a set

## Already present in canonical worktree

The following canonical dirty files are already byte-identical to donor copies. They are not donor import work for this audit; they are canonical tracking/cleanup work:

- `src/components/dashboard/PreseasonDashboard.tsx`
- `src/components/draft/AnnualDraft.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/Shell.tsx`
- `src/components/layout/ToastContainer.tsx`
- `src/components/offseason/TradeCenter.tsx`
- `src/components/roster/DepthChart.tsx`
- `src/components/roster/ProspectPipeline.tsx`
- `src/components/roster/RosterView.tsx`
- `src/components/stats/CareerStatsTable.tsx`
- `src/components/stats/FranchiseRecordsView.tsx`
- `src/engine/draft.ts`
- `src/engine/draft/draftPool.ts`
- `src/engine/player/generation.ts`
- `src/engine/roster/offseason.ts`
- `src/store/uiStore.ts`
- `public/icons/.gitkeep`
- `src/components/dashboard/DynastyMilestonesPanel.tsx`
- `src/components/draft/AnalystReaction.tsx`
- `src/components/draft/DraftGradeReport.tsx`
- `src/components/history/TransactionLog.tsx`
- `src/components/roster/CutAdvisor.tsx`
- `src/components/roster/FranchiseRatings.tsx`
- `src/components/roster/PositionBattles.tsx`
- `src/components/shared/AgingBadge.tsx`
- `src/components/shared/CoachTip.tsx`
- `src/components/shared/GameIcon.tsx`
- `src/components/shared/MilestoneCard.tsx`
- `src/components/shared/SortHeader.tsx`
- `src/components/stats/FinancialAdvisor.tsx`
- `src/constants/icons.ts`
- `src/data/coachTips.ts`
- `src/data/draftAnalysts.ts`
- `src/engine/player/fakeStats.ts`
- `src/hooks/useSort.ts`
- `src/utils/gradeColor.ts`
- `src/utils/statHighlight.ts`

## Recommended next reconciliation order

1. Normalize the canonical worktree first:
- separate already-present donor-identical files from locally divergent files

2. Pull in only the high-confidence type-alignment donor files
- `PreseasonPanel.tsx`
- `TeamDetailModal.tsx`
- `ExtensionPanel.tsx`
- `FinanceView.tsx`
- optionally `StandingsTable.tsx`, `CompareModal.tsx`, `MidSeasonFAPanel.tsx`, `PowerRankings.tsx`

3. Re-run canonical verification
- `npm run typecheck`
- `npm run test`
- `npm run build`

4. Treat the donor snapshot/onboarding/front-office/clubhouse/game-day/talent slice as a separate human-approved import plan

## Exact commands run

```bash
pwd
git rev-parse --show-toplevel && git branch --show-current && git status --short
ls -la /Users/tkevinbigham/Downloads/MBD && ls -la /Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean && ls -la /Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE
rg --files docs . | sed 's#^./##' | sort | rg '(^docs/|AGENTS\.md$|README|VERIFY|verify|triage|handoff|reconcile|reconciliation|status)'
find . \( -path './.git' -o -path './node_modules' -o -path './dist' \) -prune -o -type f -print | sed 's#^./##' | sort > /tmp/mbd_canonical_files.txt && wc -l /tmp/mbd_canonical_files.txt && sed -n '1,220p' /tmp/mbd_canonical_files.txt
find . \( -path './.git' -o -path './node_modules' -o -path './dist' -o -path './overflow' -o -path './archive' \) -prune -o -type f -print | sed 's#^./##' | sort > /tmp/mbd_donor_files.txt && wc -l /tmp/mbd_donor_files.txt && sed -n '1,220p' /tmp/mbd_donor_files.txt
printf 'Canonical docs:\n' && sed -n '1,220p' README.md && printf '\n--- VERIFY/HANDOFF hints ---\n' && sed -n '1,220p' HANDOFF_BIBLE_v2.md && printf '\n--- Improvement guide ---\n' && sed -n '1,220p' docs/IMPROVEMENT_GUIDE.md
printf 'Triage hint 1:\n' && sed -n '1,220p' /Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-canonical-vs-handoff.txt && printf '\n--- hint 2 ---\n' && sed -n '1,220p' /Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-canonical-latest-src.txt && printf '\n--- hint 3 ---\n' && sed -n '1,220p' /Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-handoff-latest-src.txt && printf '\n--- hint 4 ---\n' && sed -n '1,220p' /Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS/mbd-post-verify-status.txt
comm -23 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | sed -n '1,220p'; printf '\nCOUNT '; comm -23 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | wc -l
comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | sed -n '1,220p'; printf '\nCOUNT '; comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | wc -l
ls -la /Users/tkevinbigham/Desktop && ls -la /Users/tkevinbigham/Desktop/REPO_TRIAGE_REPORTS
rg -n "verify|typecheck|build|test|reconcile|reconciliation|handoff|dirty|task/mbd-repo-stabilize|postseason|Cannot read properties of undefined" README.md HANDOFF_BIBLE_v2.md CODEX_HANDOFF.md CODEX_COLLAB.md docs -g '!docs/_triage_imports/**'
printf 'README\n-----\n' && sed -n '1,220p' README.md && printf '\n\nVERIFY\n------\n' && sed -n '1,220p' VERIFY.md && printf '\n\nHANDOFF\n-------\n' && sed -n '1,260p' HANDOFF.md
printf 'CURRENT_PASS\n------------\n' && sed -n '1,220p' CURRENT_PASS.md && printf '\n\nPLAN\n----\n' && sed -n '1,220p' PLAN.md && printf '\n\nREPO_MAP\n--------\n' && sed -n '1,260p' REPO_MAP.md && printf '\n\nDOCS\n----\n' && sed -n '1,220p' DOCS.md
printf 'SPEC\n----\n' && sed -n '1,220p' SPEC.md && printf '\n\nACTIVE_WORKING_SET\n------------------\n' && sed -n '1,220p' ACTIVE_WORKING_SET.md && printf '\n\nDECISIONS\n---------\n' && sed -n '1,220p' DECISIONS.md
comm -12 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt > /tmp/mbd_common_files.txt && while IFS= read -r f; do if ! cmp -s "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f"; then cmt=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f"); dmt=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f"); csz=$(stat -f '%z' "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f"); dsz=$(stat -f '%z' "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f"); printf '%s|%s|%s|%s|%s\n' "$f" "$cmt" "$dmt" "$csz" "$dsz"; fi; done < /tmp/mbd_common_files.txt | sed -n '1,260p'; printf '\nDIFF_COUNT '; while IFS= read -r f; do cmp -s "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" || echo "$f"; done < /tmp/mbd_common_files.txt | wc -l
find src docs tests public . -type f \( ! -path './node_modules/*' ! -path './dist/*' ! -path './.git/*' \) -exec stat -f '%Sm|%N' -t '%Y-%m-%d %H:%M:%S' {} + | sort -r | sed -n '1,120p'
find src public . -type f \( ! -path './node_modules/*' ! -path './dist/*' ! -path './archive/*' ! -path './overflow/*' \) -exec stat -f '%Sm|%N' -t '%Y-%m-%d %H:%M:%S' {} + | sort -r | sed -n '1,120p'
for f in src/components/dashboard/Dashboard.tsx src/engine/worker.ts src/types/league.ts src/engine/persistence/saveManager.ts src/components/history/SeasonTimeline.tsx src/components/dashboard/HomeCommandCenter.tsx src/components/dashboard/TeamLeadersWidget.tsx src/components/roster/DevLab.tsx; do printf '\n===== %s =====\n' "$f"; diff -u --label canonical --label donor "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" | sed -n '1,220p'; done
for f in src/components/dashboard/WhyNextSeriesMattersPanel.tsx src/components/dashboard/SeriesStoryPanel.tsx src/components/dashboard/PlayerWatchPanel.tsx src/components/dashboard/HumanConsequencesPanel.tsx src/components/dashboard/TalentDeskPanel.tsx src/components/dashboard/DecisionFalloutPanel.tsx src/engine/dashboard/snapshot.ts src/engine/frontOffice/staffConflict.ts src/engine/season/seasonCadence.ts src/hooks/useDashboardSnapshot.ts src/hooks/useGameDayEvidence.ts; do if [ -e "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" ]; then printf 'CANONICAL_HAS %s\n' "$f"; else printf 'DONOR_ONLY %s\n' "$f"; fi; done
sed -n '1,220p' package.json
sed -n '1,260p' src/engine/persistence/saveManager.ts
sed -n '1,320p' /Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/src/engine/persistence/saveManager.ts
git ls-files | wc -l && git ls-files | sed -n '1,220p'
npm run typecheck
./scripts/verify-mbd.sh
git status --short --untracked-files=all | sed -n '1,240p'
for f in src/components/dashboard/DynastyMilestonesPanel.tsx src/components/dashboard/PowerRankings.tsx src/components/dashboard/TeamLeadersWidget.tsx src/components/draft/AnalystReaction.tsx src/components/draft/DraftGradeReport.tsx src/components/history/SeasonTimeline.tsx src/components/history/TransactionLog.tsx src/components/roster/CutAdvisor.tsx src/components/roster/FranchiseRatings.tsx src/components/roster/PositionBattles.tsx src/components/shared/AgingBadge.tsx src/components/shared/CoachTip.tsx src/components/shared/GameIcon.tsx src/components/shared/MilestoneCard.tsx src/components/shared/SortHeader.tsx src/components/stats/FinancialAdvisor.tsx src/constants/icons.ts src/data/coachTips.ts src/data/draftAnalysts.ts src/engine/player/fakeStats.ts src/hooks/useSort.ts src/utils/gradeColor.ts src/utils/statHighlight.ts; do donor="/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f"; canon="/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f"; if [ -e "$canon" ] && [ -e "$donor" ]; then if cmp -s "$canon" "$donor"; then printf 'IDENTICAL|%s\n' "$f"; else printf 'DIFFERS|%s\n' "$f"; fi; else printf 'MISSING_IN_ONE|%s\n' "$f"; fi; done
npm run test
while IFS= read -r line; do st=${line%% *}; file=${line#?? }; donor="/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$file"; canon="/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$file"; if [ -e "$donor" ]; then if cmp -s "$canon" "$donor"; then rel='same_as_donor'; else rel='differs_from_donor'; fi; else rel='donor_missing'; fi; printf '%s|%s|%s\n' "$st" "$file" "$rel"; done < <(git status --short --untracked-files=all)
npm run build
for f in src/components/dashboard/PowerRankings.tsx src/components/history/SeasonTimeline.tsx src/components/stats/PlayerProfile.tsx src/components/offseason/ExtensionPanel.tsx src/components/stats/FinanceView.tsx src/components/dashboard/PreseasonPanel.tsx src/components/dashboard/TeamDetailModal.tsx src/components/dashboard/AwardRacePanel.tsx src/db/schema.ts src/utils/saveExport.ts src/engine/league/ownerGoals.ts src/engine/workerCache.ts tailwind.config.ts; do printf '\n===== %s =====\n' "$f"; diff -u --label canonical --label donor "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" | sed -n '1,180p'; done
printf 'COMMON_IDENTICAL '; while IFS= read -r f; do cmp -s "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" && echo "$f"; done < /tmp/mbd_common_files.txt | wc -l && printf 'COMMON_DIFFERENT '; while IFS= read -r f; do cmp -s "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" || echo "$f"; done < /tmp/mbd_common_files.txt | wc -l
comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | awk '{ if ($0 ~ /^(src|public)\//) print }' | sed -n '1,220p'
comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | awk '{ if ($0 !~ /^(src|public)\//) print }' | sed -n '1,220p'
comm -23 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | awk '{ if ($0 ~ /^(src|public|tests|docs)\// || $0 ~ /^(vitest\.workspace\.ts|\.github\/workflows\/ci\.yml|\.github\/workflows\/deploy\.yml|CODEX_COLLAB\.md|CODEX_HANDOFF\.md|HANDOFF_BIBLE\.md|HANDOFF_BIBLE_v2\.md|README\.md)$/) print }' | sed -n '1,260p'
printf 'IDENTICAL_UNTRACKED_OR_MODIFIED_TO_DONOR\n'; while IFS= read -r line; do file=${line#?? }; donor="/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$file"; canon="/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$file"; if [ -e "$donor" ] && cmp -s "$canon" "$donor"; then printf '%s\n' "$file"; fi; done < <(git status --short --untracked-files=all)
printf 'MODIFIED '; git status --short --untracked-files=all | awk '$1=="M"||$1=="MM"||$1=="AM"||$1=="RM"||$1==" D"||$1=="MD"{c++} END{print c+0}' && printf 'UNTRACKED '; git status --short --untracked-files=all | awk '$1=="??"{c++} END{print c+0}'
printf 'DONOR_ONLY_SRC '; comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | awk '$0 ~ /^(src|public)\// {c++} END{print c+0}' && printf 'DONOR_ONLY_DOCS '; comm -13 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | awk '$0 !~ /^(src|public)\// {c++} END{print c+0}' && printf 'CANONICAL_ONLY '; comm -23 /tmp/mbd_canonical_files.txt /tmp/mbd_donor_files.txt | wc -l
while IFS= read -r line; do file=${line#?? }; donor="/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$file"; canon="/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$file"; if [ -e "$donor" ] && cmp -s "$canon" "$donor"; then echo "$file"; fi; done < <(git status --short --untracked-files=all) | wc -l
while IFS= read -r line; do file=${line#?? }; donor="/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$file"; canon="/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$file"; if [ -e "$donor" ] && ! cmp -s "$canon" "$donor"; then echo "$file"; fi; done < <(git status --short --untracked-files=all) | wc -l
for f in src/components/dashboard/StandingsTable.tsx src/components/stats/HistoryView.tsx src/components/stats/CompareModal.tsx src/components/layout/CrashScreen.tsx src/components/layout/SaveManager.tsx src/components/dashboard/PostseasonReport.tsx src/components/dashboard/PlayoffBracket.tsx src/components/dashboard/MidSeasonFAPanel.tsx; do printf '\n===== %s =====\n' "$f"; diff -u --label canonical --label donor "/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean/$f" "/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/$f" | sed -n '1,160p'; done
```
