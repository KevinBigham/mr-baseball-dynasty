import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { getEngine } from '../../engine/engineClient';
import { saveGame } from '../../db/schema';
import {
  Home, Users, Trophy, Clock,
  ListOrdered, TrendingUp, Search, DollarSign,
  BarChart3, Medal, Handshake, UserPlus,
  Save, DownloadCloud,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  action: () => void;
  keywords?: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { navigate, setActiveTab } = useUIStore();
  const { season, userTeamId } = useGameStore();

  // Cmd+K / Ctrl+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = useCallback((tab: NavTab, subTab?: string) => {
    if (subTab) {
      navigate(tab, subTab);
    } else {
      setActiveTab(tab);
    }
    setOpen(false);
  }, [navigate, setActiveTab]);

  const handleSave = useCallback(async () => {
    try {
      const engine = getEngine();
      const state = await engine.getFullState();
      if (state) {
        await saveGame(state, `Quick Save — S${season}`, `Team ${userTeamId}`);
        useUIStore.getState().addToast('Game saved', 'success', { icon: '💾' });
      }
    } catch {
      useUIStore.getState().addToast('Save failed', 'error');
    }
    setOpen(false);
  }, [season, userTeamId]);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'home',       label: 'Home — Dashboard',      group: 'Navigate', icon: Home,       action: () => go('home'),                         keywords: 'dashboard briefing' },
    { id: 'roster',     label: 'Team — Roster',          group: 'Navigate', icon: Users,      action: () => go('team', 'roster'),               keywords: 'players team lineup' },
    { id: 'depth',      label: 'Team — Depth Chart',     group: 'Navigate', icon: ListOrdered,action: () => go('team', 'depth'),                keywords: 'lineup positions field' },
    { id: 'prospects',  label: 'Team — Prospects',       group: 'Navigate', icon: TrendingUp, action: () => go('team', 'pipeline'),             keywords: 'minor league farm prospects' },
    { id: 'devlab',     label: 'Team — Dev Lab',         group: 'Navigate', icon: TrendingUp, action: () => go('team', 'devlab'),               keywords: 'development training skills' },
    { id: 'finances',   label: 'Front Office — Finances',group: 'Navigate', icon: DollarSign, action: () => go('frontoffice', 'finances'),      keywords: 'salary cap payroll budget contract' },
    { id: 'trades',     label: 'Front Office — Trades',  group: 'Navigate', icon: Handshake,  action: () => go('frontoffice', 'trades'),        keywords: 'trade center deals offers' },
    { id: 'scouting',   label: 'Front Office — Scouting',group: 'Navigate', icon: Search,     action: () => go('frontoffice', 'scouting'),      keywords: 'scout evaluate reports' },
    { id: 'freeagency', label: 'Front Office — Free Agency', group: 'Navigate', icon: UserPlus, action: () => go('frontoffice', 'freeagency'), keywords: 'free agent sign market' },
    { id: 'standings',  label: 'League — Standings',     group: 'Navigate', icon: Trophy,     action: () => go('league', 'standings'),          keywords: 'division playoff picture' },
    { id: 'leaders',    label: 'League — Leaderboards',  group: 'Navigate', icon: BarChart3,  action: () => go('league', 'leaderboards'),       keywords: 'stats leaders batting pitching' },
    { id: 'awards',     label: 'League — Awards',        group: 'Navigate', icon: Medal,      action: () => go('league', 'awards'),             keywords: 'mvp cy young rookie' },
    { id: 'playoffs',   label: 'League — Playoffs',      group: 'Navigate', icon: Trophy,     action: () => go('league', 'playoffs'),           keywords: 'bracket postseason world series' },
    { id: 'timeline',   label: 'History — Timeline',     group: 'Navigate', icon: Clock,      action: () => go('history', 'history'),           keywords: 'events timeline' },
    { id: 'records',    label: 'History — Records',      group: 'Navigate', icon: BarChart3,  action: () => go('history', 'records'),           keywords: 'franchise records all-time' },
    { id: 'hof',        label: 'History — Hall of Fame', group: 'Navigate', icon: Medal,      action: () => go('history', 'hof'),               keywords: 'hall fame legends' },

    // Actions
    { id: 'save',      label: 'Quick Save',              group: 'Actions',  icon: Save,          action: handleSave,                            keywords: 'save game' },
    { id: 'load',      label: 'Load Game',               group: 'Actions',  icon: DownloadCloud, action: () => { useUIStore.getState().setModal('saveManager'); setOpen(false); }, keywords: 'load save manage' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />
      {/* Command dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command
          className="border border-[#1E2A4A] bg-[#0B1020] rounded-mbd-md shadow-2xl shadow-black/60 overflow-hidden"
          loop
        >
          <div className="flex items-center border-b border-[#1E2A4A] px-4">
            <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full py-3 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 outline-none font-display"
              autoFocus
            />
            <kbd className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded font-mono shrink-0">ESC</kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-gray-500">
              No results found.
            </Command.Empty>

            {/* Group commands */}
            {['Navigate', 'Actions'].map(group => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-bold"
              >
                {commands
                  .filter(c => c.group === group)
                  .map(cmd => (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.keywords ?? ''}`}
                      onSelect={cmd.action}
                      className="flex items-center gap-3 px-3 py-2 text-xs text-gray-300 rounded cursor-pointer data-[selected=true]:bg-orange-500/10 data-[selected=true]:text-orange-400 transition-colors"
                    >
                      <cmd.icon className="w-4 h-4 shrink-0 text-gray-500" />
                      <span className="font-display">{cmd.label}</span>
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="border-t border-[#1E2A4A] px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
