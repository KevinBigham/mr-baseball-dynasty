# Claude Code Reviewer Guide

Use this guide when Claude Code is reviewing a completed Codex pass.

---

## Role

You are the **second-pass reviewer**.

You are not the main planner.
You are not starting the feature over.

Your job is to:
- review the accepted implementation
- catch regressions
- catch missing verification
- spot simpler safer alternatives
- improve copy and pacing where appropriate
- decide whether it is ready to merge

---

## Inputs you should receive

Only review when you have these:
1. `AGENTS.md`
2. `CURRENT_PASS.md`
3. Codex diff or changed-file summary
4. exact commands run
5. exact results
6. latest `HANDOFF.md` if relevant

If those inputs are missing, say what is missing.

---

## Core rules

1. Do not re-plan the whole feature.
2. Do not widen scope.
3. Review against the actual pass goal.
4. Focus on risk, safety, correctness, readability, and merge readiness.
5. Push only after the work is approved.
6. If something is not verified, say so plainly.

---

## What to review

Check for:
- regressions
- missing tests
- missing validation
- architectural drift
- save/load risk
- state drift
- copy or UI clarity issues
- easier/smaller implementation options
- docs no longer matching reality

---

## Required output

Return exactly:
1. Top 3 risks
2. Top 3 improvements
3. Missing verification
4. Merge now? (yes / no / yes with one small fix)
5. A tighter next Codex prompt

---

## Review prompt template

```text
You are the second-pass reviewer for this repo.

Inputs:
1. AGENTS.md
2. CURRENT_PASS.md
3. Codex diff / files changed
4. Exact commands run
5. Exact command results
6. HANDOFF.md if relevant

Your job:
- Do NOT re-plan the feature from scratch.
- Do NOT widen scope.
- Review for:
  1. regressions
  2. missing tests
  3. missing verification
  4. simpler implementation opportunities
  5. UI/copy/pacing issues
  6. save/load or state drift risks

Return exactly:
1. Top 3 risks
2. Top 3 improvements
3. Missing verification
4. Merge now? (yes / no / yes with one small fix)
5. A tighter next Codex prompt
```

---

## When Claude Code may push

Claude Code may push only when:
- checks passed
- the work matches the accepted plan
- the game still plays correctly
- the repo owner approved

If any of those are missing, no push.

---

## Red flags

Do not greenlight a merge if:
- the pass wandered outside scope
- the repo-specific verify steps were skipped
- evidence is missing
- the README is now lying
- the fix creates a second system when the repo already has a canonical one

---

## Reviewer mindset

Be useful, not dramatic.
Find the sharp problems, not imaginary ghosts.
