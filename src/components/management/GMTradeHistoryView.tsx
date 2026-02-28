/**
 * GMTradeHistoryView – GM trade history ledger
 *
 * Bloomberg-terminal style trade record with deal grades, value tracking,
 * prospect returns, and historical trade tree analysis.
 */
import { useState, useMemo } from 'react';
import {
  CompletedTrade,
  TRADE_GRADE_DISPLAY,
  getGMTradeHistorySummary,
  generateDemoGMTradeHistory,
} from '../../engine/management/gmTradeHistory';

export default function GMTradeHistoryView() {
  const data = useMemo(() => generateDemoGMTradeHistory(), []);
  const summary = useMemo(() => getGMTradeHistorySummary(data), [data]);
  const [selected, setSelected] = useState<CompletedTrade | null>(null);

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
          { label: 'Avg Grade', value: data.avgGrade },
          { label: 'Net Value', value: `${data.totalSurplus >= 0 ? '+' : ''}${data.totalSurplus.toFixed(1)}`, color: data.totalSurplus >= 0 ? '#22c55e' : '#ef4444' },
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
                const gd = TRADE_GRADE_DISPLAY[t.currentGrade];
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
                      {t.partnerAbbr}
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{t.tradeType}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 700 }}>{gd.label}</td>
                    <td style={{
                      padding: 6, textAlign: 'center', fontWeight: 600,
                      color: t.surplusValue >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {t.surplusValue >= 0 ? '+' : ''}{t.surplusValue.toFixed(1)}
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
                Trade with {selected.partnerTeam}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.date} · S{selected.season}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: TRADE_GRADE_DISPLAY[selected.immediateGrade].color, fontWeight: 700 }}>
                    {TRADE_GRADE_DISPLAY[selected.immediateGrade].label}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Initial Grade</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: TRADE_GRADE_DISPLAY[selected.currentGrade].color, fontWeight: 700 }}>
                    {TRADE_GRADE_DISPLAY[selected.currentGrade].label}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Current Grade</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {selected.surplusValue >= 0 ? '+' : ''}{selected.surplusValue.toFixed(1)}
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>Net Value</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.tradeType}</div>
                  <div style={{ color: '#666', fontSize: 10 }}>Type</div>
                </div>
              </div>

              {/* Sent Assets */}
              <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>SENT</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pos</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR@Trade</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Curr WAR</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Yrs</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>$M</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.sent.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{a.playerName}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.position}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.warAtTrade.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.warSinceTrade >= 2.0 ? '#22c55e' : '#ccc' }}>
                        {a.warSinceTrade.toFixed(1)}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.contractYears}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>${a.salary}</td>
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
                    <th style={{ textAlign: 'center', padding: 4 }}>Pos</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR@Trade</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Curr WAR</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Yrs</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>$M</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.received.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{a.playerName}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.position}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.warAtTrade.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.warSinceTrade >= 2.0 ? '#22c55e' : '#ccc' }}>
                        {a.warSinceTrade.toFixed(1)}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.contractYears}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>${a.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Analysis Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.notes}
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
