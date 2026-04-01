import { create } from 'zustand';

interface GameState {
  season: number;
  day: number;
  phase: string;
  isSimulating: boolean;
  teamName: string;
  setSeason: (season: number) => void;
  setDay: (day: number) => void;
  setPhase: (phase: string) => void;
  setSimulating: (simulating: boolean) => void;
  updateFromSim: (data: { season: number; day: number; phase: string }) => void;
}

export const useGameStore = create<GameState>((set) => ({
  season: 1,
  day: 1,
  phase: 'preseason',
  isSimulating: false,
  teamName: 'My Team',
  setSeason: (season) => set({ season }),
  setDay: (day) => set({ day }),
  setPhase: (phase) => set({ phase }),
  setSimulating: (simulating) => set({ isSimulating: simulating }),
  updateFromSim: (data) =>
    set({ season: data.season, day: data.day, phase: data.phase }),
}));
