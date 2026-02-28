import { generateDemoPitchArsenalComp, getGradeColor } from '../../engine/pitching/pitchArsenalComparison';

const data = generateDemoPitchArsenalComp();

export default function PitchArsenalCompView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PITCH ARSENAL COMPARISON</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Staff arsenal breakdown and grading</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PITCHERS PROFILED', value: data.pitchers.length, color: '#f59e0b' },
          { label: 'AVG PITCH TYPES', value: data.teamAvgPitchTypes.toFixed(1), color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.pitchers.map(p => (
        <div key={p.pitcherName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.pitcherName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.role} | {p.throws}HP</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: getGradeColor(p.arsenalGrade) }}>Arsenal: {p.arsenalGrade}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 70px 70px 80px 80px 50px', gap: 4, marginBottom: 6 }}>
            {['PITCH', 'VELO', 'SPIN', 'USAGE', 'WHIFF%', 'PUT AWAY', 'GRADE'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {p.pitches.map(pitch => (
            <div key={pitch.pitchType} style={{ display: 'grid', gridTemplateColumns: '70px 70px 70px 70px 80px 80px 50px', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{pitch.pitchType}</div>
              <div style={{ fontSize: 11, color: '#e5e7eb' }}>{pitch.velocity.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{pitch.spinRate}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{pitch.usage}%</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: pitch.whiffRate >= 30 ? '#22c55e' : pitch.whiffRate >= 20 ? '#3b82f6' : '#9ca3af' }}>{pitch.whiffRate}%</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{pitch.putawayRate}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: getGradeColor(pitch.grade) }}>{pitch.grade}</div>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 10, color: '#6b7280' }}>
            Best: <span style={{ color: '#22c55e' }}>{p.bestPitch}</span> | Worst: <span style={{ color: '#ef4444' }}>{p.worstPitch}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
