/**
 * DefensiveWARView – Defensive WAR Components Dashboard
 *
 * Bloomberg-terminal style defensive WAR breakdown with summary cards,
 * player list table with dWAR + grade, and detail panel with
 * component breakdown bar visualization.
 */
import { useState, useMemo } from 'react';
import {
  DefensiveWARProfile,
  DefenseGrade,
  DEF_GRADE_DISPLAY,
  getDefensiveWARSummary,
  generateDemoDefensiveWAR,
} from '../../engine/analytics/defensiveWARComponents';

export default function DefensiveWARView() {
  const profiles = useMemo(() => generateDemoDefensiveWAR(), []);
  const summary = useMemo(() => getDefensiveWARSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<DefensiveWARProfile | null>(null);

  const gradeColor = (grade: DefenseGrade): string => DEF_GRADE_DISPLAY[grade].color;
  const gradeLabel = (grade: DefenseGrade): string => DEF_GRADE_DISPLAY[grade].label;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* Header */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DEFENSIVE WAR BREAKDOWN
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players', value: summary.totalPlayers },
          { label: 'Best Defender', value: summary.bestDefender.dwar, sub: summary.bestDefender.name },
          { label: 'Top Component', value: summary.bestByComponent.component, sub: summary.bestByComponent.name },
          { label: 'Avg dWAR', value: summary.avgDWAR },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
            {'sub' in s && s.sub && <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Player List */}
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>dWAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pct</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
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
                  <td style={{ padding: 6, textAlign: 'center', color: '#888', fontSize: 10 }}>{p.position}</td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 700,
                    color: p.totalDWAR >= 1.5 ? '#22c55e' : p.totalDWAR >= 0 ? '#f59e0b' : '#ef4444',
                  }}>
                    {p.totalDWAR >= 0 ? '+' : ''}{p.totalDWAR.toFixed(1)}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>
                    {p.percentile}th
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: gradeColor(p.overallGrade), fontWeight: 600, fontSize: 10,
                  }}>
                    {gradeLabel(p.overallGrade)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              {/* Player Header */}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.position}
                </span>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total dWAR', value: `${selected.totalDWAR >= 0 ? '+' : ''}${selected.totalDWAR.toFixed(1)}`, color: selected.totalDWAR >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Percentile', value: `${selected.percentile}th`, color: '#ccc' },
                  { label: 'Grade', value: gradeLabel(selected.overallGrade), color: gradeColor(selected.overallGrade) },
                  { label: 'Components', value: selected.components.length, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Component Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>COMPONENT BREAKDOWN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {selected.components.map(comp => {
                  const barPct = Math.max(0, Math.min(100, comp.percentile));
                  return (
                    <div key={comp.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{comp.name}</span>
                        <span style={{ fontSize: 10, display: 'flex', gap: 8 }}>
                          <span style={{ color: comp.value >= 0 ? '#22c55e' : '#ef4444' }}>
                            {comp.value >= 0 ? '+' : ''}{comp.value.toFixed(1)} runs
                          </span>
                          <span style={{ color: gradeColor(comp.grade), fontWeight: 600 }}>
                            {gradeLabel(comp.grade)}
                          </span>
                        </span>
                      </div>
                      {/* Percentile Bar */}
                      <div style={{ position: 'relative', height: 10, background: '#1a1a2e', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${barPct}%`,
                          background: gradeColor(comp.grade),
                          borderRadius: 5,
                          transition: 'width 0.3s ease',
                          opacity: 0.85,
                        }} />
                        {/* 50th percentile marker */}
                        <div style={{
                          position: 'absolute', top: 0, left: '50%',
                          width: 1, height: '100%', background: '#555',
                        }} />
                      </div>
                      <div style={{ textAlign: 'right', color: '#666', fontSize: 9, marginTop: 1 }}>
                        {comp.percentile}th percentile
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUTING NOTES</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view defensive WAR components
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
