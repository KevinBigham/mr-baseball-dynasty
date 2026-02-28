import { useState } from 'react';
import { generateDemoCatcherPopTime, getPopTimeColor } from '../../engine/analytics/catcherPopTime';

const data = generateDemoCatcherPopTime();

export default function CatcherPopTimeView() {
  const [sel, setSel] = useState(0);
  const c = data.catchers[sel];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CATCHER POP TIME ANALYSIS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Throw-down metrics, caught stealing rates, and arm grading</p>
      </div>

      {/* League averages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'LG AVG POP TIME', value: `${data.leagueAvgPopTime}s`, color: '#6b7280' },
          { label: 'LG AVG CS%', value: `${data.leagueAvgCSPct}%`, color: '#6b7280' },
          { label: 'BEST POP TIME', value: `${data.catchers[0].bestPopTime}s`, color: '#22c55e' },
          { label: 'BEST CS%', value: `${Math.max(...data.catchers.map(c => c.csPct))}%`, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Leaderboard */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>POP TIME RANKINGS</div>
          {data.catchers.map((ct, i) => (
            <div key={ct.name} onClick={() => setSel(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 3, cursor: 'pointer', background: i === sel ? '#1f2937' : '#0a0f1a', border: `1px solid ${i === sel ? '#f59e0b44' : '#1f2937'}` }}>
              <div style={{ width: 18, fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{ct.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: i === sel ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{ct.name}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{ct.team} | Arm: {ct.armGrade}</div>
              </div>
              <div style={{ width: 45, fontSize: 12, fontWeight: 700, color: getPopTimeColor(ct.avgPopTime), textAlign: 'right' }}>{ct.avgPopTime}s</div>
              <div style={{ width: 40, fontSize: 10, color: ct.csPct >= 35 ? '#22c55e' : '#f59e0b', textAlign: 'right' }}>{ct.csPct}%</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>{c.name.toUpperCase()} — ARM BREAKDOWN</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'AVG POP TIME', value: `${c.avgPopTime}s`, color: getPopTimeColor(c.avgPopTime) },
              { label: 'BEST POP TIME', value: `${c.bestPopTime}s`, color: getPopTimeColor(c.bestPopTime) },
              { label: 'EXCHANGE', value: `${c.exchangeTime}s`, color: c.exchangeTime <= 0.70 ? '#22c55e' : '#f59e0b' },
              { label: 'THROW VELO', value: `${c.throwVelo} mph`, color: c.throwVelo >= 84 ? '#22c55e' : '#3b82f6' },
              { label: 'CS%', value: `${c.csPct}%`, color: c.csPct >= 35 ? '#22c55e' : '#f59e0b' },
              { label: 'ARM GRADE', value: c.armGrade, color: c.armGrade >= 65 ? '#22c55e' : c.armGrade >= 55 ? '#3b82f6' : '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>SB ATTEMPTS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{c.sbAttempts}</div>
            </div>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>CAUGHT STEALING</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{c.caughtStealing}</div>
            </div>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>ACCURACY</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.throwAccuracy >= 90 ? '#22c55e' : '#3b82f6' }}>{c.throwAccuracy}%</div>
            </div>
          </div>

          <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 9, color: '#6b7280' }}>GAMES STARTED</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{c.gamesStarted}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
