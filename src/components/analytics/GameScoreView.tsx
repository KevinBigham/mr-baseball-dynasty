/**
 * GameScoreView – Bill James Game Score tracker
 *
 * Bloomberg-terminal style game score dashboard with
 * start-by-start analysis, quality start rates, and gems.
 */
import { useState, useMemo } from 'react';
import {
  PitcherGameScores,
  PERFORMANCE_DISPLAY,
  getGameScoreSummary,
  generateDemoGameScores,
} from '../../engine/analytics/gameScore';

export default function GameScoreView() {
  const pitchers = useMemo(() => generateDemoGameScores(), []);
  const summary = useMemo(() => getGameScoreSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherGameScores | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        GAME SCORE — STARTING PITCHER PERFORMANCE
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Avg Game Score', value: summary.teamAvgGameScore },
          { label: 'Team QS%', value: `${summary.teamQSPct}%` },
          { label: 'Total Gems', value: summary.totalGems, color: '#22c55e' },
          { label: 'Total Disasters', value: summary.totalDisasters, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>GS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg GS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Best</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Worst</th>
                <th style={{ textAlign: 'center', padding: 6 }}>QS%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Gems</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.starts}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.avgGameScore >= 60 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{p.avgGameScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#22c55e' }}>{p.bestGameScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ef4444' }}>{p.worstGameScore}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.qualityStartPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.gemCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Recent Starts ── */}
        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                {selected.name} — Recent Starts
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team}</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Date</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>vs</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>IP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>H</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>ER</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>BB</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>K</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>GS</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Level</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Dec</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.recentStarts.map((s, i) => {
                    const pl = PERFORMANCE_DISPLAY[s.level];
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, color: '#888' }}>{s.date}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{s.opponent}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{s.ip}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{s.h}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: s.er >= 4 ? '#ef4444' : '#ccc' }}>{s.er}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{s.bb}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: s.k >= 10 ? '#22c55e' : '#ccc' }}>{s.k}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: pl.color, fontWeight: 700 }}>{s.gameScore}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: pl.color }}>{pl.emoji} {pl.label}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: s.decision === 'W' ? '#22c55e' : s.decision === 'L' ? '#ef4444' : '#888' }}>{s.decision}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Game score bar visualization */}
              <div style={{ marginTop: 12, display: 'flex', gap: 4, alignItems: 'flex-end', height: 50 }}>
                {selected.recentStarts.map((s, i) => {
                  const pl = PERFORMANCE_DISPLAY[s.level];
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 40, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', bottom: 0, left: '10%', right: '10%',
                          height: `${s.gameScore}%`,
                          background: pl.color,
                          borderRadius: 2,
                        }} />
                      </div>
                      <div style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{s.date.split(' ')[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view start-by-start game scores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
