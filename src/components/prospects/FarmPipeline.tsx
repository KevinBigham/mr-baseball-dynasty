import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer } from '../../types/league';
import type { ProspectReport } from '../../engine/scouting/prospectRankings';

const LEVELS = [
  { key: 'MINORS_AAA', label: 'AAA', color: 'text-green-400' },
  { key: 'MINORS_AA', label: 'AA', color: 'text-blue-400' },
  { key: 'MINORS_APLUS', label: 'A+', color: 'text-cyan-400' },
  { key: 'MINORS_AMINUS', label: 'A-', color: 'text-yellow-400' },
  { key: 'MINORS_ROOKIE', label: 'ROOKIE', color: 'text-orange-400' },
  { key: 'MINORS_INTL', label: 'INTL', color: 'text-red-400' },
] as const;

function OvrPotBar({ ovr, pot }: { ovr: number; pot: number }) {
  const ovrPct = Math.min(100, ((ovr - 20) / 60) * 100);
  const potPct = Math.min(100, ((pot - 20) / 60) * 100);
  return (
    <div className="relative w-20 h-2.5 bg-gray-800 rounded-full overflow-hidden">
      {/* Potential (background bar) */}
      <div className="absolute h-full bg-blue-900/50 rounded-full" style={{ width: `${potPct}%` }} />
      {/* Current (foreground bar) */}
      <div className={`absolute h-full rounded-full ${
        ovr >= 60 ? 'bg-green-500' : ovr >= 50 ? 'bg-orange-500' : ovr >= 40 ? 'bg-yellow-500' : 'bg-red-500'
      }`} style={{ width: `${ovrPct}%` }} />
    </div>
  );
}

