/**
 * BuyoutAnalyzerView – Contract Buyout Analyzer dashboard
 *
 * Bloomberg-terminal style buyout analysis with recommendation badges,
 * savings comparison bars, dead money display, and detailed option cards.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoBuyoutAnalysis,
  REC_LABELS,
  type BuyoutOption,
} from '../../engine/contracts/contractBuyoutAnalyzer';

function SavingsBar({ savings, max }: { savings: number; max: number }) {
  const pct = Math.min(100, Math.max(0, (savings / max) * 100));
  const color = savings > 0 ? '#22c55e' : '#ef4444';

  return (
    <div style={{ width: 100 }}>
      <div style={{ height: 8, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 9, color, fontWeight: 600, textAlign: 'right', marginTop: 1 }}>
        ${savings.toFixed(1)}M
      </div>
    </div>
  );
}

export default function BuyoutAnalyzerView() {
  const data = useMemo(() => generateDemoBuyoutAnalysis(), []);
  const [selected, setSelected] = useState<BuyoutOption | null>(null);

  const maxSavings = Math.max(...data.options.map(o => o.savingsOverTerm));

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CONTRACT BUYOUT ANALYZER
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>{data.teamName.toUpperCase()}</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL COMMITTED', value: `$${data.totalCommitted}M`, color: '#d1d5db' },
          { label: 'POTENTIAL SAVINGS', value: `$${data.totalPotentialSavings}M`, color: '#22c55e' },
          { label: 'BUYOUT CANDIDATES', value: String(data.buyoutCandidates), color: '#ef4444' },
          { label: 'KEEP', value: String(data.keepCandidates), color: '#22c55e' },
          { label: 'RESTRUCTURE', value: String(data.restructureCandidates), color: '#eab308' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Options Table */}
        <div style={{ flex: '1 1 640px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Player</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Pos</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>AAV</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Yrs</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Buyout</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Dead $</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Savings</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Rec</th>
              </tr>
            </thead>
            <tbody>
              {data.options.map(o => {
                const rec = REC_LABELS[o.recommendation];
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      background: selected?.id === o.id ? '#111827' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '7px 8px', fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>
                      {o.playerName}
                      <span style={{ color: '#4b5563', fontSize: 10, marginLeft: 4 }}>Age {o.age}</span>
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>
                      {o.position}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#d1d5db', fontWeight: 700 }}>
                      ${o.currentAAV}M
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9ca3af' }}>
                      {o.yearsRemaining}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>
                      ${o.buyoutCost}M
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#f97316', fontSize: 11 }}>
                      ${o.deadMoney}M
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <SavingsBar savings={o.savingsOverTerm} max={maxSavings} />
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span style={{
                        color: rec.color,
                        fontWeight: 700,
                        fontSize: 9,
                        padding: '2px 6px',
                        border: `1px solid ${rec.color}33`,
                        borderRadius: 2,
                        background: `${rec.color}11`,
                      }}>
                        {rec.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 320px' }}>
          {selected ? (() => {
            const rec = REC_LABELS[selected.recommendation];
            const totalRemaining = selected.currentAAV * selected.yearsRemaining;
            const warPerDollar = selected.projectedWAR / selected.currentAAV;

            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15 }}>{selected.playerName}</div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>{selected.position} · Age {selected.age}</div>
                  </div>
                  <span style={{
                    color: rec.color,
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '4px 10px',
                    border: `1px solid ${rec.color}`,
                    borderRadius: 3,
                    background: `${rec.color}15`,
                  }}>
                    {rec.label}
                  </span>
                </div>

                {/* Financial Breakdown */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>FINANCIAL BREAKDOWN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'CURRENT AAV', value: `$${selected.currentAAV}M`, color: '#d1d5db' },
                      { label: 'YEARS LEFT', value: String(selected.yearsRemaining), color: '#9ca3af' },
                      { label: 'TOTAL REMAINING', value: `$${totalRemaining}M`, color: '#f59e0b' },
                      { label: 'BUYOUT COST', value: `$${selected.buyoutCost}M`, color: '#ef4444' },
                      { label: 'DEAD MONEY', value: `$${selected.deadMoney}M`, color: '#f97316' },
                      { label: 'SAVINGS', value: `$${selected.savingsOverTerm.toFixed(1)}M`, color: '#22c55e' },
                    ].map(s => (
                      <div key={s.label} className="bloomberg-border" style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Context */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>PERFORMANCE CONTEXT</div>
                  {[
                    { label: 'Projected WAR', value: selected.projectedWAR.toFixed(1), color: selected.projectedWAR >= 2 ? '#22c55e' : '#ef4444' },
                    { label: 'Market Value', value: `$${selected.marketValue}M AAV`, color: '#f59e0b' },
                    { label: 'WAR / $M', value: warPerDollar.toFixed(3), color: warPerDollar >= 0.15 ? '#22c55e' : '#ef4444' },
                    { label: 'Overpay', value: `$${Math.max(0, selected.currentAAV - selected.marketValue)}M`, color: selected.currentAAV > selected.marketValue ? '#ef4444' : '#22c55e' },
                  ].map(s => (
                    <div key={s.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      background: '#111827',
                      border: '1px solid #1f2937',
                      marginBottom: 3,
                      fontSize: 11,
                    }}>
                      <span style={{ color: '#9ca3af' }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Dead Money Impact */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>DEAD MONEY IMPACT</div>
                  <div style={{ height: 12, background: '#1f2937', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (selected.deadMoney / selected.currentAAV) * 100)}%`,
                      background: '#f97316',
                      borderRadius: 4,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 2 }}>
                    <span style={{ color: '#f97316' }}>${selected.deadMoney}M dead</span>
                    <span style={{ color: '#6b7280' }}>${selected.currentAAV}M AAV</span>
                  </div>
                </div>

                {/* Analysis */}
                <div style={{
                  padding: '8px 10px',
                  background: `${rec.color}08`,
                  border: `1px solid ${rec.color}33`,
                }}>
                  <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 3 }}>ANALYSIS</div>
                  <div style={{ fontSize: 11, color: '#d1d5db', lineHeight: '1.5' }}>
                    {selected.notes}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a contract to view buyout analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
