import { create } from 'zustand';
import type { FOStaffMember, StartModeId } from '../types/frontOffice';
import type { OwnerArchetype, BreakoutCandidate } from '../engine/narrative';

export type SetupScreen = 'title' | 'teamSelect' | 'startMode' | 'frontOffice';

interface GameStore {
  // ── Core game state ──────────────────────────────────────────────────────────
  season:        number;
  userTeamId:    number;
  isSimulating:  boolean;
  simProgress:   number;   // 0–1
  gameStarted:   boolean;
  seasonsManaged: number;

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

  // ── Setters ───────────────────────────────────────────────────────────────────
  setSeason:          (s: number) => void;
  setUserTeamId:      (id: number) => void;
  setSimulating:      (v: boolean) => void;
  setSimProgress:     (v: number) => void;
  setGameStarted:     (v: boolean) => void;
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
}

export const useGameStore = create<GameStore>(set => ({
  // ── Defaults ─────────────────────────────────────────────────────────────────
  season:          2026,
  userTeamId:      6,
  isSimulating:    false,
  simProgress:     0,
  gameStarted:     false,
  seasonsManaged:  0,

  setupScreen:     'title',
  startMode:       'instant',
  frontOffice:     [],
  foBudget:        15,
  difficulty:      'normal',

  ownerArchetype:  'patient_builder',
  ownerPatience:   70,    // Start at 70 — earned trust must be maintained

  teamMorale:      65,    // Start optimistic but below peak

  breakoutWatch:   [],

  // ── Core setters ─────────────────────────────────────────────────────────────
  setSeason:       season      => set({ season }),
  setUserTeamId:   id          => set({ userTeamId: id }),
  setSimulating:   v           => set({ isSimulating: v }),
  setSimProgress:  v           => set({ simProgress: v }),
  setGameStarted:  v           => set({ gameStarted: v }),
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
}));
