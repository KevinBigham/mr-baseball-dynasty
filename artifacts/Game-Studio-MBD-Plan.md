# MBD Plan — Mr. Baseball Dynasty

## What this game needs most right now

MBD definitely does **not** need a restart.

This repo is already the most structurally mature of the three.

Its main need now is **calibration and polish**, not demolition.

So the plan is:

**keep the architecture -> protect canonical seams -> calibrate with playthroughs -> ship with confidence**

---

## Your goal for MBD

Get MBD to a place where:
- the front-office / dashboard systems stay coherent
- the political proof-window system feels earned
- the copy reads like authored baseball, not template soup
- the repo memory and test discipline stay strong

---

## What you should do this week

### Step 1: Do not restart MBD
You already have strong architecture here.

Restarting would be a self-inflicted banana peel.

### Step 2: Protect the canonical seams
Keep these sacred:
- worker / engine truth
- typed contracts / DTOs
- `DashboardSnapshot` as canonical HOME surface
- no surprise side-truth invented in components

### Step 3: Add or confirm repo memory files
- `AGENTS.md`
- `CURRENT_PASS.md`
- `HANDOFF.md`
- `README.md`
- `scripts/verify-mbd.sh`

### Step 4: Treat this as a calibration repo
MBD is now about questions like:
- are the thresholds too eager?
- is the signal too noisy?
- does the proof window feel exact enough?
- does the closure copy feel earned?
- does the UI repeat itself too much?

That means small tuning passes beat giant rewrites.

---

## What not to do on MBD

Do not:
- rip apart the architecture
- add new persistence unless clearly necessary
- widen the politics system every pass
- let UI components create their own truth
- add giant new subsystems because the current one is interesting

---

## The next 4 passes for MBD

### Pass 1 — Repo memory lock
Goal:
Make the architecture rules explicit for every AI.

Do:
- document canonical seams in `AGENTS.md`
- document verify commands
- document “do not regress” bullets

### Pass 2 — Playthrough calibration
Goal:
Tune the current politics layer using actual feel.

Focus on:
- exact vs linked vs generic
- strong vs moderate vs thin
- family flavor differences
- copy density

### Pass 3 — Specificity and readability audit
Goal:
Make sure the active test and closure lines feel like one coherent case file.

Do:
- compare panels side by side
- reduce duplicated copy
- make the strongest line visually primary

### Pass 4 — Shipping polish
Goal:
Make the game easier to share and understand.

Do:
- README truth pass
- simple play instructions
- stable build verification
- clean release checklist

---

## Later MBD cleanup plan

Only later, if needed:
- more advanced fixture coverage
- smarter playthrough telemetry
- additional tuning helpers

But the base architecture is already good enough to keep building on.

---

## Simple success checklist

You are winning on MBD when:
- build/test still pass every time
- the HOME dashboard stays coherent
- proof windows feel earned
- weak cases stay cautious
- strong cases feel satisfying
- the baseball language sounds specific and authored

---

## Best AI setup for MBD

### ChatGPT
Use for:
- milestone planning
- design judgment
- threshold tradeoffs
- writing exact next-pass prompts

### Codex
Use for:
- implementation
- tests
- typed contract changes
- concise handoffs

### Claude Code
Use for:
- review
- regression hunting
- copy density / readability review
- push after approval

### Cowork
Use later for:
- packaging release notes
- comparing playtest results
- organizing tuning feedback

---

## Simple MBD rule

**Do not rewrite the foundation. Tune the living system.**
