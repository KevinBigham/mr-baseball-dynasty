import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { SeasonMilestone } from '../../engine/history/awardsHistory';
import type { CareerRecord } from '../../engine/history/careerStats';

interface MilestoneThreshold {
  stat: string;
  label: string;
  thresholds: number[];
  isPitching: boolean;
}

const MILESTONE_DEFS: MilestoneThreshold[] = [
  { stat: 'h', label: 'Hits', thresholds: [1000, 2000, 3000], isPitching: false },
  { stat: 'hr', label: 'Home Runs', thresholds: [100, 200, 300, 400, 500, 600], isPitching: false },
  { stat: 'rbi', label: 'RBI', thresholds: [500, 1000, 1500, 2000], isPitching: false },
  { stat: 'sb', label: 'Stolen Bases', thresholds: [100, 200, 300, 400, 500], isPitching: false },
  { stat: 'r', label: 'Runs', thresholds: [500, 1000, 1500, 2000], isPitching: false },
  { stat: 'w', label: 'Wins', thresholds: [100, 150, 200, 250, 300], isPitching: true },
  { stat: 'ka', label: 'Strikeouts', thresholds: [1000, 2000, 3000], isPitching: true },
  { stat: 'sv', label: 'Saves', thresholds: [100, 200, 300, 400, 500], isPitching: true },
];

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, (current / target) * 100);
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-orange-500' : pct >= 50 ? 'bg-blue-500' : 'bg-gray-600';
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MilestoneBadge({ value }: { value: number }) {
  const color = value >= 3000 ? 'bg-yellow-900/40 text-yellow-400' :
    value >= 2000 ? 'bg-green-900/40 text-green-400' :
    value >= 1000 ? 'bg-blue-900/40 text-blue-400' :
    value >= 500 ? 'bg-orange-900/40 text-orange-400' :
    'bg-gray-800 text-gray-400';
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>{value.toLocaleString()}</span>;
}

export default function MilestoneTracker() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [milestones, setMilestones] = useState<SeasonMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hitting' | 'pitching'>('all');

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getMilestones()
      .then(setMilestones)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading milestones...</div>;

  // Group milestones by season
  const seasons = [...new Set(milestones.map(m => m.season))].sort((a, b) => b - a);

  // Group by stat type
  const hitMilestones = milestones.filter(m => {
    const stat = m.milestone.toLowerCase();
    return stat.includes('hit') || stat.includes('hr') || stat.includes('run') || stat.includes('steal') || stat.includes('rbi');
  });
  const pitchMilestones = milestones.filter(m => {
    const stat = m.milestone.toLowerCase();
    return stat.includes('win') || stat.includes('strikeout') || stat.includes('save') || stat.includes('k');
  });

  const filtered = filter === 'all' ? milestones :
    filter === 'hitting' ? hitMilestones : pitchMilestones;

  // Group filtered by season
  const filteredBySeasons = seasons.filter(s => filtered.some(m => m.season === s));

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CAREER MILESTONES</span>
        <span className="text-gray-600 text-[10px]">{milestones.length} TOTAL MILESTONES ACHIEVED</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL MILESTONES</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{milestones.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HITTING</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{hitMilestones.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PITCHING</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{pitchMilestones.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SEASONS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{seasons.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'hitting', 'pitching'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} milestones</span>
      </div>

      {/* Milestones by season */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">MILESTONES BY SEASON</div>
        <div className="max-h-[36rem] overflow-y-auto">
          {filteredBySeasons.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">
              No milestones achieved yet. Play more seasons to see career milestones.
            </div>
          ) : (
            filteredBySeasons.map(s => {
              const seasonMilestones = filtered.filter(m => m.season === s);
              return (
                <div key={s} className="border-b border-gray-800/50 last:border-0">
                  <div className="px-3 py-1.5 bg-gray-900/50 flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-bold">SEASON {s}</span>
                    <span className="text-gray-600 text-[10px]">{seasonMilestones.length} milestone{seasonMilestones.length !== 1 ? 's' : ''}</span>
                  </div>
                  {seasonMilestones.map((m, i) => (
                    <div key={i}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => goToPlayer(m.playerId)}>
                      <MilestoneBadge value={parseInt(m.milestone.replace(/\D/g, '')) || 0} />
                      <span className="text-orange-300 font-bold flex-1">{m.name}</span>
                      <span className="text-gray-400">{m.milestone}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Milestone thresholds legend */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">TRACKED MILESTONES</div>
        <div className="p-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-gray-500 text-[10px] font-bold mb-1">HITTING</div>
            {MILESTONE_DEFS.filter(d => !d.isPitching).map(d => (
              <div key={d.stat} className="flex items-center gap-2 text-xs py-0.5">
                <span className="text-gray-400 w-24">{d.label}</span>
                <div className="flex items-center gap-1">
                  {d.thresholds.map(t => (
                    <span key={t} className="text-gray-600 text-[10px] tabular-nums">{t.toLocaleString()}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-500 text-[10px] font-bold mb-1">PITCHING</div>
            {MILESTONE_DEFS.filter(d => d.isPitching).map(d => (
              <div key={d.stat} className="flex items-center gap-2 text-xs py-0.5">
                <span className="text-gray-400 w-24">{d.label}</span>
                <div className="flex items-center gap-1">
                  {d.thresholds.map(t => (
                    <span key={t} className="text-gray-600 text-[10px] tabular-nums">{t.toLocaleString()}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
