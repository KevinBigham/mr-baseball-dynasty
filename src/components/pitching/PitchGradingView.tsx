/**
 * PitchGradingView – Pitch Grading Dashboard
 *
 * Bloomberg-terminal style pitch grading view with summary cards,
 * pitcher list table, detail panel with grade distribution,
 * and individual pitch list with color-coded grades.
 */
import { useState, useMemo } from 'react';
import {
  PitcherGradingProfile,
  PitchGradeLevel,
  PITCH_GRADE_DISPLAY,
  pitchGradeFromScore,
  getPitchGradingSummary,
  generateDemoPitchGrading,
} from '../../engine/pitching/pitchGrading';

export default function PitchGradingView() {
  const profiles = useMemo(() => generateDemoPitchGrading(), []);
  const summary = useMemo(() => getPitchGradingSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<PitcherGradingProfile | null>(null);

  const gradeColor = (level: PitchGradeLevel): string => PITCH_GRADE_DISPLAY[level].color;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* Header */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH GRADING SYSTEM
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Highest Avg', value: `${summary.highestAvg.grade}`, sub: summary.highestAvg.name },
          { label: 'Most A+', value: summary.mostAPlus.count, sub: summary.mostAPlus.name },
          { label: 'Avg Grade', value: summary.avgGradeAll },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
            {'sub' in s && s.sub && <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Pitcher List */}
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg</th>
                <th style={{ textAlign: 'center', padding: 6 }}>A+</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Best</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Worst</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const avgLevel = pitchGradeFromScore(p.avgGrade);
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
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name}
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{p.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888', fontSize: 10 }}>{p.role}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gradeColor(avgLevel), fontWeight: 700 }}>
                      {p.avgGrade}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
                      {p.gradeDistribution['A+']}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#22c55e', fontSize: 10 }}>
                      {p.bestPitchType}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#ef4444', fontSize: 10 }}>
                      {p.worstPitchType}
                    </td>
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
              {/* Pitcher Header */}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.role}
                </span>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Avg Grade', value: selected.avgGrade, color: gradeColor(pitchGradeFromScore(selected.avgGrade)) },
                  { label: 'Pitches', value: selected.pitches.length, color: '#ccc' },
                  { label: 'Best', value: selected.bestPitchType, color: '#22c55e' },
                  { label: 'Worst', value: selected.worstPitchType, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Grade Distribution */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>GRADE DISTRIBUTION</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {(Object.keys(PITCH_GRADE_DISPLAY) as PitchGradeLevel[]).map(level => {
                  const count = selected.gradeDistribution[level];
                  const display = PITCH_GRADE_DISPLAY[level];
                  const pct = selected.pitches.length > 0
                    ? Math.round((count / selected.pitches.length) * 100)
                    : 0;
                  return (
                    <div key={level} style={{
                      padding: '4px 8px',
                      background: '#111',
                      border: `1px solid ${count > 0 ? display.color + '66' : '#222'}`,
                      borderRadius: 3,
                      textAlign: 'center',
                      minWidth: 48,
                    }}>
                      <div style={{ color: display.color, fontWeight: 700, fontSize: 14 }}>{count}</div>
                      <div style={{ color: '#888', fontSize: 9 }}>{level}</div>
                      <div style={{ color: '#555', fontSize: 9 }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Grade Distribution Bar */}
              <div style={{ height: 8, display: 'flex', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                {(Object.keys(PITCH_GRADE_DISPLAY) as PitchGradeLevel[]).map(level => {
                  const count = selected.gradeDistribution[level];
                  const pct = selected.pitches.length > 0 ? (count / selected.pitches.length) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={level}
                      style={{
                        width: `${pct}%`,
                        background: PITCH_GRADE_DISPLAY[level].color,
                        minWidth: pct > 0 ? 3 : 0,
                      }}
                    />
                  );
                })}
              </div>

              {/* Individual Pitch List */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH LOG</div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#666', position: 'sticky', top: 0, background: '#0a0a0a' }}>
                      <th style={{ textAlign: 'center', padding: 4 }}>#</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Type</th>
                      <th style={{ textAlign: 'center', padding: 4 }}>Velo</th>
                      <th style={{ textAlign: 'center', padding: 4 }}>Grade</th>
                      <th style={{ textAlign: 'center', padding: 4 }}>Lvl</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.pitches.map(p => {
                      const display = PITCH_GRADE_DISPLAY[p.gradeLevel];
                      const outcomeLabel = p.outcome.replace(/_/g, ' ');
                      const outcomeColor = p.outcome === 'in_play_hit' ? '#ef4444'
                        : p.outcome === 'strike_swinging' || p.outcome === 'strike_looking' ? '#22c55e'
                        : p.outcome === 'in_play_out' ? '#3b82f6'
                        : p.outcome === 'ball' ? '#ef4444'
                        : '#888';
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                          <td style={{ padding: 4, textAlign: 'center', color: '#555' }}>{p.sequenceNum}</td>
                          <td style={{ padding: 4, fontWeight: 600 }}>{p.pitchType}</td>
                          <td style={{ padding: 4, textAlign: 'center', color: p.velocity >= 96 ? '#f59e0b' : '#ccc' }}>
                            {p.velocity}
                          </td>
                          <td style={{ padding: 4, textAlign: 'center', color: display.color, fontWeight: 700 }}>
                            {p.grade}
                          </td>
                          <td style={{
                            padding: 4, textAlign: 'center', fontWeight: 600, fontSize: 10,
                            color: display.color,
                          }}>
                            {p.gradeLevel}
                          </td>
                          <td style={{ padding: 4, color: outcomeColor, fontSize: 10, textTransform: 'capitalize' }}>
                            {outcomeLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginTop: 12, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view pitch grades
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
