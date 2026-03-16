# NEXT_TASK.md — The Task Beacon

There must ALWAYS be exactly ONE clearly defined next task here.
When this task is complete, the Architect or Ops agent replaces it with the next one.

> **WARNING: ONLY `TASK_OWNER_ROLE` grants activation.**
> If your role does not match `TASK_OWNER_ROLE`, STOP and propose only.
> `CURRENT_STAGE` and `NEXT_HANDLER_ROLE` are informational — they do NOT activate you.
> Write your proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` and end your session.
> **Edit metadata fields in place — never duplicate or append a second metadata block.**

---

TASK_ID: MBD-010
TITLE: Fix Postseason TypeError Bug
TASK_OWNER_ROLE: Builder
CURRENT_STAGE: Build
NEXT_HANDLER_ROLE: Reviewer
STATUS: Not started
OWNER: Codex (Builder)
REVIEWER: Claude Code

## What to build
- Reproduce the postseason sim crash that throws a TypeError and causes the bottom UI panels to disappear after sim.
- Identify the exact bad state/undefined access in the postseason sim → derived UI state → bottom-panel render pipeline; fix the root cause, not just the symptom.
- Make the affected bottom panels render safely after postseason sim even when postseason-specific data is temporarily absent or not yet derived, without masking legitimate state corruption.
- Keep the fix narrow: preserve current gameplay behavior, postseason outcomes, save compatibility, and deterministic seed behavior.
- Add focused regression coverage for the reproduced crash path and at least one defensive empty/partial-state render path.

## Files expected to change
- Existing postseason simulation/result-generation module(s)
- Existing season/postseason state selector(s), adapter(s), or view-model file(s) that feed the main screen after sim
- Existing React component(s) that render the affected bottom panels / postseason summary area
- Existing or new focused regression test file(s) covering postseason sim + render state
- `.codex/MBD/handoff.md`

## Files NOT to change
- Save schema/versioning files — no save-format change is expected for this bug fix
- Chemistry gameplay effect files from MBD-007 — completed work; avoid unrelated regressions
- Coaching staff / trade AI systems — separate backlog items (MBD-008, MBD-009)
- GitHub Pages / deployment workflow / dist artifacts — deployment is handled by MBD-031
- Protocol/control docs other than normal handoff notes — this task is a product bug fix, not a process refactor

## Success criteria
- [ ] The postseason TypeError is reproducible before the fix or captured by a failing regression test, and no longer occurs after the fix
- [ ] Simulating into or through the postseason no longer hides the bottom panels
- [ ] The affected panels render valid content when postseason data is present and degrade gracefully when data is incomplete
- [ ] No save-schema changes are introduced
- [ ] Determinism is preserved: same seed + same inputs still produce identical gameplay/postseason outcomes
- [ ] Focused regression tests are added/updated for the crash path
- [ ] Full verification is green (`test`, `tsc`, `build`)

## Verification commands
```bash
cd /Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean
npm test
npx tsc --noEmit
npm run build
```
