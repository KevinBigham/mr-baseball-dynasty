# Codex S03 — Alpha Gates & Truth Reports

Date: 2026-03-07  
Branch: `work`

## Scope
Implemented control-plane hardening to answer playable-alpha readiness with machine-readable evidence instead of heuristic summaries.

## Files touched
- `src/features/playableReadiness.ts` (new)
- `src/engine/worker.ts`
- `tests/engine/playableReadiness.test.ts` (new)
- `tests/integrity/diagnosticsSnapshot.test.ts` (new)

## Endpoints added/changed
- `runIntegrityAudit()` (refined buckets + new checks)
- `getPlayableReadinessReport()` (grounded gates + recommendations)
- `getDiagnosticsSnapshot()` (manifest/readiness/smoke/markers summaries)
- `getSmokeFlowReport()` (explicit alpha-loop step contract)

## Playable readiness gates implemented
Each gate now returns `gateId`, `pass`, `blocker`, `evidence`, `recommendation`.

1. `league_seeded`
2. `core_sim_path`
3. `integrity_audit`
4. `save_system_online`
5. `load_system_online`
6. `stage_state_coherence`
7. `smoke_flow`
8. `manifest_health`
9. `determinism_probe`
10. `latency_budget`

## Integrity buckets implemented
`runIntegrityAudit()` now separates:
- **blockers** (`severity: error`)
- **warnings** (`severity: warn`)
- **notes** (`severity: info`)

Added audit buckets/checks:
- duplicate team/player IDs
- dangling player/team references
- transaction reference integrity
- impossible roster states (40-man / 26-man overflow)
- stage/state mismatch
- save metadata defaults/fingerprint sanity
- manifest consistency findings relevant to alpha

## Diagnostics snapshot fields
Expanded `getDiagnosticsSnapshot()` with:
- manifest summary counts by status and tier
- readiness summary (`ok`, blocker count, gate count)
- smoke summary (`ok`, blocker count, step count)
- last-clean markers:
  - `lastIntegrityCleanAt`
  - `lastReadinessOkAt`
  - `lastSmokeOkAt`

## Hot files touched
- `src/engine/worker.ts` (single batched touch)

## Next move for Claude
Keep current briefing/digest/onboarding surfaces in `intake`; consume readiness/diagnostics reports as read-only truth without changing worker contracts.

## Next move for architect/integration
Wire CI artifact capture for:
- `getPlayableReadinessReport()`
- `runIntegrityAudit()`
- `getDiagnosticsSnapshot()`
- `getSmokeFlowReport()`

Then define a strict promotion rule that requires readiness blockers = 0 and integrity blockers = 0 before any intake-to-core transition.
