import { generateDemoPlayoffSim, getMomentumColor } from '../../engine/analytics/playoffProbabilitySimulator';

const data = generateDemoPlayoffSim();

export default function PlayoffSimView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLAYOFF PROBABILITY SIMULATOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — {data.simulations.toLocaleString()} Monte Carlo simulations</p>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>PLAYOFF FIELD</div>
        <div style={{ display: 'grid', gridTemplateColumns: '30px 140px 55px 45px 55px 60px', gap: 4, marginBottom: 6 }}>
          {['#', 'TEAM', 'RECORD', 'RTG', 'EXP', 'MOMENT'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.playoffTeams.map(t => (
          <div key={t.abbreviation} style={{ display: 'grid', gridTemplateColumns: '30px 140px 55px 45px 55px 60px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', background: t.abbreviation === 'SFG' ? '#1a1a0a' : 'transparent' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{t.seed}</div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>{t.teamName}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{t.record}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{t.overallRating}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{t.playoffExperience}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getMomentumColor(t.momentum) }}>{t.momentum}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>SIMULATION RESULTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 55px 55px 55px 55px', gap: 4, marginBottom: 6 }}>
          {['TEAM', 'DS%', 'CS%', 'WS%', 'EXP W'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.results.map(r => (
          <div key={r.teamName} style={{ display: 'grid', gridTemplateColumns: '140px 55px 55px 55px 55px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', background: r.teamName.includes('Giants') ? '#1a1a0a' : 'transparent' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: r.teamName.includes('Giants') ? 700 : 400 }}>{r.teamName}</div>
            <div style={{ fontSize: 10, color: r.divisionSeries >= 50 ? '#22c55e' : '#f59e0b' }}>{r.divisionSeries}%</div>
            <div style={{ fontSize: 10, color: r.champSeries >= 30 ? '#22c55e' : '#9ca3af' }}>{r.champSeries}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: r.worldSeries >= 15 ? '#22c55e' : r.worldSeries >= 5 ? '#f59e0b' : '#9ca3af' }}>{r.worldSeries}%</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{r.expectedWins.toFixed(1)}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #f59e0b44', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>YOUR TEAM'S PATH</div>
        {data.userTeamPath.map((step, i) => (
          <div key={i} style={{ fontSize: 10, color: '#e5e7eb', padding: '3px 0', paddingLeft: 8, borderLeft: `2px solid ${i === 0 ? '#22c55e' : '#37415166'}` }}>{step}</div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>MATCHUP PREVIEWS</div>
        {data.matchups.map((m, i) => (
          <div key={i} style={{ padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, marginBottom: 2 }}>{m.round}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{m.team1} vs {m.team2}</span>
              <span style={{ fontSize: 10, color: '#f59e0b' }}>{m.team1WinProb}% - {m.team2WinProb}%</span>
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>Key: {m.keySeries} | HFA: {m.homefieldAdv}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
