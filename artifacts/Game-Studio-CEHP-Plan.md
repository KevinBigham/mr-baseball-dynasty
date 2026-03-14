# CEHP Plan — Cactus Ed's Happiest Place

## What this game needs most right now

CEHP does **not** need a full code restart.

It already has important runtime truth in place:
- `index.html` is the live gameplay truth
- the manual certification aid exists
- the real bottleneck is **honest human playtesting**

So the plan is:

**stabilize -> certify -> publish -> only then consider structural cleanup**

---

## Your goal for CEHP

Get CEHP to a place where:
- the public link works
- the unresolved World 2 / World 3 paths are honestly tested
- only real bugs get fixed
- the repo has durable instructions

---

## What you should do this week

### Step 1: Do not restart CEHP
Do not rebuild the game from scratch.

That would throw away real progress and working validation.

### Step 2: Treat `index.html` as the truth
For now:
- runtime truth lives in `index.html`
- docs help the AIs
- docs do not override runtime truth

### Step 3: Make sure these files exist
- `AGENTS.md`
- `CURRENT_PASS.md`
- `HANDOFF.md`
- `README.md`
- `FIRST_SESSION_REGRESSION_CHECKLIST.md`

### Step 4: Run only one CEHP lane at a time
Allowed lane types:
- certification lane
- bug-fix lane
- publish lane
- doc/README lane

Do **not** mix them.

### Step 5: Use the certification workflow exactly
For unresolved issues:
1. open the dev-only certification link
2. do 2–3 honest attempts
3. record exactly what happened
4. send notes to ChatGPT
5. ChatGPT turns notes into the next Codex prompt
6. Codex patches only confirmed defects
7. Claude reviews only that patch

---

## What not to do on CEHP

Do not:
- rewrite the architecture now
- split into modules right now
- do speculative cleanup in the middle of certification
- claim a bug exists without hand-play evidence
- let automation pretend it proved continuity when it did not

---

## The next 4 passes for CEHP

### Pass 1 — Repo memory cleanup
Goal:
Make the repo easy for AIs to read correctly.

Do:
- clean `README.md`
- confirm public play link
- confirm local play instructions
- confirm `AGENTS.md` says `index.html` is runtime truth

### Pass 2 — Human certification only
Goal:
Use the certification aid for W2 and W3.

Do:
- use `?certAid=w2`
- use `?certAid=w3`
- record literal observations
- do not propose fixes yourself

### Pass 3 — Confirmed defect fixes only
Goal:
Patch only what human evidence proves.

Do:
- classify each issue
- fix only confirmed defects
- re-run smoke checks

### Pass 4 — Publishing / release cleanup
Goal:
Make the game easy to play online.

Do:
- verify GitHub Pages link
- verify README play instructions
- optionally add playtest instructions for testers

---

## Later CEHP cleanup plan

Only after certification is stable:
- consider moving runtime logic from one giant `index.html` toward modular source files
- ship a generated `dist/index.html` or equivalent if you want
- do this as a separate architecture pass, not mixed with gameplay fixes

---

## Simple success checklist

You are winning on CEHP when:
- the live link works
- the unresolved segments are honestly tested
- fixes are based on player evidence
- the game is playable without dev confusion
- docs tell the truth

---

## Best AI setup for CEHP

### ChatGPT
Use for:
- interpreting your hand-play notes
- writing the next exact bug-fix pass
- keeping the scope tiny

### Codex
Use for:
- tiny certification-support fixes
- tiny gameplay fixes
- README / docs cleanup

### Claude Code
Use for:
- regression review
- README truth-check
- push to GitHub after approval

### Cowork
Use later for:
- organizing certification evidence
- release notes
- testing summaries

---

## Simple CEHP rule

**No big rewrite before honest certification is done.**
