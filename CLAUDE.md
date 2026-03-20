# CLAUDE.md — Agent Adapter

## Project
Mr. Baseball Dynasty

## Your role depends on which Claude you are:
- **Claude Code Sonnet 4.6** → Code Reviewer (review PRs, flag regressions, type safety)
- **Claude Cowork Opus 4.6** → Operations / Process Overseer (push to GitHub, update memory, manage process)

## Boot sequence
1. **Read `00_START_HERE.md` at the workspace root FIRST** — it is the single front door
2. Read `/Users/tkevinbigham/Projects/MBD/.codex/MBD/` (all 8 files)
3. Read `AGENTS.md` (this repo)
4. Read `NEXT_TASK.md` (current task beacon)
5. **GATE CHECK:** Read `TASK_OWNER_ROLE` in NEXT_TASK.md. If your role does not match `TASK_OWNER_ROLE`, **STOP — write a proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` and end your session.** (`TASK_OWNER_ROLE` is the ONLY activation key; `CURRENT_STAGE` and `NEXT_HANDLER_ROLE` are informational only.)

## Do NOT by default
- **Act when NEXT_TASK.md does not assign work to your role** (write a proposal instead)
- Rewrite worker/control-plane files (that's Codex's lane)
- Override architect decisions (that's ChatGPT's lane)
- Widen scope during stability sprints
- Touch hot files unless the sprint explicitly allows it
- Implement features when assigned to review (Reviewer must review only)

## Canonical runtime truth
- `DashboardSnapshot` is the canonical HOME read surface.
- `resolveFranchiseIntervention()` is the canonical write path.
- Worker and UI share typed DTOs. Changes to contracts need extra review.

## Required completion report format
```
Branch:
Commit:
Files changed:
Hot files touched:
Tests run:
Blockers:
Next move:
```

## Shared Memory Policy
- **Authoritative memory:** `.codex/MBD/` (the 8 canonical files)
- Agent-private memory is supplementary only — if it disagrees with `.codex/MBD/`, the files win
- See `00_START_HERE.md` → Shared Memory Policy for full details

## After every session
Update `.codex/MBD/`:
- `status.md` (current state)
- `handoff.md` (what to do next)
- `changelog.md` (what you did)
