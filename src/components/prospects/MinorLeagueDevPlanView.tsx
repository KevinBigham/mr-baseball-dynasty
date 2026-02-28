import { generateDemoMinorLeagueDevPlan, getProgressColor } from '../../engine/prospects/minorLeagueDevPlan';

const data = generateDemoMinorLeagueDevPlan();

export default function MinorLeagueDevPlanView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>MINOR LEAGUE DEVELOPMENT PLANS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Structured prospect development tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL IN PLAN', value: data.totalProspectsInPlan, color: '#f59e0b' },
          { label: 'ON TRACK', value: data.onTrackCount, color: '#22c55e' },
          { label: 'BEHIND PACE', value: data.totalProspectsInPlan - data.onTrackCount, color: '#ef4444' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.prospects.map(p => (
        <div key={p.name} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.position} | Age {p.age} | {p.level}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: getProgressColor(p.overallProgress) }}>{p.overallProgress}% Complete</span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
              <span>OVERALL PROGRESS</span><span>Next eval: {p.nextEval}</span>
            </div>
            <div style={{ height: 6, background: '#1f2937' }}>
              <div style={{ height: '100%', width: `${p.overallProgress}%`, background: getProgressColor(p.overallProgress) }} />
            </div>
          </div>

          {p.goals.map(g => (
            <div key={g.skill} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{g.skill}</span>
                  <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 6px', color: g.priority === 'critical' ? '#ef4444' : g.priority === 'high' ? '#f59e0b' : g.priority === 'medium' ? '#3b82f6' : '#6b7280', border: '1px solid', borderColor: g.priority === 'critical' ? '#ef444444' : g.priority === 'high' ? '#f59e0b44' : '#3b82f644' }}>{g.priority.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{g.timeline}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 30, fontSize: 10, color: '#9ca3af' }}>{g.currentLevel}</div>
                <div style={{ flex: 1, height: 6, background: '#1f2937', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${g.currentLevel}%`, background: getProgressColor(g.currentLevel) }} />
                  <div style={{ position: 'absolute', left: `${g.targetLevel}%`, top: -2, bottom: -2, width: 2, background: '#f59e0b' }} />
                </div>
                <div style={{ width: 30, fontSize: 10, color: '#f59e0b' }}>{g.targetLevel}</div>
              </div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>
                {g.drills.map((d, i) => <span key={i}>{i > 0 ? ' | ' : ''}{d}</span>)}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af', paddingLeft: 8, borderLeft: '2px solid #f59e0b44' }}>
            Coach Notes: {p.coachNotes}
          </div>
        </div>
      ))}
    </div>
  );
}
