import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { RosterPlayer } from '../../types/league';

// MLB luxury tax threshold (2026 projection)
const LUXURY_TAX = 237_000_000;
const CBT_LEVEL_2  = 257_000_000;
const CBT_LEVEL_3  = 277_000_000;

function fmt$M(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

function fmt$K(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function contractLabel(p: RosterPlayer): { label: string; color: string } {
  const svc = p.serviceTimeDays ?? 0;
  const years = Math.floor(svc / 172);
  if (years < 3) return { label: 'Pre-Arb', color: 'text-green-400' };
  if (years < 6) return { label: `Arb ${Math.min(years - 2, 3)}`, color: 'text-yellow-400' };
  return { label: 'FA Elig', color: 'text-red-400' };
}

function salaryColor(salary: number): string {
  if (salary < 1_500_000) return 'text-green-400';
  if (salary < 8_000_000) return 'text-gray-200';
  if (salary < 20_000_000) return 'text-yellow-400';
  return 'text-red-400';
}

function PayrollBar({ used, budget }: { used: number; budget: number }) {
  const pct = Math.min(100, (used / budget) * 100);
  const luxPct = Math.min(100, (LUXURY_TAX / budget) * 100);
  const overLux = used > LUXURY_TAX;

  return (
    <div className="relative w-full h-4 bg-gray-800 rounded overflow-hidden">
      <div
        className={`absolute h-full transition-all ${overLux ? 'bg-red-600' : 'bg-orange-500'}`}
        style={{ width: `${pct}%` }}
      />
      {/* Luxury tax line */}
      <div
        className="absolute top-0 h-full w-px bg-yellow-400 opacity-70"
        style={{ left: `${luxPct}%` }}
      />
    </div>
  );
}

function ContractYearsBar({ years, max = 7 }: { years: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2.5 rounded-sm ${i < years ? 'bg-orange-500' : 'bg-gray-700'}`}
        />
      ))}
    </div>
  );
}

interface FinanceData {
  roster: RosterPlayer[];
  budget: number;
  teamName: string;
}

export default function FinanceView() {
  const { userTeamId, gameStarted, season } = useGameStore();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [projYear, setProjYear] = useState(0); // 0 = current

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    (async () => {
      const engine = getEngine();
      const [roster, teams] = await Promise.all([
        engine.getFullRoster(userTeamId),
        engine.getLeagueTeams(),
      ]);

      const team = teams.find(t => t.teamId === userTeamId);
      const allPlayers: RosterPlayer[] = [
        ...roster.active,
        ...roster.il,
        ...(roster.aaa ?? []),
        ...(roster.aa ?? []),
        ...(roster.aPlus ?? []),
        ...(roster.aMinus ?? []),
        ...(roster.rookie ?? []),
        ...(roster.dfa ?? []),
      ].filter(p => p.salary > 0 && p.contractYearsRemaining > 0);

      setData({
        roster: allPlayers.sort((a, b) => b.salary - a.salary),
        budget: team?.budget ?? 150_000_000,
        teamName: team?.name ?? 'Your Team',
      });
      setLoading(false);
    })();
  }, [userTeamId, gameStarted, season]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading finances...</div>;
  if (!data) return null;

  const { roster, budget } = data;

  // Payroll projections by year
  const currentPayroll = roster.reduce((s, p) => s + p.salary, 0);
  const projPayroll = (yearsAhead: number) =>
    roster.filter(p => p.contractYearsRemaining > yearsAhead).reduce((s, p) => s + p.salary, 0);

  const displayPayroll = projYear === 0 ? currentPayroll : projPayroll(projYear);
  const committed = roster.filter(p => p.contractYearsRemaining > projYear);
  const expiring  = roster.filter(p => p.contractYearsRemaining === projYear + 1);
  const available = budget - displayPayroll;
  const overLux   = displayPayroll > LUXURY_TAX;

  // Tax penalty label
  let taxLabel = 'UNDER CBT';
  let taxColor = 'text-green-400';
  if (displayPayroll > CBT_LEVEL_3) { taxLabel = 'CBT TIER 3 (50%)'; taxColor = 'text-red-500'; }
  else if (displayPayroll > CBT_LEVEL_2) { taxLabel = 'CBT TIER 2 (42%)'; taxColor = 'text-red-400'; }
  else if (displayPayroll > LUXURY_TAX) { taxLabel = 'CBT TIER 1 (20%)'; taxColor = 'text-yellow-400'; }

  // Group by status
  const mlbPlayers  = roster.filter(p => p.rosterStatus === 'MLB_ACTIVE' || p.rosterStatus === 'MLB_IL_10' || p.rosterStatus === 'MLB_IL_60');
  const mlfaPlayers = roster.filter(p => p.rosterStatus.startsWith('MINORS_') || p.rosterStatus === 'DFA');

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2">
        PAYROLL & FINANCES — {data.teamName} — SEASON {season}
      </div>

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      <div className="bloomberg-border bg-gray-900">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-800">
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs mb-1">TOTAL PAYROLL</div>
            <div className={`text-2xl font-bold tabular-nums ${overLux ? 'text-red-400' : 'text-orange-400'}`}>
              {fmt$M(displayPayroll)}
            </div>
            <div className={`text-xs mt-0.5 ${taxColor}`}>{taxLabel}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs mb-1">TEAM BUDGET</div>
            <div className="text-2xl font-bold tabular-nums text-gray-200">{fmt$M(budget)}</div>
            <div className={`text-xs mt-0.5 ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {available >= 0 ? `${fmt$M(available)} available` : `${fmt$M(-available)} over budget`}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs mb-1">LUXURY TAX LINE</div>
            <div className="text-2xl font-bold tabular-nums text-gray-200">{fmt$M(LUXURY_TAX)}</div>
            <div className={`text-xs mt-0.5 ${overLux ? 'text-red-400' : 'text-green-400'}`}>
              {overLux ? `${fmt$M(displayPayroll - LUXURY_TAX)} over` : `${fmt$M(LUXURY_TAX - displayPayroll)} below`}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs mb-1">CONTRACTS</div>
            <div className="text-2xl font-bold tabular-nums text-gray-200">{committed.length}</div>
            <div className="text-xs mt-0.5 text-gray-500">
              {expiring.length} expiring after this season
            </div>
          </div>
        </div>

        {/* Payroll bar */}
        <div className="px-4 pb-4">
          <PayrollBar used={displayPayroll} budget={budget} />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>$0</span>
            <span className="text-yellow-400">CBT ${(LUXURY_TAX / 1_000_000).toFixed(0)}M</span>
            <span>{fmt$M(budget)}</span>
          </div>
        </div>
      </div>

      {/* ── Year projection tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1">
        <span className="text-gray-600 text-xs py-1 mr-2">PROJECTION:</span>
        {['NOW', '+1 YR', '+2 YR', '+3 YR'].map((label, i) => (
          <button
            key={i}
            onClick={() => setProjYear(i)}
            className={[
              'text-xs px-3 py-1 border transition-colors',
              projYear === i
                ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── MLB Roster contracts ──────────────────────────────────────────── */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">40-MAN CONTRACTS</div>
        <table className="w-full">
          <thead>
            <tr className="text-gray-600 text-xs border-b border-gray-800">
              <th className="text-left px-3 py-1.5">PLAYER</th>
              <th className="text-left px-2 py-1.5">POS</th>
              <th className="text-left px-2 py-1.5">STATUS</th>
              <th className="text-left px-2 py-1.5">TYPE</th>
              <th className="text-right px-2 py-1.5">AAV</th>
              <th className="text-left px-3 py-1.5 w-28">YEARS LEFT</th>
              <th className="text-left px-2 py-1.5">EXPIRES</th>
            </tr>
          </thead>
          <tbody>
            {mlbPlayers.map(p => {
              const { label, color } = contractLabel(p);
              const expiresYear = season + p.contractYearsRemaining - 1;
              return (
                <tr key={p.playerId} className="bloomberg-row text-xs">
                  <td className="px-3 py-1.5 font-bold text-gray-200">{p.name}</td>
                  <td className="px-2 py-1.5 text-gray-500">{p.position}</td>
                  <td className="px-2 py-1.5 text-gray-400">{p.rosterStatus.replace('MLB_', '').replace('_', ' ')}</td>
                  <td className={`px-2 py-1.5 text-xs font-bold ${color}`}>{label}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${salaryColor(p.salary)}`}>
                    {fmt$K(p.salary)}
                  </td>
                  <td className="px-3 py-1.5">
                    <ContractYearsBar years={p.contractYearsRemaining} />
                  </td>
                  <td className="px-2 py-1.5 text-gray-600 text-xs">{expiresYear}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Minor league contracts ────────────────────────────────────────── */}
      {mlfaPlayers.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">MINOR LEAGUE CONTRACTS</div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-left px-3 py-1.5">PLAYER</th>
                <th className="text-left px-2 py-1.5">POS</th>
                <th className="text-left px-2 py-1.5">LEVEL</th>
                <th className="text-right px-2 py-1.5">AAV</th>
                <th className="text-left px-3 py-1.5 w-28">YEARS LEFT</th>
              </tr>
            </thead>
            <tbody>
              {mlfaPlayers.filter(p => p.contractYearsRemaining > projYear).map(p => (
                <tr key={p.playerId} className="bloomberg-row text-xs">
                  <td className="px-3 py-1.5 text-gray-400">{p.name}</td>
                  <td className="px-2 py-1.5 text-gray-500">{p.position}</td>
                  <td className="px-2 py-1.5 text-gray-600 text-xs">{p.rosterStatus.replace('MINORS_', '')}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${salaryColor(p.salary)}`}>
                    {fmt$K(p.salary)}
                  </td>
                  <td className="px-3 py-1.5">
                    <ContractYearsBar years={p.contractYearsRemaining} max={5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payroll by year projection table ─────────────────────────────── */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">COMMITTED PAYROLL BY YEAR</div>
        <div className="flex gap-0 divide-x divide-gray-800">
          {[0, 1, 2, 3, 4].map(yr => {
            const yearPayroll = projPayroll(yr - 1);
            const yearLabel = season + yr;
            const pct = Math.min(100, (yearPayroll / budget) * 100);
            return (
              <div key={yr} className="flex-1 px-4 py-3 text-center">
                <div className="text-gray-500 text-xs mb-1">{yearLabel}</div>
                <div className={`text-sm font-bold tabular-nums ${yearPayroll > LUXURY_TAX ? 'text-red-400' : 'text-gray-200'}`}>
                  {yearPayroll > 0 ? fmt$M(yearPayroll) : '—'}
                </div>
                <div className="mt-2 h-16 flex items-end justify-center">
                  <div
                    className={`w-6 rounded-t transition-all ${yearPayroll > LUXURY_TAX ? 'bg-red-600' : 'bg-orange-700'}`}
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
