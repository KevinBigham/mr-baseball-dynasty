# Studio Operating System

This is the simplest version of a real studio workflow that will still scale.

---

## Part 1 — What you should do every time

### Step 1: Pick one game only
Choose **one** of these:
- CEHP
- MFD
- MBD

Do not work on two games at once in the same pass.

### Step 2: Pick one pass only
A pass must be small enough to describe in one sentence.

Good:
- “Add CEHP manual certification instructions to README.”
- “Carry biggest swing from live game into MFD postgame modal.”
- “Tune MBD proof-window thresholds for bullpen cases.”

Bad:
- “Make the game better.”
- “Fix the whole UI.”
- “Refactor everything.”

### Step 3: Ask ChatGPT to write the brief
ChatGPT should return:
- Goal
- Why this pass exists
- Constraints
- Do not regress
- Done when
- Exact validation

### Step 4: Put that brief in `CURRENT_PASS.md`
That file becomes the source of truth for the active task.

### Step 5: Give Codex only the current pass
Do not dump your whole life story into the prompt.

Give Codex:
- repo path
- “read AGENTS.md first”
- “read CURRENT_PASS.md next”
- implement only this pass
- return exact commands run

### Step 6: Give Claude Code the review packet
Claude Code should get only:
- `AGENTS.md`
- `CURRENT_PASS.md`
- Codex diff
- exact commands run
- exact results
- request for risks + improvements + merge recommendation

### Step 7: You decide
You are the merge gate.

Even if Claude can push, do **not** let anything push straight to `main` until:
- the pass is done
- checks passed
- the game still works
- you understand what changed

---

## Part 2 — What files every repo should have

## 1. `AGENTS.md`
This tells AI tools how the repo works.

It should include:
- what the source of truth is
- build/test commands
- what not to change
- save/version rules
- file structure rules
- handoff format

## 2. `CURRENT_PASS.md`
This is the active task.

It should include:
- mission
- player target
- constraints
- validation
- done when

## 3. `HANDOFF.md`
This is what the builder writes after a pass.

It should include:
- what changed
- files changed
- exact commands run
- exact results
- risks
- next pass suggestion

## 4. `README.md`
This is for humans.

It should clearly answer:
- what the game is
- how to play it
- where the live version is
- how to run it locally

## 5. `scripts/verify.*`
This is your boring truth machine.

Every repo should have a one-command verification script.

Examples:
- `scripts/verify.sh`
- `scripts/verify-mfd.sh`
- `scripts/verify-cehp.sh`

---

## Part 3 — When to start a fresh chat

Start a fresh chat when:
- you change games
- you change goals
- the pass is done
- the AI starts getting confused
- the thread has too many old assumptions
- you need a clean reviewer pass

Do **not** restart just because the chat is old.

Restart because the **task boundary** changed.

## Best rule

### One task = one thread

That is your default.

### One game = many task threads

That keeps things clean.

### One studio = one master planning thread

That keeps the big picture alive.

---

## Part 4 — Simple GitHub workflow for a beginner

If you are new to GitHub, use this setup first:

### Install these
- GitHub Desktop
- VS Code
- the Codex tool you prefer
- Claude Code if you are using it locally

### Keep one folder per game
Example:
- `Cactus-Eds-Happy-Place`
- `Mr-Football-Dynasty`
- `Mr-Baseball-Dynasty`

### Keep one GitHub repo per game
Do **not** put all 3 games in one repo.

### Branch rule
Use:
- `main` = stable public version
- `task/...` = active work

Examples:
- `task/cehp-w2-certification`
- `task/mfd-postgame-parity`
- `task/mbd-threshold-tuning`

### Your merge rule
Only merge to `main` when:
- code checks passed
- playtest looks good
- reviewer approved
- README still tells the truth

---

## Part 5 — What each AI should and should not do

### ChatGPT
Should:
- plan
- simplify
- explain
- break work into slices
- write prompts
- compare tradeoffs

Should not:
- become the main source of repo truth
- own code diffs
- improvise around missing runtime evidence

### Codex
Should:
- implement
- read repo memory
- run verification
- report exactly what happened

Should not:
- decide broad product direction
- widen scope into 5 extra features
- fake certainty when runtime evidence is missing

### Claude Code
Should:
- review
- catch regressions
- propose safer simplifications
- confirm merge readiness
- push after approval

Should not:
- completely re-architect an accepted pass
- replace ChatGPT as planner
- add scope just because it “noticed” related stuff

### Cowork
Should:
- organize
- summarize
- coordinate
- package
- monitor checklists

Should not:
- become your first coding stop
- invent a second product strategy lane

---

## Part 6 — What to automate later

Do not automate everything on day 1.

First stabilize the human workflow.

Then automate only the boring parts:
- verify scripts
- formatting
- smoke checks
- hash checks
- release notes drafts
- checklist reminders

---

## Part 7 — Your immediate next actions

1. Put the templates from `/templates` into each repo.
2. Use the game-specific plans for the next 2 weeks.
3. Keep ChatGPT as architect.
4. Keep Codex as builder.
5. Keep Claude Code as reviewer only.
6. Delay Cowork automation until the repos are organized and predictable.
