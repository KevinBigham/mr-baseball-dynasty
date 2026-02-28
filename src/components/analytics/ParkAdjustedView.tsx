import { generateDemoParkAdjusted, getDeltaColor } from '../../engine/analytics/parkAdjustedStats';

const data = generateDemoParkAdjusted();

export default function ParkAdjustedView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PARK-ADJUSTED STATS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Normalized stats with park factor adjustments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>MOST HELPED</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginTop: 4 }}>{data.mostHelped}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>MOST HURT</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{data.mostHurt}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PARK FACTORS (100 = NEUTRAL)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 50px 50px 50px 50px 50px 50px', gap: 4, marginBottom: 6 }}>
          {['PARK', 'ALL', 'HR', '2B', 'R', 'K', 'BB'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.parkFactors.map(pf => (
          <div key={pf.parkName} style={{ display: 'grid', gridTemplateColumns: '110px 50px 50px 50px 50px 50px 50px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{pf.teamName}</div>
            {[pf.overallFactor, pf.hrFactor, pf.twoBaseFactor, pf.runFactor, pf.kFactor, pf.bbFactor].map((v, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: v > 100 ? '#22c55e' : v < 100 ? '#ef4444' : '#9ca3af' }}>{v}</div>
            ))}
          </div>
        ))}
      </div>

      {data.players.map(p => (
        <div key={p.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | {p.homePark}</span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>{p.overallImpact}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '60px 70px 70px 70px', gap: 4, marginBottom: 4 }}>
            {['STAT', 'RAW', 'ADJUSTED', 'DELTA'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {p.rawStats.map(s => (
            <div key={s.stat} style={{ display: 'grid', gridTemplateColumns: '60px 70px 70px 70px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{s.stat}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{typeof s.raw === 'number' && s.raw < 1 ? s.raw.toFixed(3) : s.raw}</div>
              <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{typeof s.adjusted === 'number' && s.adjusted < 1 ? s.adjusted.toFixed(3) : s.adjusted}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: getDeltaColor(s.delta) }}>
                {s.delta > 0 ? '+' : ''}{typeof s.delta === 'number' && Math.abs(s.delta) < 1 ? s.delta.toFixed(3) : s.delta}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
