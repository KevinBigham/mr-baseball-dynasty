/**
 * ProspectCompMatrixView – Prospect Comparison Matrix dashboard
 *
 * Bloomberg-terminal style side-by-side prospect comparison with
 * tool grades, development trajectory, and historical comps.
 */
import { useState, useMemo } from 'react';
import {
  ProspectProfile,
  RISK_DISPLAY,
  gradeColor,
  getProspectMatrixSummary,
  generateDemoProspectMatrix,
} from '../../engine/scouting/prospectCompMatrix';

export default function ProspectCompMatrixView() {
  const profiles = useMemo(() => generateDemoProspectMatrix(), []);
  const summary = useMemo(() => getProspectMatrixSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<ProspectProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PROSPECT COMPARISON MATRIX — TOOL ANALYSIS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Prospects', value: summary.totalProspects },
          { label: 'Highest Ceiling', value: summary.highestCeiling, color: '#22c55e' },
          { label: 'Most Ready', value: summary.mostMLBReady },
          { label: 'Avg Future', value: summary.avgFutureGrade },
          { label: 'Best Tool', value: `${summary.bestTool.name} ${summary.bestTool.tool} (${summary.bestTool.grade})`, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Prospect List */}
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Prospect</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rk</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Lvl</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Cur</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Fut</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const rd = RISK_DISPLAY[p.risk];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>#{p.overallRank}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.position}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.level === 'MLB' ? '#22c55e' : p.level === 'AAA' ? '#4ade80' : '#888', fontSize: 10 }}>{p.level}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gradeColor(p.avgCurrentGrade), fontWeight: 700 }}>{p.avgCurrentGrade}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gradeColor(p.avgFutureGrade), fontWeight: 700 }}>{p.avgFutureGrade}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.eta <= 2025 ? '#22c55e' : '#888' }}>{p.eta}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: rd?.color ?? '#888', fontSize: 10, fontWeight: 600 }}>{rd?.label ?? p.risk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.position} · #{selected.overallRank}
                </span>
              </div>
              <div style={{ color: RISK_DISPLAY[selected.risk]?.color ?? '#888', fontWeight: 700, marginBottom: 12 }}>
                {selected.level} · Age {selected.age} · ETA {selected.eta} · {RISK_DISPLAY[selected.risk]?.label ?? selected.risk} Risk
              </div>

              {/* Tool Grades */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOOL GRADES (20-80 SCALE)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Tool</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Current</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Future</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Delta</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Grade Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.tools.filter(t => t.current > 0 || t.future > 0).map(t => (
                    <tr key={t.tool} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{t.tool}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.current), fontWeight: 700 }}>{t.current}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.future), fontWeight: 700 }}>{t.future}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: t.delta > 0 ? '#22c55e' : '#888' }}>
                        {t.delta > 0 ? `+${t.delta}` : t.delta}
                      </td>
                      <td style={{ padding: 4 }}>
                        <div style={{ background: '#111', height: 10, width: '100%', position: 'relative' }}>
                          <div style={{ background: gradeColor(t.current), height: '100%', width: `${(t.current / 80) * 100}%`, opacity: 0.4, position: 'absolute' }} />
                          <div style={{ background: gradeColor(t.future), height: '100%', width: `${(t.future / 80) * 100}%`, opacity: 0.8, position: 'absolute', borderRight: '2px solid #fff' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Historical Comps */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>HISTORICAL COMPARISONS</div>
              {selected.historicalComps.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{c.similarity}% match</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>Peak {c.peakWAR} WAR · Career {c.careerWAR}</span>
                  </span>
                </div>
              ))}

              {/* Strengths & Weaknesses */}
              <div style={{ display: 'flex', gap: 14, marginTop: 14, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>STRENGTHS</div>
                  {selected.strengths.map((s, i) => (
                    <div key={i} style={{ color: '#aaa', fontSize: 10, marginBottom: 2 }}>+ {s}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>WEAKNESSES</div>
                  {selected.weaknesses.map((w, i) => (
                    <div key={i} style={{ color: '#aaa', fontSize: 10, marginBottom: 2 }}>- {w}</div>
                  ))}
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view detailed comparison
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
