import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  COMPONENT_DISPLAY,
  generateDemoWAR,
  getTeamWARSummary,
  type WARPlayer,
  type WARComponent,
} from '../../engine/analytics/warBreakdown';

function WARBar({ component, value }: { component: WARComponent; value: number }) {
  const info = COMPONENT_DISPLAY[component];
  const maxVal = 7;
  const pct = Math.min(100, Math.max(0, ((value + maxVal) / (2 * maxVal)) * 100));

  return (
    <div className="flex items-center gap-1 text-[9px]">
      <span className="w-14 text-gray-500">{info.label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
        <div className="absolute left-1/2 top-0 w-px h-full bg-gray-700" />
        {value >= 0 ? (
          <div className="h-full rounded-full transition-all absolute" style={{ left: '50%', width: `${(value / maxVal) * 50}%`, backgroundColor: info.color }} />
        ) : (
          <div className="h-full rounded-full transition-all absolute" style={{ right: '50%', width: `${(-value / maxVal) * 50}%`, backgroundColor: '#ef4444' }} />
        )}
      </div>
      <span className="w-8 text-right tabular-nums font-bold" style={{ color: value >= 0 ? info.color : '#ef4444' }}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}

function PlayerCard({ player }: { player: WARPlayer }) {
  const warColor = player.totalWAR >= 6 ? '#22c55e' : player.totalWAR >= 3 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-orange-300 font-bold text-xs">#{player.warRank}</span>
              <span className="text-orange-300 font-bold text-sm">{player.name}</span>
            </div>
            <div className="text-gray-600 text-[10px]">{player.pos} | {player.team} | Age {player.age}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg tabular-nums" style={{ color: warColor }}>{player.totalWAR.toFixed(1)}</div>
            <div className="text-gray-600 text-[10px]">WAR</div>
          </div>
        </div>

        {/* WAR component bars */}
        <div className="space-y-1 mb-2">
          {(Object.entries(player.components) as [WARComponent, number][]).map(([comp, val]) => (
            <WARBar key={comp} component={comp} value={val} />
          ))}
        </div>

        {/* Value */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">
            ${player.salary}M salary
          </span>
          <span className="text-gray-400">
            ${player.dollarsPerWAR}M/WAR
          </span>
          <span className="text-gray-500">
            Top {100 - player.percentile}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WARBreakdownView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<WARPlayer[]>(() => generateDemoWAR());
  const [filter, setFilter] = useState<'all' | 'position' | 'pitching'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getTeamWARSummary(players);
  const filtered = filter === 'all' ? players : filter === 'position' ? players.filter(p => !p.isPitcher) : players.filter(p => p.isPitcher);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>WAR BREAKDOWN</span>
        <span className="text-gray-600 text-[10px]">{players.length} PLAYERS</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL WAR</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.totalWAR}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">POS WAR</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.positionWAR}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PITCH WAR</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.pitchingWAR}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">$/WAR</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">${summary.avgDollarsPerWAR}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MVP</div>
          <div className="text-yellow-400 font-bold text-xs truncate">{summary.bestPlayer}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(['all', 'position', 'pitching'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(p => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
