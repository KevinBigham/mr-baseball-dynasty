# 🏈 MR. FOOTBALL DYNASTY — Architecture Strategy
## Synthesized from Claude, Gemini, and ChatGPT Deep Research Reports

**Date:** Feb 17, 2026 | **Current State:** v36 "The Iron Bank" | **12,688 lines / 941KB single-file .jsx**

---

## WHERE ALL THREE REPORTS AGREE (The Five Truths)

Every report independently identified the same core principles:

| # | Truth | Current State | Gap |
|---|-------|--------------|-----|
| 1 | **Normalized state + reducer** beats nested useState soup | 97 `useState` hooks, 0 `useReducer` | 🔴 Critical |
| 2 | **Save compression + versioned migration** is non-negotiable | JSON saves via `window.storage`, migration exists but no compression | 🟡 Partial |
| 3 | **Virtualized rendering** for large lists (rosters, stats) | 278 `.map()` calls render full DOM, 0 virtualization | 🔴 Critical |
| 4 | **Web Workers** for heavy simulation (season sim, AI) | All computation on main thread | 🟡 Deferred (artifact constraint) |
| 5 | **Progressive disclosure** — reveal complexity gradually | All tabs visible from start; 15+ office sub-tabs | 🟡 Design choice |

---

## WHAT'S ACTUALLY POSSIBLE (Artifact Constraints)

MFD runs as a Claude artifact. This means:

| ✅ CAN DO | ❌ CANNOT DO |
|-----------|-------------|
| `React.memo`, `useMemo`, `useCallback` | `npm install` (no packages) |
| Inline Web Worker via Blob URL | Import external libraries (react-window, lz-string, dexie) |
| `window.storage` API (Claude persistent storage) | `localStorage`, `IndexedDB`, `Service Worker` |
| CSS optimizations, `content-visibility` | PWA manifest, offline caching |
| Manual virtualization (render visible rows only) | `react-window` / `react-virtualized` |
| Manual LZ compression (inline algorithm) | `lz-string` npm package |
| `JSON.stringify` / clipboard export | File System Access API |
| All React hooks | Zustand, Redux, external state managers |

**Key insight:** Most performance wins are available without any dependencies. The three highest-impact changes — memoization, manual virtualization, and state consolidation — are pure React patterns.

---

## PRIORITY TIERS: What to Build and When

### 🔴 TIER 1 — "STOP THE BLEEDING" (v37)
*Biggest performance impact, zero new features, pure engineering*

#### 1A. Memoize All Sub-Components
**Why:** Every `useState` update re-renders the ENTIRE 12,688-line component. With 97 state variables, clicking a single button triggers a full re-render cascade.

**How:**
```jsx
// BEFORE: inline function recreated every render
{my.roster.map(function(p){ return <div>...</div>; })}

// AFTER: memoized component, stable reference
var PlayerRow = React.memo(function PlayerRow({p, onSelect, onCut}) {
  return <div>...</div>;
});
// In render:
{my.roster.map(function(p){ 
  return <PlayerRow key={p.id} p={p} onSelect={handleSelect} onCut={handleCut} />;
})}
```

**Targets:** PlayerRow, TeamCard, DraftProspectRow, TradePlayerChip, ScheduleRow, StandingsRow, NewsItem, StatRow — the 8 components rendered inside `.map()` loops.

**Impact:** 60-80% reduction in unnecessary DOM work.

#### 1B. Manual List Virtualization (Roster + Draft Board)
**Why:** Rendering 53+ roster players or 300 draft prospects creates 1,500-5,000+ DOM nodes per tab. Only ~15 rows are visible at once.

**How:** Track scroll position, calculate visible range, render only those rows + 5 overscan:
```jsx
var VISIBLE = 20;
var [scrollTop, setScrollTop] = useState(0);
var ROW_H = 44;
var startIdx = Math.floor(scrollTop / ROW_H);
var visiblePlayers = sorted.slice(startIdx, startIdx + VISIBLE);

<div style={{height: sorted.length * ROW_H, position: 'relative'}}
     onScroll={function(e){ setScrollTop(e.target.scrollTop); }}>
  {visiblePlayers.map(function(p, i){
    return <PlayerRow key={p.id} p={p} 
      style={{position:'absolute', top:(startIdx+i)*ROW_H}} />;
  })}
</div>
```

**Targets:** Roster list (53-90 players), Draft board (300 prospects), Free agent list (60+), Stat leaders (32+ teams), History/records tables.

**Impact:** DOM nodes drop from 3,000+ to ~100. Scrolling becomes buttery.

