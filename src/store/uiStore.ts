import { create } from 'zustand';

export type NavTab = 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile' | 'finance' | 'history';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let _toastId = 0;

interface UIStore {
  activeTab: NavTab;
  selectedTeamId: number | null;
  selectedPlayerId: number | null;
  leaderboardStat: string;
  leaderboardCategory: 'hitting' | 'pitching';
  modalOpen: string | null;
  comparePlayerIds: [number, number] | null;
  toasts: ToastItem[];
  setActiveTab: (t: NavTab) => void;
  setSelectedTeam: (id: number | null) => void;
  setSelectedPlayer: (id: number | null) => void;
  setLeaderboardStat: (s: string) => void;
  setLeaderboardCategory: (c: 'hitting' | 'pitching') => void;
  setModal: (name: string | null) => void;
  setComparePlayerIds: (ids: [number, number] | null) => void;
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'dashboard',
  selectedTeamId: null,
  selectedPlayerId: null,
  leaderboardStat: 'hr',
  leaderboardCategory: 'hitting',
  modalOpen: null,
  comparePlayerIds: null,
  toasts: [],
  setActiveTab: t => set({ activeTab: t }),
  setSelectedTeam: id => set({ selectedTeamId: id }),
  setSelectedPlayer: id => set({ selectedPlayerId: id }),
  setLeaderboardStat: s => set({ leaderboardStat: s }),
  setLeaderboardCategory: c => set({ leaderboardCategory: c }),
  setModal: name => set({ modalOpen: name }),
  setComparePlayerIds: ids => set({ comparePlayerIds: ids }),
  addToast: (message, type) => {
    const id = ++_toastId;
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
