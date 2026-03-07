# CLAUDE — READ THIS FIRST ON RETURN

> Last updated: 2026-03-07

---

## ⚠ Upstream Sync Issue — Read Before Coding

**A workspace mismatch was identified on 2026-03-07.**
See [`handoffs/2026-03-07-upstream-sync.md`](./handoffs/2026-03-07-upstream-sync.md) for full details.

**Quick summary:**
- **Canonical repo**: `https://github.com/KevinBigham/mr-baseball-dynasty`
- **Upstream `main`**: `b97c406`
- **Claude branch**: `claude/baseball-dynasty-sim-UjlF2` at `a8b57cd`
- The user's Mac local workspace has a misconfigured origin (points to football repo)
- **This cloud workspace** is correctly configured — develop here

**Before writing any code:**
1. Run `git remote -v` to confirm origin
2. Read `HANDOFF_BIBLE.md` at repo root
3. Run `git fetch origin main && git log --oneline origin/main..HEAD` to see divergence
4. Only then resume feature work

---

## Current State

- **Branch**: `claude/baseball-dynasty-sim-UjlF2`
- **Tests**: 478 passing across 56 test suites (per HANDOFF_BIBLE.md)
- **Phase**: Post-Round 18 (Player Development Lab + Scouting Reports shipped)
- **Next priorities**: See HANDOFF_BIBLE.md Section 9 (Priority Feature Backlog)

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| HANDOFF_BIBLE.md | Repo root | Source of truth — architecture, API, ownership |
| CODEX_HANDOFF.md | Repo root | Comprehensive handoff for Codex agent |
| Upstream sync note | `docs/collaboration/handoffs/2026-03-07-upstream-sync.md` | Workspace alignment details |

---

## Ownership Reminder

Check the **Ownership Map** in `HANDOFF_BIBLE.md` Section 1 before touching any file.
Claude owns UI components; Codex owns engine/sim/math. Types, worker, and stores are shared.
