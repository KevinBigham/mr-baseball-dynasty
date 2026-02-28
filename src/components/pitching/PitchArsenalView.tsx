/**
 * PitchArsenalView – Pitch arsenal grading dashboard
 *
 * Bloomberg-terminal style pitch-by-pitch arsenal view
 * with 20-80 grades, movement profiles, and usage analysis.
 */
import { useState, useMemo } from 'react';
import {
  PitcherArsenal,
  gradeColor,
  getPitchGradeLabel,
  generateDemoArsenals,
} from '../../engine/pitching/pitchArsenal';

export default function PitchArsenalView() {
  const arsenals = useMemo(() => generateDemoArsenals(), []);
  const [selected, setSelected] = useState<PitcherArsenal | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH ARSENAL — REPERTOIRE GRADES
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 340px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Arsenal</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pitches</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Best</th>
              </tr>
            </thead>
            <tbody>
              {arsenals.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === a.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{a.team}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{a.overall}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: gradeColor(a.arsenalGrade), fontWeight: 700 }}>{a.arsenalGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{a.pitches.length}</td>
                  <td style={{ padding: 6 }}>{a.bestPitch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 460px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.pos} · OVR {selected.overall}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: gradeColor(selected.arsenalGrade), fontWeight: 700 }}>Arsenal Grade: {selected.arsenalGrade}</span>
                <span style={{ color: '#666', marginLeft: 12 }}>Best: {selected.bestPitch} · Worst: {selected.worstPitch}</span>
              </div>

              {/* Pitch Details */}
              {selected.pitches.map(p => (
                <div key={p.name} className="bloomberg-border" style={{ padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span style={{ color: gradeColor(p.grade), fontWeight: 700, fontSize: 16 }}>{p.grade} <span style={{ fontSize: 10, fontWeight: 400 }}>{getPitchGradeLabel(p.grade)}</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    {[
                      { label: 'Velo', value: `${p.velocity}mph` },
                      { label: 'Max', value: `${p.maxVelo}mph` },
                      { label: 'Usage', value: `${p.usage}%` },
                      { label: 'Whiff%', value: `${p.whiffRate}%`, color: p.whiffRate >= 30 ? '#22c55e' : '#ccc' },
                      { label: 'PutAway%', value: `${p.putAwayRate}%` },
                      { label: 'BAA', value: p.battingAvgAgainst.toFixed(3), color: p.battingAvgAgainst <= .180 ? '#22c55e' : '#ccc' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 12 }}>{s.value}</div>
                        <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#666' }}>
                    <span>H-Break: {p.movement.horizBreak}"</span>
                    <span>V-Break: {p.movement.vertBreak}"</span>
                    <span>Spin: {p.movement.spinRate} RPM</span>
                    <span>Axis: {p.movement.spinAxis}&deg;</span>
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 8 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view arsenal breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
