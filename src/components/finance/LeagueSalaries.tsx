import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

interface LeagueTeamFinance {
  teamName: string;
  payroll: number;
  budget: number;
  profit: number;
}

const LUXURY_TAX_THRESHOLD = 230_000_000;

function MoneyCell({ value, fmt = 'M' }: { value: number; fmt?: 'M' | 'K' }) {
  const display = fmt === 'M' ? `$${(value / 1_000_000).toFixed(1)}M` : `$${(value / 1_000).toFixed(0)}K`;
  const color = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
  return <span className={`tabular-nums ${color}`}>{display}</span>;
}

function PayrollBar({ payroll, budget }: { payroll: number; budget: number }) {
  const pct = budget > 0 ? Math.min(1.5, payroll / budget) : 0;
  const overLux = payroll > LUXURY_TAX_THRESHOLD;
  const overBudget = payroll > budget;
  const color = overLux ? 'bg-red-500' : overBudget ? 'bg-orange-500' : 'bg-green-500';
  return (
    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, pct * 66.7)}%` }} />
      {/* Luxury tax line */}
      <div className="absolute top-0 bottom-0 w-px bg-red-600/50"
        style={{ left: `${Math.min(100, (LUXURY_TAX_THRESHOLD / (budget * 1.5)) * 100)}%` }} />
    </div>
  );
}

export default function LeagueSalaries() {
  const { gameStarted, userTeamId } = useGameStore();
  const [teams, setTeams] = useState<LeagueTeamFinance[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'payroll' | 'budget' | 'profit'>('payroll');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getLeagueFinancials()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading league financials...</div>;

  const toggleSort = (col: typeof sort) => {
    if (sort === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortDir('desc'); }
  };

  const sorted = [...teams].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1;
    return mult * (a[sort] - b[sort]);
  });

  const leagueAvgPayroll = teams.length > 0 ? teams.reduce((s, t) => s + t.payroll, 0) / teams.length : 0;
  const maxPayroll = teams.reduce((m, t) => Math.max(m, t.payroll), 0);
  const minPayroll = teams.reduce((m, t) => Math.min(m, t.payroll), Infinity);
  const overLux = teams.filter(t => t.payroll > LUXURY_TAX_THRESHOLD).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>LEAGUE SALARIES & LUXURY TAX</span>
        <span className="text-gray-500 text-xs">{teams.length} teams</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG PAYROLL</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">
            ${(leagueAvgPayroll / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIGHEST</div>
          <div className="text-red-400 font-bold text-lg tabular-nums">
            ${(maxPayroll / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LOWEST</div>
          <div className="text-green-400 font-bold text-lg tabular-nums">
            ${(minPayroll / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CBT THRESHOLD</div>
          <div className="text-yellow-400 font-bold text-lg tabular-nums">$230M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OVER LUX TAX</div>
          <div className={`font-bold text-xl tabular-nums ${overLux > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {overLux}
          </div>
        </div>
      </div>

      {/* Visual payroll bars */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">PAYROLL COMPARISON</div>
        <div className="p-3 space-y-1">
          {sorted.map(t => {
            const pct = maxPayroll > 0 ? (t.payroll / maxPayroll) * 100 : 0;
            const overLuxTax = t.payroll > LUXURY_TAX_THRESHOLD;
            return (
              <div key={t.teamName} className="flex items-center gap-2 text-xs">
                <span className="w-32 text-gray-400 truncate font-bold">{t.teamName}</span>
                <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden relative">
                  <div className={`h-full rounded ${overLuxTax ? 'bg-red-600' : t.profit >= 0 ? 'bg-green-700' : 'bg-orange-700'}`}
                    style={{ width: `${pct}%` }} />
                  {/* Luxury tax line */}
                  <div className="absolute top-0 bottom-0 w-px bg-yellow-500"
                    style={{ left: `${(LUXURY_TAX_THRESHOLD / maxPayroll) * 100}%` }}
                    title="Luxury Tax Threshold" />
                </div>
                <span className="w-16 text-right tabular-nums text-gray-400">${(t.payroll / 1_000_000).toFixed(1)}M</span>
              </div>
            );
          })}
          <div className="flex gap-4 mt-2 text-[10px] text-gray-600">
            <span><span className="inline-block w-2 h-2 bg-green-700 rounded mr-1" />Under Budget</span>
            <span><span className="inline-block w-2 h-2 bg-orange-700 rounded mr-1" />Losing Money</span>
            <span><span className="inline-block w-2 h-2 bg-red-600 rounded mr-1" />Over Luxury Tax</span>
            <span><span className="inline-block w-1 h-3 bg-yellow-500 mr-1" />CBT Line ($230M)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">TEAM FINANCIALS</div>
        <div className="max-h-[24rem] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                <th className="px-2 py-1 text-right">#</th>
                <th className="px-2 py-1 text-left">TEAM</th>
                <th className="px-2 py-1 text-right cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort('payroll')}>
                  PAYROLL {sort === 'payroll' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1 text-right cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort('budget')}>
                  BUDGET {sort === 'budget' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1 text-right cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort('profit')}>
                  PROFIT {sort === 'profit' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1 text-center">BAR</th>
                <th className="px-2 py-1">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => (
                <tr key={t.teamName} className="text-xs hover:bg-gray-800/50">
                  <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                  <td className="px-2 py-1 font-bold text-orange-300">{t.teamName}</td>
                  <td className="px-2 py-1 text-right"><MoneyCell value={t.payroll} /></td>
                  <td className="px-2 py-1 text-right"><MoneyCell value={t.budget} /></td>
                  <td className="px-2 py-1 text-right"><MoneyCell value={t.profit} /></td>
                  <td className="px-2 py-1 text-center"><PayrollBar payroll={t.payroll} budget={t.budget} /></td>
                  <td className="px-2 py-1">
                    {t.payroll > LUXURY_TAX_THRESHOLD ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-900/40 text-red-400">LUX TAX</span>
                    ) : t.payroll > t.budget ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-900/40 text-orange-400">OVER BUDGET</span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/40 text-green-400">OK</span>
                    )}
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
