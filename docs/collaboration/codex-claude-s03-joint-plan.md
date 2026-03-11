# Codex × Claude Joint Development Plan (S03)

_Date: 2026-03-07_
_Branch baseline: `claude/baseball-dynasty-sim-UjlF2` + `codex/control-plane-s02` merged_

## 1) Shared Mission
Build the most playable, stable, and compelling baseball dynasty sim by pairing:
- **Codex** on reliability, contracts, and engine/control-plane hardening.
- **Claude** on player-facing cadence, onboarding clarity, and decision UX.

Success metric for this phase: players can open Home, understand stakes in <2 minutes, make one meaningful move, and safely simulate forward without crashes or confusing state.

## 2) Operating Model (No-Collision)

### Codex owns
- Engine + worker + bridge contracts.
- Validation gates, deterministic checks, CI gate artifacts.
- Feature manifest governance and intake state transitions.
- Save/load safety and migration reliability.

### Claude owns
- Home/Briefing/Onboarding/Digest UI modules.
- Prop-driven adapters and safe-empty-state UX patterns.
- Core-mode player information architecture copy and interaction flow.
- Intake packaging docs for player-facing feature batches.

### Hot-file handshake
Before either agent edits these files, post intent in `WAVE_OWNERSHIP_LEDGER.md` and validate no overlap window collision:
- `src/engine/worker.ts`
- `src/engine/bridge.ts`
- `src/features/featureManifest.ts`
- `src/features/viewRegistry.ts`
- `src/components/layout/Shell.tsx`
- `src/store/uiStore.ts`
- `src/components/dashboard/Dashboard.tsx`

## 3) 10-Day Execution Sequence

### Track A — Codex (stability/control plane)
1. Finalize feature truth matrix enforcement scripts in CI and nightly runs.
2. Promote intake candidates only with evidence links (typecheck/test/build + gate artifacts).
3. Harden save/import preflight reason matrix + migration tests.
4. Add deterministic artifact bundle versioning and delta summaries.

### Track B — Claude (player-facing loop)
1. Refine Briefing card copy, urgency ranking, and click-through affordances.
2. Expand `CoreEmptyState` adoption across key core tabs (no contract churn).
3. Tighten First-Week coach wording to drive one concrete weekly action.
4. Package each UI increment as intake docs + dependency map updates.

### Sync checkpoints (daily)
- **Morning:** lane claims + risk flags.
- **Midday:** hot-file check + blocker escalation.
- **Evening:** handoff note with changed files, tests run, and next first action.

## 4) Promotion Framework (Intake → Core)
A feature moves from `intake` only when all are true:
1. Linked to stable data source (no hidden assumptions).
2. Safe fallback state verified for missing/null/empty data.
3. No hot-file churn introduced after packaging pass.
4. `npm run typecheck`, `npm run test`, and `npm run build` green.
5. Manifest entry updated with owner, tier, deps, and evidence pointer.

Recommended promotion order for current UI batch:
1. `shared.coreEmptyStates`
2. `home.frontOfficeBriefing` + `home.actionQueue`
3. `home.endOfDayDigest`
4. `setup.firstWeekCoach`

## 5) Definition of Done for This Joint Phase
- Zero unresolved hot-file collisions.
- All collaboration docs reflect latest ownership and intake status.
- Feature truth matrix and manifest remain in sync.
- Core gameplay loop is clear, stable, and test-gated.
- Claude and Codex can resume from interruption using only docs + CI artifacts.

## 6) Immediate Next Actions (LFG)
### Codex next
- Execute promotion of `shared.coreEmptyStates` with evidence update in `feature_truth_matrix.md`.
- Open follow-up for save/import matrix tests if not already green in nightly.

### Claude next
- Perform low-conflict UX polish on Briefing/Action Queue readability.
- Prepare `S03` intake packet update with any copy/layout deltas and zero hot-file edits.

### Joint
- Hold one integration pass only after both tracks are green, then batch merge with a single manifest state transition update.

---

This plan is intentionally **stability-first + clarity-first**: no duplicate work, no merge chaos, and maximum forward velocity.
