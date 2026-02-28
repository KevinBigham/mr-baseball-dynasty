import { useState } from 'react';
import { generateDemoWalkRate, getBBColor, getChaseColor } from '../../engine/analytics/walkRateLeaderboard';

const data = generateDemoWalkRate();

export default function WalkRateLeaderboardView() {
  const [sel, setSel] = useState(0);
  const p = data.leaders[sel];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>WALK RATE LEADERBOARD</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>League-wide BB% leaders with eye discipline metrics and trends</p>
      </div>

      {/* League averages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'LG AVG BB%', value: `${data.leagueAvgBBPct}%`, color: '#6b7280' },
          { label: 'LG AVG K%', value: `${data.leagueAvgKPct}%`, color: '#6b7280' },
          { label: 'LEADER BB%', value: `${data.leaders[0].bbPct}%`, color: '#22c55e' },
          { label: 'BEST BB/K', value: data.leaders[0].bbkRatio.toFixed(2), color: '#3b82f6' },
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
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>BB% LEADERS</div>
          {data.leaders.map((l, i) => (
            <div key={l.playerId} onClick={() => setSel(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 3, cursor: 'pointer', background: i === sel ? '#1f2937' : '#0a0f1a', border: `1px solid ${i === sel ? '#f59e0b44' : '#1f2937'}` }}>
              <div style={{ width: 18, fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{l.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: i === sel ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{l.team} | {l.position}</div>
              </div>
              <div style={{ width: 50, textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: getBBColor(l.bbPct) }}>{l.bbPct}%</div>
              </div>
              <div style={{ fontSize: 10, color: l.trend === 'up' ? '#22c55e' : l.trend === 'down' ? '#ef4444' : '#6b7280' }}>
                {l.trend === 'up' ? '▲' : l.trend === 'down' ? '▼' : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Player detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>{p.name.toUpperCase()} — EYE DISCIPLINE</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'BB%', value: `${p.bbPct}%`, color: getBBColor(p.bbPct) },
              { label: 'K%', value: `${p.kPct}%`, color: p.kPct <= 18 ? '#22c55e' : p.kPct <= 22 ? '#f59e0b' : '#ef4444' },
              { label: 'BB/K', value: p.bbkRatio.toFixed(2), color: p.bbkRatio >= 0.8 ? '#22c55e' : '#f59e0b' },
              { label: 'OBP', value: p.obp.toFixed(3), color: p.obp >= .380 ? '#22c55e' : '#3b82f6' },
              { label: 'CHASE %', value: `${p.chasePct}%`, color: getChaseColor(p.chasePct) },
              { label: 'ZONE SWING', value: `${p.zoneSwingPct}%`, color: '#e5e7eb' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly trend */}
          <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>MONTHLY BB% TREND</div>
            {p.monthlyBBPct.map(m => (
              <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 30, fontSize: 10, color: '#6b7280' }}>{m.month}</div>
                <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 4 }}>
                  <div style={{ width: `${(m.bbPct / 25) * 100}%`, height: '100%', borderRadius: 4, background: getBBColor(m.bbPct) }} />
                </div>
                <div style={{ width: 40, fontSize: 10, fontWeight: 700, color: getBBColor(m.bbPct), textAlign: 'right' }}>{m.bbPct}%</div>
              </div>
            ))}
          </div>

          {/* Additional stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>PLATE APPEARANCES</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.pa}</div>
            </div>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>WALKS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{p.bb}</div>
            </div>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>1ST PITCH STRIKE %</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.firstPitchStrikePct < 55 ? '#22c55e' : '#f59e0b' }}>{p.firstPitchStrikePct}%</div>
            </div>
            <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>OPS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.ops >= .900 ? '#22c55e' : '#3b82f6' }}>{p.ops.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
