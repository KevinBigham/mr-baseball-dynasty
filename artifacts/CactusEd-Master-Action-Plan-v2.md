# CACTUS ED'S HAPPY PLACE — MASTER ACTION PLAN v2
## Synthesized from 3 Expert Analyses (2,289 lines of feedback)

---

## EXECUTIVE SUMMARY

Three independent analyses agree on five things:
1. **The movement bones are excellent** — ratings range 6-9/10 across abilities
2. **World 1 is near-finished; Worlds 2-3 need authored density**
3. **Bosses need more attack patterns, phases, and learnable grammar**
4. **Visual parity (pixel sprites for W2/W3) is the #1 production gap**
5. **The ending concept is brilliant but needs one more layer: player participation**

All three also flag the same "must-have infrastructure": save system, gamepad support, assist mode.

The institutional voice is called "one of the game's best assets" — but ~10 lines break character with internet memes/meta-jokes and need replacement.

---

## PRIORITY TIER 1: CRITICAL PATH (Do First — Biggest Impact)
*These appear in ALL THREE analyses as top priorities*

### 1A. Movement Controller Parity (All 3 flag this)
World 1 has the full controller (apex gravity, ground/air friction split, jump cut, etc).
Worlds 2-3 reference simplified ED_MOVE constants.
**FIX:** Port the FULL World 1 movement controller to World 2 and World 3 scenes.

### 1B. Boss Hit Logic Fixes (All 3 flag this)
- Intake Counselor pointer laser: damage check scoped to `abs < 100` but visual reads arena-wide
- Attending Physician diagnose: slow check keys off `abs(ep.y - boss3.y)` but beam draws at player y
**FIX:** Make hit logic match visual telegraph exactly.

### 1C. Boss Phase 3 + New Attack Patterns (All 3 flag this)
Each boss needs 5-8 attacks across 3 phases. Current: 2-4 attacks, 2 phases.

**Intake Counselor additions (consensus):**
- Clipboard Shield: raises clipboard, immune from front for 2-3s, player must air-dash behind
- Stamp Queue: 3 floor lines lock lanes for 2s, must air-dash over
- Pamphlet Tornado: rotating gap pattern (Cuphead-style)
- Arena Reclassification (Phase 3): floor becomes slippery, boss changes movement rules

**Guidance Gardener additions (consensus):**
- Vine Lash Arc: roots pulse 0.8s telegraph, then thorny arc floor-to-ceiling
- Bloom Trap: seeds spawn harmless, bloom into thorns unless player stomps (slam counterplay)
- Grade Wave: arena highlights "approved" tiles, unapproved = slow
- Phase 3 — The Pruning: arena shrinks via hedge walls, boss gains quick-lunge

**Attending Physician additions (consensus):**
- Triage Zones: floor sectors A/B/C, one gets "coverage," others become danger
- Pre-Authorization Shield: boss immune until player hits 2 floating signature targets
- MRI Sweep: rotating beam with one moving safe pocket
- Prescription Patterns: replace random pills with 3-4 learnable spreads
- Phase 3 — Discharge: exit door appears and slowly closes, cramping arena

### 1D. Deterministic Pop Quiz Triggers (2 of 3 flag this)
Random quiz interrupts during precision platforming feel unfair.
**FIX:** Trigger quizzes at fixed x-coordinates (x=760, x=1140), not randomly.

### 1E. LocalStorage Save System (All 3 flag this)
**FIX:** Serialize world progress, health, aloe, run stats, behavior to localStorage.
Theme wrapper: "YOUR FILE HAS BEEN ARCHIVED."

### 1F. Gamepad Support (All 3 flag this)
**FIX:** navigator.getGamepads() polling + Phaser gamepad plugin.
Theme wrapper: "APPROVED INPUT DEVICE DETECTED."

---

## PRIORITY TIER 2: HIGH IMPACT (Do Next)
*Flagged by 2+ analyses as essential*

### 2A. Spin-Dash Overhaul (All 3 rate it 5-8/10, weakest movement verb)
Current: instant crouch-run, no real charge payoff.
**FIX:** 3 charge tiers (150ms / 300ms / 450ms) → 3 speed tiers (120 / 155 / 185).
Full charge breaks weak enemies. Smoke buildup during charge. Momentum preservation on exit.

### 2B. Triple Jump Identity (All 3 rate it 5-7/10)
Currently feels like "decaying leftover," not a reward.
**FIX:** Raise to 0.82-0.85× double jump. Add gold apex hang (80-110ms).
Give it unique SFX (not reusing djump). Add stronger horizontal carry option.

### 2C. Cig Copter Accessibility (All 3 rate it 6-7/10)
3 rapid taps within 280ms = hand fatigue, inconsistency.
**FIX:** Widen tap window to 320-340ms. Allow activation after double jump (not only triple).
Add hold-to-maintain + tap-for-burst model. Add accessibility toggle: auto-tap.
Add rhythmic rotor audio so player can "hear" the cadence.

