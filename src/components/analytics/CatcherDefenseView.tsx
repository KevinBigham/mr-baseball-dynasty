import { generateDemoCatcherDefense, getDefGradeColor } from '../../engine/analytics/catcherDefenseAnalyzer';

const data = generateDemoCatcherDefense();

export default function CatcherDefenseView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CATCHER DEFENSE ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Framing, blocking, throwing, and game-calling</p>
      </div>

      {data.catchers.map(c => (
        <div key={c.playerName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{c.playerName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{c.gamesStarted} GS</span>
            </div>
            <span style={{ fontSize: 12, padding: '2px 10px', fontWeight: 700, color: getDefGradeColor(c.overallGrade), border: `1px solid ${getDefGradeColor(c.overallGrade)}44` }}>
              {c.overallGrade}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
            <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>FRAMING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Strikes Earned:</span> <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>{c.framing.extraStrikesEarned}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Runs Above Avg:</span> <span style={{ fontSize: 10, color: c.framing.framingRunsAboveAvg > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{c.framing.framingRunsAboveAvg > 0 ? '+' : ''}{c.framing.framingRunsAboveAvg.toFixed(1)}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>League Rank:</span> <span style={{ fontSize: 10, color: '#3b82f6' }}>#{c.framing.leagueRank}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Best Zone:</span> <span style={{ fontSize: 10, color: '#9ca3af' }}>{c.framing.bestZone}</span></div>
              </div>
            </div>
            <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>BLOCKING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>WP:</span> <span style={{ fontSize: 10, color: '#e5e7eb' }}>{c.blocking.wildPitches}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>PB:</span> <span style={{ fontSize: 10, color: '#e5e7eb' }}>{c.blocking.passedBalls}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Block Rate:</span> <span style={{ fontSize: 10, color: c.blocking.blockRate >= 95 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{c.blocking.blockRate}%</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Runs Saved:</span> <span style={{ fontSize: 10, color: '#22c55e' }}>{c.blocking.runsSaved.toFixed(1)}</span></div>
              </div>
            </div>
            <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>THROWING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>CS Rate:</span> <span style={{ fontSize: 10, color: c.throwing.csRate >= 30 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{c.throwing.csRate}%</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>CS/SBA:</span> <span style={{ fontSize: 10, color: '#e5e7eb' }}>{c.throwing.caughtStealing}/{c.throwing.stolenBaseAttempts}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Avg Pop:</span> <span style={{ fontSize: 10, color: c.throwing.avgPopTime < 1.90 ? '#22c55e' : '#9ca3af' }}>{c.throwing.avgPopTime}s</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Best Pop:</span> <span style={{ fontSize: 10, color: '#3b82f6' }}>{c.throwing.bestPopTime}s</span></div>
              </div>
            </div>
            <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>GAME CALLING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>ERA w/ C:</span> <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>{c.gameCalling.staffERAWithCatcher.toFixed(2)}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>ERA w/o:</span> <span style={{ fontSize: 10, color: '#ef4444' }}>{c.gameCalling.staffERAWithout.toFixed(2)}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Sequence:</span> <span style={{ fontSize: 10, fontWeight: 700, color: getDefGradeColor(c.gameCalling.sequenceGrade) }}>{c.gameCalling.sequenceGrade}</span></div>
                <div><span style={{ fontSize: 9, color: '#6b7280' }}>Trust:</span> <span style={{ fontSize: 10, color: c.gameCalling.pitcherTrust >= 80 ? '#22c55e' : '#f59e0b' }}>{c.gameCalling.pitcherTrust}%</span></div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Total Defensive Value: </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.totalDefensiveValue > 10 ? '#22c55e' : c.totalDefensiveValue > 0 ? '#f59e0b' : '#ef4444' }}>
              {c.totalDefensiveValue > 0 ? '+' : ''}{c.totalDefensiveValue.toFixed(1)} runs
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
