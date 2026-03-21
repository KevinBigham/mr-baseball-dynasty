import { create } from 'zustand';
import type { FOStaffMember, StartModeId } from '../types/frontOffice';
import type { OwnerArchetype, BreakoutCandidate } from '../engine/narrative';

export type SetupScreen = 'title' | 'teamSelect' | 'startMode' | 'difficulty' | 'frontOffice' | 'draft';
export type GamePhase = 'preseason' | 'in_season' | 'simulating' | 'postseason' | 'offseason' | 'fired';
export type SeasonPhase = 'early' | 'allstar' | 'deadline' | 'stretch' | 'complete';
export type SimPace = 'monthly' | 'weekly' | 'fast';

// ─── Delegation System (Progressive Disclosure) ──────────────────────────────
// Each key = a management domain. true = player controls it, false = AI handles it.
export interface DelegationScope {
  lineup:        boolean;  // Set lineup/rotation
  roster:        boolean;  // Call-ups, DFA, promotions
  trades:        boolean;  // Propose and evaluate trades
  freeAgency:    boolean;  // Sign free agents
  minorLeagues:  boolean;  // Manage minor league rosters
  scouting:      boolean;  // Assign scouts to regions
  development:   boolean;  // Dev lab assignments
  arbitration:   boolean;  // Handle arbitration cases
  extensions:    boolean;  // Negotiate contract extensions
  draftStrategy: boolean;  // Amateur draft picks
}

export const DELEGATION_PRESETS: Record<string, DelegationScope> = {
  casual: {
    lineup: true, roster: false, trades: false, freeAgency: false,
    minorLeagues: false, scouting: false, development: false,
    arbitration: false, extensions: false, draftStrategy: false,
  },
  standard: {
    lineup: true, roster: true, trades: true, freeAgency: true,
    minorLeagues: false, scouting: false, development: false,
    arbitration: false, extensions: true, draftStrategy: true,
  },
  hardcore: {
    lineup: true, roster: true, trades: true, freeAgency: true,
    minorLeagues: true, scouting: true, development: true,
    arbitration: true, extensions: true, draftStrategy: true,
  },
};

/** Maps difficulty → default delegation preset */
export function getDelegationForDifficulty(d: string): DelegationScope {
  if (d === 'rookie') return { ...DELEGATION_PRESETS.casual };
  if (d === 'hard')   return { ...DELEGATION_PRESETS.hardcore };
  return { ...DELEGATION_PRESETS.standard };
}

interface GameStore {
  // ── Core game state ──────────────────────────────────────────────────────────
  season:        number;
  userTeamId:    number;
  isSimulating:  boolean;
  simProgress:   number;   // 0–1
  gameStarted:   boolean;
  seasonsManaged: number;
  gamePhase:     GamePhase;
  seasonPhase:   SeasonPhase;

  // ── Setup / onboarding ───────────────────────────────────────────────────────
  setupScreen:   SetupScreen;
  startMode:     StartModeId;
  startupDraftSlot: number | null;
  frontOffice:   FOStaffMember[];
  foBudget:      number;    // Total budget in $M
  difficulty:    'rookie' | 'normal' | 'hard';

  // ── Delegation (progressive disclosure) ──────────────────────────────────────
  delegation: DelegationScope;

  // ── Owner Patience ───────────────────────────────────────────────────────────
  ownerArchetype:  OwnerArchetype;
  ownerPatience:   number;          // 0–100

  // ── Team Morale ──────────────────────────────────────────────────────────────
  teamMorale:      number;          // 0–100

  // ── Breakout Watch ───────────────────────────────────────────────────────────
  breakoutWatch:   BreakoutCandidate[];

