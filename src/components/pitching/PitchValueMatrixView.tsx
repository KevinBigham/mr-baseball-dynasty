/**
 * PitchValueMatrixView – Pitch value run-value dashboard
 *
 * Bloomberg-terminal style pitch value matrix with per-pitch
 * run values, whiff rates, usage breakdowns, and effectiveness grades.
 */
import { useState, useMemo } from 'react';
import {
  PitcherPitchValues,
  PITCH_GRADE_DISPLAY,
  pitchGradeColor,
  getPitchValueSummary,
  generateDemoPitchValues,
} from '../../engine/pitching/pitchValueMatrix';

export default function PitchValueMatrixView() {
  const pitchers = useMemo(() => generateDemoPitchValues(), []);
  const summary = useMemo(() => getPitchValueSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherPitchValues | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH VALUE MATRIX — RUN VALUE ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Elite Pitches', value: summary.elitePitchCount, color: '#22c55e' },
          { label: 'Best Overall', value: summary.bestOverall },
          { label: 'Avg Team RV/100', value: summary.avgTeamRV100 },
          { label: 'Most Used', value: summary.mostUsedPitch },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>T</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RV/100</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Best</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.role}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.throws}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.totalRV100 <= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {p.totalRV100 > 0 ? '+' : ''}{p.totalRV100}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', fontSize: 10 }}>{p.bestPitch}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: pitchGradeColor(p.overallGrade), fontWeight: 700 }}>
                    {PITCH_GRADE_DISPLAY[p.overallGrade].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · {selected.throws}HP</span>
              </div>
              <div style={{ color: pitchGradeColor(selected.overallGrade), fontWeight: 700, marginBottom: 12 }}>
                Overall: {PITCH_GRADE_DISPLAY[selected.overallGrade].label} ({selected.totalRV100 > 0 ? '+' : ''}{selected.totalRV100} RV/100)
              </div>

              {/* Pitch Breakdown Table */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH ARSENAL</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Use%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Velo</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>CSW%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>RV/100</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitches.map(pt => (
                    <tr key={pt.pitchType} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pt.pitchType} <span style={{ color: '#666', fontSize: 9 }}>{pt.pitchName}</span></td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.usage}%</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.velocity}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.whiffPct >= 30 ? '#22c55e' : '#ccc' }}>{pt.whiffPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.cswPct >= 32 ? '#22c55e' : '#ccc' }}>{pt.cswPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.runValue <= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {pt.runValue > 0 ? '+' : ''}{pt.runValue}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: pitchGradeColor(pt.grade), fontWeight: 600 }}>
                        {PITCH_GRADE_DISPLAY[pt.grade].label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Additional metrics */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ADDITIONAL METRICS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {selected.pitches.map(pt => (
                  <div key={pt.pitchType} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>{pt.pitchType}</div>
                    <div style={{ color: '#888', fontSize: 9 }}>{pt.spinRate} RPM</div>
                    <div style={{ color: '#888', fontSize: 9 }}>xBA {pt.xBA.toFixed(3)}</div>
                    <div style={{ color: '#888', fontSize: 9 }}>EV {pt.avgEV}</div>
                  </div>
                ))}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view pitch values
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
