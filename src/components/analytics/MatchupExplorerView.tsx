/**
 * MatchupExplorerView – Head-to-head batter vs pitcher matchups
 *
 * Bloomberg-terminal style matchup explorer with outcomes,
 * pitch tendencies, and edge analysis.
 */
import { useState, useMemo } from 'react';
import {
  Matchup,
  EDGE_DISPLAY,
  getMatchupSummary,
  generateDemoMatchups,
} from '../../engine/analytics/matchupExplorer';

export default function MatchupExplorerView() {
  const matchups = useMemo(() => generateDemoMatchups(), []);
  const summary = useMemo(() => getMatchupSummary(matchups), [matchups]);
  const [selected, setSelected] = useState<Matchup | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        MATCHUP EXPLORER — BATTER vs PITCHER
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Matchups', value: summary.totalMatchups },
          { label: 'Batter Favored', value: summary.batterDominant, color: '#22c55e' },
          { label: 'Pitcher Favored', value: summary.pitcherDominant, color: '#ef4444' },
          { label: 'Even', value: summary.evenCount, color: '#eab308' },
          { label: 'Avg Sample', value: `${summary.avgSampleSize} ABs` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Matchup List ── */}
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Batter</th>
                <th style={{ textAlign: 'center', padding: 6 }}>vs</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ABs</th>
                <th style={{ textAlign: 'center', padding: 6 }}>AVG</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OPS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Edge</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map(m => {
                const ed = EDGE_DISPLAY[m.edge];
                const ops = (m.outcomes.obp + m.outcomes.slg).toFixed(3);
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === m.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{m.batterName} <span style={{ color: '#666' }}>{m.batterTeam}</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#555' }}>vs</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{m.pitcherName} <span style={{ color: '#666' }}>{m.pitcherTeam}</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{m.outcomes.abs}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: m.outcomes.avg >= .300 ? '#22c55e' : '#ccc' }}>{m.outcomes.avg.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: parseFloat(ops) >= .800 ? '#f59e0b' : '#ccc' }}>{ops}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: ed.color }}>{ed.emoji} {ed.label}</td>
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
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{selected.batterName}</span>
                <span style={{ color: '#888', margin: '0 8px' }}>vs</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6' }}>{selected.pitcherName}</span>
                <span style={{ color: '#888', marginLeft: 6 }}>({selected.pitcherThrows}HP)</span>
              </div>

              <div style={{ color: EDGE_DISPLAY[selected.edge].color, fontWeight: 700, marginBottom: 12 }}>
                {EDGE_DISPLAY[selected.edge].emoji} {EDGE_DISPLAY[selected.edge].label} · {selected.sampleSize} ABs · Last: {selected.lastMeeting}
              </div>

              {/* Outcomes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>CAREER HEAD-TO-HEAD</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'AVG', value: selected.outcomes.avg.toFixed(3) },
                  { label: 'OBP', value: selected.outcomes.obp.toFixed(3) },
                  { label: 'SLG', value: selected.outcomes.slg.toFixed(3) },
                  { label: 'HR', value: selected.outcomes.hr },
                  { label: 'K', value: selected.outcomes.k },
                  { label: 'BB', value: selected.outcomes.bb },
                  { label: 'RBI', value: selected.outcomes.rbi },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pitch Tendencies */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH TENDENCIES IN MATCHUP</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Usage</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Velo</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>BAA</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitchTendencies.map(pt => (
                    <tr key={pt.pitchType} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pt.pitchType}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.usage}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{pt.avgVelo}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.whiffRate >= 30 ? '#f59e0b' : '#ccc' }}>{pt.whiffRate}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.batAvg >= .300 ? '#22c55e' : pt.batAvg <= .150 ? '#ef4444' : '#ccc' }}>{pt.batAvg.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUT NOTES</div>
              <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5, fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a matchup to view detailed breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
