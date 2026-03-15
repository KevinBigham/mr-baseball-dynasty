/**
 * DynastyMilestonesPanel.tsx — Franchise dynasty milestones tracker.
 *
 * Scans franchise history to detect and display dynasty achievements:
 * career win milestones, playoff streaks, championship runs, etc.
 * Bloomberg-style with gold accents for unlocked milestones.
 */

import { useMemo } from 'react';
import { useLeagueStore, type SeasonSummary } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';

// ─── Milestone Definitions ───────────────────────────────────────────────────

interface MilestoneDef {
  id: string;
  icon: string;
  label: string;
  description: string;
  check: (history: SeasonSummary[], seasonsManaged: number) => boolean;
  /** Higher = rarer / more impressive */
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

const MILESTONES: MilestoneDef[] = [
  // ── Career Wins ───────────────────────────────────
  {
    id: 'wins-100',
    icon: '📊',
    label: '100 Career Wins',
    description: 'Accumulated 100 regular season wins.',
    check: (h) => h.reduce((s, x) => s + x.wins, 0) >= 100,
    tier: 'bronze',
  },
  {
    id: 'wins-500',
    icon: '📈',
    label: '500 Career Wins',
    description: 'Half a thousand victories managed.',
    check: (h) => h.reduce((s, x) => s + x.wins, 0) >= 500,
    tier: 'silver',
  },
  {
    id: 'wins-1000',
    icon: '🏛️',
    label: '1,000 Career Wins',
    description: 'A thousand wins — legendary status.',
    check: (h) => h.reduce((s, x) => s + x.wins, 0) >= 1000,
    tier: 'gold',
  },

  // ── Season Records ────────────────────────────────
  {
    id: 'season-90',
    icon: '💪',
    label: '90-Win Season',
    description: 'Won 90+ games in a single season.',
    check: (h) => h.some(x => x.wins >= 90),
    tier: 'bronze',
  },
  {
    id: 'season-100',
    icon: '🔥',
    label: '100-Win Season',
    description: 'Elite territory — 100+ wins in a season.',
    check: (h) => h.some(x => x.wins >= 100),
    tier: 'silver',
  },
  {
    id: 'season-110',
    icon: '⚡',
    label: '110-Win Season',
    description: 'Historic dominance — 110+ regular season wins.',
    check: (h) => h.some(x => x.wins >= 110),
    tier: 'gold',
  },

  // ── Playoffs ──────────────────────────────────────
  {
    id: 'first-playoff',
    icon: '⚾',
    label: 'Playoff Bound',
    description: 'Made the playoffs for the first time.',
    check: (h) => h.some(x => x.playoffResult !== null),
    tier: 'bronze',
  },
  {
    id: 'playoff-streak-3',
    icon: '🎯',
    label: 'Playoff Dynasty (3)',
    description: 'Made the playoffs 3 consecutive seasons.',
    check: (h) => hasConsecutivePlayoffs(h, 3),
    tier: 'silver',
  },
  {
    id: 'playoff-streak-5',
    icon: '🏆',
    label: 'Playoff Dynasty (5)',
    description: 'Five straight playoff appearances.',
    check: (h) => hasConsecutivePlayoffs(h, 5),
    tier: 'gold',
  },

  // ── Championships ─────────────────────────────────
  {
    id: 'first-ring',
    icon: '💍',
    label: 'First Ring',
    description: 'Won the World Series for the first time!',
    check: (h) => h.some(x => x.playoffResult === 'Champion'),
    tier: 'gold',
  },
  {
    id: 'back-to-back',
    icon: '👑',
    label: 'Back-to-Back',
    description: 'Won consecutive championships.',
    check: (h) => hasConsecutiveChampionships(h, 2),
    tier: 'diamond',
  },
  {
    id: 'three-peat',
    icon: '🌟',
    label: 'Three-Peat',
    description: 'Three consecutive World Series titles.',
    check: (h) => hasConsecutiveChampionships(h, 3),
    tier: 'diamond',
  },
  {
    id: 'rings-3',
    icon: '🏅',
    label: 'Three Rings',
    description: 'Won 3 championships total.',
    check: (h) => h.filter(x => x.playoffResult === 'Champion').length >= 3,
    tier: 'diamond',
  },

  // ── Longevity ─────────────────────────────────────
  {
    id: 'seasons-5',
    icon: '📅',
    label: 'Five Seasons',
    description: 'Managed 5 seasons without getting fired.',
    check: (_h, sm) => sm >= 5,
    tier: 'bronze',
  },
  {
    id: 'seasons-10',
    icon: '📆',
    label: 'A Decade',
    description: '10 seasons at the helm.',
    check: (_h, sm) => sm >= 10,
    tier: 'silver',
  },
  {
    id: 'seasons-20',
    icon: '🏛️',
    label: 'Two Decades',
    description: '20 seasons — a franchise institution.',
    check: (_h, sm) => sm >= 20,
    tier: 'gold',
  },

  // ── Awards ────────────────────────────────────────
  {
    id: 'first-award',
    icon: '🏅',
    label: 'Award Winner',
    description: 'A player on your team won a major award.',
    check: (h) => h.some(x => x.awardsWon.length > 0),
    tier: 'bronze',
  },
  {
    id: 'awards-5',
    icon: '🏆',
    label: 'Award Factory',
    description: 'Your players have won 5+ total awards.',
    check: (h) => h.flatMap(x => x.awardsWon).length >= 5,
    tier: 'silver',
  },
  {
    id: 'awards-10',
    icon: '✨',
    label: 'Award Dynasty',
    description: '10+ total awards under your management.',
    check: (h) => h.flatMap(x => x.awardsWon).length >= 10,
    tier: 'gold',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasConsecutivePlayoffs(history: SeasonSummary[], count: number): boolean {
  if (history.length < count) return false;
  // History is newest-first, so sort by season ascending for streak detection
  const sorted = [...history].sort((a, b) => a.season - b.season);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].playoffResult !== null) {
      streak++;
      if (streak >= count) return true;
      // Check continuity
      if (i > 0 && sorted[i].season !== sorted[i - 1].season + 1) {
        streak = 1;
      }
    } else {
      streak = 0;
    }
  }
  return false;
}

