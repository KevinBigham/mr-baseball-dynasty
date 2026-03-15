/**
 * FinancialAdvisor — Cap health analysis with actionable suggestions.
 * Ported from MFD's buildCapFixes concept.
 */

import { useMemo } from 'react';
import type { RosterPlayer } from '../../types/league';
import { toGrade } from '../../utils/gradeColor';
import AgingBadge from '../shared/AgingBadge';

interface FinancialAdvisorProps {
  activePlayers: RosterPlayer[];
  budget: number; // in raw dollars (e.g. 150_000_000)
  onClickPlayer: (id: number) => void;
}

function fmt$M(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

interface Alert {
  type: 'expiring' | 'arb' | 'deadweight' | 'budget';
  severity: 'warn' | 'danger' | 'info';
  title: string;
  players?: RosterPlayer[];
  message: string;
}

export default function FinancialAdvisor({ activePlayers, budget, onClickPlayer }: FinancialAdvisorProps) {
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const budgetDollars = budget;
    const totalPayroll = activePlayers.reduce((s, p) => s + p.salary, 0);

    // 1. Expiring contracts
    const expiring = activePlayers
      .filter(p => p.contractYearsRemaining <= 1 && p.salary > 1_000_000)
      .sort((a, b) => b.salary - a.salary);
    if (expiring.length > 0) {
      result.push({
        type: 'expiring',
        severity: expiring.length >= 5 ? 'warn' : 'info',
        title: `${expiring.length} EXPIRING CONTRACTS`,
        players: expiring.slice(0, 5),
        message: `${fmt$M(expiring.reduce((s, p) => s + p.salary, 0))} coming off the books after this season.`,
      });
    }

    // 2. Arbitration watch
    const arbEligible = activePlayers
      .filter(p => {
        const svcYears = Math.floor(p.serviceTimeDays / 172);
        return svcYears >= 3 && svcYears < 6;
      })
      .sort((a, b) => b.overall - a.overall);
    if (arbEligible.length > 0) {
      const projRaise = arbEligible.reduce((s, p) => s + Math.round(p.salary * 0.3), 0);
      result.push({
        type: 'arb',
        severity: projRaise > 10_000_000 ? 'warn' : 'info',
        title: `${arbEligible.length} ARBITRATION-ELIGIBLE`,
        players: arbEligible.slice(0, 4),
        message: `Projected raises: ~${fmt$M(projRaise)}. Consider extensions to lock in value.`,
      });
    }

    // 3. Dead weight (high salary + low OVR)
    const deadWeight = activePlayers
      .filter(p => p.salary > 5_000_000 && toGrade(p.overall) < 45)
      .sort((a, b) => b.salary - a.salary);
    if (deadWeight.length > 0) {
      result.push({
        type: 'deadweight',
        severity: 'danger',
        title: `${deadWeight.length} OVERPAID UNDERPERFORMER${deadWeight.length > 1 ? 'S' : ''}`,
        players: deadWeight.slice(0, 3),
        message: `${fmt$M(deadWeight.reduce((s, p) => s + p.salary, 0))} tied up in below-average players.`,
      });
    }

    // 4. Budget alert
    if (budgetDollars > 0 && totalPayroll > budgetDollars * 0.9) {
      const pctOver = ((totalPayroll / budgetDollars) * 100 - 100);
      result.push({
        type: 'budget',
        severity: totalPayroll > budgetDollars ? 'danger' : 'warn',
        title: totalPayroll > budgetDollars ? 'OVER BUDGET' : 'APPROACHING BUDGET LIMIT',
        message: totalPayroll > budgetDollars
          ? `Payroll is ${pctOver.toFixed(0)}% over budget. Consider trades or cuts to relieve pressure.`
          : `Payroll at ${((totalPayroll / budgetDollars) * 100).toFixed(0)}% of budget. Limited flexibility for acquisitions.`,
      });
    }

    return result;
  }, [activePlayers, budget]);

  if (alerts.length === 0) {
    return (
      <div className="bloomberg-border">
        <div className="bloomberg-header flex items-center gap-2">
          <span>FINANCIAL ADVISOR</span>
          <span className="text-green-400 text-[10px] font-bold">✓ HEALTHY</span>
        </div>
        <div className="p-4 text-gray-500 text-xs text-center">
          No financial concerns at this time. Cap situation looks good.
        </div>
      </div>
    );
  }

  const severityColors = {
    danger: { border: '#ef4444', bg: 'rgba(239,68,68,0.06)', icon: '🚨' },
    warn: { border: '#fb923c', bg: 'rgba(251,146,60,0.04)', icon: '⚠️' },
    info: { border: '#60a5fa', bg: 'rgba(96,165,250,0.04)', icon: 'ℹ️' },
  };

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center gap-2">
        <span>FINANCIAL ADVISOR</span>
        {alerts.some(a => a.severity === 'danger') && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            ACTION NEEDED
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-800/30">
        {alerts.map((alert, i) => {
          const sev = severityColors[alert.severity];
          return (
            <div
              key={i}
              className="px-4 py-3"
              style={{ background: sev.bg, borderLeft: `3px solid ${sev.border}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{sev.icon}</span>
                <span className="text-xs font-black tracking-wider" style={{ color: sev.border }}>
                  {alert.title}
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-2">{alert.message}</p>

              {alert.players && (
                <div className="flex flex-wrap gap-2">
                  {alert.players.map(p => (
                    <button
                      key={p.playerId}
                      onClick={() => onClickPlayer(p.playerId)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] hover:bg-gray-800/30 transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-orange-300 font-bold">{p.name}</span>
                      <span className="text-gray-500">{p.position}</span>
                      <span className="text-gray-500 tabular-nums">{fmt$M(p.salary)}</span>
                      <AgingBadge age={p.age} position={p.position} compact />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
