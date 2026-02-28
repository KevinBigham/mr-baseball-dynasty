/**
 * TeamPayrollHistoryView – Historical payroll dashboard
 *
 * Bloomberg-terminal style view showing multi-season payroll trends,
 * current breakdown by category, league rank, and luxury tax status.
 */
import { useState, useMemo } from 'react';
import {
  TeamPayrollRecord,
  generateDemoTeamPayrollHistory,
  getPayrollTrend,
  getSparkline,
  TREND_DISPLAY,
} from '../../engine/finance/teamPayrollHistory';

export default function TeamPayrollHistoryView() {
  const records = useMemo(() => generateDemoTeamPayrollHistory(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selected: TeamPayrollRecord = records[selectedIdx];
  const trend = getPayrollTrend(selected);
  const trendInfo = TREND_DISPLAY[trend];

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TEAM PAYROLL HISTORY — SPENDING TRENDS
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Teams Tracked', value: records.length },
          { label: 'Highest Payroll', value: `$${Math.max(...records.map(r => r.seasons[0]?.final ?? 0))}M`, color: '#ef4444' },
          { label: 'Lowest Payroll', value: `$${Math.min(...records.map(r => r.seasons[0]?.final ?? 0))}M`, color: '#22c55e' },
          { label: 'CBT Payers', value: records.filter(r => r.seasons[0]?.competitiveBalanceTax).length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Team List ── */}
        <div style={{ flex: '1 1 520px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rank</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Current $M</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Trend</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Sparkline</th>
                <th style={{ textAlign: 'center', padding: 6 }}>CBT</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tax $M</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const t = getPayrollTrend(r);
                const ti = TREND_DISPLAY[t];
                const currentSeason = r.seasons[0];
                const isSelected = i === selectedIdx;
                return (
                  <tr
                    key={r.teamId}
                    onClick={() => setSelectedIdx(i)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: isSelected ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      <span style={{ color: '#f59e0b', marginRight: 6 }}>{r.abbr}</span>
                      {r.teamName}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: r.leagueRank <= 5 ? '#f59e0b' : '#888' }}>
                      #{r.leagueRank}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>
                      ${currentSeason?.final ?? 0}M
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: ti.color, fontWeight: 600, fontSize: 10 }}>
                      {ti.label}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontSize: 14, letterSpacing: 1 }}>
                      {getSparkline(r)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      {currentSeason?.competitiveBalanceTax ? (
                        <span style={{
                          background: '#7f1d1d',
                          color: '#fca5a5',
                          padding: '2px 6px',
                          fontSize: 9,
                          fontWeight: 700,
                        }}>
                          CBT
                        </span>
                      ) : (
                        <span style={{
                          background: '#14532d',
                          color: '#86efac',
                          padding: '2px 6px',
                          fontSize: 9,
                          fontWeight: 700,
                        }}>
                          CLEAR
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: (currentSeason?.luxuryTaxPayable ?? 0) > 0 ? '#ef4444' : '#666' }}>
                      {(currentSeason?.luxuryTaxPayable ?? 0) > 0 ? `$${currentSeason?.luxuryTaxPayable}M` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 380px' }}>
          <div className="bloomberg-border" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
              {selected.abbr} — {selected.teamName}
              <span style={{ color: trendInfo.color, fontWeight: 600, marginLeft: 10, fontSize: 11 }}>
                {trendInfo.label}
              </span>
            </div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
              League Rank: #{selected.leagueRank} of 30
            </div>

            {/* Season History Table */}
            <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PAYROLL BY SEASON ($M)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                  <th style={{ textAlign: 'left', padding: 4 }}>Season</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Opening</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Mid</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Final</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Tax</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>CBT</th>
                </tr>
              </thead>
              <tbody>
                {selected.seasons.map(s => (
                  <tr key={s.season} style={{ borderBottom: '1px solid #1a1a2e' }}>
                    <td style={{ padding: 4, fontWeight: 600, color: s.season === 2026 ? '#f59e0b' : '#ccc' }}>
                      {s.season}
                    </td>
                    <td style={{ padding: 4, textAlign: 'center' }}>${s.opening}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>${s.midseason}</td>
                    <td style={{ padding: 4, textAlign: 'center', fontWeight: 700 }}>${s.final}</td>
                    <td style={{ padding: 4, textAlign: 'center', color: s.luxuryTaxPayable > 0 ? '#ef4444' : '#666' }}>
                      {s.luxuryTaxPayable > 0 ? `$${s.luxuryTaxPayable}` : '-'}
                    </td>
                    <td style={{ padding: 4, textAlign: 'center' }}>
                      {s.competitiveBalanceTax ? (
                        <span style={{ color: '#fca5a5', fontSize: 9, fontWeight: 700 }}>YES</span>
                      ) : (
                        <span style={{ color: '#555', fontSize: 9 }}>NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Current Breakdown */}
            <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CURRENT SEASON BREAKDOWN</div>
            {selected.currentBreakdown.map(cat => (
              <div key={cat.label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#ccc' }}>{cat.label}</span>
                  <span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>${cat.amount}M</span>
                    <span style={{ color: '#666', marginLeft: 6 }}>{cat.pctOfTotal}%</span>
                  </span>
                </div>
                <div style={{ background: '#111', height: 8, width: '100%', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '100%',
                    width: `${cat.pctOfTotal}%`,
                    background: cat.pctOfTotal >= 30 ? '#f59e0b' : cat.pctOfTotal >= 15 ? '#3b82f6' : '#4b5563',
                  }} />
                </div>
              </div>
            ))}

            {/* Luxury Tax Status Badge */}
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              {selected.seasons[0]?.competitiveBalanceTax ? (
                <div style={{
                  display: 'inline-block',
                  background: '#7f1d1d',
                  color: '#fca5a5',
                  padding: '6px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid #ef4444',
                }}>
                  LUXURY TAX PAYER — ${selected.seasons[0].luxuryTaxPayable}M DUE
                </div>
              ) : (
                <div style={{
                  display: 'inline-block',
                  background: '#14532d',
                  color: '#86efac',
                  padding: '6px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid #22c55e',
                }}>
                  UNDER LUXURY TAX THRESHOLD
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
