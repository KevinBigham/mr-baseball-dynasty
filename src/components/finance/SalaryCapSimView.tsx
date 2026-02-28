/**
 * SalaryCapSimView – Salary Cap Simulator dashboard
 *
 * Bloomberg-terminal style luxury tax threshold analysis with team list,
 * summary cards, tax tier breakdown, biggest contracts, and cap space.
 */
import { useState, useMemo } from 'react';
import {
  SalaryCapData,
  TAX_STATUS_DISPLAY,
  getSalaryCapSummary,
  generateDemoSalaryCapSimulator,
} from '../../engine/finance/salaryCapSimulator';

export default function SalaryCapSimView() {
  const teams = useMemo(() => generateDemoSalaryCapSimulator(), []);
  const summary = useMemo(() => getSalaryCapSummary(teams), [teams]);
  const [selected, setSelected] = useState<SalaryCapData | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'projected'>('current');

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SALARY CAP SIMULATOR — LUXURY TAX ANALYSIS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Teams', value: summary.totalTeams },
          { label: 'Highest', value: `${summary.highestPayroll.abbr} $${summary.highestPayroll.amount}M`, color: '#ef4444' },
          { label: 'Lowest', value: `${summary.lowestPayroll.abbr} $${summary.lowestPayroll.amount}M`, color: '#22c55e' },
          { label: 'Avg Payroll', value: `$${summary.avgPayroll}M` },
          { label: 'Over Threshold', value: summary.overThreshold, color: summary.overThreshold > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Total Penalties', value: `$${summary.totalPenalties}M`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 15, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Team List Table */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Payroll</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Cap Space</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const statusInfo = TAX_STATUS_DISPLAY[t.currentScenario.taxStatus];
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === t.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 700 }}>
                      <span style={{ color: '#f59e0b' }}>{t.abbr}</span>
                      <span style={{ color: '#666', fontSize: 10, marginLeft: 6 }}>{t.teamName.split(' ').pop()}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700, color: t.currentPayroll > t.luxuryThreshold ? '#ef4444' : '#ccc' }}>
                      ${t.currentPayroll}M
                    </td>
                    <td style={{
                      padding: 6, textAlign: 'center', fontWeight: 700,
                      color: t.capSpace >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {t.capSpace >= 0 ? '+' : ''}{t.capSpace}M
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: statusInfo.color, fontWeight: 700, fontSize: 10 }}>
                      {statusInfo.label}
                    </td>
                    <td style={{
                      padding: 6, textAlign: 'center',
                      color: t.currentScenario.totalPenalty > 0 ? '#ef4444' : '#22c55e',
                      fontWeight: 700,
                    }}>
                      ${t.currentScenario.totalPenalty}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 480px' }}>
          {selected ? (() => {
            const scenario = viewMode === 'current' ? selected.currentScenario : selected.projectedScenario;
            const statusInfo = TAX_STATUS_DISPLAY[scenario.taxStatus];

            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                  {selected.abbr} — {selected.teamName}
                  <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                    ${selected.currentPayroll}M payroll
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {(['current', 'projected'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: '3px 10px',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        background: viewMode === mode ? '#f59e0b' : '#1a1a2e',
                        color: viewMode === mode ? '#000' : '#888',
                        border: '1px solid #333',
                        cursor: 'pointer',
                        fontWeight: viewMode === mode ? 700 : 400,
                      }}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Scenario Summary */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Payroll', value: `$${scenario.totalPayroll}M`, color: scenario.totalPayroll > selected.luxuryThreshold ? '#ef4444' : '#22c55e' },
                    { label: 'Status', value: statusInfo.label, color: statusInfo.color },
                    { label: 'Total Penalty', value: `$${scenario.totalPenalty}M`, color: scenario.totalPenalty > 0 ? '#ef4444' : '#22c55e' },
                    { label: 'Rev Share Loss', value: `$${scenario.revenueShareLoss}M`, color: scenario.revenueShareLoss > 0 ? '#ef4444' : '#22c55e' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                      <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tax Tiers */}
                {scenario.penalties.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TAX TIER BREAKDOWN</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                          <th style={{ textAlign: 'center', padding: 4 }}>Threshold</th>
                          <th style={{ textAlign: 'center', padding: 4 }}>Rate</th>
                          <th style={{ textAlign: 'center', padding: 4 }}>Overage</th>
                          <th style={{ textAlign: 'center', padding: 4 }}>Penalty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.penalties.map((tier, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                            <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${tier.threshold}M</td>
                            <td style={{ padding: 4, textAlign: 'center', color: tier.rate >= 75 ? '#ef4444' : '#ccc' }}>{tier.rate}%</td>
                            <td style={{ padding: 4, textAlign: 'center', color: '#ccc' }}>${tier.overage}M</td>
                            <td style={{ padding: 4, textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>${tier.penalty}M</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Draft Pick Penalty */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: scenario.draftPickPenalty === 'None' ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>
                      {scenario.draftPickPenalty}
                    </div>
                    <div style={{ color: '#666', fontSize: 9 }}>Draft Pick Penalty</div>
                  </div>
                </div>

                {/* Biggest Contracts */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BIGGEST CONTRACTS</div>
                {selected.biggestContracts.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>${c.aav}M</span>
                      <span style={{ color: '#666', marginLeft: 8 }}>{c.yearsLeft}yr left</span>
                    </span>
                  </div>
                ))}

                {/* Cap Space */}
                <div style={{ display: 'flex', gap: 14, marginTop: 14, marginBottom: 14 }}>
                  <div className="bloomberg-border" style={{ padding: '6px 14px', textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: 10 }}>Cap Space</div>
                    <div style={{
                      color: selected.capSpace >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 700, fontSize: 18,
                    }}>
                      {selected.capSpace >= 0 ? '+' : ''}{selected.capSpace}M
                    </div>
                  </div>
                  <div className="bloomberg-border" style={{ padding: '6px 14px', textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: 10 }}>Threshold</div>
                    <div style={{ color: '#ccc', fontWeight: 700, fontSize: 18 }}>${selected.luxuryThreshold}M</div>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
                <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                  {selected.notes}
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view salary cap analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
