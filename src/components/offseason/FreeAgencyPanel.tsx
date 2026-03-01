import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { RosterPlayer } from '../../types/league';

interface FAPlayer extends RosterPlayer {
  projectedSalary: number;
  projectedYears: number;
}

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

type SortKey = 'overall' | 'age' | 'position' | 'salary' | 'stat';

// ─── Market interest level ────────────────────────────────────────────────────
function getMarketInterest(p: FAPlayer): { label: string; color: string; level: number } {
  if (p.overall >= 400 && p.age < 30) return { label: 'HOT', color: 'text-red-400', level: 3 };
  if (p.overall >= 350 && p.age < 33) return { label: 'WARM', color: 'text-yellow-400', level: 2 };
  if (p.overall >= 300) return { label: 'MILD', color: 'text-blue-400', level: 1 };
  return { label: 'COLD', color: 'text-gray-600', level: 0 };
}

// ─── Acceptance probability calculator ────────────────────────────────────────
function calcAcceptance(
  offeredSalary: number, offeredYears: number,
  projectedSalary: number, projectedYears: number,
  marketLevel: number,
): number {
  const salaryRatio = offeredSalary / Math.max(1, projectedSalary);
  const yearsRatio = offeredYears / Math.max(1, projectedYears);

  // Base: 95% if offering ≥1.05x on both salary and years
  let prob = 50;
  if (salaryRatio >= 1.05 && yearsRatio >= 1.0) prob = 95;
  else if (salaryRatio >= 1.0 && yearsRatio >= 1.0) prob = 85;
  else if (salaryRatio >= 0.9 && yearsRatio >= 0.8) prob = 70;
  else if (salaryRatio >= 0.8) prob = 55;
  else if (salaryRatio >= 0.7) prob = 40;
  else prob = Math.max(10, Math.round(salaryRatio * 50));

  // Hot market → need to offer closer to market value
  if (marketLevel >= 3 && salaryRatio < 1.0) prob = Math.max(10, prob - 15);
  if (marketLevel >= 2 && salaryRatio < 0.95) prob = Math.max(10, prob - 10);

  // Extra years bonus
  if (yearsRatio > 1.2) prob = Math.min(98, prob + 5);

  return Math.min(98, Math.max(5, prob));
}

