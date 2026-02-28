import { generateDemoSituationalHitting, getClutchColor } from '../../engine/analytics/situationalHittingSplits';

const data = generateDemoSituationalHitting();

export default function SitHittingSplitsView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SITUATIONAL HITTING SPLITS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Performance by game situation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM RISP AVG', value: data.teamRISPAvg.toFixed(3), color: data.teamRISPAvg >= .270 ? '#22c55e' : '#f59e0b' },
          { label: 'TEAM CLUTCH RATING', value: data.teamClutchRating, color: getClutchColor(data.teamClutchRating) },
          { label: 'PLAYERS TRACKED', value: data.players.length, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.players.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: getClutchColor(p.overallClutch) }}>Clutch: {p.overallClutch}</span>
          </div>

          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>
            Best: <span style={{ color: '#22c55e' }}>{p.bestSituation}</span> | Worst: <span style={{ color: '#ef4444' }}>{p.worstSituation}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '110px 50px 65px 65px 65px 65px 50px 60px', gap: 4, marginBottom: 4 }}>
            {['SITUATION', 'PA', 'AVG', 'OBP', 'SLG', 'OPS', 'RBI', 'CLUTCH'].map(h => (
              <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {p.splits.map(s => (
            <div key={s.situation} style={{ display: 'grid', gridTemplateColumns: '110px 50px 65px 65px 65px 65px 50px 60px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: '#f59e0b' }}>{s.situation}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{s.pa}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.avg >= .300 ? '#22c55e' : '#e5e7eb' }}>{s.avg.toFixed(3)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.obp.toFixed(3)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.slg.toFixed(3)}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.ops >= .900 ? '#22c55e' : s.ops >= .750 ? '#3b82f6' : '#9ca3af' }}>{s.ops.toFixed(3)}</div>
              <div style={{ fontSize: 10, color: '#3b82f6' }}>{s.rbi}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: getClutchColor(s.clutchRating) }}>{s.clutchRating}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
