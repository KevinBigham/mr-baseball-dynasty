import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer } from '../../types/league';

function formatMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

interface OffseasonSummary {
  expiringContracts: RosterPlayer[];
  arbEligible: RosterPlayer[];
  topFreeAgents: Array<{ playerId: number; name: string; position: string; overall: number; age: number; askingPrice: number }>;
  extensionCandidates: Array<{ playerId: number; name: string; position: string; overall: number; contractYearsRemaining: number }>;
  totalPayroll: number;
  projectedPayroll: number;
  rosterSpots: number;
}

function QuickLink({ label, tab, icon }: { label: string; tab: string; icon: string }) {
  const { setActiveTab } = useUIStore();
  return (
    <button
      onClick={() => setActiveTab(tab as never)}
      className="bloomberg-border px-3 py-2 text-xs hover:bg-gray-800/50 transition-colors text-left">
      <div className="text-gray-500 text-[10px]">{icon}</div>
      <div className="text-orange-300 font-bold mt-0.5">{label}</div>
    </button>
  );
}

function PlayerChip({ player, onClick }: { player: RosterPlayer; onClick: () => void }) {
  const ovrColor = player.overall >= 70 ? 'text-green-400' :
    player.overall >= 60 ? 'text-blue-400' :
    player.overall >= 50 ? 'text-orange-400' : 'text-gray-400';
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-800/30 cursor-pointer border-b border-gray-800/30"
      onClick={onClick}>
      <span className="text-orange-300 font-bold truncate flex-1">{player.name}</span>
      <span className="text-gray-600 text-[10px]">{player.position}</span>
      <span className={`font-bold tabular-nums ${ovrColor}`}>{player.overall}</span>
      <span className="text-gray-600 text-[10px] tabular-nums">{player.age}</span>
      <span className="text-gray-500 text-[10px] tabular-nums">{formatMoney(player.salary)}</span>
    </div>
  );
}

export default function OffseasonHub() {
  const { gameStarted, userTeamId, season } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    getEngine().getRoster(userTeamId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading offseason data...</div>;
  if (!roster) return null;

  const allPlayers = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa];
  const activePlayers = [...roster.active, ...roster.il];
  const LUXURY_TAX = 230_000_000;

  // Expiring contracts (1 year remaining)
  const expiring = activePlayers
    .filter(p => p.contractYearsRemaining <= 1)
    .sort((a, b) => b.salary - a.salary);

  // Players with 2 years left (upcoming decisions)
  const upcoming = activePlayers
    .filter(p => p.contractYearsRemaining === 2)
    .sort((a, b) => b.salary - a.salary);

  // Arb-eligible (young players, low contract years, active)
  const arbEligible = activePlayers
    .filter(p => p.contractYearsRemaining <= 1 && p.salary < 5_000_000 && p.age <= 30)
    .sort((a, b) => b.overall - a.overall);

  // Key re-signings (high OVR expiring)
  const keyResignings = expiring.filter(p => p.overall >= 55).sort((a, b) => b.overall - a.overall);

  // Payroll calculations
  const currentPayroll = activePlayers.reduce((s, p) => s + p.salary, 0);
  const nextYearPayroll = activePlayers
    .filter(p => p.contractYearsRemaining > 1)
    .reduce((s, p) => s + p.salary, 0);
  const capSpace = LUXURY_TAX - nextYearPayroll;
  const expiringValue = expiring.reduce((s, p) => s + p.salary, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">OFFSEASON PLANNER — {season}</div>

      {/* Quick links */}
      <div className="grid grid-cols-6 gap-3">
        <QuickLink label="FREE AGENTS" tab="freeagents" icon="FA" />
        <QuickLink label="EXTENSIONS" tab="extensions" icon="EXT" />
        <QuickLink label="DRAFT ROOM" tab="draft" icon="DRF" />
        <QuickLink label="WAIVERS" tab="waivers" icon="WVR" />
        <QuickLink label="TRADE CENTER" tab="trades" icon="TRD" />
        <QuickLink label="RULE 5" tab="rule5" icon="R5" />
      </div>

      {/* Financial overview */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CURRENT PAYROLL</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{formatMoney(currentPayroll)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMMITTED NEXT YR</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">{formatMoney(nextYearPayroll)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">EXPIRING VALUE</div>
          <div className="text-red-400 font-bold text-lg tabular-nums">{formatMoney(expiringValue)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CBT SPACE (NEXT YR)</div>
          <div className={`font-bold text-lg tabular-nums ${capSpace >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {capSpace >= 0 ? formatMoney(capSpace) : `-${formatMoney(-capSpace)}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Key re-signings */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-red-400">
            KEY RE-SIGNING DECISIONS ({keyResignings.length})
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {keyResignings.length === 0 ? (
              <div className="px-4 py-4 text-gray-600 text-xs text-center">No key decisions pending.</div>
            ) : (
              keyResignings.map(p => (
                <PlayerChip key={p.playerId} player={p} onClick={() => goToPlayer(p.playerId)} />
              ))
            )}
          </div>
        </div>

        {/* All expiring */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-orange-400">
            ALL EXPIRING CONTRACTS ({expiring.length})
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {expiring.length === 0 ? (
              <div className="px-4 py-4 text-gray-600 text-xs text-center">No expiring contracts.</div>
            ) : (
              expiring.map(p => (
                <PlayerChip key={p.playerId} player={p} onClick={() => goToPlayer(p.playerId)} />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming decisions (2 years out) */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-yellow-400">
            UPCOMING DECISIONS — {season + 1} ({upcoming.length})
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {upcoming.length === 0 ? (
              <div className="px-4 py-4 text-gray-600 text-xs text-center">No upcoming decisions.</div>
            ) : (
              upcoming.map(p => (
                <PlayerChip key={p.playerId} player={p} onClick={() => goToPlayer(p.playerId)} />
              ))
            )}
          </div>
        </div>

        {/* Arbitration eligible */}
        <div className="bloomberg-border">
          <div className="bloomberg-header text-blue-400">
            ARBITRATION ELIGIBLE ({arbEligible.length})
          </div>
          <div className="max-h-[16rem] overflow-y-auto">
            {arbEligible.length === 0 ? (
              <div className="px-4 py-4 text-gray-600 text-xs text-center">No arb-eligible players.</div>
            ) : (
              arbEligible.map(p => (
                <PlayerChip key={p.playerId} player={p} onClick={() => goToPlayer(p.playerId)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Roster composition */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">ROSTER COMPOSITION</div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800 p-3">
          <div className="px-3 text-center">
            <div className="text-gray-500 text-[10px]">26-MAN</div>
            <div className="text-gray-300 font-bold text-lg">{roster.active.length}</div>
            <div className="text-gray-600 text-[10px]">{26 - roster.active.length} spots open</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-gray-500 text-[10px]">IL</div>
            <div className="text-red-400 font-bold text-lg">{roster.il.length}</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-gray-500 text-[10px]">MINORS</div>
            <div className="text-blue-400 font-bold text-lg">{roster.minors.length}</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-gray-500 text-[10px]">DFA</div>
            <div className="text-gray-400 font-bold text-lg">{roster.dfa.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
