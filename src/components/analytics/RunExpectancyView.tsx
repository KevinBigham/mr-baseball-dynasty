/**
 * RunExpectancyView – Run expectancy matrix dashboard
 *
 * Bloomberg-terminal style RE matrix with base-out state comparisons,
 * team vs league expected values, and situational analysis.
 */
import { useState, useMemo } from 'react';
import {
  RunExpectancyData,
  baseStateLabel,
  getRunExpectancySummary,
  generateDemoRunExpectancy,
} from '../../engine/analytics/runExpectancy';

export default function RunExpectancyView() {
  const teams = useMemo(() => generateDemoRunExpectancy(), []);
  const summary = useMemo(() => getRunExpectancySummary(teams), [teams]);
  const [selected, setSelected] = useState<RunExpectancyData | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        RUN EXPECTANCY MATRIX — SITUATIONAL ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Teams', value: summary.totalTeams },
          { label: 'Best Team', value: summary.bestTeam, color: '#22c55e' },
          { label: 'Worst Team', value: summary.worstTeam, color: '#ef4444' },
          { label: 'Avg RAE', value: summary.avgRunsAboveExpected },
          { label: 'Best Clutch', value: summary.bestClutch, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RAE</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Clutch</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Strength</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === t.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{t.abbr}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.totalRunsAboveExpected >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {t.totalRunsAboveExpected > 0 ? '+' : ''}{t.totalRunsAboveExpected}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.clutchRE >= 0 ? '#22c55e' : '#ef4444' }}>
                    {t.clutchRE > 0 ? '+' : ''}{t.clutchRE.toFixed(3)}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', fontSize: 10 }}>{t.biggestStrength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 480px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.teamName}
                <span style={{ color: selected.totalRunsAboveExpected >= 0 ? '#22c55e' : '#ef4444', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.totalRunsAboveExpected > 0 ? '+' : ''}{selected.totalRunsAboveExpected} RAE
                </span>
              </div>

              {/* RE Matrix */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RUN EXPECTANCY MATRIX (Team vs League)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Base State</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>0 Out</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>1 Out</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>2 Out</th>
                  </tr>
                </thead>
                <tbody>
                  {(['---', '1--', '-2-', '--3', '12-', '1-3', '-23', '123'] as const).map(bs => {
                    const cells = selected.matrix.filter(c => c.baseState === bs);
                    return (
                      <tr key={bs} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, fontWeight: 600, fontSize: 10 }}>{baseStateLabel(bs)}</td>
                        {cells.map(c => (
                          <td key={c.outs} style={{ padding: 4, textAlign: 'center' }}>
                            <div style={{ color: c.diff >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{c.teamRE.toFixed(3)}</div>
                            <div style={{ color: '#555', fontSize: 8 }}>{c.diff > 0 ? '+' : ''}{c.diff.toFixed(3)}</div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Situational */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#22c55e', fontSize: 9, marginBottom: 2 }}>STRENGTH</div>
                  <div style={{ fontSize: 11 }}>{selected.biggestStrength}</div>
                </div>
                <div style={{ flex: 1, padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#ef4444', fontSize: 9, marginBottom: 2 }}>WEAKNESS</div>
                  <div style={{ fontSize: 11 }}>{selected.biggestWeakness}</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view run expectancy matrix
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