### 2D. Pixel Art Sprites for W2/W3 (All 3 call this #1 visual gap)
Priority order (consensus):
1. Guidance Gardener boss sprite (48x64, 6 poses)
2. Attending Physician boss sprite (48x64, 6 poses)
3. World 2 enemy set: Pencil Trooper, Scantron Sentinel, Hall Pass Phantom, Substitute Teacher
4. World 3 enemy set: Pill Bug, Clipboard Drone, Wellness Bot, Insurance Adjuster

### 2E. Assist Mode (All 3 call this mandatory)
Celeste-grade accessibility wrapped in institutional satire.
Toggles: bigger coyote window, lower boss projectile speed, easier copter,
reduced shake/flash, health forgiveness, slower quiz timing.
Theme wrapper: "ACCOMMODATION REQUEST APPROVED" / "SEDATIVE DRIP ACTIVE"

### 2F. Receipt Terminal Rituals for W2/W3 (2 of 3 flag this)
Receipts are the lore. That power is too concentrated in World 1.
**FIX:** Wire full receipt terminals in Worlds 2 and 3 with zone-specific pools.

### 2G. Signature Minigames for W2/W3 (2 of 3 flag this)
World 1 has the Civic Tram Run. Worlds 2/3 need equivalents.
- World 2: "Bell Sprint" hallway auto-runner (avoid hall monitors + collect hall passes)
- World 3: "Insurance Phone Tree" (rhythm-based menu navigation parody)

---

## PRIORITY TIER 3: AUTHORED DENSITY (Polish the Worlds)
*Level design improvements from zone-by-zone audits*

### 3A. Dead Zone Elimination (All 3 identify same zones)
- W1 Zone D (Return Desk): add optional receipt memorial micro-route, pre-boss ceremony
- W2 Zone H (Graduation Lawn): add ceremony prop hazards, podium platform, diploma secret
- W3 Zone L (Recovery Garden): add plastic hedge walls, remove last enemy, add door sightline

### 3B. World 2 Platform Density +25-40%
Currently 31 platforms across 4 zones vs World 1's higher density.
Add teaching moments: wall-slide trellis in Garden, answer-lane platforms in Testing,
fake-left branch in Maze, ceremony choreography in Lawn.

### 3C. World 3 Platform Density +25-40%
Add waiting-room queue blockers, scanner tunnel in Diagnostic,
denial-fork routes in Pharmacy, hedge walls in Recovery.

### 3D. Enemy Repositioning (Specific coordinates from GPT 5.4 audit)
- W1: Move cone x300→275, mascot x1080→1135, clerk x1850→1880
- W2: Move Scantron x750→790, Phantom x1050→1010, Sub Teacher to upper path x1520
- W3: Move Wellness Bot x520→560, Insurance Adjuster x1550→1515

### 3E. Secret/Reward Placement
Every zone needs: one safe route, one skill route, one curiosity route.
Add high-route temptation pickups, hidden micro-alcoves, lore-only rewards.

---

## PRIORITY TIER 4: NARRATIVE POLISH

### 4A. Replace 10 Voice-Breaking Lines (All 3 flag same lines)
REMOVE: "MANDELA SAYS HI", "THE BOSS WAS YOU ALL ALONG. KIDDING.",
"CTRL+Z WON'T SAVE YOU HERE", "LOADING SCREEN OF YOUR LIFE",
"BUFFERING… BUFFERING… YOU", "DON'T READ THIS", "THE VOID CALLED. VOICEMAIL.",
"25% OFF EXISTENCE", "THIS IS FINE", "THE ALOE WAS INSIDE YOU"

REPLACE with institutional language: lines that sound like memos, not memes.

### 4B. Add 40 New Receipt Variants (20 from GPT 5.4 + 20 from Deep Research)
Both analyses provided excellent receipts organized by behavior current.
All written in document-organism voice. Ready to inject.

### 4C. Fix Text Encoding Issues
Yearbook quote has mojibake: "â€"" — fix em dash encoding.

### 4D. Behavior Consequences Players Can Feel
Not visible numbers. Visible consequences:
- Dominant chaos → different PA lines, NPC contempt
- Dominant curiosity → alternate signage, secret route openings
- Dominant compliance → NPC pity, "approved" route shortcuts
- Dominant grace → different final classification sentence

---

## PRIORITY TIER 5: AUDIO EVOLUTION

### 5A. Boss Phase Transition Stings
Brief timeScale freeze + world-specific "institution chord" + visual burst.

### 5B. Zone Entry Cues
0.3-0.6s PA chime/ding per world that marks "new department."

