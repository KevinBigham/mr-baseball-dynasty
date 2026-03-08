# AGENTS.md

## Project
Mr. Baseball Dynasty

## Mission
Build the greatest baseball franchise dynasty sim with a fast, trustworthy playable-alpha loop.

## Canonical truth order
1. shared collaboration branch
2. HANDOFF_BIBLE.md
3. docs/collaboration/COMMAND_CENTER.md
4. latest architect sprint note

## Global rules
- Do not add random features during stability sprints.
- Prefer additive changes over destructive rewrites.
- Push code before claiming completion.
- Report: branch, commit, files changed, hot files touched, blockers, next move.
- Never assume chat-only summaries are source of truth.
- Small PRs beat giant PRs.

## Hot files
- src/components/layout/Shell.tsx
- src/store/uiStore.ts
- src/engine/worker.ts
- src/features/*
- save/persistence files

## Review guidelines
- Prioritize blocker bugs, regressions, schema risk, and broken tests.
- Flag hidden coupling and hot-file churn.
- Flag any change that widens scope beyond the assigned sprint.
