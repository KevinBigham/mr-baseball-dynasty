/**
 * MilestoneCard — Celebratory display for career milestones.
 * Ported from MFD's milestone tracker concept.
 */

import type { PlayerSeasonStats } from '../../types/player';

export interface Milestone {
  stat: string;
  label: string;
  threshold: number;
  icon: string;
}

// ─── Milestone definitions ───────────────────────────────────────────────────

const HITTING_MILESTONES: Milestone[] = [
  { stat: 'hr', label: 'Career Home Runs', threshold: 100, icon: '💣' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 200, icon: '💣' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 300, icon: '🔥' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 400, icon: '🔥' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 500, icon: '🏆' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 600, icon: '👑' },
  { stat: 'hr', label: 'Career Home Runs', threshold: 700, icon: '👑' },
  { stat: 'h', label: 'Career Hits', threshold: 1000, icon: '🎯' },
  { stat: 'h', label: 'Career Hits', threshold: 1500, icon: '🎯' },
  { stat: 'h', label: 'Career Hits', threshold: 2000, icon: '⭐' },
  { stat: 'h', label: 'Career Hits', threshold: 2500, icon: '🔥' },
  { stat: 'h', label: 'Career Hits', threshold: 3000, icon: '🏆' },
  { stat: 'rbi', label: 'Career RBI', threshold: 500, icon: '💪' },
  { stat: 'rbi', label: 'Career RBI', threshold: 1000, icon: '🔥' },
  { stat: 'rbi', label: 'Career RBI', threshold: 1500, icon: '🏆' },
  { stat: 'r', label: 'Career Runs', threshold: 500, icon: '🏃' },
  { stat: 'r', label: 'Career Runs', threshold: 1000, icon: '⭐' },
  { stat: 'r', label: 'Career Runs', threshold: 1500, icon: '🏆' },
  { stat: 'sb', label: 'Career Stolen Bases', threshold: 100, icon: '💨' },
  { stat: 'sb', label: 'Career Stolen Bases', threshold: 200, icon: '🔥' },
  { stat: 'sb', label: 'Career Stolen Bases', threshold: 300, icon: '🏆' },
];

const PITCHING_MILESTONES: Milestone[] = [
  { stat: 'w', label: 'Career Wins', threshold: 50, icon: '💪' },
  { stat: 'w', label: 'Career Wins', threshold: 100, icon: '⭐' },
  { stat: 'w', label: 'Career Wins', threshold: 150, icon: '🔥' },
  { stat: 'w', label: 'Career Wins', threshold: 200, icon: '🏆' },
  { stat: 'w', label: 'Career Wins', threshold: 250, icon: '👑' },
  { stat: 'w', label: 'Career Wins', threshold: 300, icon: '👑' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 500, icon: '🎯' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 1000, icon: '⭐' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 1500, icon: '🔥' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 2000, icon: '🔥' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 2500, icon: '🏆' },
  { stat: 'ka', label: 'Career Strikeouts', threshold: 3000, icon: '👑' },
  { stat: 'sv', label: 'Career Saves', threshold: 50, icon: '🚪' },
  { stat: 'sv', label: 'Career Saves', threshold: 100, icon: '⭐' },
  { stat: 'sv', label: 'Career Saves', threshold: 200, icon: '🔥' },
  { stat: 'sv', label: 'Career Saves', threshold: 300, icon: '🏆' },
];

/**
 * Detect career milestones from season stats history.
 */
export function detectMilestones(
  seasons: PlayerSeasonStats[],
  isPitcher: boolean,
): { milestone: Milestone; value: number }[] {
  if (seasons.length === 0) return [];

  // Accumulate career totals
  const totals: Record<string, number> = {};
  for (const s of seasons) {
    for (const [key, val] of Object.entries(s)) {
      if (typeof val === 'number' && key !== 'season' && key !== 'teamId' && key !== 'playerId') {
        totals[key] = (totals[key] ?? 0) + val;
      }
    }
  }

  const milestones = isPitcher ? PITCHING_MILESTONES : HITTING_MILESTONES;
  const achieved: { milestone: Milestone; value: number }[] = [];

  for (const m of milestones) {
    const val = totals[m.stat] ?? 0;
    if (val >= m.threshold) {
      achieved.push({ milestone: m, value: val });
    }
  }

  // Return only the highest threshold per stat (don't show 100 HR if 200 HR is also achieved)
  const byStatHighest = new Map<string, { milestone: Milestone; value: number }>();
  for (const a of achieved) {
    const existing = byStatHighest.get(a.milestone.stat);
    if (!existing || a.milestone.threshold > existing.milestone.threshold) {
      byStatHighest.set(a.milestone.stat, a);
    }
  }

  return [...byStatHighest.values()].sort((a, b) => b.milestone.threshold - a.milestone.threshold);
}

// ─── Display component ──────────────────────────────────────────────────────

interface MilestoneCardProps {
  playerName: string;
  seasons: PlayerSeasonStats[];
  isPitcher: boolean;
}

export default function MilestoneCard({ playerName, seasons, isPitcher }: MilestoneCardProps) {
  const milestones = detectMilestones(seasons, isPitcher);

  if (milestones.length === 0) return null;

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center gap-2">
        <span>CAREER MILESTONES</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
        >
          {milestones.length}
        </span>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {milestones.map(({ milestone, value }) => (
          <div
            key={`${milestone.stat}-${milestone.threshold}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(251,191,36,0.04)',
              border: '1px solid rgba(251,191,36,0.15)',
            }}
          >
            <span className="text-xl shrink-0">{milestone.icon}</span>
            <div className="min-w-0">
              <div className="text-yellow-500 text-[10px] font-black tracking-widest">
                {milestone.threshold.toLocaleString()} {milestone.label.split(' ').slice(1).join(' ').toUpperCase()}
              </div>
              <div className="text-gray-400 text-xs">
                {playerName} · <span className="text-yellow-400 font-bold tabular-nums">{value.toLocaleString()}</span> {milestone.label.split(' ').slice(1).join(' ').toLowerCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
