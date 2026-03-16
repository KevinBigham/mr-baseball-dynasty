# AGENTS.md — Mr. Baseball Dynasty

## Project
Mr. Baseball Dynasty — browser-based baseball franchise dynasty simulator.

## Canonical cross-agent memory
- `/Users/tkevinbigham/Downloads/MBD/.codex/MBD/`
- Read `.codex/MBD/` files FIRST before doing any work.

## Active implementation root
- `/Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean`
- This is the ONLY repo you should modify, stage from, or verify against.

## Donor / reference tree (READ-ONLY)
- `/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE`
- Contains useful code history. Do NOT modify, stage, or verify against it.

---

## The 4-Agent Team

### ChatGPT 5.4 Pro — Architect / Game Director
- Owns: game design, feature specs, system architecture, sprint planning
- Writes: `NEXT_TASK.md`, architecture decision records, feature RFCs
- Edits: `docs/collaboration/COMMAND_CENTER.md` (architect-owned, others read-only)
- Does NOT: write implementation code directly

### Codex 5.4 — Primary Builder
- Owns: simulation engine, player systems, math layer, data files, tests, worker API
- Key files: `src/engine/**`, `src/types/**`, `tests/**`
- Reports: branch, commit, files changed, hot files touched, tests run, blockers
- Does NOT: modify architect docs, skip verification, push without green tests

### Claude Code Sonnet 4.6 — Code Reviewer
- Owns: code review, regression checks, type safety audits, test coverage gaps
- Reviews: every PR before merge
- Flags: hidden coupling, hot-file churn, scope creep, schema risk, broken tests
- Does NOT: implement features, modify architect docs, push to main

### Claude Cowork Opus 4.6 — Operations / Process Overseer
- Owns: process docs, GitHub pushes, durable memory updates, sprint log, backlog grooming
- Manages: `NEXT_TASK.md`, `SPRINT_LOG.md`, `BACKLOG.md`, `.codex/MBD/` updates
- Pushes: verified builds to GitHub after reviewer approval
- Does NOT: implement gameplay features, override architect decisions

---

## Workflow: How Work Flows Between Agents

```
1. ARCHITECT defines task     → writes NEXT_TASK.md
2. BUILDER implements         → works in active root, runs verification
3. REVIEWER reviews           → flags issues or approves
4. OPS merges + updates       → pushes to GitHub, updates durable memory
5. ARCHITECT picks next task  → cycle repeats
```

---

## Boot Sequence (Every New Chat)

### Step 0: Read the front door
Read `00_START_HERE.md` at the workspace root. It is the single entry point.

### Step 1: Read durable memory
Read ALL files in `.codex/MBD/` in this order:
1. `agent.md`
2. `status.md`
3. `plan.md`
4. `open_questions.md`
5. `runbook.md`
6. `handoff.md`
7. `decisions.md`
8. `changelog.md`

### Step 2: Read active repo docs
In `mr-baseball-dynasty-clean/`:
1. `AGENTS.md` (this file)
2. `NEXT_TASK.md`
3. `BACKLOG.md`

### Step 3: Check assignment
**Does `TASK_OWNER_ROLE` in NEXT_TASK.md match YOUR role?**
- YES → proceed to Step 4
- NO → **STOP. Do not self-assign.** Write a proposal into `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` and end your session.

> **`TASK_OWNER_ROLE` is the ONLY activation key.** `CURRENT_STAGE` and `NEXT_HANDLER_ROLE` are informational context — they do NOT independently grant activation.

### Step 4: Check working state
Before touching any code:
- `git branch --show-current`
- `git status --short --branch`
- Confirm no uncommitted user changes in hot files

---

## Hot Files (Coordinate Before Touching)
- `src/components/layout/Shell.tsx`
- `src/store/uiStore.ts`
- `src/engine/worker.ts`
- `src/features/*`
- `src/types/*` (shared contracts)
- save/persistence files

## Ignore by Default
- `archive/**`
- `overflow/**`
- `dist/**`
- `node_modules/**`
- `/Users/tkevinbigham/Desktop/MBD/**`
- `/Users/tkevinbigham/Downloads/MBD/MRBD_HANDOFF_PACKAGE/**`

## Required Verification (Before Claiming Done)
```bash
cd /Users/tkevinbigham/Downloads/MBD/mr-baseball-dynasty-clean
npx tsc --noEmit
npm run test
npx vite build
```

## Global Rules
- Do not add random features during stability sprints.
- Prefer additive changes over destructive rewrites.
- Push code before claiming completion.
- Small PRs beat giant PRs.
- Chat is temporary. Files are permanent.
- If chat and files disagree, files win.
- Update `.codex/MBD/` after every meaningful session.

---

## AI Studio Kernel