  // ── In-Season Pacing ────────────────────────────────────────────────────────
  currentSegment:    number;           // 0-4 (which segment was just completed)
  inSeasonPaused:    boolean;          // true when awaiting user action between chunks
  segmentUserRecord: { wins: number; losses: number } | null;
  currentSeasonDate: string | null;    // ISO date of next unplayed game (e.g., "2026-04-15")
  gamesCompleted:    number;           // total schedule entries completed
  totalGames:        number;           // total schedule entries in season
  simPace:           SimPace;          // 'monthly' | 'weekly' | 'fast'

  // ── Tutorial ───────────────────────────────────────────────────────────────────
  tutorialActive:  boolean;

  // ── Setters ───────────────────────────────────────────────────────────────────
  setSeason:          (s: number) => void;
  setUserTeamId:      (id: number) => void;
  setSimulating:      (v: boolean) => void;
  setSimProgress:     (v: number) => void;
  setGameStarted:     (v: boolean) => void;
  setGamePhase:       (p: GamePhase) => void;
  setSeasonPhase:     (p: SeasonPhase) => void;
  incrementSeasonsManaged: () => void;

  setSetupScreen:     (s: SetupScreen) => void;
  setStartMode:       (m: StartModeId) => void;
  setStartupDraftSlot:(slot: number | null) => void;
  setFrontOffice:     (staff: FOStaffMember[]) => void;
  addFOStaff:         (member: FOStaffMember) => void;
  removeFOStaff:      (id: string) => void;
  setFoBudget:        (b: number) => void;
  setDifficulty:      (d: 'rookie' | 'normal' | 'hard') => void;
  setDelegation:      (d: DelegationScope) => void;
  toggleDelegation:   (key: keyof DelegationScope) => void;
  resetSetup:         () => void;

  setOwnerArchetype:  (a: OwnerArchetype) => void;
  setOwnerPatience:   (p: number) => void;
  adjustOwnerPatience:(delta: number) => void;

  setTeamMorale:      (m: number) => void;
  adjustTeamMorale:   (delta: number) => void;

  setBreakoutWatch:   (candidates: BreakoutCandidate[]) => void;

  setCurrentSegment:    (n: number) => void;
  setInSeasonPaused:    (v: boolean) => void;
  setSegmentUserRecord: (r: { wins: number; losses: number } | null) => void;
  setCurrentSeasonDate: (d: string | null) => void;
  setGamesCompleted:    (n: number) => void;
  setTotalGames:        (n: number) => void;
  setSimPace:           (p: SimPace) => void;

  setTutorialActive:  (v: boolean) => void;

  // ── Reset ───────────────────────────────────────────────────────────────────
  resetAll:           () => void;
}