function hasConsecutiveChampionships(history: SeasonSummary[], count: number): boolean {
  if (history.length < count) return false;
  const sorted = [...history].sort((a, b) => a.season - b.season);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].playoffResult === 'Champion') {
      streak++;
      if (streak >= count) return true;
      if (i > 0 && sorted[i].season !== sorted[i - 1].season + 1) {
        streak = 1;
      }
    } else {
      streak = 0;
    }
  }
  return false;
}

const TIER_STYLES = {
  bronze: { bg: 'bg-orange-900/10', border: 'border-orange-800/30', text: 'text-orange-400', badge: 'bg-orange-900/40 text-orange-300' },
  silver: { bg: 'bg-gray-700/10', border: 'border-gray-600/30', text: 'text-gray-300', badge: 'bg-gray-700/40 text-gray-200' },
  gold: { bg: 'bg-yellow-900/10', border: 'border-yellow-700/30', text: 'text-yellow-400', badge: 'bg-yellow-900/40 text-yellow-300' },
  diamond: { bg: 'bg-cyan-900/10', border: 'border-cyan-600/30', text: 'text-cyan-300', badge: 'bg-cyan-900/40 text-cyan-200' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DynastyMilestonesPanel() {
  const { franchiseHistory } = useLeagueStore();
  const { seasonsManaged } = useGameStore();

  const { unlocked, locked, progress } = useMemo(() => {
    const un: (MilestoneDef & { unlocked: true })[] = [];
    const lk: (MilestoneDef & { unlocked: false })[] = [];

    for (const m of MILESTONES) {
      if (m.check(franchiseHistory, seasonsManaged)) {
        un.push({ ...m, unlocked: true });
      } else {
        lk.push({ ...m, unlocked: false });
      }
    }

    return {
      unlocked: un,
      locked: lk,
      progress: Math.round((un.length / MILESTONES.length) * 100),
    };
  }, [franchiseHistory, seasonsManaged]);

  // Don't show if no seasons played
  if (franchiseHistory.length === 0 && seasonsManaged === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>DYNASTY MILESTONES</span>
        <span className="text-gray-500 font-normal text-[10px]">
          {unlocked.length}/{MILESTONES.length} UNLOCKED
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-gray-500 font-bold tracking-widest">COMPLETION</span>
          <span className="text-[9px] text-orange-400 font-bold">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Unlocked milestones */}
      {unlocked.length > 0 && (
        <div className="px-4 py-2 space-y-1.5">
          {unlocked.map(m => {
            const style = TIER_STYLES[m.tier];
            return (
              <div key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded border ${style.border} ${style.bg}`}>
                <span className="text-base shrink-0">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-bold ${style.text}`}>{m.label}</div>
                  <div className="text-[10px] text-gray-500 truncate">{m.description}</div>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${style.badge}`}>
                  {m.tier}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Next milestones (locked, show top 3) */}
      {locked.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-800">
          <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1.5">NEXT MILESTONES</div>
          {locked.slice(0, 3).map(m => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-1.5 opacity-50">
              <span className="text-base shrink-0 grayscale">{m.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-500">{m.label}</div>
                <div className="text-[10px] text-gray-500 truncate">{m.description}</div>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-gray-500 bg-gray-800">
                LOCKED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
