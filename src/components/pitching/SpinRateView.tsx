import { useState } from 'react';
import { generateDemoSpinRate, type PitcherSpinProfile } from '../../engine/pitching/pitchSpinRate';

const data = generateDemoSpinRate();

export default function SpinRateView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pitcher = data[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH SPIN RATE ANALYSIS</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Spin metrics, efficiency, and movement profile per pitch type</p>
        </div>
        {pitcher.eliteSpinner && (
          <span style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>ELITE SPINNER</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((p, i) => (
          <button key={p.pitcherId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name} ({p.throws})
          </button>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['PITCH', 'AVG RPM', 'MAX', 'AXIS', 'DIRECTION', 'EFF%', 'ACTIVE%', 'V-BRK', 'H-BRK', 'WHIFF/SW', 'USAGE'].map(h => (
              <th key={h} style={{ padding: '6px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCH' ? 'left' : 'center' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pitcher.pitches.map(p => (
            <tr key={p.pitchType} style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '6px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.pitchType}</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: p.avgRPM > 2400 ? '#f59e0b' : '#e5e7eb', fontWeight: p.avgRPM > 2400 ? 700 : 400 }}>{p.avgRPM}</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.maxRPM}</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.spinAxis}°</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.spinDirection.replace('_', ' ').toUpperCase()}</td>
              <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                <span style={{ color: p.spinEfficiency > 80 ? '#22c55e' : p.spinEfficiency < 60 ? '#ef4444' : '#e5e7eb' }}>{p.spinEfficiency}%</span>
              </td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.activeSpinPct}%</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: p.inducedVertBreak > 14 ? '#22c55e' : '#e5e7eb' }}>{p.inducedVertBreak}"</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: Math.abs(p.horizontalBreak) > 8 ? '#a855f7' : '#e5e7eb' }}>{p.horizontalBreak}"</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: p.whiffPerSwing > 30 ? '#22c55e' : '#e5e7eb' }}>{p.whiffPerSwing}%</td>
              <td style={{ padding: '6px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.usage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MONTHLY SPIN TREND</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {pitcher.trends.map(t => (
            <div key={t.month} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{t.month}</div>
              <div style={{ height: 60, background: '#1f2937', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ width: '60%', background: '#f59e0b', height: `${((t.avgRPM - 2000) / 600) * 100}%`, minHeight: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: '#e5e7eb', marginTop: 4 }}>{t.avgRPM}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{t.whiffRate}% W</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
