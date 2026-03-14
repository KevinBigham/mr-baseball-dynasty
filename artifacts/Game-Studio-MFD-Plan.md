# MFD Plan — Mr. Football Dynasty

## What this game needs most right now

MFD does **not** need a full restart.

But it **does** need stricter file discipline than the other games.

Right now the biggest risk is not imagination.
It is **monolith drift**.

So the plan is:

**stabilize the monolith -> automate mirror safety -> keep feature slices tiny -> later decide whether to move to authored modules**

---

## Your goal for MFD

Get MFD to a place where:
- one file is the real source of truth
- mirrors are synced automatically
- every pass is small and testable
- postgame / continuity work keeps improving without breaking the game

---

## What you should do this week

### Step 1: Do not restart MFD from scratch
That would be a giant time bomb.

You already have real working progress on live-to-postgame continuity.

### Step 2: Declare one canonical source file
For now, that should be:
- `game.js` = human-authored source of truth

The mirrored files should be treated as outputs or synchronized copies.

### Step 3: Add repo memory files
- `AGENTS.md`
- `CURRENT_PASS.md`
- `HANDOFF.md`
- `README.md`
- `scripts/verify-mfd.sh`
- `scripts/sync-mirrors.sh`

### Step 4: Make verification one-click
Your verify script should do:
1. `node --check game.js`
2. `node --check` on mirror 2
3. `node --check` on mirror 3
4. sync mirrors if needed
5. confirm all 3 hashes match

### Step 5: Keep every pass narrow
Good MFD passes:
- one postgame carry-through
- one wording continuity pass
- one MFSN prep note
- one review fix

Bad MFD passes:
- redesign all postgame systems
- add multiple new hosts
- refactor everything and add features too

---

## What not to do on MFD

Do not:
- maintain multiple manually edited source files forever
- widen one pass into a buffet of football ideas
- add a second postgame system
- add fake analytics when clean evidence does not exist
- let three AIs touch the same monolith section at once

---

## The next 4 passes for MFD

### Pass 1 — Source-of-truth lock
Goal:
Make `game.js` clearly canonical.

Do:
- document this in `AGENTS.md`
- create `scripts/sync-mirrors.sh`
- create `scripts/verify-mfd.sh`
- stop hand-editing all copies separately

### Pass 2 — Release lane discipline
Goal:
Standardize the handoff pattern.

Do:
- every Codex pass returns exact changed seam
- every pass includes parse-check and hash-check
- Claude always reviews before push

### Pass 3 — Safe feature continuation
Goal:
Keep improving the player-facing learning loop.

Good targets:
- live final copy polish
- Home/Gameplan/postgame wording continuity
- one compact MFSN beat
- one narrow recap improvement

### Pass 4 — Authoring-source decision
Goal:
Decide whether to keep the monolith or create an authored `/src` version.

Important:
This is **not** a full rebuild.
It is a controlled authoring upgrade.

Only do this when the live feature lane is calm.

---

## Later MFD cleanup plan

Long term, the best shape is probably:
- authored source in `/src`
- generated `game.js`
- generated public legacy file(s)

But that should happen **later**, after the current gameplay and postgame loop settles.

Right now, the right move is safer process, not a dramatic rewrite.

---

## Simple success checklist

You are winning on MFD when:
- one canonical source is clear
- every pass stays narrow
- parse checks always pass
- mirror hashes always match
- live/postgame continuity keeps getting better
- nothing major breaks between passes

---

## Best AI setup for MFD

### ChatGPT
Use for:
- choosing the next narrow slice
- stopping scope creep
- writing exact task prompts

### Codex
Use for:
- the actual code changes
- parse checks
- mirror sync
- exact handoff notes

### Claude Code
Use for:
- regression review
- “is this still the same game?” checks
- push after approval

### Cowork
Use later for:
- release summaries
- status tracking
- comparing multiple handoffs

---

## Simple MFD rule

**Protect the monolith first. Improve it second. Replace its authoring model later if needed.**