#### 1C. Save Compression
**Why:** A 10-season save is 2-5MB of JSON. Claude's `window.storage` has a 5MB per-key limit. Saves will fail silently on long dynasties.

**How:** Inline a minimal LZ compression (the core algorithm is ~40 lines):
```jsx
// Lightweight LZW compress/decompress (no dependency needed)
function lzCompress(str) { /* ~40 lines of LZW */ }
function lzDecompress(compressed) { /* ~30 lines */ }

// In doSave:
var raw = JSON.stringify(saveData);
var compressed = lzCompress(raw);
window.storage.set("mr-football-save", compressed);
```

**Impact:** 70-80% smaller saves. Dynasties can run 30+ seasons without hitting storage limits.

#### 1D. SAVE_VERSION → 36 Migration
**Why:** v36 added `trueOvr`, `scouting`, `scouts`, `ownerSpendRate`, `cashSpent` to data model. Old saves need migration.

**Status:** Migration code EXISTS at line 5307 but `SAVE_VERSION` is still 35.

**Fix:** Change `var SAVE_VERSION=35;` → `var SAVE_VERSION=36;`

---

### 🟡 TIER 2 — "SMOOTH OPERATOR" (v38)
*UX polish that makes it feel professional*

#### 2A. Consolidated State Object
**Why:** 97 individual `useState` calls means 97 potential re-render triggers. Grouping related state reduces renders and simplifies `doSave`.

**How:** Consolidate into 4-5 state groups:
```jsx
// CURRENT: 97 separate hooks
var [teams, setTeams] = useState([]);
var [myId, setMyId] = useState(null);
var [sched, setSched] = useState([]);
var [season, setSeason] = useState({...});
// ... 93 more

// TARGET: 4 logical groups
var [core, setCore] = useState({teams:[], myId:null, sched:[], season:{...}, fas:[], dc:[]});
var [ui, setUI] = useState({tab:'home', posF:'ALL', selectedGame:null, ...});
var [trade, setTrade] = useState({teamId:null, myP:[], aiP:[], myPk:[], aiPk:[], msg:''});
// Use refs for non-rendering values
var txLogRef = useRef([]);
```

**Impact:** State updates that touch `teams` no longer trigger re-renders of trade UI. Tab switches don't re-process game data.

#### 2B. Export Save as Copyable String
**Why:** All three reports emphasize the Cookie Clicker / Kittens Game pattern: compress → base64 → copy to clipboard. This is the zero-infrastructure cross-device solution.

**How:**
```jsx
function exportSaveString() {
  var raw = JSON.stringify(_save);
  var compressed = lzCompress(raw);
  var b64 = btoa(compressed);
  navigator.clipboard.writeText(b64);
  addN("📋 Save code copied to clipboard! Paste on any device.", "green");
}

function importSaveString(str) {
  var compressed = atob(str.trim());
  var raw = lzDecompress(compressed);
  var data = JSON.parse(raw);
  // ... run migration, load
}
```

**Impact:** Players can transfer saves between devices with zero backend.

#### 2C. Keyboard Shortcuts
**Why:** Power users (like you) want to navigate fast. All three reports recommend this.

**Bindings:**
- `Space` → Advance/Sim Week
- `D` → Dashboard, `R` → Roster, `S` → Standings, `T` → Trade
- `O` → Office, `C` → Cap Lab
- `Escape` → Close modal / player detail
- `Ctrl+S` → Manual save

#### 2D. Dark/Light Theme Toggle
**Why:** Long sessions. Eye strain. All three reports mention it. Currently hardcoded dark theme.

**How:** CSS custom properties with a `data-theme` attribute. Already half-done via the `T` (theme) object — just needs a light variant and toggle button.

---

### 🟢 TIER 3 — "THE ARCHITECT" (v39-v40)
*Structural refactors for long-term scalability*

