import { useState } from 'react';
import { generateDemoArsenalComparison, type ArsenalPlayer } from '../../engine/pitching/arsenalComparison';

const data = generateDemoArsenalComparison();

export default function ArsenalCompView() {
  const [selected, setSelected] = useState<number[]>([0, 1]);

  const togglePitcher = (idx: number) => {
    if (selected.includes(idx)) {
      if (selected.length > 1) setSelected(selected.filter(i => i !== idx));
    } else {
      setSelected([...selected, idx].slice(-3));
    }
  };

  const pitchers = selected.map(i => data[i]);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>ARSENAL COMPARISON</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Compare pitch arsenals side-by-side (select 2-3 pitchers)</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((p, i) => (
          <button key={p.pitcherId} onClick={() => togglePitcher(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: selected.includes(i) ? '#f59e0b' : '#374151', background: selected.includes(i) ? '#78350f' : 'transparent', color: selected.includes(i) ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name} ({p.throws}HP)
          </button>
        ))}
      </div>

      {/* Pitcher cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pitchers.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
        {pitchers.map(p => (
          <div key={p.pitcherId} style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{p.throws}HP | {p.role}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <div><div style={{ fontSize: 9, color: '#6b7280' }}>SCORE</div><div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{p.arsenalScore}</div></div>
              <div><div style={{ fontSize: 9, color: '#6b7280' }}>AVG VELO</div><div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>{p.avgVelo}</div></div>
              <div><div style={{ fontSize: 9, color: '#6b7280' }}>BEST</div><div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>{p.bestPitch}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Arsenal tables side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pitchers.length}, 1fr)`, gap: 12 }}>
        {pitchers.map(p => (
          <div key={p.pitcherId} style={{ border: '1px solid #374151', background: '#111827' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #374151', color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>{p.name}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  {['PITCH', 'VELO', 'USE%', 'WHIFF', 'xwOBA', 'SPIN'].map(h => (
                    <th key={h} style={{ padding: '4px 4px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCH' ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...p.arsenal].sort((a, b) => b.usage - a.usage).map(pitch => (
                  <tr key={pitch.pitchType} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '4px 4px', color: '#e5e7eb', fontWeight: 600 }}>{pitch.pitchType}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', color: pitch.velo > 95 ? '#ef4444' : '#e5e7eb' }}>{pitch.velo}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', color: '#9ca3af' }}>{pitch.usage}%</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', color: pitch.whiffRate > 30 ? '#22c55e' : '#e5e7eb' }}>{pitch.whiffRate}%</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', color: +pitch.xwOBA < 0.300 ? '#22c55e' : +pitch.xwOBA > 0.350 ? '#ef4444' : '#e5e7eb' }}>{pitch.xwOBA}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', color: pitch.spin > 2400 ? '#f59e0b' : '#9ca3af' }}>{pitch.spin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
