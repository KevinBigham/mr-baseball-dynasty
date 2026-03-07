# Upstream Sync Note — 2026-03-07

> **Purpose**: Record the canonical upstream state so any new Claude or Codex session
> can verify its local workspace before writing code.

---

## Upstream GitHub Truth

| Item | Value |
|------|-------|
| **Canonical repo** | `https://github.com/KevinBigham/mr-baseball-dynasty` |
| **Upstream `main`** | `b97c406` — _Merge pull request #6 from KevinBigham/claude/baseball-dynasty-sim-UjlF2_ |
| **Claude branch** | `claude/baseball-dynasty-sim-UjlF2` at `a8b57cd` — _docs: add Codex collaboration note_ |
| **HANDOFF_BIBLE.md** | Present on `main` and Claude branch |
| **CODEX_HANDOFF.md** | Present on Claude branch (added in `82d7062`) |

---

## Local Workspace Warnings (from user's Mac environment)

The user's **other** local workspace (on macOS) had these issues:

| Problem | Detail |
|---------|--------|
| Git root | `/Users/tkevinbigham/Downloads` (parent of the actual project dir) |
| Current branch | `codexCactusEd` (not the canonical Claude branch) |
| Origin remote | Points to `mr-football-dynasty.git` (wrong repo) |
| HANDOFF_BIBLE.md | Not present locally in that workspace |

> **This cloud workspace** (`/home/user/mr-baseball-dynasty`) is correctly wired:
> origin → `KevinBigham/mr-baseball-dynasty`, branch → `claude/baseball-dynasty-sim-UjlF2`.

---

## Required Re-entry Sequence (for any new AI session)

1. **Confirm you are in the right repo.** Run `git remote -v` and verify origin is `mr-baseball-dynasty`.
2. **Read `HANDOFF_BIBLE.md`** at the repo root — it is the source of truth.
3. **Compare upstream `main` to your local branch** before writing any code:
   ```bash
   git fetch origin main
   git log --oneline origin/main..HEAD
   ```
4. **Resume wave work only after base is confirmed.**

---

## Recommended Sync Commands

### If starting fresh (preferred):

```bash
git clone https://github.com/KevinBigham/mr-baseball-dynasty.git
cd mr-baseball-dynasty
git checkout claude/baseball-dynasty-sim-UjlF2
cat HANDOFF_BIBLE.md
git log --oneline --decorate -5
```

### If inspecting the user's Mac workspace (fallback):

```bash
cd "/Users/tkevinbigham/Downloads/Mr Baseball Dynasty Sim Game/mr-baseball-dynasty"
git remote add upstream-baseball https://github.com/KevinBigham/mr-baseball-dynasty.git
git fetch upstream-baseball main claude/baseball-dynasty-sim-UjlF2
git log --oneline --decorate -5 upstream-baseball/main
git show upstream-baseball/main:HANDOFF_BIBLE.md | head -220
```

---

## Key Reminders

- **Do not trust the Mac local workspace as canonical.** It is nested inside a larger
  git repo and its `origin` points to `mr-football-dynasty`.
- **Do not re-create Codex hardening work blindly.** Diff upstream first, then port
  only what is actually missing.
- **This cloud workspace is clean** and can be used directly for development.
