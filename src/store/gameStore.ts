import { create } from 'zustand';

interface GameStore {
  season: number;
  userTeamId: number;
  isSimulating: boolean;
  simProgress: number;       // 0–1
  gameStarted: boolean;
  setSeason: (s: number) => void;
  setUserTeamId: (id: number) => void;
  setSimulating: (v: boolean) => void;
  setSimProgress: (v: number) => void;
  setGameStarted: (v: boolean) => void;
}

export const useGameStore = create<GameStore>(set => ({
  season: 2026,
  userTeamId: 6, // River City Wolves default
  isSimulating: false,
  simProgress: 0,
  gameStarted: false,
  setSeason: season => set({ season }),
  setUserTeamId: id => set({ userTeamId: id }),
  setSimulating: v => set({ isSimulating: v }),
  setSimProgress: v => set({ simProgress: v }),
  setGameStarted: v => set({ gameStarted: v }),
}));
