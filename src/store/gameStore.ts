import { create } from 'zustand';
import type { FOStaffMember, StartModeId } from '../types/frontOffice';
import type { OwnerArchetype, BreakoutCandidate } from '../engine/narrative';

export type SetupScreen = 'title' | 'teamSelect' | 'startMode' | 'difficulty' | 'frontOffice' | 'draft';
export type GamePhase = 'preseason' | 'in_season' | 'simulating' | 'postseason' | 'offseason' | 'fired';
export type SeasonPhase = 'early' | 'allstar' | 'deadline' | 'stretch' | 'complete';

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
  frontOffice:   FOStaffMember[];
  foBudget:      number;    // Total budget in $M
  difficulty:    'rookie' | 'normal' | 'hard';

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
  setFrontOffice:     (staff: FOStaffMember[]) => void;
  addFOStaff:         (member: FOStaffMember) => void;
  removeFOStaff:      (id: string) => void;
  setFoBudget:        (b: number) => void;
  setDifficulty:      (d: 'rookie' | 'normal' | 'hard') => void;
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
  frontOffice:     [],
  foBudget:        15,
  difficulty:      'normal',

  ownerArchetype:  'patient_builder',
  ownerPatience:   70,    // Start at 70 — earned trust must be maintained

  teamMorale:      65,    // Start optimistic but below peak

  breakoutWatch:   [],

  currentSegment:    -1,
  inSeasonPaused:    false,
  segmentUserRecord: null,

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
  setFrontOffice:  staff       => set({ frontOffice: staff }),
  addFOStaff:      member      => set(state => ({ frontOffice: [...state.frontOffice, member] })),
  removeFOStaff:   id          => set(state => ({ frontOffice: state.frontOffice.filter(s => s.id !== id) })),
  setFoBudget:     b           => set({ foBudget: b }),
  setDifficulty:   d           => set({ difficulty: d }),

  resetSetup: () => set({
    setupScreen: 'title',
    startMode:   'instant',
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
    frontOffice: [],
    foBudget: 15,
    difficulty: 'normal' as const,
    ownerArchetype: 'patient_builder' as OwnerArchetype,
    ownerPatience: 70,
    teamMorale: 65,
    breakoutWatch: [],
    currentSegment: -1,
    inSeasonPaused: false,
    segmentUserRecord: null,
    tutorialActive: false,
  }),
}));
