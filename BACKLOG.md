# BACKLOG.md — Mr. Baseball Dynasty

Items below are ordered by priority. The top item should match or feed into `NEXT_TASK.md`.
Only the Architect or Ops agent should reorder this list.

---

## HIGH PRIORITY — Engine Work

### MBD-008: Coaching Staff Active Effects ⬅️ NEXT
- Wire `FOTraitId` to actual bonuses (dev boost, scouting fog, injury reduction)
- Staff is selectable but effects are zero right now
- Owner: Codex

### MBD-009: Improved Trade AI
- Position-need targeting, surplus identification, prospect valuation, package deals
- Current AI generates somewhat random offers
- Owner: Codex

---

## MEDIUM PRIORITY — Features

### MBD-011: Historical Season Browser
- View past seasons' standings, stats, awards

### MBD-012: Manager/Coach Hiring UI
- Hire/fire staff between seasons with salary costs

### MBD-013: Expanded Playoff Experience
- Game-by-game playoff sim with box scores

### MBD-014: Season Awards Ceremony
- End-of-season ceremony screen

### MBD-015: Award Race on HOME Dashboard
- AwardRacePanel exists but isn't surfaced on home screen during season

---

## ENGAGEMENT SYSTEMS — Future Tracks

### MBD-020: Prospect Breakout System
- Prospects can have "breakout seasons" with accelerated development
- Hidden workEthic/mentalToughness already exist, wire them to farm events

### MBD-021: Trade Deadline Heat
- 48-hour in-game deadline window, increased AI offer frequency, rumor mill UI

### MBD-022: Post-Game Highlights / SportsCenter
- After each sim day, show 2-3 notable league-wide performances

### MBD-023: Richer Season Narrative Arcs
- Arc templates: Cinderella Run, Rebuilding Year, Dynasty Defense, Rivalry Showdown

### MBD-024: Expanded Press Conferences
- Context-aware questions after trades, losing streaks, prospect call-ups

---

## TECH DEBT

### MBD-030: Mixed Import Warnings
- `src/engine/engineClient.ts`, `src/db/schema.ts`, `src/components/layout/ErrorBoundary.tsx`
- Non-breaking but noisy in build output

### MBD-032: README Reconciliation
- Short 29-line deploy README in MRBD_HANDOFF_PACKAGE vs full 176-line README in clean root
- Confirm which is the public-facing version

---

## COMPLETED

### MBD-010: Fix Postseason TypeError Bug ✅ DONE (2026-03-21)
- Fixed by deep code review: 10 simulation engine fixes
- Committed, merged to main, deployed

### MBD-031: Deploy Fresh Bundle ✅ DONE (2026-03-21)
- Merged to main, GitHub Pages deploy pipeline ran successfully

### MBD-007: Player Personality & Chemistry v1 — Slice 1C (UI + Effects) ✅ DONE (2026-03-16)
- Bounded chemistry gameplay effects (cohesion + morale modifiers)
- Built by: Claude Code Sonnet 4.6, committed and merged

### MBD-006: Player Personality & Chemistry v1 — Slice 1B ✅ DONE
- Player bridge, roster aggregation, snapshot skeleton

---

## EXPLICITLY NOT IN NEXT SPRINT
- New persistence / save schema changes
- New politics subsystem
- New worker endpoints (until coaching staff wired)
- Route or panel expansion
