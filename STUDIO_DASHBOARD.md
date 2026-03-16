# STUDIO DASHBOARD — Mr. Baseball Dynasty

> **Read-only mission control.** This file summarizes repository status. It does not store tasks, decisions, or architecture. Those live in their authoritative systems.
>
> **Last updated:** 2026-03-15 | **Updated by:** Claude Cowork Opus 4.6

---

## ACTIVE TASK

| Field | Value |
|---|---|
| TASK_ID | MBD-006 |
| TITLE | Player Personality & Chemistry v1 — Slice 1B |
| OWNER | Codex 5.4 (Builder) |
| REVIEWER | Claude Code Sonnet 4.6 |
| STATUS | Ready — waiting for Codex to pick up |

Source: `NEXT_TASK.md`

---

## BUILD HEALTH

| Check | Result | Last Run |
|---|---|---|
| `npx tsc --noEmit` | PASS | 2026-03-15 |
| `npm run test` | PASS (77 files, 703 tests) | 2026-03-15 |
| `npx vite build` | PASS (known warnings only) | 2026-03-15 |

Known warnings: mixed static/dynamic imports in `engineClient.ts`, `schema.ts`. Non-failing `TradeCenter` stderr in tests.

Source: `.codex/MBD/handoff.md`

---

## REPOSITORY HEALTH — 72%

| Signal | Status | Impact |
|---|---|---|
| Large files (>500 lines) | 9 files | -10% |
| Auto-tasks discovered | 8 open | -8% |
| TODO/FIXME comments | 2 found | -2% |
| Math.random() fallback | 1 instance | -3% |
| Console statements | 10 in production | -2% |
| Inline import() types | 8+ in types/ | -3% |
| Tests passing | All 703 | +0% (baseline) |
| TypeScript clean | Zero errors | +0% (baseline) |
| Build clean | Passes | +0% (baseline) |

Calculation: 100% baseline minus weighted deductions for code health signals.

---

## AUTONOMOUS TASKS

| Stage | Count |
|---|---|
| DISCOVERED | 8 / 10 max |
| REVIEWED | 0 |
| PROMOTED | 0 |
| REJECTED | 0 |

### Top 3 Highest-Severity Discoveries

| ID | Title | Complexity |
|---|---|---|
| AT-001 | Split worker.ts into domain modules | HIGH |
| AT-002 | Remove Math.random() fallback in frontOffice.ts | LOW (but determinism risk) |
| AT-008 | Replace inline import() types in league.ts | MEDIUM |

Source: `auto_tasks/DISCOVERED/`

---

## SELF-HEALING ACTIVITY

No automatic repairs applied yet. System installed 2026-03-15.

| Metric | Value |
|---|---|
| Total Tier 1 fixes | 0 |
| Last scan | N/A |
| Next scan trigger | After MBD-006 sprint completes |

Source: `self_healing/AUTO_FIX_LOG.md`

---

## KERNEL KNOWLEDGE

| Category | Entries |
|---|---|
| Lessons learned | 5 |
| Bug patterns | 6 |
| Architecture patterns | 7 |

### Recent Lessons
- Root confusion across dual folder structures (MBD, 2026-03-13)
- Token waste from legacy docs at repo root (MBD, 2026-03-15)
- Deploy bundle staleness from verification gap (MBD, 2026-03-14)
- Missing task beacon caused navigation overhead (MBD, 2026-03-15)
- Cross-agent memory drift without enforced protocol (Studio, 2026-03-15)

Source: `STUDIO_KERNEL/lessons_learned.md`, `bug_patterns.md`, `architecture_patterns.md`

---

## SPRINT STATUS

### Current: Sprint 07 — Process Overhaul (2026-03-15)
- **Goal:** Create AI-friendly cold-start system, 4-agent protocol, task beacon
- **Result:** Complete. Boot sequence operational. Kernel + auto_tasks + self_healing installed.
- **Next:** Codex picks up MBD-006 (Chemistry Slice 1B)

### Sprint History (7 sprints)
| Sprint | Date | Goal | Result |
|---|---|---|---|
| 01 | pre-03-07 | Initial build | Playable alpha, 478 tests |
| 02 | 03-07 | Codex onboarding | Two-agent workflow established |
| 03 | 03-08 | Cadence + dashboard | 703 tests, green branch |
| 04 | 03-11 | Chemistry Slice 1A | PR #15 merged, archetype rename |
| 05 | 03-13 | HOME copy audit | Dashboard polish, no engine changes |
| 06 | 03-14 | Repo stabilization | Durable memory bootstrapped |
| 07 | 03-15 | Process overhaul | Cold-start system, Kernel, auto-tasks, self-healing |

Source: `SPRINT_LOG.md`

---

## UPDATE PROTOCOL

This dashboard should be refreshed when:
- A new sprint begins
- `NEXT_TASK.md` changes (task completed or new task assigned)
- `auto_tasks/` scans complete
- `self_healing/` runs produce repairs
- `STUDIO_KERNEL/` knowledge is updated

The Ops agent (Claude Cowork) owns dashboard updates.

---

## AUTHORITY REMINDER

This dashboard is **read-only** and **rank 6** in the authority order:
1. Repository instructions
2. `.codex/MBD/` durable memory
3. STUDIO_KERNEL/ guidance
4. auto_tasks/ suggestions
5. self_healing/ automation
6. **STUDIO_DASHBOARD.md (this file — summary only)**

If this dashboard conflicts with any authoritative system, the authoritative system wins.
