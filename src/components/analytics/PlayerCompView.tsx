import { generateDemoPlayerComp } from '../../engine/analytics/playerCompMatrix';

const comp = generateDemoPlayerComp();

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

export default function PlayerCompView() {
  const { players, advantages, overallWinner } = comp;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLAYER COMPARISON MATRIX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Side-by-side multi-stat comparison with percentile rankings</p>
      </div>

      {/* Player header cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${players.length}, 1fr)`, gap: 0, marginBottom: 20 }}>
        <div />
        {players.map(p => (
          <div key={p.playerId} style={{ padding: 12, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.playerId === overallWinner ? '#f59e0b' : '#e5e7eb' }}>
              {p.name} {p.playerId === overallWinner ? '\u2605' : ''}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{p.position} | {p.team} | Age {p.age}</div>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>WAR</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.overallWAR >= 5 ? '#22c55e' : p.overallWAR >= 3 ? '#f59e0b' : '#e5e7eb' }}>{p.overallWAR}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>AAV</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{fmt(p.contractAAV)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>VALUE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.valueRating >= 80 ? '#22c55e' : p.valueRating >= 60 ? '#f59e0b' : '#9ca3af' }}>{p.valueRating}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stat comparison table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            <th style={{ width: 200, textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 700 }}>STAT</th>
            {players.map(p => (
              <th key={p.playerId} style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>{p.name.split(' ')[1]}</th>
            ))}
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>LG AVG</th>
            <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>BEST</th>
          </tr>
        </thead>
        <tbody>
          {players[0].stats.map(s => {
            const winnerId = advantages.find(a => a.statLabel === s.label)?.playerId;
            return (
              <tr key={s.label} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '6px 8px', color: '#9ca3af', fontWeight: 600 }}>
                  <span style={{ color: '#6b7280', fontSize: 9, marginRight: 6 }}>{s.category.toUpperCase()}</span>
                  {s.label}
                </td>
                {players.map(p => {
                  const stat = p.stats.find(x => x.label === s.label)!;
                  const isBest = p.playerId === winnerId;
                  return (
                    <td key={p.playerId} style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ color: isBest ? '#f59e0b' : '#e5e7eb', fontWeight: isBest ? 700 : 400 }}>
                        {typeof stat.value === 'number' && stat.value < 1 ? stat.value.toFixed(3) : stat.value}
                      </div>
                      <div style={{ width: '100%', height: 3, background: '#1f2937', marginTop: 2 }}>
                        <div style={{ width: `${stat.percentile}%`, height: '100%', background: stat.percentile > 75 ? '#22c55e' : stat.percentile > 50 ? '#f59e0b' : stat.percentile > 25 ? '#9ca3af' : '#ef4444' }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>{stat.percentile}th</div>
                    </td>
                  );
                })}
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#6b7280' }}>
                  {typeof s.leagueAvg === 'number' && s.leagueAvg < 1 ? s.leagueAvg.toFixed(3) : s.leagueAvg}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 10 }}>
                    {players.find(p => p.playerId === winnerId)?.name.split(' ')[1] || '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 16, padding: 12, border: '1px solid #374151', background: '#111827', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          ADVANTAGE COUNT: {players.map(p => {
            const count = advantages.filter(a => a.playerId === p.playerId).length;
            return <span key={p.playerId} style={{ marginRight: 16, color: p.playerId === overallWinner ? '#f59e0b' : '#9ca3af' }}>{p.name.split(' ')[1]}: {count}</span>;
          })}
        </div>
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
          OVERALL: {players.find(p => p.playerId === overallWinner)?.name}
        </div>
      </div>
    </div>
  );
}