This repository is part of a multi-game AI development studio.
Shared studio knowledge lives in:
- `/Users/tkevinbigham/Downloads/MBD/STUDIO_KERNEL/`

### How to use the Kernel
- Agents may read Kernel files for shared principles, patterns, and lessons learned
- **Repository instructions always override Kernel guidance**
- When you discover something reusable (a bug pattern, architecture insight, or process improvement), write it into the appropriate Kernel file
- See `STUDIO_KERNEL/BOOT_SEQUENCE.md` for the full boot order

### Autonomous Task Discovery
- Machine-generated development opportunities live in `auto_tasks/`
- Organized into: `DISCOVERED/` → `REVIEWED/` → `PROMOTED/` or `REJECTED/`
- These are **suggestions only** — never active work items
- Promotion path: `auto_tasks/DISCOVERED/` → Ops review → Architect approval → `BACKLOG.md` → `NEXT_TASK.md`
- Maximum 10 tasks in DISCOVERED/ at any time
- See `auto_tasks/README.md` for discovery rules and task format

### Self-Healing Repository
- Automated detection and repair layer in `self_healing/`
- **Tier 1 — Auto Fix:** trivial issues (unused imports, console.log, trailing whitespace) fixed automatically and logged in `self_healing/AUTO_FIX_LOG.md`
- **Tier 2 — Assisted Fix:** medium issues generate suggestions in `auto_tasks/REVIEWED/`
- **Tier 3 — Discovery:** complex issues become auto-tasks in `auto_tasks/DISCOVERED/`
- Scans run after sprint completion, before releases, after large merges, and when NEXT_TASK.md changes
- The self-healing system must NEVER modify: `NEXT_TASK.md`, `BACKLOG.md`, `STUDIO_KERNEL/`, `.codex/`
- See `self_healing/HEALING_RULES.md` for what can and cannot be auto-fixed

### Studio Dashboard
- `STUDIO_DASHBOARD.md` — read-only mission control summary
- Shows: active task, build health, repo health score, auto-task counts, self-healing log, kernel knowledge, sprint status
- Ops (Cowork) updates after sprints, scans, or task changes
- Never stores tasks, decisions, or architecture — those live in their authoritative systems

### Stability Systems (Sprint 07f)

**Scan Automation:**
- `scripts/studio-scan.sh` runs all 4 scan types from SCAN_PROTOCOL.md in one command
- Usage: `./scripts/studio-scan.sh` (all) or `./scripts/studio-scan.sh code|build|arch|gameplay`
- Output: `scan-results.md` (gitignored, overwritten each run)
- The script is READ-ONLY — it reports signals, never modifies code

**Playtest Feedback:**
- `PLAYTEST_LOG.md` — Kevin records observations from actual gameplay sessions
- AI agents must NOT edit or delete existing entries
- Playtest feedback outranks automated suggestions when priorities conflict

**Health Trend Tracking:**
- `HEALTH_TREND.md` — tracks repo health score across sprints
- If the score drops for two consecutive sprints, schedule a tech-debt sprint
- Ops updates after each sprint or scan

**Operating Principles:**
See `STUDIO_KERNEL/studio_rules.md` for the full set. Key ones:
1. Prefer stability over clever automation
2. Prefer simplicity over new systems
3. NEXT_TASK.md is the only active task pointer
4. Playtesting feedback outranks automated suggestions

### Authority Order (Non-Negotiable)
1. Repository instructions (this file, `00_START_HERE.md`, NEXT_TASK.md)
2. `.codex/MBD/` durable memory
3. `PLAYTEST_LOG.md` human feedback
4. Kernel reference knowledge (advisory only)
5. `auto_tasks/` suggestions (advisory only)
6. `self_healing/` automation (advisory only)
7. `STUDIO_DASHBOARD.md` summary (read-only, lowest priority)

---

## The No-Task Rule (MANDATORY)

> **If NEXT_TASK.md does not assign work to your role, DO NOT ACT.**
>
> **DO NOT** self-assign tasks.
> **DO NOT** improvise work that seems helpful.
> **DO NOT** modify gameplay code, architect docs, or task files without explicit assignment.
> **DO NOT** implement features when assigned to review.
>
> **INSTEAD:** Write a proposal into `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` and stop.

Observed failure mode: when prompts are open-ended or no active task exists, agents improvise and cross lanes. **This rule exists to prevent that. When in doubt, stop.**

---

## Role Gate (MANDATORY — Every Agent, Every Session)

Before doing ANY work, every agent must pass this gate:

