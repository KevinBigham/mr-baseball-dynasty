import { generateDemoAdvDefMetrics, getDefGradeColor } from '../../engine/analytics/advancedDefensiveMetrics';

const data = generateDemoAdvDefMetrics();

export default function AdvDefMetricsView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>ADVANCED DEFENSIVE METRICS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Comprehensive defensive analytics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM DRS', value: data.teamDRS > 0 ? `+${data.teamDRS}` : data.teamDRS, color: data.teamDRS > 0 ? '#22c55e' : '#ef4444' },
          { label: 'TEAM OAA', value: data.teamOAA > 0 ? `+${data.teamOAA}` : data.teamOAA, color: data.teamOAA > 0 ? '#22c55e' : '#ef4444' },
          { label: 'DEF RANK', value: `#${data.teamDefRank}`, color: data.teamDefRank <= 10 ? '#22c55e' : data.teamDefRank <= 20 ? '#f59e0b' : '#ef4444' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PLAYER DEFENSIVE GRADES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 50px 55px 55px 55px 55px 50px', gap: 4, marginBottom: 6 }}>
          {['PLAYER', 'POS', 'DRS', 'OAA', 'UZR', 'dWAR', 'RANGE', 'ARM', 'FLD%', 'GRADE'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.players.map(p => (
          <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 50px 55px 55px 55px 55px 50px', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: '#f59e0b' }}>{p.position}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: p.drs > 0 ? '#22c55e' : p.drs < 0 ? '#ef4444' : '#9ca3af' }}>{p.drs > 0 ? '+' : ''}{p.drs}</div>
            <div style={{ fontSize: 10, color: p.oaa > 0 ? '#22c55e' : p.oaa < 0 ? '#ef4444' : '#9ca3af' }}>{p.oaa > 0 ? '+' : ''}{p.oaa}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.uzr.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{p.dwar.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: p.rangeRating >= 70 ? '#22c55e' : '#9ca3af' }}>{p.rangeRating}</div>
            <div style={{ fontSize: 10, color: p.armRating >= 70 ? '#22c55e' : '#9ca3af' }}>{p.armRating}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.fieldingPct.toFixed(3)}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: getDefGradeColor(p.overallDefGrade) }}>{p.overallDefGrade}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>DEFENSE BY POSITION (MLB RANK)</div>
        {data.byPosition.map(bp => (
          <div key={bp.position} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ width: 40, fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{bp.position}</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 6, background: '#1f2937' }}>
                <div style={{ height: '100%', width: `${((31 - bp.teamRank) / 30) * 100}%`, background: bp.teamRank <= 10 ? '#22c55e' : bp.teamRank <= 20 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
            <div style={{ width: 40, fontSize: 11, fontWeight: 700, color: bp.teamRank <= 10 ? '#22c55e' : bp.teamRank <= 20 ? '#f59e0b' : '#ef4444', textAlign: 'right' }}>#{bp.teamRank}</div>
            <div style={{ width: 40, fontSize: 10, color: bp.totalDRS > 0 ? '#22c55e' : '#ef4444' }}>{bp.totalDRS > 0 ? '+' : ''}{bp.totalDRS}</div>
            <div style={{ width: 100, fontSize: 9, color: '#6b7280' }}>{bp.bestPlayer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
