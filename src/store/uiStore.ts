import { create } from 'zustand';

export type NavTab = 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile' | 'finance' | 'history';

interface UIStore {
  activeTab: NavTab;
  selectedTeamId: number | null;
  selectedPlayerId: number | null;
  leaderboardStat: string;
  leaderboardCategory: 'hitting' | 'pitching';
  modalOpen: string | null;
  setActiveTab: (t: NavTab) => void;
  setSelectedTeam: (id: number | null) => void;
  setSelectedPlayer: (id: number | null) => void;
  setLeaderboardStat: (s: string) => void;
  setLeaderboardCategory: (c: 'hitting' | 'pitching') => void;
  setModal: (name: string | null) => void;
}

export const useUIStore = create<UIStore>(set => ({
  activeTab: 'dashboard',
  selectedTeamId: null,
  selectedPlayerId: null,
  leaderboardStat: 'hr',
  leaderboardCategory: 'hitting',
  modalOpen: null,
  setActiveTab: t => set({ activeTab: t }),
  setSelectedTeam: id => set({ selectedTeamId: id }),
  setSelectedPlayer: id => set({ selectedPlayerId: id }),
  setLeaderboardStat: s => set({ leaderboardStat: s }),
  setLeaderboardCategory: c => set({ leaderboardCategory: c }),
  setModal: name => set({ modalOpen: name }),
}));
