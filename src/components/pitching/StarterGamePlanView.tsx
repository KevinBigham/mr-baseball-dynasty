import { generateDemoStarterGamePlan, getDangerColor } from '../../engine/pitching/starterGamePlanBuilder';

const data = generateDemoStarterGamePlan();
const plan = data.plan;

export default function StarterGamePlanView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>STARTER GAME PLAN</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{plan.pitcherName} vs {plan.opponent} — {plan.gameDate}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PROJ PITCH COUNT', value: plan.projectedPitchCount, color: '#f59e0b' },
          { label: 'PROJ INNINGS', value: plan.projectedInnings.toFixed(1), color: '#3b82f6' },
          { label: 'BATTERS IN PLAN', value: plan.batterPlans.length, color: '#e5e7eb' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>OVERALL STRATEGY</div>
        <div style={{ fontSize: 11, color: '#e5e7eb' }}>{plan.overallStrategy}</div>
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>PITCH MIX SUGGESTION</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {plan.pitchMixSuggestion.map(p => (
            <div key={p.pitch} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{p.pct}%</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{p.pitch}</div>
            </div>
          ))}
        </div>
      </div>

      {plan.batterPlans.map(b => (
        <div key={b.batterName} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{b.batterName}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{b.position} | {b.bats}HH</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: getDangerColor(b.dangerRating), border: `1px solid ${getDangerColor(b.dangerRating)}44` }}>
              DANGER: {b.dangerRating}/10
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>AVG AGAINST</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{b.avgAgainst.toFixed(3)}</div>
            </div>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>OPS AGAINST</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{b.opsAgainst.toFixed(3)}</div>
            </div>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#6b7280' }}>KEY WEAKNESS</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>{b.keyWeakness}</div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>PITCH PLAN</div>
          {b.pitchPlan.map((step, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 80px 90px 1fr 55px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{step.count}</div>
              <div style={{ fontSize: 10, color: '#3b82f6' }}>{step.pitch}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{step.location}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{step.intent}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: step.successRate >= 55 ? '#22c55e' : '#f59e0b' }}>{step.successRate}%</div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 12 }}>
        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>KEY MATCHUP NOTES</div>
        {plan.keyMatchups.map((note, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid #f59e0b66' }}>{note}</div>
        ))}
      </div>
    </div>
  );
}
