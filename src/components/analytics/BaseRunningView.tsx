import { generateDemoBaseRunning, getBRGradeColor } from '../../engine/analytics/baseRunningEfficiency';

const data = generateDemoBaseRunning();

export default function BaseRunningView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BASE RUNNING EFFICIENCY</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Comprehensive base running analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>TEAM BRR</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: data.teamBRR > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>{data.teamBRR > 0 ? '+' : ''}{data.teamBRR.toFixed(1)}</div>
        </div>
        <div style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>LEAGUE RANK</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>#{data.leagueRank}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PLAYER BASE RUNNING</div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 35px 50px 50px 55px 55px 55px 55px 50px 40px', gap: 3, marginBottom: 6 }}>
          {['PLAYER', 'SPD', 'SB', 'CS', 'SB%', '1→3%', 'SC2%', 'XBT%', 'BRR', 'GR'].map(h => (
            <div key={h} style={{ fontSize: 8, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.players.map(p => (
          <div key={p.playerName} style={{ display: 'grid', gridTemplateColumns: '100px 35px 50px 50px 55px 55px 55px 55px 50px 40px', gap: 3, padding: '3px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{p.playerName}</div>
            <div style={{ fontSize: 10, color: p.speed >= 55 ? '#22c55e' : '#9ca3af' }}>{p.speed}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{p.stolenBases}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{p.caughtStealing}</div>
            <div style={{ fontSize: 10, color: p.sbSuccess >= 75 ? '#22c55e' : '#f59e0b' }}>{p.sbSuccess > 0 ? p.sbSuccess.toFixed(1) + '%' : '—'}</div>
            <div style={{ fontSize: 10, color: p.firstToThirdPct >= 50 ? '#22c55e' : '#9ca3af' }}>{p.firstToThirdPct}%</div>
            <div style={{ fontSize: 10, color: p.scoreFromSecondPct >= 55 ? '#22c55e' : '#9ca3af' }}>{p.scoreFromSecondPct}%</div>
            <div style={{ fontSize: 10, color: p.extraBasePct >= 60 ? '#22c55e' : '#9ca3af' }}>{p.extraBasePct.toFixed(1)}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: p.baseRunningRuns > 0 ? '#22c55e' : '#ef4444' }}>{p.baseRunningRuns > 0 ? '+' : ''}{p.baseRunningRuns.toFixed(1)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getBRGradeColor(p.overallGrade) }}>{p.overallGrade}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TEAM vs LEAGUE</div>
        {data.situationalData.map(s => (
          <div key={s.situation} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderTop: '1px solid #1f2937' }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>{s.situation}</span>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb' }}>{typeof s.teamRate === 'number' && s.teamRate < 1 ? s.teamRate.toFixed(2) : s.teamRate.toFixed(1)}%</span>
              <span style={{ fontSize: 9, color: '#6b7280', marginLeft: 8 }}>LG: {typeof s.leagueAvg === 'number' && s.leagueAvg < 1 ? s.leagueAvg.toFixed(2) : s.leagueAvg.toFixed(1)}%</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.differential > 0 ? '#22c55e' : '#ef4444', marginLeft: 8 }}>{s.differential > 0 ? '+' : ''}{s.differential.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
