import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer } from '../../types/league';

const LUXURY_TAX = 230_000_000;

function formatMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function PayrollBar({ current, budget, luxuryTax }: { current: number; budget: number; luxuryTax: number }) {
  const max = Math.max(current, budget, luxuryTax) * 1.1;
  const curPct = (current / max) * 100;
  const budPct = (budget / max) * 100;
  const luxPct = (luxuryTax / max) * 100;
  const color = current > luxuryTax ? 'bg-red-500' : current > budget ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${curPct}%` }} />
      {/* Budget line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/70" style={{ left: `${budPct}%` }}
        title={`Budget: ${formatMoney(budget)}`} />
      {/* Luxury tax line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/70" style={{ left: `${luxPct}%` }}
        title={`CBT: ${formatMoney(luxuryTax)}`} />
    </div>
  );
}

export default function PayrollPlanner() {
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
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading payroll data...</div>;
  if (!roster) return null;

  const allPlayers = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa]
    .sort((a, b) => b.salary - a.salary);

  const totalPayroll = allPlayers.reduce((s, p) => s + p.salary, 0);
  const activePayroll = roster.active.reduce((s, p) => s + p.salary, 0);
  const ilPayroll = roster.il.reduce((s, p) => s + p.salary, 0);

  // Future commitments: project year-by-year
  const futureYears = useMemo(() => {
    const years: Array<{ year: number; committed: number; players: number; expiring: RosterPlayer[] }> = [];
    for (let y = 0; y < 5; y++) {
      const committed = allPlayers
        .filter(p => p.contractYearsRemaining > y)
        .reduce((s, p) => s + p.salary, 0);
      const numPlayers = allPlayers.filter(p => p.contractYearsRemaining > y).length;
      const expiring = allPlayers.filter(p => p.contractYearsRemaining === y + 1);
      years.push({ year: season + y, committed, players: numPlayers, expiring });
    }
    return years;
  }, [allPlayers, season]);

  // Contract buckets
  const bigContracts = allPlayers.filter(p => p.salary >= 10_000_000);
  const midContracts = allPlayers.filter(p => p.salary >= 1_000_000 && p.salary < 10_000_000);
  const minContracts = allPlayers.filter(p => p.salary < 1_000_000);

  const overLux = totalPayroll > LUXURY_TAX;
  const space = LUXURY_TAX - totalPayroll;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">PAYROLL PLANNER</div>

      {/* Current payroll */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL PAYROLL</div>
          <div className={`font-bold text-lg tabular-nums ${overLux ? 'text-red-400' : 'text-orange-400'}`}>
            {formatMoney(totalPayroll)}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACTIVE (26)</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{formatMoney(activePayroll)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">IL</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{formatMoney(ilPayroll)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CBT SPACE</div>
          <div className={`font-bold text-lg tabular-nums ${space >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {space >= 0 ? formatMoney(space) : `-${formatMoney(-space)}`}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ON ROSTER</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{allPlayers.length}</div>
        </div>
      </div>

      {/* Payroll bar */}
      <div className="bloomberg-border px-4 py-3">
        <PayrollBar current={totalPayroll} budget={180_000_000} luxuryTax={LUXURY_TAX} />
        <div className="flex justify-between mt-1 text-[10px] text-gray-600">
          <span>$0</span>
          <span className="text-yellow-600">Budget $180M</span>
          <span className="text-red-600">CBT $230M</span>
          <span>${(Math.max(totalPayroll, LUXURY_TAX) * 1.1 / 1e6).toFixed(0)}M</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Future commitments */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">FUTURE COMMITMENTS</div>
          <div className="p-3 space-y-2">
            {futureYears.map(y => (
              <div key={y.year} className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-bold w-10">{y.year}</span>
                <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${
                    y.committed > LUXURY_TAX ? 'bg-red-600' : y.committed > 180_000_000 ? 'bg-orange-600' : 'bg-green-700'
                  }`} style={{ width: `${Math.min(100, (y.committed / LUXURY_TAX) * 90)}%` }} />
                </div>
                <span className="text-gray-400 text-xs tabular-nums w-16 text-right">{formatMoney(y.committed)}</span>
                <span className="text-gray-600 text-[10px] w-6">{y.players}p</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contract distribution */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">CONTRACT DISTRIBUTION</div>
          <div className="p-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-bold">$10M+ ({bigContracts.length})</span>
                <span className="text-gray-400 tabular-nums">{formatMoney(bigContracts.reduce((s, p) => s + p.salary, 0))}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full"
                  style={{ width: `${totalPayroll > 0 ? (bigContracts.reduce((s, p) => s + p.salary, 0) / totalPayroll) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400 font-bold">$1M-$10M ({midContracts.length})</span>
                <span className="text-gray-400 tabular-nums">{formatMoney(midContracts.reduce((s, p) => s + p.salary, 0))}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 rounded-full"
                  style={{ width: `${totalPayroll > 0 ? (midContracts.reduce((s, p) => s + p.salary, 0) / totalPayroll) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-400 font-bold">Min/Pre-Arb ({minContracts.length})</span>
                <span className="text-gray-400 tabular-nums">{formatMoney(minContracts.reduce((s, p) => s + p.salary, 0))}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full"
                  style={{ width: `${totalPayroll > 0 ? (minContracts.reduce((s, p) => s + p.salary, 0) / totalPayroll) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring contracts by year */}
      {futureYears.slice(0, 3).map(y => y.expiring.length > 0 && (
        <div key={y.year} className="bloomberg-border">
          <div className="bloomberg-header">EXPIRING AFTER {y.year} ({y.expiring.length} players)</div>
          <div className="max-h-[12rem] overflow-y-auto">
            <table className="w-full">
              <tbody>
                {y.expiring.sort((a, b) => b.salary - a.salary).map(p => (
                  <tr key={p.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => goToPlayer(p.playerId)}>
                    <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                    <td className="px-2 py-1 text-gray-500">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-gray-400">{p.age}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`font-bold tabular-nums ${
                        p.overall >= 60 ? 'text-green-400' : p.overall >= 50 ? 'text-orange-400' : 'text-gray-400'
                      }`}>{p.overall}</span>
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-400">{formatMoney(p.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Full contract table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">ALL CONTRACTS ({allPlayers.length})</div>
        <div className="max-h-[24rem] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                <th className="px-2 py-1 text-left">PLAYER</th>
                <th className="px-2 py-1">POS</th>
                <th className="px-2 py-1">AGE</th>
                <th className="px-2 py-1">OVR</th>
                <th className="px-2 py-1 text-right">AAV</th>
                <th className="px-2 py-1">YRS</th>
                <th className="px-2 py-1 text-right">TOTAL</th>
                <th className="px-2 py-1">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(p => (
                <tr key={p.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => goToPlayer(p.playerId)}>
                  <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                  <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                  <td className="px-2 py-1 tabular-nums text-gray-400 text-center">{p.age}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`font-bold tabular-nums ${
                      p.overall >= 70 ? 'text-green-400' : p.overall >= 60 ? 'text-blue-400' : p.overall >= 50 ? 'text-orange-400' : 'text-gray-400'
                    }`}>{p.overall}</span>
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums text-gray-300">{formatMoney(p.salary)}</td>
                  <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.contractYearsRemaining}Y</td>
                  <td className="px-2 py-1 text-right tabular-nums text-gray-500">
                    {formatMoney(p.salary * p.contractYearsRemaining)}
                  </td>
                  <td className="px-2 py-1">
                    {p.contractYearsRemaining <= 1 ? (
                      <span className="text-red-400 text-[10px] font-bold">EXPIRING</span>
                    ) : p.contractYearsRemaining >= 4 ? (
                      <span className="text-blue-400 text-[10px] font-bold">LOCKED</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
