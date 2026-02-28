import { useState } from 'react';
import { generateDemoTunnelHeatmap, getTunnelGradeColor } from '../../engine/pitching/pitchTunnelHeatmap';

const data = generateDemoTunnelHeatmap();

export default function PitchTunnelHeatmapView() {
  const [sel, setSel] = useState(0);
  const p = data.pitchers[sel];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH TUNNEL HEATMAP</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Visualize pitch release and tunnel consistency per pitcher</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'LG AVG CONSISTENCY', value: data.leagueAvgConsistency, color: '#6b7280' },
          { label: 'BEST TUNNEL PAIR', value: `${p.bestTunnelPair.pitch1}/${p.bestTunnelPair.pitch2}`, color: '#22c55e' },
          { label: 'TUNNEL SCORE', value: p.bestTunnelPair.tunnelScore, color: getTunnelGradeColor(p.overallTunnelGrade) },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pitcher selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {data.pitchers.map((pitcher, i) => (
          <button key={pitcher.name} onClick={() => setSel(i)} style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: i === sel ? '#f59e0b22' : '#111827', border: `1px solid ${i === sel ? '#f59e0b' : '#374151'}`, color: i === sel ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {pitcher.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tunnel zones visualization */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>TUNNEL ZONES — {p.name.toUpperCase()}</div>
          <div style={{ position: 'relative' as const, width: '100%', paddingBottom: '100%', background: '#0a0f1a', border: '1px solid #1f2937' }}>
            {p.tunnelZones.map((z, i) => (
              <div key={i} style={{ position: 'absolute', left: `${(z.x + 1) * 50}%`, top: `${(1 - z.y) * 50}%`, transform: 'translate(-50%, -50%)' }}>
                <div style={{ width: Math.max(20, z.frequency * 1.2), height: Math.max(20, z.frequency * 1.2), borderRadius: '50%', background: z.pitchType === 'FF' ? '#ef444466' : z.pitchType === 'SL' ? '#3b82f666' : z.pitchType === 'CH' ? '#22c55e66' : '#f59e0b66', border: `2px solid ${z.pitchType === 'FF' ? '#ef4444' : z.pitchType === 'SL' ? '#3b82f6' : z.pitchType === 'CH' ? '#22c55e' : '#f59e0b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{z.pitchType}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 9, color: '#6b7280' }}>
            <span style={{ color: '#ef4444' }}>● FF</span>
            <span style={{ color: '#3b82f6' }}>● SL</span>
            <span style={{ color: '#22c55e' }}>● CH</span>
            <span style={{ color: '#f59e0b' }}>● CB/SI</span>
          </div>
        </div>

        {/* Pitch details */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PITCH BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            <div style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>TUNNEL GRADE</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: getTunnelGradeColor(p.overallTunnelGrade) }}>{p.overallTunnelGrade}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>RELEASE CONSISTENCY</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: p.releaseConsistency >= 85 ? '#22c55e' : '#f59e0b' }}>{p.releaseConsistency}</div>
            </div>
          </div>

          {p.tunnelZones.map(z => (
            <div key={z.pitchType} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: z.pitchType === 'FF' ? '#ef4444' : z.pitchType === 'SL' ? '#3b82f6' : z.pitchType === 'CH' ? '#22c55e' : '#f59e0b' }}>{z.pitchType}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#e5e7eb' }}>{z.velocity} mph | {z.frequency}% usage</div>
              </div>
              <div style={{ width: 60, fontSize: 10, color: z.whiffPct >= 30 ? '#22c55e' : '#f59e0b', textAlign: 'right' }}>{z.whiffPct}% whiff</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
