import { generateDemoOffseasonPlan, getOffseasonPriorityColor } from '../../engine/analytics/offseasonPlanBuilder';

const data = generateDemoOffseasonPlan();

export default function OffseasonPlanView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>OFFSEASON PLAN BUILDER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Structured offseason priorities and timeline</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL BUDGET', value: `$${data.totalBudget.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'BUDGET USED', value: `$${data.budgetUsed.toFixed(1)}M`, color: '#3b82f6' },
          { label: 'REMAINING', value: `$${(data.totalBudget - data.budgetUsed).toFixed(1)}M`, color: '#22c55e' },
          { label: 'READINESS', value: `${data.overallReadiness}%`, color: data.overallReadiness >= 70 ? '#22c55e' : '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 12, marginBottom: 12 }}>
        <div>
          {data.priorities.map((p, i) => (
            <div key={i} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.area}</span>
                  <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 6px', fontWeight: 700, color: getOffseasonPriorityColor(p.priority), border: `1px solid ${getOffseasonPriorityColor(p.priority)}44` }}>{p.priority.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: p.status === 'completed' ? '#22c55e' : p.status === 'in-progress' ? '#f59e0b' : '#6b7280' }}>{p.status.toUpperCase()}</span>
                  {p.budget > 0 && <span style={{ fontSize: 10, color: '#3b82f6' }}>${p.budget.toFixed(1)}M</span>}
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>{p.impact}</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Deadline: {p.deadline}</div>
              {p.actions.map((a, j) => (
                <div key={j} style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1, paddingLeft: 8 }}>- {a}</div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, height: 'fit-content' }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>KEY DATES</div>
          {data.keyDates.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid #1f2937' : 'none' }}>
              <div style={{ width: 60, fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{d.date}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{d.event}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
