/**
 * RosterConstructionView – Roster construction grade dashboard
 *
 * Bloomberg-terminal style roster construction evaluator with
 * dimension scores, team modes, strengths/weaknesses, and grades.
 */
import { useState, useMemo } from 'react';
import {
  RosterConstructionTeam,
  MODE_DISPLAY,
  gradeColor,
  getRosterConstructionSummary,
  generateDemoRosterConstruction,
} from '../../engine/analytics/rosterConstructionScore';

export default function RosterConstructionView() {
  const teams = useMemo(() => generateDemoRosterConstruction(), []);
  const summary = useMemo(() => getRosterConstructionSummary(teams), [teams]);
  const [selected, setSelected] = useState<RosterConstructionTeam | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        ROSTER CONSTRUCTION — TEAM GRADES
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Teams', value: summary.totalTeams },
          { label: 'Avg Score', value: summary.avgScore },
          { label: 'Best Built', value: summary.bestTeam, color: '#22c55e' },
          { label: 'Contenders', value: summary.contenderCount, color: '#22c55e' },
          { label: 'Rebuilding', value: summary.rebuildingCount, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Mode</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Proj W</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR/$M</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === t.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{t.abbr} <span style={{ color: '#666', fontSize: 10 }}>{t.teamName}</span></td>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{t.overallScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: gradeColor(t.overallGrade), fontWeight: 700 }}>{t.overallGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: MODE_DISPLAY[t.mode].color, fontSize: 10, fontWeight: 600 }}>{MODE_DISPLAY[t.mode].label}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{t.projectedWins}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.payrollEfficiency >= 0.18 ? '#22c55e' : '#ccc' }}>{t.payrollEfficiency.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.teamName}
                <span style={{ color: MODE_DISPLAY[selected.mode].color, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{MODE_DISPLAY[selected.mode].label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.overallGrade), fontWeight: 700, fontSize: 22 }}>{selected.overallGrade}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Overall</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>{selected.overallScore}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>{selected.projectedWins}W</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Projected</div>
                </div>
              </div>

              {/* Dimension Scores */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>DIMENSION GRADES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Dimension</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.dimensions.map(d => (
                    <tr key={d.dimension} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{d.dimension}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{d.score}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(d.grade), fontWeight: 700 }}>{d.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Strengths & Weaknesses */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 4 }}>STRENGTHS</div>
                  {selected.strengths.map(s => (
                    <div key={s} style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>+ {s}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 4 }}>WEAKNESSES</div>
                  {selected.weaknesses.map(w => (
                    <div key={w} style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>- {w}</div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.coreAge}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Core Age</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.payrollEfficiency >= 0.18 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{selected.payrollEfficiency.toFixed(2)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>WAR/$M</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.pipelineScore >= 80 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{selected.pipelineScore}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Pipeline</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view roster construction
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
