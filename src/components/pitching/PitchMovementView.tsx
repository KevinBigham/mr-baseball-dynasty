import { useState } from 'react';
import { generateDemoPitchMovement, type PitcherMovementProfile } from '../../engine/pitching/pitchMovementProfile';

const data = generateDemoPitchMovement();

function delta(val: number, avg: number): { text: string; color: string } {
  const d = +(val - avg).toFixed(1);
  if (d > 0) return { text: `+${d}"`, color: '#22c55e' };
  if (d < 0) return { text: `${d}"`, color: '#ef4444' };
  return { text: '0.0"', color: '#6b7280' };
}

export default function PitchMovementView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pitcher: PitcherMovementProfile = data[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH MOVEMENT PROFILE</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Movement characteristics vs league averages &middot; break, velo, release</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#6b7280' }}>UNIQUENESS</span>
          <span style={{
            padding: '3px 10px', fontSize: 13, fontWeight: 700,
            background: pitcher.uniqueIndex >= 70 ? '#f59e0b22' : '#111827',
            color: pitcher.uniqueIndex >= 70 ? '#f59e0b' : pitcher.uniqueIndex >= 40 ? '#e5e7eb' : '#6b7280',
            border: `1px solid ${pitcher.uniqueIndex >= 70 ? '#f59e0b44' : '#374151'}`,
          }}>
            {pitcher.uniqueIndex}
          </span>
        </div>
      </div>

      {/* Pitcher Selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((p, i) => (
          <button key={p.pitcherId} onClick={() => setSelectedIdx(i)}
            style={{
              padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
              border: '1px solid', cursor: 'pointer',
              borderColor: i === selectedIdx ? '#f59e0b' : '#374151',
              background: i === selectedIdx ? '#78350f' : 'transparent',
              color: i === selectedIdx ? '#f59e0b' : '#9ca3af',
            }}>
            {p.name} ({p.throws})
          </button>
        ))}
      </div>

      {/* Movement Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['PITCH', 'AVG VELO', 'MAX VELO', 'H-BREAK', 'vs LgAvg', 'V-BREAK', 'vs LgAvg', 'ARM ANG', 'EXT', 'REL HT'].map(h => (
              <th key={h} style={{ padding: '6px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCH' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pitcher.pitches.map(p => {
            const hDelta = delta(p.horzBreak, p.leagueAvgHorz);
            const vDelta = delta(p.vertBreak, p.leagueAvgVert);
            return (
              <tr key={p.pitchType} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '6px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.pitchType}</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: p.avgVelo >= 95 ? '#f59e0b' : '#e5e7eb', fontWeight: p.avgVelo >= 95 ? 700 : 400 }}>
                  {p.avgVelo.toFixed(1)}
                </td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.maxVelo.toFixed(1)}</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#e5e7eb' }}>{p.horzBreak.toFixed(1)}"</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: hDelta.color, fontWeight: 600 }}>{hDelta.text}</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#e5e7eb' }}>{p.vertBreak.toFixed(1)}"</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: vDelta.color, fontWeight: 600 }}>{vDelta.text}</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.armAngle.toFixed(1)}&deg;</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.extension.toFixed(1)} ft</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.relHeight.toFixed(1)} ft</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Movement Visual - H vs V Break scatter representation */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Break summary cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {pitcher.pitches.map(p => {
            const hD = delta(p.horzBreak, p.leagueAvgHorz);
            const vD = delta(p.vertBreak, p.leagueAvgVert);
            return (
              <div key={p.pitchType} style={{ border: '1px solid #374151', background: '#111827', padding: 12 }}>
                <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{p.pitchType}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Velo</span>
                  <span style={{ fontSize: 11, color: '#e5e7eb' }}>{p.avgVelo.toFixed(1)} mph</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>H-Break</span>
                  <span style={{ fontSize: 11 }}>
                    <span style={{ color: '#e5e7eb' }}>{p.horzBreak.toFixed(1)}" </span>
                    <span style={{ color: hD.color, fontWeight: 600 }}>({hD.text})</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>V-Break</span>
                  <span style={{ fontSize: 11 }}>
                    <span style={{ color: '#e5e7eb' }}>{p.vertBreak.toFixed(1)}" </span>
                    <span style={{ color: vD.color, fontWeight: 600 }}>({vD.text})</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Arm Angle</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.armAngle.toFixed(1)}&deg;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Uniqueness gauge */}
        <div style={{ width: 180, border: '1px solid #374151', background: '#111827', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>UNIQUENESS INDEX</div>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${pitcher.uniqueIndex >= 70 ? '#f59e0b' : pitcher.uniqueIndex >= 40 ? '#3b82f6' : '#374151'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: pitcher.uniqueIndex >= 70 ? '#f59e0b' : '#e5e7eb' }}>
              {pitcher.uniqueIndex}
            </span>
          </div>
          <div style={{ fontSize: 10, color: pitcher.uniqueIndex >= 70 ? '#f59e0b' : '#6b7280', marginTop: 8, fontWeight: 600 }}>
            {pitcher.uniqueIndex >= 70 ? 'ELITE' : pitcher.uniqueIndex >= 40 ? 'ABOVE AVG' : 'STANDARD'}
          </div>
          <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
            Deviation from league-avg movement profiles
          </div>
        </div>
      </div>
    </div>
  );
}
