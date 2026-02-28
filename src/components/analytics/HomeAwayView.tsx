import { generateDemoHomeAway, getSplitColor } from '../../engine/analytics/homeAwayPerformance';

const data = generateDemoHomeAway();

export default function HomeAwayView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>HOME/AWAY PERFORMANCE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Home vs away splits analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>HOME</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginTop: 4 }}>{data.homeRecord}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>AWAY</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{data.awayRecord}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>INTERLEAGUE</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{data.interleagueRecord}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TEAM SPLITS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 55px 55px 55px 55px 55px 55px', gap: 4, marginBottom: 6 }}>
          {['LOC', 'W-L', 'WIN%', 'R/G', 'RA/G', 'BA', 'ERA'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.teamSplits.map(ts => (
          <div key={ts.location} style={{ display: 'grid', gridTemplateColumns: '60px 55px 55px 55px 55px 55px 55px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: ts.location === 'Home' ? '#22c55e' : '#3b82f6' }}>{ts.location}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ts.wins}-{ts.losses}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ts.winPct >= 0.550 ? '#22c55e' : '#ef4444' }}>{(ts.winPct * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{ts.runsPerGame.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{ts.runsAllowedPerGame.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ts.teamBA.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{ts.teamERA.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PLAYER HOME/AWAY SPLITS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 55px 55px 40px 55px 55px 40px 55px 65px', gap: 3, marginBottom: 6 }}>
          {['PLAYER', 'H BA', 'H OPS', 'H HR', 'A BA', 'A OPS', 'A HR', 'DELTA', 'SPLIT'].map(h => (
            <div key={h} style={{ fontSize: 8, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.playerSplits.map(p => (
          <div key={p.playerName} style={{ display: 'grid', gridTemplateColumns: '100px 55px 55px 40px 55px 55px 40px 55px 65px', gap: 3, padding: '3px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{p.playerName}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{p.homeBA.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{p.homeOPS.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.homeHR}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{p.awayBA.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{p.awayOPS.toFixed(3)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.awayHR}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: p.splitDelta > 0 ? '#22c55e' : '#ef4444' }}>{p.splitDelta > 0 ? '+' : ''}{p.splitDelta.toFixed(3)}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: getSplitColor(p.splitLabel) }}>{p.splitLabel.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>HOME ADVANTAGE</div>
          <div style={{ fontSize: 10, color: '#e5e7eb' }}>{data.biggestHomeAdvantage}</div>
        </div>
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
          <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AWAY STRUGGLE</div>
          <div style={{ fontSize: 10, color: '#e5e7eb' }}>{data.biggestAwayStruggle}</div>
        </div>
      </div>
    </div>
  );
}
