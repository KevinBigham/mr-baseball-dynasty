import { generateDemoTeamTrend, getTrendBadgeColor } from '../../engine/analytics/teamTrendAnalyzer';

const data = generateDemoTeamTrend();

export default function TeamTrendView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TEAM TREND ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Performance trends across multiple periods</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CURRENT STREAK', value: data.currentStreak, color: data.currentStreak.startsWith('W') ? '#22c55e' : '#ef4444' },
          { label: 'OVERALL TREND', value: data.overallTrend.toUpperCase(), color: getTrendBadgeColor(data.overallTrend) },
          { label: 'PERIODS TRACKED', value: data.periods.length, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PERIOD BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 70px 60px 60px 60px 60px 60px 50px', gap: 4, marginBottom: 6 }}>
          {['PERIOD', 'RECORD', 'RUN DIFF', 'AVG R', 'AVG RA', 'ERA', 'BA', 'TREND'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.periods.map(p => (
          <div key={p.period} style={{ display: 'grid', gridTemplateColumns: '80px 70px 60px 60px 60px 60px 60px 50px', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>{p.period}</div>
            <div style={{ fontSize: 11, color: '#e5e7eb' }}>{p.wins}-{p.losses}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: p.runDiff > 0 ? '#22c55e' : '#ef4444' }}>{p.runDiff > 0 ? '+' : ''}{p.runDiff}</div>
            <div style={{ fontSize: 11, color: '#22c55e' }}>{p.avgRuns.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: '#ef4444' }}>{p.avgRunsAllowed.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.teamERA.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.teamBA.toFixed(3)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getTrendBadgeColor(p.trend) }}>
              {p.trend === 'hot' ? '\u25B2' : p.trend === 'cold' ? '\u25BC' : '\u25C6'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>METRIC TRENDS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, 1fr) 70px', gap: 4, marginBottom: 6 }}>
          {['METRIC', 'LAST 7', 'LAST 15', 'LAST 30', 'SEASON', 'TREND'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.metrics.map(m => (
          <div key={m.metric} style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, 1fr) 70px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#f59e0b' }}>{m.metric}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{typeof m.last7 === 'number' && m.last7 < 1 ? m.last7.toFixed(3) : m.last7.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{typeof m.last15 === 'number' && m.last15 < 1 ? m.last15.toFixed(3) : m.last15.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{typeof m.last30 === 'number' && m.last30 < 1 ? m.last30.toFixed(3) : m.last30.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{typeof m.season === 'number' && m.season < 1 ? m.season.toFixed(3) : m.season.toFixed(2)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getTrendBadgeColor(m.trend) }}>
              {m.trend === 'improving' ? '\u25B2 UP' : m.trend === 'declining' ? '\u25BC DOWN' : '\u25C6 STABLE'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
