import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  LEVEL_DISPLAY,
  generateDemoAffiliates,
  getSystemSummary,
  getETALabel,
  promote,
  type AffiliateTeam,
  type MinorLeaguePlayer,
  type MinorLevel,
} from '../../engine/minors/minorLeagueSystem';

function PlayerRow({ player, onPromote }: { player: MinorLeaguePlayer; onPromote: () => void }) {
  const ovrColor = player.overall >= 65 ? '#22c55e' : player.overall >= 55 ? '#eab308' : '#94a3b8';
  const potColor = player.potential >= 75 ? '#22c55e' : player.potential >= 65 ? '#eab308' : '#94a3b8';
  const etaInfo = getETALabel(player.eta);
  const trendIcon = player.trend === 'rising' ? '▲' : player.trend === 'falling' ? '▼' : '─';
  const trendColor = player.trend === 'rising' ? '#22c55e' : player.trend === 'falling' ? '#ef4444' : '#6b7280';
  const isPitcher = player.pos === 'SP' || player.pos === 'RP';

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0 text-xs">
      <span className="font-bold tabular-nums w-7 text-right" style={{ color: ovrColor }}>{player.overall}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-orange-300 font-bold truncate">{player.name}</span>
          <span className="text-gray-700">{player.pos}</span>
          <span style={{ color: trendColor }}>{trendIcon}</span>
          {player.onRehabAssignment && <span className="text-red-400 text-[10px]">REHAB</span>}
          {player.onFortyMan && <span className="text-blue-400 text-[10px]">40-MAN</span>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Age {player.age}</span>
          <span>POT <span className="font-bold" style={{ color: potColor }}>{player.potential}</span></span>
          {isPitcher ? (
            <>
              <span>{player.stats.era?.toFixed(2)} ERA</span>
              <span>{player.stats.so} K</span>
            </>
          ) : (
            <>
              <span>{player.stats.avg.toFixed(3)} AVG</span>
              <span>{player.stats.hr} HR</span>
              <span>{player.stats.sb} SB</span>
            </>
          )}
        </div>
      </div>
      <span className="text-[10px] font-bold" style={{ color: etaInfo.color }}>{etaInfo.label}</span>
      {player.readyForPromotion && (
        <button onClick={onPromote}
          className="text-[10px] font-bold px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30">
          PROMOTE
        </button>
      )}
    </div>
  );
}

function AffiliateCard({ affiliate, onPromote }: { affiliate: AffiliateTeam; onPromote: (id: number) => void }) {
  const levelInfo = LEVEL_DISPLAY[affiliate.level];
  const wpct = ((affiliate.record.wins / (affiliate.record.wins + affiliate.record.losses)) * 100).toFixed(1);
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: levelInfo.color + '22', color: levelInfo.color }}>
            {affiliate.level}
          </span>
          <span>{affiliate.city} {affiliate.name}</span>
        </div>
        <span className="text-gray-600 text-[10px]">{affiliate.record.wins}-{affiliate.record.losses} ({wpct}%)</span>
      </div>
      {affiliate.players.map(p => (
        <PlayerRow key={p.id} player={p} onPromote={() => onPromote(p.id)} />
      ))}
    </div>
  );
}

export default function MinorLeagueView() {
  const { gameStarted } = useGameStore();
  const [affiliates, setAffiliates] = useState<AffiliateTeam[]>(() => generateDemoAffiliates());
  const [filter, setFilter] = useState<'all' | MinorLevel>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getSystemSummary(affiliates);
  const filtered = filter === 'all' ? affiliates : affiliates.filter(a => a.level === filter);

  const handlePromote = (playerId: number) => {
    setAffiliates(prev => prev.map(a => ({
      ...a,
      players: a.players.map(p => p.id === playerId ? promote(p) : p),
    })));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>MINOR LEAGUE SYSTEM</span>
        <span className="text-gray-600 text-[10px]">{summary.totalPlayers} PLAYERS</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYERS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.totalPlayers}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG OVR</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgOvr}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MLB READY</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.mlbReady}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">40-MAN</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.fortyMan}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">REHAB</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.rehab}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['AAA', 'AA', 'A+', 'A', 'Rookie'] as MinorLevel[]).map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === l ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.sort((a, b) => LEVEL_DISPLAY[a.level].order - LEVEL_DISPLAY[b.level].order).map(a => (
          <AffiliateCard key={a.level} affiliate={a} onPromote={handlePromote} />
        ))}
      </div>
    </div>
  );
}
