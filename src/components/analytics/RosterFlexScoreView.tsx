import { useState } from 'react';
import { generateDemoRosterFlex, getFlexColor } from '../../engine/analytics/rosterFlexScore';

const data = generateDemoRosterFlex();

export default function RosterFlexScoreView() {
  const [sel, setSel] = useState(0);
  const p = data.players[sel];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>ROSTER FLEXIBILITY SCORE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Positional versatility and depth analysis</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'FLEX SCORE', value: data.overallFlexScore, color: getFlexColor(data.overallFlexScore) },
          { label: 'GRADE', value: data.flexGrade, color: '#f59e0b' },
          { label: 'LEAGUE RANK', value: `#${data.leagueRank}`, color: '#3b82f6' },
          { label: 'POSITIONS COVERED', value: Object.keys(data.positionCoverage).length, color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Player list */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PLAYER FLEXIBILITY</div>
          {[...data.players].sort((a, b) => b.flexScore - a.flexScore).map((pl, i) => {
            const origIdx = data.players.indexOf(pl);
            return (
              <div key={pl.name} onClick={() => setSel(origIdx)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 3, cursor: 'pointer', background: origIdx === sel ? '#1f2937' : '#0a0f1a', border: `1px solid ${origIdx === sel ? '#f59e0b44' : '#1f2937'}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: origIdx === sel ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{pl.name}</div>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{pl.primaryPos} | {pl.positionCount} pos</div>
                </div>
                <div style={{ width: 50, height: 8, background: '#1f2937', borderRadius: 4 }}>
                  <div style={{ width: `${pl.flexScore}%`, height: '100%', borderRadius: 4, background: getFlexColor(pl.flexScore) }} />
                </div>
                <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: getFlexColor(pl.flexScore), textAlign: 'right' }}>{pl.flexScore}</div>
              </div>
            );
          })}
        </div>

        <div>
          {/* Player detail */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
            <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>{p.name.toUpperCase()} — POSITIONAL BREAKDOWN</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' as const }}>
              {p.eligiblePositions.map(pos => (
                <span key={pos} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 700, background: pos === p.primaryPos ? '#f59e0b22' : '#1f2937', color: pos === p.primaryPos ? '#f59e0b' : '#e5e7eb', border: `1px solid ${pos === p.primaryPos ? '#f59e0b44' : '#374151'}` }}>
                  {pos} {p.defensiveRating[pos] ? `(${p.defensiveRating[pos]})` : ''}
                </span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>FLEX SCORE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getFlexColor(p.flexScore) }}>{p.flexScore}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>POSITIONS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>{p.positionCount}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>UTILITY WAR</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: p.utilityValue > 0 ? '#22c55e' : '#6b7280' }}>+{p.utilityValue.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Position coverage & analysis */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
            <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>COVERAGE & ANALYSIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12 }}>
              {Object.entries(data.positionCoverage).map(([pos, count]) => (
                <div key={pos} style={{ padding: 4, textAlign: 'center', background: '#0a0f1a', border: '1px solid #1f2937' }}>
                  <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700 }}>{pos}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: count >= 3 ? '#22c55e' : count >= 2 ? '#f59e0b' : '#ef4444' }}>{count}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>WEAK SPOTS</div>
              {data.weakSpots.map((w, i) => <div key={i} style={{ fontSize: 10, color: '#ef4444', marginBottom: 2 }}>• {w}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>STRENGTHS</div>
              {data.strengths.map((s, i) => <div key={i} style={{ fontSize: 10, color: '#22c55e', marginBottom: 2 }}>• {s}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
