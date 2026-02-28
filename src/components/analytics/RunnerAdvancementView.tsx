import { generateDemoRunnerAdvancement, getAdvRecColor } from '../../engine/analytics/runnerAdvancementModel';

const data = generateDemoRunnerAdvancement();

export default function RunnerAdvancementView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>RUNNER ADVANCEMENT MODEL</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Baserunner advancement probability analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'EXTRA BASE RATE', value: `${(data.teamExtraBaseRate * 100).toFixed(1)}%`, color: '#22c55e' },
          { label: 'ADVANCEMENT RANK', value: `#${data.teamAdvRank}`, color: data.teamAdvRank <= 10 ? '#22c55e' : '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>SCENARIO ANALYSIS</div>
        {data.scenarios.map((s, i) => (
          <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid #1f2937' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: '#e5e7eb' }}>{s.situation}</div>
              <span style={{ fontSize: 10, padding: '2px 6px', fontWeight: 700, color: getAdvRecColor(s.recommendation), border: `1px solid ${getAdvRecColor(s.recommendation)}44` }}>
                {s.recommendation.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
              <span style={{ color: '#6b7280' }}>Runner: <span style={{ color: '#e5e7eb' }}>{s.runner}</span></span>
              <span style={{ color: '#6b7280' }}>Speed: {s.speed}</span>
              <span style={{ color: '#22c55e' }}>Adv: {s.advancePct}%</span>
              {s.scorePct > 0 && <span style={{ color: '#3b82f6' }}>Score: {s.scorePct}%</span>}
              <span style={{ color: '#ef4444' }}>Out: {s.outPct}%</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>BASERUNNING LEADERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 70px 70px 60px 50px', gap: 4, marginBottom: 4 }}>
          {['PLAYER', 'SPD', 'IQ', 'EB TAKEN', 'EB OPP', 'SUCCESS', 'THROWN'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.players.map(p => (
          <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 70px 70px 60px 50px', gap: 4, padding: '5px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: p.speed >= 60 ? '#22c55e' : '#9ca3af' }}>{p.speed}</div>
            <div style={{ fontSize: 10, color: p.baserunningIQ >= 70 ? '#22c55e' : '#9ca3af' }}>{p.baserunningIQ}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{p.extraBasesTaken}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{p.extraBasesOpps}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: p.successRate >= 85 ? '#22c55e' : p.successRate >= 75 ? '#f59e0b' : '#ef4444' }}>{p.successRate}%</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{p.timesThrown}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
