# NEXT_TASK.md — The Task Beacon

There must ALWAYS be exactly ONE clearly defined next task here.
When this task is complete, the Architect or Ops agent replaces it with the next one.

> **WARNING: ONLY `TASK_OWNER_ROLE` grants activation.**
> If your role does not match `TASK_OWNER_ROLE`, STOP and propose only.
> `CURRENT_STAGE` and `NEXT_HANDLER_ROLE` are informational — they do NOT activate you.
> Write your proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` and end your session.
> **Edit metadata fields in place — never duplicate or append a second metadata block.**

---

TASK_ID: MBD-008
TITLE: Coaching Staff Active Effects
TASK_OWNER_ROLE: Architect
CURRENT_STAGE: Awaiting Spec
NEXT_HANDLER_ROLE: Builder (Codex)
STATUS: Ready for Architect to write spec. All prior work (MBD-010, MBD-031, Terminal Ascension, deep code review) is committed, merged to main, and deployed. 888/888 tests pass.
OWNER: Codex (Builder)
REVIEWER: Claude Code

## What to build
- Wire `FOTraitId` values to actual gameplay bonuses in the simulation engine
- Coaching staff is already selectable in the UI but effects are currently zero
- Expected bonuses: player development boost, scouting fog reduction, injury recovery improvement
- Architect needs to write the full spec before Builder begins

## Files expected to change
- `src/engine/` — coaching effect application during sim
- `src/ai/` — AI coaching evaluation logic
- Existing roster/staff UI components (if display of effects needed)
- Test files for coaching bonuses

## Files NOT to change
- Save schema/versioning files — no save-format change expected
- Chemistry gameplay effect files (MBD-007) — completed, avoid regressions
- Deployment workflow — MBD-031 is done

## Success criteria
- [ ] Each `FOTraitId` maps to a concrete, measurable gameplay effect
- [ ] Effects are bounded and balanced (no runaway bonuses)
- [ ] Determinism is preserved: same seed + same inputs = identical outcomes
- [ ] No save-schema changes
- [ ] Full verification is green (`test`, `tsc`, `build`)
- [ ] Focused tests cover coaching effect application

## Verification commands
```bash
cd /Users/tkevinbigham/Projects/MBD/ACTIVE/CODEBASE/mr-baseball-dynasty-clean
npm test
npx tsc --noEmit
npm run build
```
