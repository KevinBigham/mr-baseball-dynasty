/**
 * MarketValueView – Trade market value estimator dashboard
 *
 * Bloomberg-terminal style player valuation with surplus value,
 * market scores, position scarcity, and comparable trades.
 */
import { useState, useMemo } from 'react';
import {
  PlayerMarketValue,
  VALUE_DISPLAY,
  getMarketSummary,
  generateDemoMarketValues,
} from '../../engine/trade/marketValue';

export default function MarketValueView() {
  const players = useMemo(() => generateDemoMarketValues(), []);
  const summary = useMemo(() => getMarketSummary(players), [players]);
  const [selected, setSelected] = useState<PlayerMarketValue | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TRADE MARKET VALUE — PLAYER VALUATIONS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players', value: summary.totalPlayers },
          { label: 'Franchise Value', value: summary.franchiseCount, color: '#22c55e' },
          { label: 'Negative Value', value: summary.negativeCount, color: '#ef4444' },
          { label: 'Avg Surplus', value: `$${summary.avgSurplus}M` },
          { label: 'Avg Market Score', value: summary.avgMarketScore },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Player List ── */}
        <div style={{ flex: '1 1 500px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Salary</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Yrs</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Surplus $</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Market</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tier</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const vd = VALUE_DISPLAY[p.valueTier];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666' }}>{p.team}</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.currentWAR}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>${p.salary}M</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.yearsLeft}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      ${p.surplusValue}M
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.marketScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: vd.color, fontWeight: 600 }}>{vd.emoji} {vd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.pos} · Age {selected.age}</span>
              </div>
              <div style={{ color: VALUE_DISPLAY[selected.valueTier].color, fontWeight: 700, marginBottom: 12 }}>
                {VALUE_DISPLAY[selected.valueTier].emoji} {VALUE_DISPLAY[selected.valueTier].label}
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Current WAR', value: selected.currentWAR },
                  { label: 'Proj WAR', value: selected.projectedWAR },
                  { label: 'Salary', value: `$${selected.salary}M` },
                  { label: 'Yrs Left', value: selected.yearsLeft },
                  { label: 'Surplus', value: `$${selected.surplusValue}M`, color: selected.surplusValue >= 0 ? '#22c55e' : '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Market Factors */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>MARKET FACTORS</div>
              {[
                { label: 'Market Score', value: selected.marketScore },
                { label: 'Position Scarcity', value: selected.positionScarcity },
                { label: 'Demand Level', value: selected.demandLevel },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#888' }}>{f.label}</span>
                    <span>{f.value}/100</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#222', borderRadius: 2 }}>
                    <div style={{
                      width: `${f.value}%`, height: 4, borderRadius: 2,
                      background: f.value >= 70 ? '#22c55e' : f.value >= 40 ? '#eab308' : '#ef4444',
                    }} />
                  </div>
                </div>
              ))}

              {/* Comparables */}
              {selected.comparables.length > 0 && (
                <>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 12 }}>COMPARABLE TRADES</div>
                  {selected.comparables.map((c, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #1a1a2e' }}>
                      <div style={{ fontWeight: 600 }}>{c.playerName} ({c.tradeDate})</div>
                      <div style={{ color: '#888', fontSize: 11 }}>Return: {c.returnSummary}</div>
                      <div style={{ color: '#666', fontSize: 10 }}>WAR at time: {c.warAtTime}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Notes */}
              <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4, marginTop: 12 }}>TRADE NOTES</div>
              <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5, fontSize: 12 }}>
                {selected.tradeNotes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view market value breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