export const useGameStore = create<GameStore>(set => ({
  // ── Defaults ─────────────────────────────────────────────────────────────────
  season:          2026,
  userTeamId:      6,
  isSimulating:    false,
  simProgress:     0,
  gameStarted:     false,
  seasonsManaged:  0,
  gamePhase:       'preseason',
  seasonPhase:     'early',

  setupScreen:     'title',
  startMode:       'instant',
  startupDraftSlot: null,
  frontOffice:     [],
  foBudget:        15,
  difficulty:      'normal',
  delegation:      { ...DELEGATION_PRESETS.standard },

  ownerArchetype:  'patient_builder',
  ownerPatience:   70,    // Start at 70 — earned trust must be maintained

  teamMorale:      65,    // Start optimistic but below peak

  breakoutWatch:   [],

  currentSegment:    -1,
  inSeasonPaused:    false,
  segmentUserRecord: null,
  currentSeasonDate: null,
  gamesCompleted:    0,
  totalGames:        0,
  simPace:           'monthly',

  tutorialActive:  false,

  // ── Core setters ─────────────────────────────────────────────────────────────
  setSeason:       season      => set({ season }),
  setUserTeamId:   id          => set({ userTeamId: id }),
  setSimulating:   v           => set({ isSimulating: v }),
  setSimProgress:  v           => set({ simProgress: v }),
  setGameStarted:  v           => set({ gameStarted: v }),
  setGamePhase:    p           => set({ gamePhase: p }),
  setSeasonPhase:  p           => set({ seasonPhase: p }),
  incrementSeasonsManaged: ()  => set(state => ({ seasonsManaged: state.seasonsManaged + 1 })),

  // ── Setup setters ─────────────────────────────────────────────────────────────
  setSetupScreen:  s           => set({ setupScreen: s }),
  setStartMode:    m           => set({ startMode: m }),
  setStartupDraftSlot: slot    => set({ startupDraftSlot: slot }),
  setFrontOffice:  staff       => set({ frontOffice: staff }),
  addFOStaff:      member      => set(state => ({ frontOffice: [...state.frontOffice, member] })),
  removeFOStaff:   id          => set(state => ({ frontOffice: state.frontOffice.filter(s => s.id !== id) })),
  setFoBudget:     b           => set({ foBudget: b }),
  setDifficulty:   d           => set({ difficulty: d }),
  setDelegation:   d           => set({ delegation: d }),
  toggleDelegation: key        => set(state => ({ delegation: { ...state.delegation, [key]: !state.delegation[key] } })),

  resetSetup: () => set({
    setupScreen: 'title',
    startMode:   'instant',
    startupDraftSlot: null,
    frontOffice: [],
    foBudget:    15,
    difficulty:  'normal',
  }),

  // ── Owner patience setters ────────────────────────────────────────────────────
  setOwnerArchetype:   a       => set({ ownerArchetype: a }),
  setOwnerPatience:    p       => set({ ownerPatience: Math.max(0, Math.min(100, p)) }),
  adjustOwnerPatience: delta   => set(state => ({
    ownerPatience: Math.max(0, Math.min(100, state.ownerPatience + delta)),
  })),

  // ── Team morale setters ───────────────────────────────────────────────────────
  setTeamMorale:    m          => set({ teamMorale: Math.max(0, Math.min(100, m)) }),
  adjustTeamMorale: delta      => set(state => ({
    teamMorale: Math.max(0, Math.min(100, state.teamMorale + delta)),
  })),

  // ── Breakout watch ────────────────────────────────────────────────────────────
  setBreakoutWatch: candidates => set({ breakoutWatch: candidates }),

  // ── In-season pacing ──────────────────────────────────────────────────────────
  setCurrentSegment:    n => set({ currentSegment: n }),
  setInSeasonPaused:    v => set({ inSeasonPaused: v }),
  setSegmentUserRecord: r => set({ segmentUserRecord: r }),
  setCurrentSeasonDate: d => set({ currentSeasonDate: d }),
  setGamesCompleted:    n => set({ gamesCompleted: n }),
  setTotalGames:        n => set({ totalGames: n }),
  setSimPace:           p => set({ simPace: p }),

  // ── Tutorial ────────────────────────────────────────────────────────────────────
  setTutorialActive: v => set({ tutorialActive: v }),

  // ── Reset all (new game) ──────────────────────────────────────────────────────
  resetAll: () => set({
    season: 2026,
    userTeamId: 6,
    isSimulating: false,
    simProgress: 0,
    gameStarted: false,
    seasonsManaged: 0,
    gamePhase: 'preseason' as GamePhase,
    seasonPhase: 'early' as SeasonPhase,
    setupScreen: 'title' as SetupScreen,
    startMode: 'instant' as StartModeId,
    startupDraftSlot: null,
    frontOffice: [],
    foBudget: 15,
    difficulty: 'normal' as const,
    delegation: { ...DELEGATION_PRESETS.standard },
    ownerArchetype: 'patient_builder' as OwnerArchetype,
    ownerPatience: 70,
    teamMorale: 65,
    breakoutWatch: [],
    currentSegment: -1,
    inSeasonPaused: false,
    segmentUserRecord: null,
    currentSeasonDate: null,
    simPace: 'monthly' as SimPace,
    gamesCompleted: 0,
    totalGames: 0,
    tutorialActive: false,
  }),
}));
