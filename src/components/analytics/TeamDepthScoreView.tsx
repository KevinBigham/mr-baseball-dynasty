/**
 * TeamDepthScoreView – Team Depth Score dashboard
 *
 * Bloomberg-terminal style position-by-position depth analysis with
 * team list table, summary cards, starter vs backup comparison,
 * dropoff metrics, and depth grade visualization.
 */
import { useState, useMemo } from 'react';
import {
  TeamDepthData,
  DEPTH_GRADE_DISPLAY,
  getTeamDepthSummary,
  generateDemoTeamDepthScore,
} from '../../engine/analytics/teamDepthScore';

export default function TeamDepthScoreView() {
  const teams = useMemo(() => generateDemoTeamDepthScore(), []);
  const summary = useMemo(() => getTeamDepthSummary(teams), [teams]);
  const [selected, setSelected] = useState<TeamDepthData | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TEAM DEPTH SCORE — ROSTER RESILIENCE
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Teams', value: summary.totalTeams },
          { label: 'Deepest', value: summary.deepestTeam, color: '#22c55e' },
          { label: 'Thinnest', value: summary.thinnestTeam, color: '#ef4444' },
          { label: 'Avg Score', value: summary.avgDepthScore },
          { label: 'Most Elite', value: `${summary.mostPositionsElite.team} (${summary.mostPositionsElite.count})`, color: '#22c55e' },
          { label: 'Biggest Drop', value: `${summary.biggestDropoff.team} ${summary.biggestDropoff.position} (${summary.biggestDropoff.dropoff})`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 15, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Team List Table */}
        <div style={{ flex: '1 1 380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Strong</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Weak</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg Drop</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const scoreColor = t.overallDepthScore >= 70 ? '#22c55e'
                  : t.overallDepthScore >= 50 ? '#f59e0b'
                  : '#ef4444';
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
                    <td style={{ padding: 6, fontWeight: 700 }}>
                      <span style={{ color: '#f59e0b' }}>{t.abbr}</span>
                      <span style={{ color: '#666', fontSize: 10, marginLeft: 6 }}>{t.teamName.split(' ').pop()}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: scoreColor, fontWeight: 700 }}>
                      {t.overallDepthScore}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#22c55e', fontSize: 11 }}>{t.strongestPosition}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#ef4444', fontSize: 11 }}>{t.weakestPosition}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: t.avgDropoff >= 25 ? '#ef4444' : '#ccc' }}>
                      {t.avgDropoff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 520px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.abbr} — {selected.teamName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  Depth Score: {selected.overallDepthScore}
                </span>
              </div>

              {/* Position-by-Position Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6, marginTop: 10 }}>POSITION DEPTH</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pos</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Starter</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Rtg</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Backup</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Rtg</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WAR</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Drop</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.positions.map(p => {
                    const gd = DEPTH_GRADE_DISPLAY[p.depthGrade];
                    return (
                      <tr key={p.position} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, fontWeight: 700, color: '#f59e0b' }}>{p.position}</td>
                        <td style={{ padding: 4, fontWeight: 600 }}>{p.starter.name}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: p.starter.rating >= 80 ? '#22c55e' : '#ccc' }}>
                          {p.starter.rating}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: p.starter.war >= 4 ? '#22c55e' : '#ccc' }}>
                          {p.starter.war.toFixed(1)}
                        </td>
                        <td style={{ padding: 4, color: '#aaa' }}>{p.backup.name}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: p.backup.rating >= 60 ? '#3b82f6' : '#888' }}>
                          {p.backup.rating}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>
                          {p.backup.war.toFixed(1)}
                        </td>
                        <td style={{
                          padding: 4, textAlign: 'center', fontWeight: 700,
                          color: p.dropoff >= 30 ? '#ef4444' : p.dropoff >= 20 ? '#f59e0b' : '#22c55e',
                        }}>
                          {p.dropoff}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: gd.color, fontWeight: 700, fontSize: 10 }}>
                          {gd.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Depth Summary */}
              <div style={{ display: 'flex', gap: 14, marginTop: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Strongest', value: selected.strongestPosition, color: '#22c55e' },
                  { label: 'Weakest', value: selected.weakestPosition, color: '#ef4444' },
                  { label: 'Avg Dropoff', value: `${selected.avgDropoff} pts`, color: selected.avgDropoff >= 25 ? '#ef4444' : '#f59e0b' },
                  { label: 'Elite Pos', value: selected.positions.filter(p => p.depthGrade === 'elite').length, color: '#22c55e' },
                  { label: 'Thin Pos', value: selected.positions.filter(p => p.depthGrade === 'thin').length, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
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
              Select a team to view depth analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
