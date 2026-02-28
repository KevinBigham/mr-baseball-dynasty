import { generateDemoPinchHitEngine } from '../../engine/analytics/pinchHitDecisionEngine';

const data = generateDemoPinchHitEngine();

export default function PinchHitDecisionView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PINCH HIT DECISION ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Optimal pinch-hit matchup recommendations based on game state</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'SEASON PH AVG', value: data.seasonPHAvg.toFixed(3), color: data.seasonPHAvg >= .250 ? '#22c55e' : '#f59e0b' },
          { label: 'TEAM PH RANK', value: `#${data.teamPHRank}`, color: '#3b82f6' },
          { label: 'SCENARIOS', value: data.decisions.length, color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {data.decisions.map((d, di) => (
        <div key={di} style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
          {/* Situation header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>SITUATION {di + 1}</div>
              <div style={{ fontSize: 12, color: '#e5e7eb', marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>{d.currentBatter}</span>
                <span style={{ color: '#6b7280' }}> ({d.currentBatterHand}HB) vs </span>
                <span style={{ fontWeight: 700 }}>{d.currentPitcher}</span>
                <span style={{ color: '#6b7280' }}> ({d.currentPitcherHand}HP)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'INN', value: d.inning },
                { label: 'OUTS', value: d.outs },
                { label: 'LEV', value: d.leverage.toFixed(1) },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '4px 8px', background: '#1f2937', marginBottom: 12, fontSize: 10, color: '#9ca3af' }}>
            Runners: {d.runnersOn} | Expected Run Gain: <span style={{ color: '#22c55e', fontWeight: 700 }}>+{d.expectedRunGain.toFixed(2)}</span>
          </div>

          {/* Candidates */}
          <div style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700, marginBottom: 8 }}>PH CANDIDATES</div>
          {d.candidates.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4, background: '#0a0f1a', border: `1px solid ${c.name === d.bestOption ? '#22c55e' : '#1f2937'}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{c.name}</span>
                  <span style={{ fontSize: 9, color: '#6b7280' }}>({c.hand})</span>
                  {c.name === d.bestOption && <span style={{ padding: '1px 5px', fontSize: 8, fontWeight: 700, background: '#22c55e22', color: '#22c55e' }}>BEST</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'vs L', value: c.avgVsL.toFixed(3), color: '#3b82f6' },
                  { label: 'vs R', value: c.avgVsR.toFixed(3), color: '#ef4444' },
                  { label: 'CLUTCH', value: c.clutchRating, color: c.clutchRating >= 60 ? '#22c55e' : '#f59e0b' },
                  { label: 'PLATOON+', value: `+${c.platoonAdv.toFixed(3)}`, color: '#22c55e' },
                  { label: 'SCORE', value: c.recommendation, color: c.recommendation >= 80 ? '#22c55e' : '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', width: 50 }}>
                    <div style={{ fontSize: 7, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
