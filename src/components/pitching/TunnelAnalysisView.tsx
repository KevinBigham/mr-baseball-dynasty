import { useState } from 'react';
import { generateDemoPitchTunnel, type TunnelPair } from '../../engine/pitching/pitchTunnelAnalysis';

const data = generateDemoPitchTunnel();

const gradeColor: Record<TunnelPair['deceptionGrade'], string> = {
  elite: '#f59e0b', plus: '#22c55e', average: '#3b82f6', below_avg: '#9ca3af', poor: '#ef4444',
};

export default function TunnelAnalysisView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pitcher = data[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH TUNNEL ANALYSIS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Tunnel distance, plate separation, and deception grades per pitch pair</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((p, i) => (
          <button key={p.pitcherId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name} ({p.throws})
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'OVERALL SCORE', value: pitcher.overallTunnelScore, color: pitcher.overallTunnelScore > 65 ? '#22c55e' : pitcher.overallTunnelScore > 45 ? '#f59e0b' : '#ef4444' },
          { label: 'AVG TUNNEL DIST', value: `${pitcher.avgTunnelDist}"`, color: '#e5e7eb' },
          { label: 'BEST PAIR', value: pitcher.bestPair, color: '#22c55e' },
          { label: 'WORST PAIR', value: pitcher.worstPair, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['PITCH PAIR', 'TUNNEL DIST', 'PLATE SEP', 'SCORE', 'GRADE', 'WHIFF%', 'USAGE%'].map(h => (
              <th key={h} style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCH PAIR' ? 'left' : 'center' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...pitcher.pairs].sort((a, b) => b.tunnelScore - a.tunnelScore).map((pair, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '6px 8px', color: '#e5e7eb', fontWeight: 600 }}>{pair.pitch1} / {pair.pitch2}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: pair.tunnelDistance < 4 ? '#22c55e' : pair.tunnelDistance > 7 ? '#ef4444' : '#e5e7eb' }}>
                {pair.tunnelDistance}"
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: pair.plateSeparation > 15 ? '#22c55e' : '#e5e7eb' }}>
                {pair.plateSeparation}"
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ width: 50, height: 6, background: '#1f2937' }}>
                    <div style={{ width: `${pair.tunnelScore}%`, height: '100%', background: gradeColor[pair.deceptionGrade] }} />
                  </div>
                  <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{pair.tunnelScore}</span>
                </div>
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 700, background: gradeColor[pair.deceptionGrade] + '22', color: gradeColor[pair.deceptionGrade], border: `1px solid ${gradeColor[pair.deceptionGrade]}44` }}>
                  {pair.deceptionGrade.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: pair.whiffRateOnSequence > 30 ? '#22c55e' : '#e5e7eb' }}>{pair.whiffRateOnSequence}%</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af' }}>{pair.usage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
