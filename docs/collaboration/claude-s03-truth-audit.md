# Claude Sprint 03 — Truth Audit

**Date**: 2026-03-07
**Branch**: `claude/baseball-dynasty-sim-UjlF2`

---

## Audit Purpose

For each major cadence surface, document exactly what data drives it, how trustworthy each signal is, and what would improve it next.

---

## Front Office Briefing — Dials

| Dial | Signal Source | Real Fields | Heuristic Fields | Fallback Behavior | What Would Improve It |
|------|-------------|-------------|------------------|-------------------|----------------------|
| Contention Confidence | **Real** (when standings exist) / **Unavailable** (preseason) | `standings.pct`, `standings.gb`, `standings.wins` | Formula weighting (60% pct + GB proximity bonus) | Shows "NO DATA YET" with grayed bar before season starts | Pythagorean wins integration for smarter projection |
| Owner Patience | **Real** | `gameStore.ownerPatience` | None | Always available — defaults to initial value | Already fully wired |
| Market Heat | **Heuristic** | None directly | `gameStore.gamePhase` → phase-based proxy | Always shows phase-appropriate estimate | Real trade offer count from engine |
| Scouting Certainty | **Heuristic** | None (hardcoded 0.6) | Hardcoded default | Shows "LIMITED" with gray styling | Wire `scoutingQuality` from front office staff |
| Clubhouse Temperature | **Real** | `gameStore.teamMorale` | None | Always available — defaults to initial value | Already fully wired |

### Signal source badges

Each dial now displays a badge:
- **LIVE** (green) — real game data
- **EST** (yellow) — estimated from limited signals
- **N/A** (gray) — not enough data

The briefing header also shows a legend explaining these badges.

---

## Front Office Briefing — Story Thread Cards

| Card Slot | Signal Source | Real Data Used | Heuristic Logic | Fallback |
|-----------|-------------|---------------|----------------|----------|
| Urgent Problem | **Real** (mostly) | `ownerPatience`, `roster.active.length`, `roster.dfa.length`, `roster.il[].injuryInfo.daysRemaining`, `teamMorale` | Threshold-based cascade (patience ≤25, roster over/under, DFA pending, IL returns, heavy IL, morale ≤30) | "ALL CLEAR" card with green indicator when no urgent issue detected |
| Open Mystery | **Mixed** | `roster.minors[].potential/overall`, `standings[].gb`, `standings[].division` | Prospect breakout (OVR/POT gap > 20), tight division race (≤3 GB chasing or ≤2 GB defending) | Philosophical question ("What kind of GM will you be?") |
| Long Arc | **Real** (when history exists) | `franchiseHistory[].playoffResult`, `franchiseHistory[].wins` | Pattern detection (champion, 3x 85+ wins, 2x sub-70 wins) | Generic "Write the Next Chapter" narrative |

### Improvements in Sprint 03
- Added roster over-limit detection to urgent cascade
- Added DFA pending detection to urgent cascade
- Added "hold the lead" division race mystery (when user leads but chasers within 2 GB)
- Fallback mystery card now routes to roster (first season) or history (later) instead of finance tab
- "ALL CLEAR" card renders when no urgent issue, preventing blank slot

---

## Action Queue

| Task Category | Signal Source | Data Used | Fallback |
|---------------|-------------|-----------|----------|
| Roster over limit | **Real** | `roster.active.length > 26` | Not shown if legal |
| Roster below minimum | **Real** | `roster.active.length < 25` | Not shown if legal |
| IL returns | **Real** | `roster.il[].injuryInfo.daysRemaining <= 3` | Not shown if no imminent returns |
| Prospect pressure | **Heuristic** | `roster.minors[].overall >= 55 && age <= 24` | Not shown if no qualifying minors. Uses OVR threshold, not OVR delta (Codex data needed) |
| DFA pending | **Real** | `roster.dfa.length > 0` | Not shown if no DFA players |
| Owner warning | **Real** | `ownerPatience <= 30` | Not shown if patience healthy |
| Low morale | **Real** | `teamMorale <= 35` | Not shown if morale acceptable |
| Offseason moves | **Real** | `gamePhase === 'offseason'` | Not shown outside offseason |

### Improvements in Sprint 03
- Added `deadline` field to critical tasks ("Before next sim")
- Empty queue now shows honest "No pending actions" message instead of hiding entirely