// ─── Offer modal ─────────────────────────────────────────────────────────────
function OfferModal({
  player, onSign, onCancel, currentPayroll, budget,
}: {
  player: FAPlayer;
  onSign: (years: number, salary: number) => void;
  onCancel: () => void;
  currentPayroll: number;
  budget: number;
}) {
  const [years, setYears] = useState(player.projectedYears);
  const [salary, setSalary] = useState(player.projectedSalary);

  const salaryStep = 500_000;
  const minSalary = Math.max(500_000, Math.round(player.projectedSalary * 0.5));
  const maxSalary = Math.round(player.projectedSalary * 2);

  const market = getMarketInterest(player);
  const acceptance = calcAcceptance(salary, years, player.projectedSalary, player.projectedYears, market.level);
  const newPayroll = currentPayroll + salary;
  const budgetMil = budget * 1_000_000;
  const overBudget = newPayroll > budgetMil;

  // Key stat line
  const statLine = player.isPitcher
    ? `${player.stats.era?.toFixed(2) ?? '—'} ERA · ${player.stats.k9?.toFixed(1) ?? '—'} K/9 · ${player.stats.whip?.toFixed(2) ?? '—'} WHIP`
    : `${player.stats.avg?.toFixed(3) ?? '—'} AVG · ${player.stats.hr ?? 0} HR · ${((player.stats.obp ?? 0) + (player.stats.slg ?? 0)).toFixed(3)} OPS`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bloomberg-border bg-gray-900 p-6 max-w-md w-full">
        <div className="text-orange-500 font-bold text-xs tracking-widest mb-4">CONTRACT OFFER</div>

        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-800">
          <div>
            <div className="text-gray-200 font-bold text-sm">{player.name}</div>
            <div className="text-gray-500 text-xs">{player.position} · Age {player.age} · OVR {player.overall}</div>
            <div className="text-gray-600 text-xs mt-0.5">{statLine}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-gray-500 text-xs">MARKET VALUE</div>
            <div className="text-orange-400 font-bold text-sm">{formatSalary(player.projectedSalary)}/yr</div>
            <div className={`text-xs font-bold ${market.color}`}>{market.label} MARKET</div>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">CONTRACT LENGTH</span>
              <span className="text-orange-400 font-bold text-sm">{years} {years === 1 ? 'year' : 'years'}</span>
            </div>
            <input
              type="range" min={1} max={Math.min(8, player.projectedYears + 2)} step={1}
              value={years} onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">ANNUAL SALARY</span>
              <span className="text-orange-400 font-bold text-sm">{formatSalary(salary)}/yr</span>
            </div>
            <input
              type="range" min={minSalary} max={maxSalary} step={salaryStep}
              value={salary} onChange={e => setSalary(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-gray-600 text-xs mt-0.5">
              <span>{formatSalary(minSalary)}</span>
              <span>{formatSalary(maxSalary)}</span>
            </div>
          </div>

          {/* Acceptance probability meter */}
          <div className="bloomberg-border bg-gray-950 p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-gray-500 text-xs">ACCEPTANCE PROBABILITY</span>
              <span className={`font-bold text-sm tabular-nums ${
                acceptance >= 70 ? 'text-green-400' : acceptance >= 45 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {acceptance}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  acceptance >= 70 ? 'bg-green-500' : acceptance >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${acceptance}%` }}
              />
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {acceptance >= 80 ? 'Very likely to accept' :
               acceptance >= 60 ? 'Likely to accept' :
               acceptance >= 40 ? 'May accept — consider sweetening the deal' :
               'Unlikely to accept — increase offer'}
            </div>
          </div>

          {/* Total value + payroll impact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bloomberg-border bg-gray-950 p-3">
              <div className="text-gray-500 text-xs mb-1">TOTAL VALUE</div>
              <div className="text-orange-400 font-bold text-lg tabular-nums">
                {formatSalary(salary * years)}
              </div>
              <div className="text-gray-600 text-xs">{years}yr / {formatSalary(salary)} per year</div>
            </div>

            <div className="bloomberg-border bg-gray-950 p-3">
              <div className="text-gray-500 text-xs mb-1">PAYROLL IMPACT</div>
              <div className={`font-bold text-sm tabular-nums ${overBudget ? 'text-red-400' : 'text-green-400'}`}>
                {formatSalary(newPayroll)}
              </div>
              <div className="text-gray-600 text-xs">
                Budget: ${budget}M
              </div>
              <div className={`text-xs mt-0.5 ${overBudget ? 'text-red-400' : 'text-green-500'}`}>
                {overBudget
                  ? `Over by ${formatSalary(newPayroll - budgetMil)}`
                  : `${formatSalary(budgetMil - newPayroll)} remaining`}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSign(years, salary)}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-3 uppercase tracking-widest"
          >
            SIGN PLAYER
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-3 uppercase tracking-widest"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat cell helper ─────────────────────────────────────────────────────────
function StatCell({ value, suffix }: { value: number | undefined; suffix?: string }) {
  if (value === undefined || value === null) return <td className="px-2 py-1.5 tabular-nums text-right text-gray-700 text-xs">—</td>;
  const display = suffix === '%' ? value.toFixed(3) : suffix === 'ip' ? value.toFixed(1) : String(value);
  return (
    <td className="px-2 py-1.5 tabular-nums text-right text-gray-400 text-xs">{display}{suffix && suffix !== '%' && suffix !== 'ip' ? '' : ''}</td>
  );
}

// ─── Main Free Agency Panel ──────────────────────────────────────────────────
export default function FreeAgencyPanel({ onDone, onTransaction }: {
  onDone: () => void;
  onTransaction?: (tx: { type: 'signing' | 'trade'; description: string }) => void;
}) {
  const { season, userTeamId } = useGameStore();
  const [freeAgents, setFreeAgents] = useState<FAPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [offerPlayer, setOfferPlayer] = useState<FAPlayer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [signings, setSignings] = useState(0);
  const [currentPayroll, setCurrentPayroll] = useState(0);
  const [teamBudget, setTeamBudget] = useState(0);

  const loadFAs = useCallback(async () => {
    setLoading(true);
    const engine = getEngine();
    const fas = await engine.getFreeAgents(100);
    setFreeAgents(fas);
    setLoading(false);
  }, []);

  // Load FAs + payroll context on mount
  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const [fas, roster, teams] = await Promise.all([
        engine.getFreeAgents(100),
        engine.getFullRoster(userTeamId),
        engine.getLeagueTeams(),
      ]);
      setFreeAgents(fas);

      // Compute payroll
      const allPlayers = [...roster.active, ...roster.il];
      const payroll = allPlayers.reduce((s, p) => s + (p.salary || 0), 0);
      setCurrentPayroll(payroll);

      // Get budget
      const myTeam = teams.find(t => t.teamId === userTeamId);
      setTeamBudget(myTeam?.budget ?? 0);

      setLoading(false);
    })();
  }, [userTeamId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSign = useCallback(async (years: number, salary: number) => {
    if (!offerPlayer) return;
    const engine = getEngine();
    const result = await engine.signFreeAgent(offerPlayer.playerId, years, salary);
    if (result.ok) {
      setToast(`Signed ${offerPlayer.name}!`);
      setSignings(s => s + 1);
      setCurrentPayroll(prev => prev + salary);
      onTransaction?.({
        type: 'signing',
        description: `${offerPlayer.name} (${offerPlayer.position}, ${offerPlayer.age}) — ${years}yr / ${formatSalary(salary)}`,
      });
      setOfferPlayer(null);
      await loadFAs();
    } else {
      setToast(result.error ?? 'Signing failed.');
    }
  }, [offerPlayer, loadFAs, onTransaction]);

  const handleFinishOffseason = useCallback(async () => {
    onDone();
  }, [onDone]);

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...freeAgents];
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'overall': return b.overall - a.overall;
        case 'age': return a.age - b.age;
        case 'salary': return b.projectedSalary - a.projectedSalary;
        case 'position': return a.position.localeCompare(b.position);
        case 'stat': {
          // Sort by primary stat: ERA for pitchers, OPS for hitters
          const aVal = a.isPitcher ? (a.stats.era ?? 99) : ((a.stats.obp ?? 0) + (a.stats.slg ?? 0));
          const bVal = b.isPitcher ? (b.stats.era ?? 99) : ((b.stats.obp ?? 0) + (b.stats.slg ?? 0));
          // For ERA lower is better; for OPS higher is better
          // Group pitchers and hitters: pitchers first by ERA asc, then hitters by OPS desc
          if (a.isPitcher && b.isPitcher) return aVal - bVal;
          if (!a.isPitcher && !b.isPitcher) return bVal - aVal;
          return a.isPitcher ? -1 : 1;
        }
        default: return 0;
      }
    });
    return arr;
  }, [freeAgents, sortKey]);

  // Position filter
  const positions = useMemo(() => ['ALL', ...new Set(freeAgents.map(p => p.position))], [freeAgents]);
  const filtered = posFilter === 'ALL' ? sorted : sorted.filter(p => p.position === posFilter);

  // Budget context
  const budgetMil = teamBudget * 1_000_000;
  const budgetUsedPct = budgetMil > 0 ? (currentPayroll / budgetMil) * 100 : 0;

  if (loading) {
    return <div className="text-orange-400 text-xs animate-pulse p-4">Loading free agents...</div>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-green-900 text-green-300 border border-green-700">
          {toast}
        </div>
      )}

      {offerPlayer && (
        <OfferModal
          player={offerPlayer}
          onSign={handleSign}
          onCancel={() => setOfferPlayer(null)}
          currentPayroll={currentPayroll}
          budget={teamBudget}
        />
      )}

      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4 flex items-center justify-between">
          <span>FREE AGENCY — {season - 1} OFFSEASON</span>
          <span className="text-green-400 font-normal">{signings} signed</span>
        </div>

        {/* Payroll context bar */}
        <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-gray-600 text-[10px] uppercase">Payroll </span>
              <span className="text-gray-300 text-xs font-bold tabular-nums">{formatSalary(currentPayroll)}</span>
            </div>
            <div>
              <span className="text-gray-600 text-[10px] uppercase">Budget </span>
              <span className="text-gray-300 text-xs font-bold tabular-nums">${teamBudget}M</span>
            </div>
            <div>
              <span className="text-gray-600 text-[10px] uppercase">Remaining </span>
              <span className={`text-xs font-bold tabular-nums ${budgetMil - currentPayroll > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatSalary(Math.abs(budgetMil - currentPayroll))}
                {budgetMil - currentPayroll < 0 ? ' OVER' : ''}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-[100px]">
            <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  budgetUsedPct > 100 ? 'bg-red-500' : budgetUsedPct > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-2 flex items-center gap-4 border-b border-gray-800 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">SORT:</span>
            {(['overall', 'age', 'salary', 'position', 'stat'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`text-xs px-2 py-1 transition-colors ${
                  sortKey === key ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {key === 'stat' ? 'STATS' : key.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">POS:</span>
            <select
              value={posFilter}
              onChange={e => setPosFilter(e.target.value)}
              className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1"
            >
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="ml-auto text-gray-500 text-xs">{filtered.length} available</div>
        </div>

        {/* FA Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-3 py-1.5">NAME</th>
                <th className="text-left px-2 py-1.5">POS</th>
                <th className="text-right px-2 py-1.5">AGE</th>
                <th className="text-right px-2 py-1.5">OVR</th>
                <th className="text-center px-2 py-1.5">MKT</th>
                <th className="text-right px-2 py-1.5">STAT1</th>
                <th className="text-right px-2 py-1.5">STAT2</th>
                <th className="text-right px-2 py-1.5">STAT3</th>
                <th className="text-right px-2 py-1.5">PROJ $</th>
                <th className="text-right px-2 py-1.5">YRS</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(p => {
                const market = getMarketInterest(p);
                return (
                  <tr key={p.playerId} className="bloomberg-row text-xs">
                    <td className="px-3 py-1.5 font-bold text-orange-300">{p.name}</td>
                    <td className="px-2 py-1.5 text-gray-500">{p.position}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right">{p.age}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right text-orange-400 font-bold">{p.overall}</td>
                    <td className={`px-2 py-1.5 text-center font-bold ${market.color}`}>{market.label}</td>
                    {p.isPitcher ? (
                      <>
                        <StatCell value={p.stats.era} suffix="%" />
                        <StatCell value={p.stats.k9} suffix="ip" />
                        <StatCell value={p.stats.whip} suffix="%" />
                      </>
                    ) : (
                      <>
                        <StatCell value={p.stats.avg} suffix="%" />
                        <td className="px-2 py-1.5 tabular-nums text-right text-gray-400 text-xs">{p.stats.hr ?? '—'}</td>
                        <StatCell value={p.stats.obp != null && p.stats.slg != null ? p.stats.obp + p.stats.slg : undefined} suffix="%" />
                      </>
                    )}
                    <td className="px-2 py-1.5 tabular-nums text-right text-green-400">{formatSalary(p.projectedSalary)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right text-gray-500">{p.projectedYears}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => setOfferPlayer(p)}
                        className="text-orange-600 hover:text-orange-400 text-xs font-bold transition-colors"
                      >
                        SIGN
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Column legend */}
          <div className="px-3 py-1.5 border-t border-gray-800 text-gray-600 text-[10px]">
            Hitters: AVG / HR / OPS · Pitchers: ERA / K/9 / WHIP · MKT = Market Interest
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-3">
        <button
          onClick={handleFinishOffseason}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-3 uppercase tracking-widest"
        >
          ADVANCE TO NEXT SEASON →
        </button>
      </div>
    </div>
  );
}
