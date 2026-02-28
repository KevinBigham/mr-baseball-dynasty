import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { TeamFinancials, FinancialHistory } from '../../engine/finance/financeEngine';

function formatMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function MoneyCell({ value, invert = false }: { value: number; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0;
  const color = value === 0 ? '#94a3b8' : isPositive ? '#4ade80' : '#ef4444';
  return (
    <span className="font-mono text-xs tabular-nums font-bold" style={{ color }}>
      {formatMoney(value)}
    </span>
  );
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
      <div className="h-full rounded transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function FinanceDashboard() {
  const { gameStarted, userTeamId } = useGameStore();
  const [financials, setFinancials] = useState<TeamFinancials | null>(null);
  const [history, setHistory] = useState<FinancialHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'league'>('overview');
  const [leagueData, setLeagueData] = useState<Array<{ teamName: string; payroll: number; budget: number; profit: number }>>([]);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const [fin, hist] = await Promise.all([
      getEngine().getTeamFinancials(userTeamId),
      getEngine().getFinancialHistory(userTeamId),
    ]);
    setFinancials(fin);
    setHistory(hist);
    if (tab === 'league') {
      const league = await getEngine().getLeagueFinancials();
      setLeagueData(league);
    }
    setLoading(false);
  }, [gameStarted, userTeamId, tab]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading || !financials) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading financials...</div>;

  const luxuryOverage = financials.luxuryTaxPayroll - financials.luxuryTaxThreshold;
  const isOverLuxury = luxuryOverage > 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM FINANCES</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('overview')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'overview' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>OVERVIEW</button>
          <button onClick={() => setTab('league')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'league' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>LEAGUE</button>
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-3 gap-4">
          {/* Revenue */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">REVENUE</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Gate Revenue</span>
                <MoneyCell value={financials.gateRevenue} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Media Revenue</span>
                <MoneyCell value={financials.mediaRevenue} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Merchandise</span>
                <MoneyCell value={financials.merchRevenue} />
              </div>
              {financials.revenueSharingIn > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Revenue Sharing (in)</span>
                  <MoneyCell value={financials.revenueSharingIn} />
                </div>
              )}
              <div className="border-t border-gray-800 pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-400">TOTAL REVENUE</span>
                <MoneyCell value={financials.totalRevenue} />
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">EXPENSES</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Player Payroll</span>
                <MoneyCell value={financials.payroll} invert />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Minor League Ops</span>
                <MoneyCell value={financials.minorLeagueOps} invert />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Scouting</span>
                <MoneyCell value={financials.scoutingBudget} invert />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Coaching</span>
                <MoneyCell value={financials.coachingBudget} invert />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Operations</span>
                <MoneyCell value={financials.operations} invert />
              </div>
              {financials.revenueSharingOut > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Revenue Sharing (out)</span>
                  <MoneyCell value={financials.revenueSharingOut} invert />
                </div>
              )}
              {financials.luxuryTaxPenalty > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-red-400">Luxury Tax</span>
                  <MoneyCell value={financials.luxuryTaxPenalty} invert />
                </div>
              )}
              <div className="border-t border-gray-800 pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-400">TOTAL EXPENSES</span>
                <MoneyCell value={financials.totalExpenses} invert />
              </div>
            </div>
          </div>

          {/* Summary + Luxury Tax */}
          <div className="space-y-4">
            <div className="bloomberg-border">
              <div className="bloomberg-header">BOTTOM LINE</div>
              <div className="p-3 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Operating Income</span>
                  <MoneyCell value={financials.operatingIncome} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cash on Hand</span>
                  <MoneyCell value={financials.cashOnHand} />
                </div>
                <div className="border-t border-gray-800 pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Budget Used</span>
                    <span className="text-gray-400 tabular-nums">
                      {formatMoney(financials.payroll)} / {formatMoney(financials.totalBudget)}
                    </span>
                  </div>
                  <BarChart
                    value={financials.payroll}
                    max={financials.totalBudget}
                    color={financials.payroll > financials.totalBudget ? '#ef4444' : '#f59e0b'}
                  />
                </div>
              </div>
            </div>

            <div className="bloomberg-border">
              <div className="bloomberg-header">LUXURY TAX (CBT)</div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CBT Payroll</span>
                  <span className="text-gray-300 tabular-nums font-mono text-xs">{formatMoney(financials.luxuryTaxPayroll)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Threshold</span>
                  <span className="text-gray-300 tabular-nums font-mono text-xs">{formatMoney(financials.luxuryTaxThreshold)}</span>
                </div>
                <BarChart
                  value={financials.luxuryTaxPayroll}
                  max={financials.luxuryTaxThreshold * 1.3}
                  color={isOverLuxury ? '#ef4444' : '#4ade80'}
                />
                {isOverLuxury ? (
                  <div className="text-red-400 text-xs font-bold">
                    OVER by {formatMoney(luxuryOverage)} — Penalty: {formatMoney(financials.luxuryTaxPenalty)}
                    {financials.luxuryTaxYears > 1 && ` (Year ${financials.luxuryTaxYears} surcharge)`}
                  </div>
                ) : (
                  <div className="text-green-400 text-xs">
                    Under by {formatMoney(-luxuryOverage)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial history */}
          {history.length > 0 && (
            <div className="col-span-3 bloomberg-border">
              <div className="bloomberg-header">FINANCIAL HISTORY</div>
              <div className="p-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800">
                      <th className="px-2 py-1 text-left">SEASON</th>
                      <th className="px-2 py-1">WINS</th>
                      <th className="px-2 py-1">REVENUE</th>
                      <th className="px-2 py-1">PAYROLL</th>
                      <th className="px-2 py-1">EXPENSES</th>
                      <th className="px-2 py-1">PROFIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.season} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 text-gray-400">{h.season}</td>
                        <td className="px-2 py-1 text-center tabular-nums">{h.wins}</td>
                        <td className="px-2 py-1 text-center"><MoneyCell value={h.revenue} /></td>
                        <td className="px-2 py-1 text-center"><MoneyCell value={h.payroll} invert /></td>
                        <td className="px-2 py-1 text-center"><MoneyCell value={h.expenses} invert /></td>
                        <td className="px-2 py-1 text-center"><MoneyCell value={h.profit} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* League financials tab */
        <div className="bloomberg-border">
          <div className="bloomberg-header">LEAGUE PAYROLLS</div>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">TEAM</th>
                  <th className="px-2 py-1">PAYROLL</th>
                  <th className="px-2 py-1">BUDGET</th>
                  <th className="px-2 py-1">PROFIT</th>
                  <th className="px-2 py-1 text-left w-48">PAYROLL BAR</th>
                </tr>
              </thead>
              <tbody>
                {leagueData.sort((a, b) => b.payroll - a.payroll).map(t => (
                  <tr key={t.teamName} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 text-orange-300 font-bold">{t.teamName}</td>
                    <td className="px-2 py-1 text-center"><MoneyCell value={t.payroll} invert /></td>
                    <td className="px-2 py-1 text-center text-gray-400 tabular-nums font-mono">{formatMoney(t.budget)}</td>
                    <td className="px-2 py-1 text-center"><MoneyCell value={t.profit} /></td>
                    <td className="px-2 py-1">
                      <BarChart value={t.payroll} max={250_000_000} color={t.payroll > t.budget ? '#ef4444' : '#f59e0b'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
