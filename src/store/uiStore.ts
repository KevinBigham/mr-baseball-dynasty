import { create } from 'zustand';

export type NavTab = 'home' | 'team' | 'frontoffice' | 'league' | 'history'
  // Legacy aliases (still used by some components)
  | 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile' | 'finance';

export type SubTab = string;

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let _toastId = 0;

interface UIStore {
  activeTab: NavTab;
  subTab: SubTab;
  selectedTeamId: number | null;
  selectedPlayerId: number | null;
  leaderboardStat: string;
  leaderboardCategory: 'hitting' | 'pitching';
  modalOpen: string | null;
  comparePlayerIds: [number, number] | null;
  toasts: ToastItem[];
  rosterViewMode: string | null;
  setActiveTab: (t: NavTab) => void;
  setSubTab: (s: SubTab) => void;
  navigate: (tab: NavTab, sub?: SubTab) => void;
  setSelectedTeam: (id: number | null) => void;
  setSelectedPlayer: (id: number | null) => void;
  setLeaderboardStat: (s: string) => void;
  setLeaderboardCategory: (c: 'hitting' | 'pitching') => void;
  setModal: (name: string | null) => void;
  setComparePlayerIds: (ids: [number, number] | null) => void;
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: number) => void;
  setRosterViewMode: (mode: string | null) => void;
}

// ─── Legacy tab name → 5-pillar mapping ──────────────────────────────────────
const LEGACY_TAB_MAP: Record<string, string> = {
  dashboard: 'home',
  standings: 'league',
  roster: 'team',
  stats: 'league',
  finance: 'frontoffice',
  history: 'history',
  profile: 'team',
};
const LEGACY_SUBTAB_MAP: Record<string, string> = {
  dashboard: '',
  standings: 'standings',
  roster: 'roster',
  stats: 'leaderboards',
  finance: 'finances',
  history: 'history',
  profile: 'player',
};

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'home',
  subTab: '',
  selectedTeamId: null,
  selectedPlayerId: null,
  leaderboardStat: 'hr',
  leaderboardCategory: 'hitting',
  modalOpen: null,
  comparePlayerIds: null,
  toasts: [],
  rosterViewMode: null,
  setActiveTab: t => {
    // Map legacy tab names to 5-pillar structure
    const mapped = LEGACY_TAB_MAP[t as string] ?? t;
    const sub = LEGACY_SUBTAB_MAP[t as string] ?? '';
    set({ activeTab: mapped as NavTab, subTab: sub });
  },
  setSubTab: s => set({ subTab: s }),
  navigate: (tab, sub) => set({ activeTab: tab, subTab: sub ?? '' }),
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
  setRosterViewMode: (mode) => set({ rosterViewMode: mode }),
}));
