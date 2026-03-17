# self_healing/ — Self-Healing Repository System

## What This Is
An automated detection and repair layer that keeps the codebase healthy between sprints. It can fix trivial issues automatically, suggest medium fixes, and discover complex opportunities.

## Authority Order
1. Repository instructions (FOREVER INSTRUCTIONS, AGENTS.md, NEXT_TASK.md)
2. `.codex/MBD/` durable memory
3. STUDIO_KERNEL/ guidance
4. auto_tasks/ suggestions
5. **self_healing/ automation (lowest priority)**

The self-healing system must NEVER modify:
- `NEXT_TASK.md`
- `BACKLOG.md`
- `STUDIO_KERNEL/`
- `.codex/` durable memory

## Three Healing Tiers

### Tier 1 — AUTO FIX (immediate, logged)
Trivial issues fixed automatically. Every fix logged in `AUTO_FIX_LOG.md`.

### Tier 2 — ASSISTED FIX (suggestion only)
Medium issues generate reviewed suggestions in `auto_tasks/REVIEWED/`.

### Tier 3 — DISCOVERY (task creation)
Complex issues become auto-tasks in `auto_tasks/DISCOVERED/`.

## Files
- `HEALING_RULES.md` — what can be auto-fixed and what cannot
- `SCAN_PROTOCOL.md` — when and how to scan
- `AUTO_FIX_LOG.md` — append-only record of all automatic repairs
