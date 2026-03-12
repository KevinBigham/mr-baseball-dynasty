# Front Office Setup Fix Report

> Date: 2026-03-10
> Branch: `claude/front-office-setup-fix`
> Sprint type: Stability / P0 bug fix

---

## Root Cause

The "Confirm Staff and Start Dynasty" button failed because `handleStartGame` in `SetupFlow.tsx` called three worker methods that did not exist or had mismatched signatures:

1. **`engine.newGame(seed, userTeamId)`** — Worker's `newGame()` only accepts `(seed)`. The extra `userTeamId` arg was silently ignored, but the call was behind `@ts-expect-error`.
2. **`engine.setFrontOffice(frontOffice)`** — This method does not exist on the worker API at all. Calling it via Comlink threw a runtime error (`not a function`). This was the primary P0 blocker. Front office staff lives in the Zustand `gameStore`, not the worker.
3. **`engine.startDraft(startMode)`** — The compat layer's `startDraft()` takes no arguments. The `startMode` arg was silently ignored, but this was also behind `@ts-expect-error`.
4. **`setStandings(standings)`** — `getStandings()` returns `TeamStandingRow[]` but `setStandings()` expects `StandingsData` (`{ season, standings }`). Shape mismatch caused the standings display to break silently after game start.

When `setFrontOffice()` threw, the `catch` block set `error` state, but the error was only visible in the loading screen component. After `finally { setLoading(false) }`, the user was dumped back to the Front Office screen with no explanation — the P0 stuck-screen bug.

---

## Exact Files Changed

| File | Change |
|------|--------|
| `src/components/setup/SetupFlow.tsx` | Fixed `handleStartGame`: removed non-existent `engine.setFrontOffice()` call, fixed `newGame(seed)` signature, removed `@ts-expect-error` comments, wrapped standings into `StandingsData` shape, moved `setGameStarted(true)` after standings fetch, added `startError` prop to `FrontOfficeScreen`, added error display panel on FO screen, updated Rookie budget display from 22 to 30, wired difficulty-based candidate counts |
| `src/data/frontOffice.ts` | Updated `FO_BUDGET.rookie` from 22 to 30, added `FO_CANDIDATES_PER_ROLE` config (`rookie: 8, normal: 6, hard: 6`) |

---

## Hot Files Touched

None. `worker.ts`, `gameStore.ts`, `uiStore.ts`, and `Shell.tsx` were NOT modified.

---

## How the Runtime/Setup Mismatch Was Fixed

- **Removed** the `engine.setFrontOffice(frontOffice)` call entirely. FO staff is managed by Zustand's `gameStore.frontOffice`, not the worker. The worker has no concept of front office staff.
- **Fixed** `engine.newGame(seed)` — removed the extra `userTeamId` argument. The user's team ID is set via `setUserTeamId()` in the Zustand store.
- **Fixed** `engine.startDraft()` — removed the unused `startMode` argument.
- **Fixed** standings shape — wrapped `getStandings()` result into `{ season: 2026, standings: rows }` to match `StandingsData`.
- **Removed** all four `@ts-expect-error` comments from the critical start path. Zero contract drift remaining.

---

## Rookie Budget: Now 30M Everywhere

| Location | Before | After |
|----------|--------|-------|
| `src/data/frontOffice.ts` → `FO_BUDGET.rookie` | 22 | **30** |
| `src/components/setup/SetupFlow.tsx` → `DIFFICULTIES[0].foBudget` | 22 | **30** |

No other files reference the Rookie FO budget value. The two sources of truth are now aligned at 30M.

---

## Candidate Counts by Difficulty

| Difficulty | Candidates Per Role |
|------------|-------------------|
| Rookie | 8 |
| Normal | 6 |
| Hard | 6 |

Centralized in `FO_CANDIDATES_PER_ROLE` in `src/data/frontOffice.ts`. The `SetupFlow` FO screen reads this config instead of using a hardcoded `4`.

---

## Flow Verification Matrix

| Scenario | Expected Behavior | Status |
|----------|------------------|--------|
| Instant mode + no staff hired | `newGame(seed)` → skip FO → `setGameStarted(true)` | Fixed — no `setFrontOffice` call to throw |
| Instant mode + with staff hired | `newGame(seed)` → FO staff in Zustand only → `setGameStarted(true)` | Fixed — removed worker FO call |
| Draft mode + no staff hired | `newGame(seed)` → `startDraft()` → `setSetupScreen('draft')` | Fixed — clean contract |
| Draft mode + with staff hired | `newGame(seed)` → FO staff in Zustand only → `startDraft()` → draft screen | Fixed — removed worker FO call |
| Start failure | Error displayed on FO screen with red panel | Fixed — `startError` prop passed to `FrontOfficeScreen` |

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** — zero errors |
| `npm run test` | **PASS** — 590/590 tests, 66 suites |
| `npm run build` | **PASS** — production build successful |

---

## Blockers Remaining

None for this sprint's scope. Future considerations:

- The `TeamStandingRow` / `StandingsRow` type shapes differ slightly (`pct: string` vs `pct: number`, `pythWins` vs `pythagWins`). Current fix uses `as unknown as StandingsRow[]` cast. A proper type alignment between worker output and store types should happen in a future sprint (Codex-owned `worker.ts` type territory).
- FO staff effects are not wired to the simulation engine yet (noted in HANDOFF_BIBLE as backlog item C).

---

## Recommended Next Move

1. Codex aligns `TeamStandingRow` with `StandingsRow` in `worker.ts` to eliminate the `as unknown` cast.
2. Wire FO staff effects to the simulation engine (coaching staff bonuses).
3. Smoke test the draft flow end-to-end in browser after this fix lands.
