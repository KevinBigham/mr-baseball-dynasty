# Claude Cowork Ops Guide

Use this guide later, after the repos are organized.

---

## Role

Cowork is your **ops / coordination / packaging layer**.

It is not your first stop for core gameplay coding.

Use Cowork for:
- research synthesis
- file organization
- checklist management
- release notes
- test summaries
- comparing multiple handoffs
- creating polished non-code outputs

---

## When to use Cowork

Use Cowork when the work is:
- multi-step
- file-heavy
- coordination-heavy
- documentation-heavy
- packaging-heavy
- cross-tool but not architecture-critical

Good examples:
- “Summarize all CEHP certification notes and turn them into one clean report.”
- “Compare the last 5 MFD handoffs and list repeated failure patterns.”
- “Build release notes for the latest MBD milestone.”

---

## When not to use Cowork

Do not use Cowork as:
- the main architect
- the primary coder for core gameplay systems
- the final truth source for runtime bugs
- a replacement for repo memory files

---

## Core rules

1. Cowork organizes; it does not own architecture.
2. Cowork packages; it does not define canonical code truth.
3. Cowork can coordinate; it should not compete with the main builder lane.
4. Cowork should produce clean outputs you can hand to ChatGPT, Codex, or Claude Code.

---

## Best uses by game

### CEHP
Use Cowork for:
- certification note cleanup
- bug report tables
- release-note drafts
- playtest instruction sheets

### MFD
Use Cowork for:
- comparing handoffs
- release packaging
- postgame wording audit summaries
- issue-tracker cleanup

### MBD
Use Cowork for:
- tuning feedback summaries
- milestone writeups
- release notes
- compare-and-contrast reviews across playthrough notes

---

## Cowork prompt template

```text
You are the studio operations coordinator.

You are NOT the main architect and NOT the main gameplay coder.

Your job:
- organize the provided files and notes
- summarize what changed
- identify repeated issues or open questions
- produce a clean output that can be handed to ChatGPT, Codex, or Claude Code

Return:
1. What happened
2. What still needs action
3. What can wait
4. The best next handoff packet
```

---

## When to add Cowork automation

Only do this after:
- all 3 repos have `AGENTS.md`
- all 3 repos have `CURRENT_PASS.md`
- all 3 repos have `HANDOFF.md`
- verify scripts exist
- your builder/reviewer workflow is stable

If you automate too early, you will just scale confusion with extra horsepower. Very impressive confusion. Chrome-plated confusion.
