# auto_tasks/ — Autonomous Task Discovery

## What This Is
Machine-generated development opportunities discovered through code, build, architecture, and gameplay scans. These are **suggestions only** — never active work items.

## Authority Order
1. Repository instructions (FOREVER INSTRUCTIONS, AGENTS.md, NEXT_TASK.md)
2. `.codex/MBD/` durable memory
3. STUDIO_KERNEL/ guidance
4. auto_tasks/ suggestions
5. self_healing/ automation (lowest priority)

## Directory Structure
```
auto_tasks/
  DISCOVERED/   — newly found issues (max 10 at a time)
  REVIEWED/     — Tier 2 assisted-fix suggestions from self-healing scans
  PROMOTED/     — tasks approved and moved to BACKLOG.md
  REJECTED/     — tasks triaged out with a note
```

## Rules
- Tasks here are **DISCOVERED**, not assigned
- No task in this folder is active until promoted to `NEXT_TASK.md`
- The generator may ONLY write into `auto_tasks/`
- The generator must NEVER write to: `.codex/`, `STUDIO_KERNEL/`, `NEXT_TASK.md`, `BACKLOG.md`

## Capacity Limits
| Folder | Max | When Exceeded |
|---|---|---|
| DISCOVERED/ | 10 | Archive lowest-impact to REJECTED/ with a note |
| REVIEWED/ | 20 | Triage each sprint — promote or reject |
| PROMOTED/ | No hard limit | Clears as tasks enter BACKLOG.md |
| REJECTED/ | No hard limit | Prune quarterly — delete entries older than 90 days |

Architect approval is required before any task moves from REVIEWED/ or DISCOVERED/ to PROMOTED/.

## Promotion Workflow
```
1. Scan discovers opportunity       → writes to DISCOVERED/
2. Self-healing suggests fix        → writes to REVIEWED/ (Tier 2 only)
3. Ops (Cowork) triages            → moves to PROMOTED/ or REJECTED/
4. Architect approves promoted      → adds to BACKLOG.md with task ID
5. Ops moves to NEXT_TASK.md       → becomes active work
```

## File Naming
One task per file. Format: `AT-NNN-short-title.md`

## Integration with Self-Healing
- Tier 1 (auto-fix) issues are fixed immediately and logged in `self_healing/AUTO_FIX_LOG.md`
- Tier 2 (assisted fix) suggestions go to `REVIEWED/`
- Tier 3 (discovery) tasks go to `DISCOVERED/`
- See `self_healing/HEALING_RULES.md` for the tier definitions
