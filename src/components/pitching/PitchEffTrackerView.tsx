import { generateDemoPitchEffectiveness, getTrendColor } from '../../engine/pitching/pitchEffectivenessTracker';

const data = generateDemoPitchEffectiveness();

export default function PitchEffTrackerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH EFFECTIVENESS TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Pitch-by-pitch effectiveness analysis</p>
      </div>

      {data.pitchers.map(p => (
        <div key={p.pitcherName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.pitcherName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.role}</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: p.overallEfficiency >= 80 ? '#22c55e' : '#f59e0b', border: `1px solid ${p.overallEfficiency >= 80 ? '#22c55e' : '#f59e0b'}44` }}>
              EFF: {p.overallEfficiency}
            </span>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid #f59e0b66' }}>{p.keyInsight}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '70px 50px 55px 45px 55px 55px 55px 55px 50px 50px 65px', gap: 3, marginBottom: 6 }}>
            {['PITCH', 'VELO', 'SPIN', 'USE%', 'WHIFF%', 'PUT%', 'BAA', 'SLG', 'GB%', 'xwOBA', 'TREND'].map(h => (
              <div key={h} style={{ fontSize: 8, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {p.pitches.map(pt => (
            <div key={pt.pitchType} style={{ display: 'grid', gridTemplateColumns: '70px 50px 55px 45px 55px 55px 55px 55px 50px 50px 65px', gap: 3, padding: '3px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{pt.pitchType}</div>
              <div style={{ fontSize: 10, color: '#e5e7eb' }}>{pt.velocity.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{pt.spinRate}</div>
              <div style={{ fontSize: 10, color: '#3b82f6' }}>{pt.usage}%</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: pt.whiffRate >= 30 ? '#22c55e' : pt.whiffRate >= 20 ? '#f59e0b' : '#9ca3af' }}>{pt.whiffRate}%</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{pt.putAwayRate}%</div>
              <div style={{ fontSize: 10, color: pt.battingAvgAgainst < 0.200 ? '#22c55e' : '#9ca3af' }}>{pt.battingAvgAgainst.toFixed(3)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{pt.sluggingAgainst.toFixed(3)}</div>
              <div style={{ fontSize: 10, color: pt.groundBallRate >= 50 ? '#22c55e' : '#9ca3af' }}>{pt.groundBallRate}%</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{pt.xwOBA.toFixed(3)}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: getTrendColor(pt.trendVsLastMonth) }}>
                {pt.trendVsLastMonth === 'improving' ? '\u25B2' : pt.trendVsLastMonth === 'declining' ? '\u25BC' : '\u25C6'}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8, fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>SITUATIONAL EFFECTIVENESS</div>
          {p.situationalData.map(sd => (
            <div key={sd.situation} style={{ display: 'grid', gridTemplateColumns: '100px 80px 80px 60px 60px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{sd.situation}</div>
              <div style={{ fontSize: 10, color: '#22c55e' }}>Best: {sd.bestPitch}</div>
              <div style={{ fontSize: 10, color: '#ef4444' }}>Worst: {sd.worstPitch}</div>
              <div style={{ fontSize: 9, color: '#22c55e' }}>{sd.bestWhiffRate}% WH</div>
              <div style={{ fontSize: 9, color: '#ef4444' }}>{sd.worstBAA.toFixed(3)} BAA</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