function LevelCard({ level, players, prospects, onPlayer }: {
  level: typeof LEVELS[number];
  players: RosterPlayer[];
  prospects: Map<number, ProspectReport>;
  onPlayer: (id: number) => void;
}) {
  const sorted = [...players].sort((a, b) => b.overall - a.overall);
  const hitters = sorted.filter(p => !p.isPitcher);
  const pitchers = sorted.filter(p => p.isPitcher);
  const avgOvr = players.length > 0 ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length) : 0;
  const avgAge = players.length > 0 ? (players.reduce((s, p) => s + p.age, 0) / players.length).toFixed(1) : '—';

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <span className={level.color}>{level.label}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-[10px]">{players.length} players</span>
          <span className="text-gray-500 text-[10px]">AVG OVR: <span className="text-gray-300 font-bold">{avgOvr}</span></span>
          <span className="text-gray-500 text-[10px]">AVG AGE: <span className="text-gray-300">{avgAge}</span></span>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="px-4 py-3 text-gray-700 text-xs text-center">No players at this level.</div>
      ) : (
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
          {/* Hitters */}
          <div>
            <div className="px-2 py-1 text-gray-600 text-[10px] font-bold border-b border-gray-800">
              HITTERS ({hitters.length})
            </div>
            {hitters.map(p => {
              const pr = prospects.get(p.playerId);
              return (
                <div key={p.playerId}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30 last:border-0"
                  onClick={() => onPlayer(p.playerId)}>
                  <span className="text-orange-300 font-bold truncate flex-1">{p.name}</span>
                  <span className="text-gray-600 text-[10px]">{p.position}</span>
                  <span className="text-gray-500 text-[10px] w-5 text-right">{p.age}</span>
                  <OvrPotBar ovr={p.overall} pot={p.potential} />
                  <span className="text-gray-400 tabular-nums text-[10px] w-5 text-right">{p.overall}</span>
                  <span className="text-gray-600 tabular-nums text-[10px] w-5 text-right">{p.potential}</span>
                  {pr && pr.orgRank > 0 && pr.orgRank <= 10 && (
                    <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-yellow-900/30 text-yellow-400">#{pr.orgRank}</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Pitchers */}
          <div>
            <div className="px-2 py-1 text-gray-600 text-[10px] font-bold border-b border-gray-800">
              PITCHERS ({pitchers.length})
            </div>
            {pitchers.map(p => {
              const pr = prospects.get(p.playerId);
              return (
                <div key={p.playerId}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30 last:border-0"
                  onClick={() => onPlayer(p.playerId)}>
                  <span className="text-orange-300 font-bold truncate flex-1">{p.name}</span>
                  <span className="text-gray-600 text-[10px]">{p.position}</span>
                  <span className="text-gray-500 text-[10px] w-5 text-right">{p.age}</span>
                  <OvrPotBar ovr={p.overall} pot={p.potential} />
                  <span className="text-gray-400 tabular-nums text-[10px] w-5 text-right">{p.overall}</span>
                  <span className="text-gray-600 tabular-nums text-[10px] w-5 text-right">{p.potential}</span>
                  {pr && pr.orgRank > 0 && pr.orgRank <= 10 && (
                    <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-yellow-900/30 text-yellow-400">#{pr.orgRank}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FarmPipeline() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [allPlayers, setAllPlayers] = useState<RosterPlayer[]>([]);
  const [prospects, setProspects] = useState<ProspectReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    Promise.all([
      getEngine().getRoster(userTeamId),
      getEngine().getOrgProspects(userTeamId),
    ]).then(([roster, prList]) => {
      // Combine all roster groups
      const all = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa];
      setAllPlayers(all);
      setProspects(prList);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading farm system...</div>;

  // Group players by level
  const byLevel = new Map<string, RosterPlayer[]>();
  for (const lev of LEVELS) byLevel.set(lev.key, []);
  for (const p of allPlayers) {
    const bucket = byLevel.get(p.rosterStatus);
    if (bucket) bucket.push(p);
  }

  // Prospect lookup map
  const prospectMap = new Map<number, ProspectReport>();
  for (const pr of prospects) prospectMap.set(pr.playerId, pr);

  // Pipeline stats
  const minorsTotal = LEVELS.reduce((s, l) => s + (byLevel.get(l.key)?.length ?? 0), 0);
  const top10Prospects = prospects.filter(p => p.orgRank <= 10);
  const highCeiling = prospects.filter(p => p.ceiling === 'Superstar' || p.ceiling === 'All-Star');
  const readySoon = prospects.filter(p => p.eta === 'MLB Ready' || Number(p.eta) <= new Date().getFullYear() + 1);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">MINOR LEAGUE PIPELINE</div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL IN MINORS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{minorsTotal}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOP PROSPECTS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{top10Prospects.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIGH CEILING</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{highCeiling.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MLB READY SOON</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{readySoon.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RANKED PROSPECTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{prospects.length}</div>
        </div>
      </div>

      {/* Top 10 prospects sidebar */}
      {top10Prospects.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">TOP ORG PROSPECTS</div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
            {top10Prospects.slice(0, 10).map(pr => (
              <div key={pr.playerId}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
                onClick={() => goToPlayer(pr.playerId)}>
                <span className="text-yellow-400 font-bold text-xs w-5">#{pr.orgRank}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-orange-300 font-bold text-xs truncate">{pr.name}</div>
                  <div className="text-gray-600 text-[10px]">{pr.position} · {pr.level} · Age {pr.age}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold tabular-nums ${
                    pr.fv >= 60 ? 'text-green-400' : pr.fv >= 50 ? 'text-orange-400' : 'text-gray-400'
                  }`}>FV {pr.fv}</div>
                  <div className={`text-[10px] ${
                    pr.ceiling === 'Superstar' ? 'text-yellow-400' :
                    pr.ceiling === 'All-Star' ? 'text-green-400' : 'text-gray-500'
                  }`}>{pr.ceiling}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level-by-level breakdown */}
      <div className="space-y-3">
        {LEVELS.map(level => (
          <LevelCard
            key={level.key}
            level={level}
            players={byLevel.get(level.key) ?? []}
            prospects={prospectMap}
            onPlayer={goToPlayer}
          />
        ))}
      </div>
    </div>
  );
}
