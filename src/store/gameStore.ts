import { create } from 'zustand';
import type { FOStaffMember, StartModeId } from '../types/frontOffice';

export type SetupScreen = 'title' | 'teamSelect' | 'startMode' | 'frontOffice';

interface GameStore {
  // ── Core game state ──────────────────────────────────────────────────────────
  season:        number;
  userTeamId:    number;
  isSimulating:  boolean;
  simProgress:   number;   // 0–1
  gameStarted:   boolean;

  // ── Setup / onboarding ───────────────────────────────────────────────────────
  setupScreen:   SetupScreen;
  startMode:     StartModeId;
  frontOffice:   FOStaffMember[];
  foBudget:      number;    // Total budget in $M
  difficulty:    'rookie' | 'normal' | 'hard';

  // ── Setters ───────────────────────────────────────────────────────────────────
  setSeason:       (s: number) => void;
  setUserTeamId:   (id: number) => void;
  setSimulating:   (v: boolean) => void;
  setSimProgress:  (v: number) => void;
  setGameStarted:  (v: boolean) => void;

  setSetupScreen:  (s: SetupScreen) => void;
  setStartMode:    (m: StartModeId) => void;
  setFrontOffice:  (staff: FOStaffMember[]) => void;
  addFOStaff:      (member: FOStaffMember) => void;
  removeFOStaff:   (id: string) => void;
  setFoBudget:     (b: number) => void;
  setDifficulty:   (d: 'rookie' | 'normal' | 'hard') => void;
  resetSetup:      () => void;
}

export const useGameStore = create<GameStore>(set => ({
  // ── Defaults ─────────────────────────────────────────────────────────────────
  season:       2026,
  userTeamId:   6,
  isSimulating: false,
  simProgress:  0,
  gameStarted:  false,

  setupScreen:  'title',
  startMode:    'instant',
  frontOffice:  [],
  foBudget:     15,          // Default normal budget
  difficulty:   'normal',

  // ── Core setters ─────────────────────────────────────────────────────────────
  setSeason:      season      => set({ season }),
  setUserTeamId:  id          => set({ userTeamId: id }),
  setSimulating:  v           => set({ isSimulating: v }),
  setSimProgress: v           => set({ simProgress: v }),
  setGameStarted: v           => set({ gameStarted: v }),

  // ── Setup setters ─────────────────────────────────────────────────────────────
  setSetupScreen: s           => set({ setupScreen: s }),
  setStartMode:   m           => set({ startMode: m }),
  setFrontOffice: staff       => set({ frontOffice: staff }),
  addFOStaff:     member      => set(state => ({ frontOffice: [...state.frontOffice, member] })),
  removeFOStaff:  id          => set(state => ({ frontOffice: state.frontOffice.filter(s => s.id !== id) })),
  setFoBudget:    b           => set({ foBudget: b }),
  setDifficulty:  d           => set({ difficulty: d }),

  resetSetup: () => set({
    setupScreen: 'title',
    startMode:   'instant',
    frontOffice: [],
    foBudget:    15,
    difficulty:  'normal',
  }),
}));
