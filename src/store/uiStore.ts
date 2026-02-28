import { create } from 'zustand';

export type NavTab = 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile' | 'trades' | 'freeagents' | 'lineup' | 'draft' | 'prospects' | 'finance' | 'history' | 'analytics' | 'frontoffice' | 'compare' | 'parks' | 'rankings' | 'records' | 'depth' | 'teamcompare' | 'scoreboard' | 'awards' | 'franchise' | 'fortyman' | 'deadline' | 'waivers' | 'extensions' | 'owner' | 'intl' | 'simhub';

interface UIStore {
  activeTab: NavTab;
  selectedTeamId: number | null;
  selectedPlayerId: number | null;
  leaderboardStat: string;
  modalOpen: string | null;
  setActiveTab: (t: NavTab) => void;
  setSelectedTeam: (id: number | null) => void;
  setSelectedPlayer: (id: number | null) => void;
  setLeaderboardStat: (s: string) => void;
  setModal: (name: string | null) => void;
}

export const useUIStore = create<UIStore>(set => ({
  activeTab: 'dashboard',
  selectedTeamId: null,
  selectedPlayerId: null,
  leaderboardStat: 'hr',
  modalOpen: null,
  setActiveTab: t => set({ activeTab: t }),
  setSelectedTeam: id => set({ selectedTeamId: id }),
  setSelectedPlayer: id => set({ selectedPlayerId: id }),
  setLeaderboardStat: s => set({ leaderboardStat: s }),
  setModal: name => set({ modalOpen: name }),
}));