#### 3A. useReducer Migration
**Why:** All three reports (especially ChatGPT's ZenGM analysis) identify `useReducer` as the correct pattern for game state. Every game action becomes a discrete, testable dispatch.

**How:** Incremental migration — start with the core game loop actions:
```jsx
function gameReducer(state, action) {
  switch(action.type) {
    case 'SIM_WEEK': return simWeek(state);
    case 'SIGN_PLAYER': return signPlayer(state, action.pid, action.salary);
    case 'TRADE': return executeTrade(state, action.sent, action.received);
    case 'CUT_PLAYER': return cutPlayer(state, action.pid);
    case 'ADVANCE_PHASE': return advancePhase(state);
    default: return state;
  }
}
var [game, dispatch] = useReducer(gameReducer, initialState);
```

**Impact:** Testable state transitions. Undo/redo becomes trivial (save previous state). Replay/deterministic simulation possible.

#### 3B. Normalized Data Model
**Why:** Currently players are nested inside team objects. Every trade/cut requires `find()` + `filter()` + reassign. With normalized data, it's a simple ID swap.

```jsx
// CURRENT (nested):
teams[0].roster = [{ id:'p1', name:'Smith', ovr:85 }, ...]

// TARGET (normalized):  
players: { 'p1': { name:'Smith', ovr:85, teamId:'t1' }, ... }
teams: { 't1': { playerIds: ['p1','p2',...], wins:8, ... } }
```

**Impact:** O(1) player lookups. Trades become ID swaps instead of array surgery. Smaller save files (no duplicated player data).

#### 3C. Inline Web Worker for Season Simulation
**Why:** Simming a full season (17 weeks × 10 games) blocks the UI for 2-5 seconds. An inline Blob worker keeps the UI responsive.

```jsx
var simWorkerCode = 'self.onmessage = function(e) { /* sim logic */ postMessage(results); };';
var blob = new Blob([simWorkerCode], {type:'application/javascript'});
var worker = new Worker(URL.createObjectURL(blob));
worker.onmessage = function(e) { setTeams(e.data.teams); };
worker.postMessage({teams, sched, season});
```

**Constraint:** This MAY not work in Claude's artifact sandbox. Worth testing.

#### 3D. Historical Stats Pagination
**Why:** After 10+ seasons, history/records tables can have thousands of entries. Currently all rendered to DOM.

**How:** Show current season + paginated access to historical data. Load from compressed storage on demand.

---

## WHAT TO IGNORE (For Now)

These are recommendations from the reports that DON'T apply to MFD's current architecture:

| Recommendation | Why Skip |
|---------------|----------|
| Firebase / Supabase cloud sync | Requires backend infra. Artifact can't make authenticated API calls. |
| PWA + Service Worker | Artifact runs inside Claude's renderer, not as standalone web app. |
| WebGL / Canvas rendering | MFD is a management sim, not a graphical game. DOM is correct. |
| WebAssembly (Rust/C++) | Overkill for turn-based sim math. JS is fine. |
| WebSocket multiplayer | Single-player game. No multiplayer planned. |
| Phaser / Three.js / Pixi.js | Wrong paradigm entirely. This is a spreadsheet game with soul. |
| TypeScript migration | Single-file constraint makes this impractical. |
| npm dependencies | Can't install packages in artifact environment. |

---

## THE ROADMAP

```
v36 ✅ THE IRON BANK (current)
 │   Contract coherence, fog-of-war scouting, explain panels
 │
v37 🔴 THE GLASS CANNON → STEEL FRAME
 │   Memoize 8 sub-components, virtualize roster+draft,
 │   save compression, SAVE_VERSION=36, bug fixes
 │   Est: 1 session
 │
v38 🟡 THE PORTAL
 │   Export/import save strings (cross-device),
 │   keyboard shortcuts, state consolidation (97→4 groups),
 │   dark/light toggle
 │   Est: 1-2 sessions
 │
v39 🟢 THE ARCHITECT  
 │   useReducer migration, normalized data model,
 │   inline Web Worker experiment, undo/redo
 │   Est: 2-3 sessions
 │
v40 🟢 THE LIVING WORLD (ChatGPT's deferred features)
     Coaching carousel, facilities v2, owner mode,
     dynamic league events, rivalry system
     Est: 2-3 sessions
```

---

## IMMEDIATE NEXT ACTIONS

If you want to start Tier 1 right now, here's the punch list:

1. **SAVE_VERSION = 36** (1 line fix — already have migration code)
2. **Extract `PlayerRow` as `React.memo` component** (biggest single win)
3. **Extract `DraftProspectRow` as `React.memo` component**
4. **Add manual virtualization to roster list** (~30 lines)
5. **Add manual virtualization to draft board** (~30 lines)  
6. **Inline LZW compression for saves** (~70 lines)
7. **Export/import save as base64 string** (~40 lines)

Total: ~170 lines of new code, 0 new features, massive performance gain.

---

## CREDIT

- **Claude Deep Research** — Strongest on architecture philosophy (progressive disclosure, JS13K efficiency lessons, PWA standards)
- **Gemini Deep Research** — Strongest on technical implementation (code snippets, specific API details, persistence comparison tables)  
- **ChatGPT Deep Research** — Strongest on practical patterns (ZenGM study, idle game save pipeline, react-window specifics, exact library recommendations)

All three converged on the same core truth: **the game that endures isn't the one with the most features — it's the one where the code runs clean and saves never break.**
