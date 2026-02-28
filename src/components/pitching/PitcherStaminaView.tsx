import { useState } from 'react';
import { generateDemoStaminaTracker, getStaminaGradeColor, getVeloChangeColor } from '../../engine/pitching/pitcherStaminaTracker';

const data = generateDemoStaminaTracker();

export default function PitcherStaminaView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pitcher = data.pitchers[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCHER STAMINA TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Performance degradation, velocity trends, and optimal pitch counts</p>
      </div>

      {/* Pitcher selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.pitchers.map((p, i) => (
          <button key={p.pitcherId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'GRADE', value: pitcher.staminaGrade, color: getStaminaGradeColor(pitcher.staminaGrade) },
          { label: 'DURABILITY', value: String(pitcher.durabilityScore), color: pitcher.durabilityScore >= 80 ? '#22c55e' : pitcher.durabilityScore >= 65 ? '#f59e0b' : '#ef4444' },
          { label: 'AVG PITCHES', value: String(pitcher.avgPitchCount), color: '#e5e7eb' },
          { label: 'OPTIMAL PC', value: String(pitcher.optimalPitchCount), color: '#3b82f6' },
          { label: 'DROPOFF INN', value: `${pitcher.dropoffInning}th`, color: '#f59e0b' },
          { label: '3rd TIME +OPS', value: `+${(pitcher.thirdTimePenalty * 1000).toFixed(0)}pts`, color: pitcher.thirdTimePenalty > 0.06 ? '#ef4444' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Velocity curve */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>VELOCITY BY INNING — {pitcher.name}</div>
          {pitcher.inningData.map(inn => (
            <div key={inn.inning} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, fontSize: 10, color: inn.inning >= pitcher.dropoffInning ? '#ef4444' : '#6b7280', fontWeight: 700, textAlign: 'right' }}>
                {inn.inning}
              </div>
              <div style={{ flex: 1, height: 14, background: '#1f2937', borderRadius: 2, position: 'relative' as const }}>
                <div style={{
                  width: `${((inn.velocity - 85) / 15) * 100}%`,
                  height: '100%', borderRadius: 2,
                  background: inn.inning >= pitcher.dropoffInning ? '#ef4444' : inn.pitchCount >= pitcher.optimalPitchCount ? '#f59e0b' : '#22c55e',
                  opacity: 0.7,
                }} />
              </div>
              <div style={{ width: 42, fontSize: 11, fontWeight: 700, color: '#e5e7eb', textAlign: 'right' }}>{inn.velocity.toFixed(1)}</div>
              <div style={{ width: 42, fontSize: 10, color: getVeloChangeColor(inn.veloChange), textAlign: 'right' }}>
                {inn.veloChange > 0 ? '+' : ''}{inn.veloChange.toFixed(1)}
              </div>
              <div style={{ width: 30, fontSize: 9, color: '#6b7280', textAlign: 'right' }}>P{inn.pitchCount}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6, fontSize: 9, color: '#6b7280' }}>
            <span>VELO</span><span>CHG</span><span>PC</span>
          </div>
          <div style={{ marginTop: 10, padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', fontSize: 10 }}>
            <span style={{ color: '#6b7280' }}>Optimal zone: </span>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>Inn 1-{pitcher.dropoffInning - 1}</span>
            <span style={{ color: '#6b7280' }}> | Caution zone: </span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>Inn {pitcher.dropoffInning}+</span>
          </div>
        </div>

        {/* Performance by inning table */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>PERFORMANCE BY INNING</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['INN', 'K', 'BB', 'H', 'ERA', 'WHIP'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitcher.inningData.map(inn => (
                <tr key={inn.inning} style={{ borderBottom: '1px solid #1f2937', background: inn.inning >= pitcher.dropoffInning ? '#1f293722' : 'transparent' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: inn.inning >= pitcher.dropoffInning ? '#ef4444' : '#e5e7eb', fontWeight: 700 }}>{inn.inning}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#22c55e' }}>{inn.strikeouts}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: inn.walks > 15 ? '#ef4444' : '#9ca3af' }}>{inn.walks}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{inn.hits}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: inn.era <= 3.00 ? '#22c55e' : inn.era <= 4.00 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{inn.era.toFixed(2)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: inn.whip <= 1.10 ? '#22c55e' : inn.whip <= 1.30 ? '#f59e0b' : '#ef4444' }}>{inn.whip.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All pitchers comparison */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>STAMINA COMPARISON</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['PITCHER', 'GRADE', 'DURABILITY', 'AVG PC', 'OPTIMAL', 'DROPOFF', '3rd TIME'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCHER' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.pitchers.map((p, i) => (
              <tr key={p.pitcherId} onClick={() => setSelectedIdx(i)}
                style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedIdx ? '#1f2937' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: getStaminaGradeColor(p.staminaGrade), fontWeight: 700, fontSize: 14 }}>{p.staminaGrade}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ width: 40, height: 6, background: '#1f2937', borderRadius: 2 }}>
                      <div style={{ width: `${p.durabilityScore}%`, height: '100%', borderRadius: 2, background: p.durabilityScore >= 80 ? '#22c55e' : p.durabilityScore >= 65 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{p.durabilityScore}</span>
                  </div>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{p.avgPitchCount}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#3b82f6', fontWeight: 700 }}>{p.optimalPitchCount}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: p.dropoffInning >= 7 ? '#22c55e' : '#f59e0b' }}>{p.dropoffInning}th</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: p.thirdTimePenalty > 0.06 ? '#ef4444' : '#f59e0b' }}>+{(p.thirdTimePenalty * 1000).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