---

## End-of-Day Digest

| Section | Signal Source | Data Used | Fallback |
|---------|-------------|-----------|----------|
| Standings | **Real** | `standings[].wins/losses/pct/gb/runsScored/runsAllowed` | Section omitted if no standings |
| Injury Report | **Real** | `roster.il[].name/position/injuryInfo` | Section omitted if no injuries |
| Roster Depth | **Real** | `roster.active/il/minors/dfa.length` | Section omitted if no roster data |
| Front Office Pulse | **Real** | `ownerPatience`, `teamMorale` | Always shown |
| Headlines | **Real** | `newsItems[].headline/icon/type` | Section omitted if no news |
| Recommended Next | **Real** (phase) + **Hardcoded** (copy) | `gamePhase` | Always shown with phase-appropriate text |

### Improvements in Sprint 03
- Added Roster Depth section (active/IL/minors/DFA counts)
- Added honest empty state when no digest blocks exist
- Recommended Next action always rendered (not conditional on blocks)
- "Fired" game phase now has appropriate copy instead of silent fallthrough

---

## League Pressure Strip

| Field | Signal Source | Data Used | Fallback |
|-------|-------------|-----------|----------|
| Division standings | **Real** | `standings[].wins/losses/gb/abbreviation/name/division/league` | Shows structured empty state: "No standings data yet. Start the season to see your division race." |
| User team highlight | **Real** | `userTeamId` | Falls back gracefully if user row not found |

### Improvements in Sprint 03
- Replaced minimal text empty state with structured card matching panel style

---

## First-Week Onboarding

| Step | Signal Source | Completion Check | Notes |
|------|-------------|-----------------|-------|
| Review Your Roster | **Heuristic** | `roster !== null` (data existence proxy) | Marks complete when roster data loads, not when user actually reviews |
| Check the Standings | **Heuristic** | `standings !== null` (data existence proxy) | Same as above |
| Start the Season | **Real** | `gamePhase === 'in_season' \|\| 'postseason'` | Accurate |
| Make Your First Roster Move | **Static** | Always `false` | No way to detect actual roster transactions yet |

### Improvements in Sprint 03
- Removed "Understand Your Budget" step (finance tab is not a reliable first-session surface)
- Shortened from 5 steps to 4 — all steps now target actions possible on current branch
- Added KEY TERMS glossary section with 40-Man, DFA, Option, Owner Patience definitions
- Reworded step copy to be more specific and actionable

---

## Shared Components

### CoreEmptyState
- **Signal Source**: None (fully prop-driven)
- **Fallback**: Always renders correctly
- **Status**: Ready for adoption by any tab

### GlossaryInlineTip
- **Signal Source**: None (fully prop-driven)
- **Fallback**: Always renders correctly
- **Status**: Now used in FirstWeekCoach KEY TERMS section

---

## Glossary Terms Added

Centralized in `src/utils/briefingAdapter.ts` as `GLOSSARY` export:

| Term | Used In |
|------|---------|
| Service Time | Available for inline tips |
| Option | FirstWeekCoach KEY TERMS |
| DFA | FirstWeekCoach KEY TERMS |
| 40-Man | FirstWeekCoach KEY TERMS |
| Waivers | Available for inline tips |
| Owner Patience | FirstWeekCoach KEY TERMS, dial tooltip |
| Contention Confidence | Dial tooltip |
| Scouting Certainty | Dial tooltip |
| Market Heat | Dial tooltip |
| Clubhouse Temperature | Dial tooltip |
| Run Differential | Available for inline tips |
| Pythagorean Wins | Available for inline tips |

---

## What Codex/Readiness Data Would Improve Next

1. **`scoutingQuality`** — Wire from front office staff ratings to replace hardcoded 0.6
2. **Active trade offer count** — Replace phase-proxy Market Heat with real trade activity
3. **`RosterPlayer.seasonalOVRDelta`** — Enable prospect pressure based on performance trajectory, not just static OVR threshold
4. **Contract expiration dates** — Enable real deadline tasks instead of phase-based proxies
5. **User action tracking** — Detect whether the user has actually reviewed roster/standings (not just data load) for onboarding accuracy
6. **Pythagorean wins** — Already on `StandingsRow` as `pythagWins` — could integrate into Contention Confidence formula
