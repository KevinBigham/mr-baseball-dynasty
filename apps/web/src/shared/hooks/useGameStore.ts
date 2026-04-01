import { create } from 'zustand';

interface GameState {
  season: number;
  day: number;
  phase: string;
  isSimulating: boolean;
  isInitialized: boolean;
  userTeamId: string;
  teamName: string;
  playerCount: number;
  gamesPlayed: number;
  setSeason: (season: number) => void;
  setDay: (day: number) => void;
  setPhase: (phase: string) => void;
  setSimulating: (simulating: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setUserTeamId: (teamId: string) => void;
  updateFromSim: (data: {
    season: number;
    day: number;
    phase: string;
    gamesPlayed?: number;
  }) => void;
  initializeGame: (data: {
    season: number;
    day: number;
    phase: string;
    playerCount: number;
    userTeamId: string;
  }) => void;
}

export const useGameStore = create<GameState>((set) => ({
  season: 1,
  day: 1,
  phase: 'preseason',
  isSimulating: false,
  isInitialized: false,
  userTeamId: 'nyy',
  teamName: 'Yankees',
  playerCount: 0,
  gamesPlayed: 0,
  setSeason: (season) => set({ season }),
  setDay: (day) => set({ day }),
  setPhase: (phase) => set({ phase }),
  setSimulating: (simulating) => set({ isSimulating: simulating }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setUserTeamId: (teamId) => set({ userTeamId: teamId }),
  updateFromSim: (data) =>
    set({
      season: data.season,
      day: data.day,
      phase: data.phase,
      gamesPlayed: data.gamesPlayed ?? 0,
    }),
  initializeGame: (data) =>
    set({
      season: data.season,
      day: data.day,
      phase: data.phase,
      playerCount: data.playerCount,
      userTeamId: data.userTeamId,
      isInitialized: true,
    }),
}));