### 5C. Receipt Reveal Signature
Paper tear + thermal printer whine (procedural noise + resonant filter sweep).

### 5D. Ambient Zone Layers
- W1: fluorescent hum, stamp thumps, paper shuffle, distant printer
- W2: muffled chatter, pencil scratch, sneaker squeak, intercom chime
- W3: HVAC whoosh, ECG beep texture, pill rattle, cart wheel squeak

### 5E. Audio Degradation in Ending
Muzak → filters closing → LFO slowing → total silence.
One final PA chime that fails mid-tone.

---

## PRIORITY TIER 6: THE ENDING (Make It Transcendent)

All three analyses agree: the ending CONCEPT is perfect. The execution needs one more layer.

### 6A. Playable Walk-Out (All 3 recommend this)
After "THE DOOR WAS NEVER LOCKED." — give the player control.
Empty hallway. No enemies. No score. Just walk right. Footsteps and smoke.
The player CHOOSES to leave.

### 6B. Let the Door Line Breathe
Add 3-5 seconds of silence after "THE DOOR WAS NEVER LOCKED."
Don't rush to stats/credits.

### 6C. Ember Sound
After "THE CIGARETTE IS STILL LIT." — one cigarette ember crackle.
No chord. No extra text. Just ember.

### 6D. Credits Lead-In
Add "FINAL CLASSIFICATION: INCONCLUSIVE." before the three-line quote.
Move the quote to credits epigraph position, not emotional endpoint.

### 6E. Sequential Ability Stripping (Analysis 1's strongest idea)
During the final walk, silently disable abilities one by one based on x-coordinate.
Air dash → copter → glide → triple jump → double jump → kick → punch.
Eventually: only walk remains. Ed is reduced to his simplest self.
Then he walks through the door.

---

## PRIORITY TIER 7: INFRASTRUCTURE & SYSTEMS

### 7A. Remove "Proof of Concept" Language
The build still says "SNES UPDATE PROOF OF CONCEPT" and "PHASE 1 PROOF OF CONCEPT."
This is a complete 3-world game with credits. Remove self-deprecation.

### 7B. Embed Google Font as Data URI
Eliminate the one remaining external dependency beyond Phaser CDN.

### 7C. Performance Scaler
Particle budget system that degrades gracefully on low-end devices.

### 7D. Oversight Directives (Hades Heat Equivalent)
Post-clear modifiers: "Reduced Recovery Windows," "Stricter Billing,"
"Shorter Quiz Timers," "Additional Auditors."

### 7E. Receipt Archive
Post-clear diegetic archive: review receipts, brochures, posters, classifications.
Preserve mystery during play; reveal the trail after.

---

## IMPLEMENTATION ORDER (What to Build in Each Session)

### SESSION 1: Movement & Controller
- Port full W1 controller to W2/W3
- Spin-dash 3-tier charge
- Triple jump buff + unique SFX
- Copter accessibility (hold model + wider window)
- Wall jump detach lockout (120ms)
- Slam speed increase (400→550) + pre-drop hang (60ms)

### SESSION 2: Boss Evolution
- Fix Intake pointer + Physician diagnose hit logic
- Add 3 new attacks per boss
- Add Phase 3 to each boss
- Add boss phase transition stings
- Deterministic pop quiz triggers

### SESSION 3: Narrative & Voice
- Replace 10 voice-breaking lines
- Add 40 new receipt variants
- Fix encoding issues
- Wire receipt terminals in W2/W3
- Add behavior consequence hooks

### SESSION 4: Level Design
- Dead zone elimination (W1D, W2H, W3L)
- Platform density increase W2/W3
- Enemy repositioning
- Secret/reward placement
- Breathing room moments

### SESSION 5: The Ending
- Playable walk-out
- Ability stripping sequence
- Audio degradation
- Ember sound
- Credits restructure

### SESSION 6: Infrastructure
- LocalStorage save
- Gamepad support
- Assist Mode
- Remove POC language
- Embed font
- Performance scaler

### SESSION 7: Sprites (Requires Gemini Art Generation)
- Guidance Gardener boss (6 poses)
- Attending Physician boss (6 poses)
- W2 enemy set (4 enemies × 4 frames)
- W3 enemy set (4 enemies × 4 frames)
- Ed idle animation (4 frames)

---

## THE VERDICT (Consensus Across All 3 Analyses)

> "The bones are already smoking." — GPT 5.4

> "This is not 'far away' from greatness; it is unevenly close." — GPT 5.4

> "To become a GOTY contender, it does not need more 'stuff.'
> It needs: controller consistency, authored encounter density,
> bosses that teach and escalate, visual parity, and theatrical payoff." — GPT 5.4

> "What you'd need to change to make people talk about
> this game five years later." — Deep Research

The path is clear. Seven sessions. Let's build.
