# STATUS - Demo Event Readiness Sweep

Status: **COMPLETE** for the demo-readiness sweep and final demo-confidence pass. The game now has deterministic career milestone news/ticker data flow, persisted resumable open trade negotiations, stronger player-profile endpoint coverage, fictional team logo assets, a demo-safe feedback path, and updated verification notes. Save schema remains v33.

## What shipped

- Milestone news and ticker generation now use cumulative career totals before calling `generateNews`, and malformed milestone payloads fail closed instead of rendering `Unknown`, `#0`, `0th`, or `undefined`.
- Trade Center now loads persisted open negotiations on entry, shows an `Active Talks` section, autosaves negotiation state after trade actions, supports resume after reload, refreshes after negotiation actions, and deep-links with `?negotiationId=...`.
- Player Profile lazy panels for projections, breakout intelligence, scout consensus, and similar players now have focused non-null worker-data regression coverage.
- Added original SVG logo assets for all 32 fictional team ids under `apps/web/public/logos/`, plus a smoke test that catches missing logo files and confirms unknown ids still fall back to the monogram badge.
- Added a lightweight feedback form in Settings / About with GitHub issue draft and mailto fallback. No backend, no schema change, no new dependency.
- Removed unused legacy onboarding components flagged by `verify:structure` after confirming the revised onboarding route uses newer components.
- Dev-mode service worker registration is skipped so local demo reloads no longer log the expected Vite `sw.js` MIME failure; production build still generates the PWA service worker.

## Validation

All commands were run from `/Users/kevin/MBD-main` with:

```text
PATH=/Users/kevin/.nvm/versions/node/v24.14.0/bin:$PATH
```

```text
pnpm typecheck
```

PASS. Turbo reported `Tasks: 9 successful, 9 total` in `6.886s`.

```text
pnpm test
```

PASS. Turbo reported `Tasks: 8 successful, 8 total` in `1m36.19s`. Web passed 103 files / 640 tests. Sim-core passed 137 files / 1612 tests. Contracts passed 1 file / 20 tests. UI passed 1 file / 1 test. Existing non-fatal test console noise remains: Recharts zero-size warnings in jsdom, React `act(...)` warnings, the intentional service-worker failure-test log, and an existing ScoutingPage mock-function log.

```text
pnpm build
```

PASS. Turbo reported `Tasks: 5 successful, 5 total` in `5.465s`; Vite built in `4.16s`; PWA precached 152 entries.

```text
PLAYTEST_SEED=2601 PLAYTEST_YEARS=2 PLAYTEST_OUT=playtest-output/demo-readiness-sweep.md MBD_PLAYTEST_DUMP=1 pnpm --filter @mbd/sim-core exec vitest run tests/playtestNarrativeDump.generate.ts
```

PASS. One deterministic two-season narrative dump generated in `40.62s`.

```text
rg -n "Unknown|#0|0th|undefined" packages/sim-core/playtest-output/demo-readiness-sweep.md
```

PASS by no-match exit. The grep returned no milestone/news/ticker bad strings.

```text
pnpm run verify:structure
```

PASS with the repo's configured non-zero-exit suppression. The unused onboarding component files were removed, and the low-risk redundant `src/index.ts` Knip entry hints were cleaned from `knip.json`. Remaining known non-fatal output is broad Knip noise: unused dependency warning for `@mbd/design-tokens` in `packages/ui/package.json`, 193 unused exports, and 146 unused exported types.

## Browser smoke

Final browser smoke used:

```text
pnpm --filter @mbd/web dev --host 127.0.0.1 --port 5174
```

Port 5174 was occupied, so Vite served the app at `http://127.0.0.1:5175/MBD/`.

Browser smoke covered:

- Save Hub and Dashboard loaded the real Slot 1 New York Tycoons dynasty at Season 1, Day 2 with standings, roster health, trade intel, press digest, and logo assets.
- Trade Center created and persisted a real open BOS negotiation (`negotiation-0a7c-ebf6-ce93`) involving Ivan Morales for Marco Luzardo after advancing to the regular season.
- Reloading `/MBD/trade?negotiationId=negotiation-0a7c-ebf6-ce93` auto-resumed the active talk and restored the current response/builder state.
- Navigating back to plain `/MBD/trade` discovered `1 open negotiation`; clicking `Resume Talk` restored the same builder/current response state and updated the URL query.
- Player Profile smoke loaded Manuel Gomez at `/MBD/players/e19a9d3c-332e-41e6-ba57-6d387661f1ee`; Development and Scouting tabs loaded their lazy panels, including Development Trajectory, Breakout Intelligence, Scout Consensus, Similar Players, and the scouting report fallback note.
- Settings/About at `/MBD/settings` rendered the Feedback form. A synthetic report/contact entry updated the `Email Fallback` mailto body and left `Open Issue Draft` enabled.
- Final browser console error log was empty after the Settings/About smoke.

## Manual changed-file inventory

This local folder is not a git repo, so changed paths were recorded manually.

```text
GOAL.md
STATUS.md
knip.json
apps/web/public/logos/*.svg
apps/web/src/build/registerServiceWorker.test.ts
apps/web/src/build/registerServiceWorker.ts
apps/web/src/features/feedback/FeedbackButton.tsx
apps/web/src/features/feedback/FeedbackForm.tsx
apps/web/src/features/feedback/__tests__/FeedbackForm.test.tsx
apps/web/src/features/feedback/feedbackSubmit.ts
apps/web/src/features/feedback/index.ts
apps/web/src/features/onboarding/components/AGMPanel.tsx (deleted)
apps/web/src/features/onboarding/components/ChoiceSelector.tsx (deleted)
apps/web/src/features/onboarding/components/OnboardingComplete.tsx (deleted)
apps/web/src/features/onboarding/components/TypewriterText.tsx (deleted)
apps/web/src/features/players/routes/PlayerProfilePage.test.tsx
apps/web/src/features/settings/routes/SettingsPage.test.tsx
apps/web/src/features/settings/routes/SettingsPage.tsx
apps/web/src/features/trade/routes/TradePage.test.tsx
apps/web/src/features/trade/routes/TradePage.tsx
apps/web/src/shared/components/TeamLogo.test.tsx
apps/web/src/shared/components/TeamLogo.tsx
apps/web/src/workers/sim.worker.helpers.ts
apps/web/src/workers/sim.worker.milestones.ts
apps/web/src/workers/sim.worker.test.ts
apps/web/src/workers/sim.worker.ticker.ts
packages/sim-core/src/narrative/newsFeed.ts
packages/sim-core/tests/narrative.test.ts
packages/sim-core/playtest-output/demo-readiness-sweep.md
```

## Risks

- `verify:structure` still reports broad unused export/type noise and the unused dependency warning for `@mbd/design-tokens`. The true dead onboarding files and redundant Knip entry hints discovered by this sweep were cleaned.
- The local smoke created a Slot 1 browser save in the dev browser profile with an open BOS negotiation. That is demo-local state, not a repo artifact.
- This local folder is not a git repo, so the changed-file inventory above is manual.
