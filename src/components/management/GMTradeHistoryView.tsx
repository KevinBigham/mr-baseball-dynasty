/**
 * GMTradeHistoryView – GM trade history ledger
 *
 * Bloomberg-terminal style trade record with deal grades, value tracking,
 * prospect returns, and historical trade tree analysis.
 */
import { useState, useMemo } from 'react';
import {
  HistoricalTrade,
  GRADE_DISPLAY,
  getGMTradeHistorySummary,
  generateDemoGMTradeHistory,
} from '../../engine/management/gmTradeHistory';

export default function GMTradeHistoryView() {
  const data = useMemo(() => generateDemoGMTradeHistory(), []);
  const summary = useMemo(() => getGMTradeHistorySummary(data), [data]);
  const [selected, setSelected] = useState<HistoricalTrade | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        GM TRADE HISTORY — {data.gmName.toUpperCase()}
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Trades', value: summary.totalTrades },
          { label: 'Avg Grade', value: summary.avgGrade },
          { label: 'Net Value', value: summary.netValue, color: data.totalNetValue >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Win%', value: `${summary.winPct}%` },
          { label: 'Best Deal', value: data.bestTrade },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Trade List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Date</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Partner</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Net Value</th>
              </tr>
            </thead>
            <tbody>
              {data.trades.map(t => {
                const gd = GRADE_DISPLAY[t.currentGrade];
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
                    <td style={{ padding: 6, color: '#aaa' }}>{t.date}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {t.partner}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 700 }}>{gd.label}</td>
                    <td style={{
                      padding: 6, textAlign: 'center', fontWeight: 600,
                      color: t.netValue >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {t.netValue >= 0 ? '+' : ''}{t.netValue.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                Trade with {selected.partner}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.date}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: GRADE_DISPLAY[selected.initialGrade].color, fontWeight: 700 }}>
                    {GRADE_DISPLAY[selected.initialGrade].label}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Initial Grade</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: GRADE_DISPLAY[selected.currentGrade].color, fontWeight: 700 }}>
                    {GRADE_DISPLAY[selected.currentGrade].label}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Current Grade</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.netValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {selected.netValue >= 0 ? '+' : ''}{selected.netValue.toFixed(1)}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Net Value</div>
                </div>
              </div>

              {/* Sent Assets */}
              <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>SENT</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Type</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR@Trade</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Curr WAR</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.sent.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.type}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.warAtTrade.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.currentWAR >= 2.0 ? '#22c55e' : '#ccc' }}>
                        {a.currentWAR.toFixed(1)}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.surplus >= 0 ? '#22c55e' : '#ef4444' }}>
                        {a.surplus >= 0 ? '+' : ''}{a.surplus.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Received Assets */}
              <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>RECEIVED</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Type</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR@Trade</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Curr WAR</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.received.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.type}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.warAtTrade.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.currentWAR >= 2.0 ? '#22c55e' : '#ccc' }}>
                        {a.currentWAR.toFixed(1)}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.surplus >= 0 ? '#22c55e' : '#ef4444' }}>
                        {a.surplus >= 0 ? '+' : ''}{a.surplus.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Description */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.description}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a trade to view deal breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
