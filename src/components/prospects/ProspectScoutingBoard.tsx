import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { ProspectReport } from '../../engine/scouting/prospectRankings';

const FV_LABELS: Record<number, string> = {
  80: 'Generational',
  70: 'Perennial All-Star',
  60: 'All-Star Upside',
  55: 'Above-Average Regular',
  50: 'Average Regular',
  45: 'Fringe Regular',
  40: 'Org Depth',
};

function FVBadge({ fv }: { fv: number }) {
  const label = FV_LABELS[fv] ?? '';
  const color = fv >= 70 ? 'bg-green-900/40 text-green-400' :
    fv >= 60 ? 'bg-blue-900/40 text-blue-400' :
    fv >= 55 ? 'bg-orange-900/40 text-orange-400' :
    fv >= 50 ? 'bg-yellow-900/40 text-yellow-400' :
    'bg-gray-800 text-gray-400';

  return (
    <div className="flex items-center gap-1">
      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>FV {fv}</span>
      {label && <span className="text-gray-600 text-[10px]">{label}</span>}
    </div>
  );
}

function RiskLabel({ risk }: { risk: string }) {
  const color = risk === 'low' ? 'text-green-400' :
    risk === 'medium' ? 'text-orange-400' :
    risk === 'high' ? 'text-red-400' : 'text-gray-400';
  return <span className={`text-[10px] font-bold ${color}`}>{risk.toUpperCase()}</span>;
}

function CeilingLabel({ ceiling }: { ceiling: string }) {
  const color = ceiling === 'star' ? 'text-yellow-400' :
    ceiling === 'starter' ? 'text-blue-400' :
    ceiling === 'role_player' ? 'text-gray-300' :
    ceiling === 'bench' ? 'text-gray-500' : 'text-gray-400';
  return <span className={`text-[10px] font-bold ${color}`}>{ceiling.replace(/_/g, ' ').toUpperCase()}</span>;
}

function ETABadge({ eta }: { eta: number }) {
  const yearsAway = eta - new Date().getFullYear();
  const label = yearsAway <= 0 ? 'MLB READY' : yearsAway === 1 ? '1 YR' : `${yearsAway} YRS`;
  const color = yearsAway <= 0 ? 'text-green-400' : yearsAway <= 1 ? 'text-orange-400' : 'text-gray-500';
  return <span className={`text-[10px] font-bold tabular-nums ${color}`}>{label}</span>;
}

function ProspectRow({ prospect, rank, onClickPlayer }: {
  prospect: ProspectReport;
  rank: number;
  onClickPlayer: (id: number) => void;
}) {
  const ovrColor = prospect.overall >= 70 ? 'text-green-400' :
    prospect.overall >= 60 ? 'text-blue-400' :
    prospect.overall >= 50 ? 'text-orange-400' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
      onClick={() => onClickPlayer(prospect.playerId)}>
      <span className="text-gray-600 tabular-nums w-6 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-orange-300 font-bold truncate">{prospect.name}</span>
          <span className="text-gray-600 text-[10px]">{prospect.position}</span>
          <span className="text-gray-700 text-[10px]">({prospect.teamName})</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <FVBadge fv={prospect.fv} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <span className={`font-bold tabular-nums ${ovrColor}`}>{prospect.overall}</span>
          <span className="text-gray-600 text-[10px]">/</span>
          <span className="text-blue-400 tabular-nums font-bold">{prospect.potential}</span>
        </div>
        <div className="text-right w-16">
          <div><RiskLabel risk={prospect.risk} /></div>
          <div><CeilingLabel ceiling={prospect.ceiling} /></div>
        </div>
        <div className="text-right w-12">
          <ETABadge eta={prospect.eta} />
          <div className="text-gray-600 text-[10px]">Age {prospect.age}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProspectScoutingBoard() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [leagueProspects, setLeagueProspects] = useState<ProspectReport[]>([]);
  const [orgProspects, setOrgProspects] = useState<ProspectReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'league' | 'org'>('org');
  const [posFilter, setPosFilter] = useState('ALL');

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    Promise.all([
      getEngine().getLeagueProspects(),
      getEngine().getOrgProspects(userTeamId),
    ]).then(([league, org]) => {
      setLeagueProspects(league);
      setOrgProspects(org);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading scouting data...</div>;

  const prospects = view === 'org' ? orgProspects : leagueProspects;
  const filtered = posFilter === 'ALL' ? prospects :
    posFilter === 'P' ? prospects.filter(p => p.position === 'SP' || p.position === 'RP' || p.position === 'CL') :
    posFilter === 'H' ? prospects.filter(p => !['SP', 'RP', 'CL'].includes(p.position)) :
    prospects.filter(p => p.position === posFilter);

  // Summary stats
  const elite = prospects.filter(p => p.fv >= 60).length;
  const solid = prospects.filter(p => p.fv >= 50 && p.fv < 60).length;
  const depth = prospects.filter(p => p.fv < 50).length;
  const mlbReady = prospects.filter(p => {
    const season = useGameStore.getState().season;
    return p.eta <= season;
  }).length;
  const avgFV = prospects.length > 0
    ? Math.round(prospects.reduce((s, p) => s + p.fv, 0) / prospects.length)
    : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SCOUTING BOARD</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('org')}
            className={`px-3 py-0.5 text-xs font-bold ${
              view === 'org' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400'
            }`}>YOUR ORG</button>
          <button onClick={() => setView('league')}
            className={`px-3 py-0.5 text-xs font-bold ${
              view === 'league' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400'
            }`}>LEAGUE TOP 100</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ELITE (FV 60+)</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{elite}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SOLID (FV 50+)</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{solid}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEPTH ({'<'}50)</div>
          <div className="text-gray-400 font-bold text-xl tabular-nums">{depth}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MLB READY</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{mlbReady}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG FV</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{avgFV}</div>
        </div>
      </div>

      {/* Position filter */}
      <div className="flex items-center gap-1">
        <span className="text-gray-600 text-xs mr-1">FILTER:</span>
        {['ALL', 'H', 'P', 'C', 'SS', 'SP'].map(f => (
          <button key={f} onClick={() => setPosFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              posFilter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f}</button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} prospects</span>
      </div>

      {/* Prospect list */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">
          {view === 'org' ? 'ORGANIZATION PROSPECTS' : 'LEAGUE TOP PROSPECTS'} ({filtered.length})
        </div>
        <div className="max-h-[36rem] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No prospects match filter.</div>
          ) : (
            filtered.map((p, i) => (
              <ProspectRow key={p.playerId} prospect={p} rank={i + 1} onClickPlayer={goToPlayer} />
            ))
          )}
        </div>
      </div>

      {/* FV scale legend */}
      <div className="bloomberg-border px-3 py-2">
        <div className="text-gray-500 text-[10px] font-bold mb-1">FUTURE VALUE SCALE</div>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(FV_LABELS).reverse().map(([fv, label]) => (
            <span key={fv} className="text-gray-600 text-[10px]">
              <span className="text-gray-400 font-bold">{fv}</span> = {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
