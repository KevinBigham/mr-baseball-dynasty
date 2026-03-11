# Claude Code Assignment 01 — Cadence, Clarity, and the Weekly Heartbeat

Date: 2026-03-07
Owner: Claude Code (Opus 4.6)
Priority: Highest
Mode: Additive-first, low-conflict

## Mission

Build the **player-facing cadence spine** for Mr. Baseball Dynasty.

This sprint is about making the game immediately understandable and immediately compelling:
- what changed,
- why it matters,
- what the player can do next.

You are **not** here to add random extra dashboards.
You are here to make the core loop feel like a real front office.

## Your product target

A player should be able to open the game and, inside two minutes:
- understand the franchise situation,
- see the urgent problem,
- spot an open mystery,
- make one meaningful move,
- and know what to simulate toward next.

## Deliverables

### 1. Front Office Briefing stack
Create additive UI components for a Home / Briefing surface.

Recommended components:
- `src/components/home/FrontOfficeBriefing.tsx`
- `src/components/home/BriefingHeader.tsx`
- `src/components/home/UrgentProblemCard.tsx`
- `src/components/home/OpenMysteryCard.tsx`
- `src/components/home/LongArcCard.tsx`
- `src/components/home/LeaguePressureStrip.tsx`

### 2. Action Queue
Create a lightweight task queue surface.

Recommended components:
- `src/components/home/ActionQueuePanel.tsx`
- `src/components/home/ActionQueueItem.tsx`

The queue should support baseball tasks like:
- roster illegality
- IL / rehab decision
- prospect pressure
- trade-market ping
- owner warning
- contract / arb / deadline task

### 3. End-of-Day / End-of-Week Digest
Create a digest surface that compresses consequence.

Recommended components:
- `src/components/home/EndOfDayDigest.tsx`
- `src/components/home/DigestSection.tsx`

The digest should summarize:
- results
- standings movement
- injuries / returns
- hot/cold developments
- owner / market / clubhouse movement
- next recommended action

### 4. First-Week onboarding
Create a minimal “coach me through week one” layer.

Recommended components:
- `src/components/setup/FirstWeekCoach.tsx`
- `src/components/setup/NextBestActionPanel.tsx`
- `src/components/shared/GlossaryInlineTip.tsx`

Do not make a boring tutorial museum.
Teach through real baseball decisions.

### 5. Core empty-state system
Create reusable empty-state components for core tabs.

Recommended component:
- `src/components/shared/CoreEmptyState.tsx`

Every empty state must answer:
- what this area is for,
- why it matters,
- and what the player should do now.

## Required product behavior

The Home screen should surface **five top-line dials** in player language:
- Contention Confidence
- Owner Patience
- Market Heat
- Scouting Certainty
- Clubhouse Temperature

And **three story threads**:
- Urgent Problem
- Open Mystery
- Long-Term Arc

## Hot-file rules for this sprint

Avoid touching hot files until the end.

### You may freely touch
- new component files
- CSS / styling for new components
- docs
- helper adapters that do not mutate core contracts

### Coordinate before touching
- `src/components/layout/Shell.tsx`
- `src/store/uiStore.ts`
- `src/engine/worker.ts`
- `src/types/*`

If the new briefing stack can be delivered first as prop-driven components, do that.
Then do **one** small batched integration pass.

## Acceptance criteria

Your sprint is successful when:
- Briefing renders cleanly with real data **or** safe empty/fallback data.
- No component crashes on missing data.
- The player can click from a card into a relevant destination.
- The UI never directly mutates game state.
- The design stays consistent with the Bloomberg-terminal language already in the repo.
- No fake “mystery numbers” without labels.
- `npm run typecheck && npm run test && npm run build` all pass.

## Explicit non-goals

Do **not** do these in this sprint:
- no new deep analytics views
- no decorative theme experiments
- no giant nav churn
- no engine-side trade AI work
- no save-system work
- no bulk merge of wave features

## Deliverable note required

End with a markdown note named something like:
- `docs/collaboration/claude-s01-briefing-report.md`

Include:
- changed files
- any contracts you need Codex to expose
- hot-file changes made
- blockers
- best next move

## Stretch goal (only if everything above is clean)

Add the **Core Mode nav copy + IA spec** so the default nav is:
- Home
- Team
- Moves
- Org
- League
- History

Everything else can live in All Mode until proven worthy.