1. Open `NEXT_TASK.md`
2. Read `TASK_OWNER_ROLE`
3. **Does your role match `TASK_OWNER_ROLE`?**
   - Builder may only work when `TASK_OWNER_ROLE: Builder`
   - Reviewer may only work when `TASK_OWNER_ROLE: Reviewer`
   - Ops may only work when `TASK_OWNER_ROLE: Ops` OR explicit ops directive from Architect/Kevin
   - Architect always has authority to define tasks
4. **If your role does not match: STOP. Propose only. End session.**

> **`TASK_OWNER_ROLE` is the ONLY activation key.** `CURRENT_STAGE` and `NEXT_HANDLER_ROLE` are informational context — they do NOT independently grant activation.

A session that produces only a proposal in `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` is a **successful** session.
A session that crosses lanes or self-assigns is a **failed** session, regardless of code quality.

---

## Architect Absence Protocol

When the current task is complete and the Architect is not available:

1. **Builder and Reviewer may write proposals only** — into `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md`
2. **Builder may NOT write or modify `NEXT_TASK.md`** — only Architect or Ops may do that
3. **Only Architect or Operations may promote** `PROPOSED_NEXT_TASK.md` into `NEXT_TASK.md`
4. **Reviewer must NOT implement** unless explicitly reassigned by Architect or Kevin
5. If in doubt, stop. A session that only proposes is a successful session.

---

## Role Checklists

### Builder (Codex) — Before/During/After

- [ ] Read `00_START_HERE.md` at workspace root
- [ ] **GATE:** Check `NEXT_TASK.md` → `TASK_OWNER_ROLE` = Builder?
- [ ] **If NO: STOP. Write proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md`. End session.**
- [ ] If YES: implement ONLY the assigned task (no extras, no scope creep)
- [ ] Run verification: `npx tsc --noEmit && npm run test && npx vite build`
- [ ] Update `.codex/MBD/status.md`, `changelog.md`, `handoff.md` before closing

### Reviewer (Claude Code) — Before/During/After

- [ ] Read `00_START_HERE.md` at workspace root
- [ ] **GATE:** Check `NEXT_TASK.md` → `TASK_OWNER_ROLE` = Reviewer?
- [ ] **If NO: STOP. Write proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md`. End session.**
- [ ] If YES: review ONLY — do not implement anything
- [ ] Flag: hidden coupling, hot-file churn, scope creep, schema risk, broken tests
- [ ] Update `NEXT_TASK.md` status in place and update `.codex/MBD/status.md`, `handoff.md` before closing
- [ ] **Do NOT implement features unless explicitly reassigned by Architect or Kevin**

### Architect (ChatGPT) — Before/During/After

- [ ] Read `00_START_HERE.md` at workspace root
- [ ] Read `ACTIVE/CONTROL/ARCHITECT_PACKET.md` for current briefing
- [ ] Check `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md` for agent proposals
- [ ] Define next task in `NEXT_TASK.md` with all required metadata fields
- [ ] Update `BACKLOG.md` priority order if needed

### Operations (Claude Cowork) — Before/During/After

- [ ] Read `00_START_HERE.md` at workspace root
- [ ] **GATE:** Check `NEXT_TASK.md` → `TASK_OWNER_ROLE` = Ops OR explicit ops directive?
- [ ] **If NO: STOP. Write proposal to `ACTIVE/CONTROL/PROPOSED_NEXT_TASK.md`. End session.**
- [ ] Commit/push verified builds after reviewer approval
- [ ] Update `.codex/MBD/` durable memory
- [ ] Update `SPRINT_LOG.md`, `STUDIO_DASHBOARD.md`, `HEALTH_TREND.md`

---

## Shared Memory Policy

- **Authoritative memory:** `.codex/MBD/` (the 8 canonical files)
- Agent-private memory (ChatGPT context, Codex internal state) is supplementary only and **never authoritative**
- If private memory and `.codex/MBD/` disagree, `.codex/MBD/` wins
- Update `.codex/MBD/` after every meaningful session

---

## Architect Briefing

When the Architect needs to be briefed, prepare **one file only:**
`ACTIVE/CONTROL/ARCHITECT_PACKET.md`

This must be paste-ready for a blank ChatGPT 5.4 Pro chat. Do not create parallel briefing systems.

---

## BEFORE YOU CLOSE (Mandatory Exit Checklist)

- [ ] Did I only work on the role-assigned task?
- [ ] Did I update `.codex/MBD/status.md` with current state?
- [ ] Did I update `.codex/MBD/changelog.md` with what I changed?
- [ ] Did I update `.codex/MBD/handoff.md` with what the next agent should do?
- [ ] Did I update `NEXT_TASK.md` status in place (if task state changed)?
- [ ] Did I preserve the authority hierarchy?
- [ ] Did I avoid editing protected files without assignment?
- [ ] If no active task existed for my role, did I stop and propose instead of acting?
