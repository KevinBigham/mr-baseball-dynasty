/**
 * FranchiseValueView – Franchise Value Tracker dashboard
 *
 * Bloomberg-terminal style franchise valuation overview with summary cards,
 * team list table sorted by valuation, and detail panel with revenue
 * stream breakdown, operating income, and market rank.
 */
import { useState, useMemo } from 'react';
import {
  FranchiseFinancials,
  getFranchiseValueSummary,
  generateDemoFranchiseValue,
} from '../../engine/finance/franchiseValue';

export default function FranchiseValueView() {
  const teams = useMemo(() => generateDemoFranchiseValue(), []);
  const summary = useMemo(() => getFranchiseValueSummary(teams), [teams]);
  const [selected, setSelected] = useState<FranchiseFinancials | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        FRANCHISE VALUE TRACKER — LEAGUE FINANCIAL OVERVIEW
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Valuation', value: `$${(summary.totalValuation / 1000).toFixed(1)}B` },
          { label: 'Avg Valuation', value: `$${summary.avgValuation}M` },
          { label: 'Highest', value: `${summary.highestValued.name.split(' ').pop()} $${(summary.highestValued.valuation / 1000).toFixed(1)}B`, color: '#22c55e' },
          { label: 'Lowest', value: `${summary.lowestValued.name.split(' ').pop()} $${summary.lowestValued.valuation}M`, color: '#ef4444' },
          { label: 'Avg Growth', value: `${summary.avgGrowth}%`, color: summary.avgGrowth >= 0 ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Team List Table */}
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>Rank</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Valuation</th>
                <th style={{ textAlign: 'center', padding: 6 }}>YoY</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Revenue</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Op Income</th>
              </tr>
            </thead>
            <tbody>
              {[...teams].sort((a, b) => b.valuation - a.valuation).map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === t.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{t.marketRank}</td>
                  <td style={{ padding: 6, fontWeight: 700 }}>
                    <span style={{ color: '#f59e0b' }}>{t.abbr}</span>
                    <span style={{ color: '#666', fontSize: 10, marginLeft: 6 }}>{t.teamName.split(' ').pop()}</span>
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 700, color: '#ccc' }}>
                    ${t.valuation >= 1000 ? (t.valuation / 1000).toFixed(1) + 'B' : t.valuation + 'M'}
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 700,
                    color: t.yoyGrowth >= 5 ? '#22c55e' : t.yoyGrowth >= 0 ? '#ccc' : '#ef4444',
                  }}>
                    {t.yoyGrowth > 0 ? '+' : ''}{t.yoyGrowth}%
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>${t.revenue}M</td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 700,
                    color: t.operatingIncome >= 50 ? '#22c55e' : t.operatingIncome >= 0 ? '#ccc' : '#ef4444',
                  }}>
                    ${t.operatingIncome}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 480px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.abbr} — {selected.teamName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  Market Rank #{selected.marketRank}
                </span>
              </div>

              {/* Financial Overview */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Valuation', value: `$${selected.valuation >= 1000 ? (selected.valuation / 1000).toFixed(1) + 'B' : selected.valuation + 'M'}`, color: '#f59e0b' },
                  { label: 'YoY Growth', value: `${selected.yoyGrowth > 0 ? '+' : ''}${selected.yoyGrowth}%`, color: selected.yoyGrowth >= 5 ? '#22c55e' : selected.yoyGrowth >= 0 ? '#ccc' : '#ef4444' },
                  { label: 'Revenue', value: `$${selected.revenue}M`, color: '#ccc' },
                  { label: 'Expenses', value: `$${selected.expenses}M`, color: '#ccc' },
                  { label: 'Op Income', value: `$${selected.operatingIncome}M`, color: selected.operatingIncome >= 50 ? '#22c55e' : selected.operatingIncome >= 0 ? '#f59e0b' : '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Revenue Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>REVENUE BREAKDOWN</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Source</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>% Total</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.revenueStreams.map((rs, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{rs.source}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${rs.amount}M</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#ccc' }}>{rs.pctOfTotal}%</td>
                      <td style={{
                        padding: 4, textAlign: 'center', fontWeight: 700,
                        color: rs.yoyChange >= 5 ? '#22c55e' : rs.yoyChange >= 0 ? '#ccc' : '#ef4444',
                      }}>
                        {rs.yoyChange > 0 ? '+' : ''}{rs.yoyChange}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Revenue Bar Visualization */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>REVENUE MIX</div>
              <div style={{ marginBottom: 14 }}>
                {selected.revenueStreams.map((rs, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 90, fontSize: 10, color: '#888', textAlign: 'right' }}>{rs.source}</span>
                    <div style={{ flex: 1, height: 12, background: '#111', border: '1px solid #222', position: 'relative' }}>
                      <div style={{
                        width: `${rs.pctOfTotal}%`,
                        height: '100%',
                        background: rs.yoyChange >= 5 ? '#22c55e' : rs.yoyChange >= 0 ? '#f59e0b' : '#ef4444',
                        opacity: 0.7,
                      }} />
                    </div>
                    <span style={{ width: 35, fontSize: 10, color: '#ccc', textAlign: 'right' }}>{rs.pctOfTotal}%</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view franchise financials
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
