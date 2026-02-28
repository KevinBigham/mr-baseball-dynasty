import { generateDemoDeadlineCountdown, getPriorityColor, getStatusColor } from '../../engine/trade/deadlineCountdownTracker';

const data = generateDemoDeadlineCountdown();

export default function DeadlineTrackerView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TRADE DEADLINE TRACKER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — {data.deadlineDate}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'DAYS LEFT', value: data.daysUntilDeadline, color: data.daysUntilDeadline <= 7 ? '#ef4444' : data.daysUntilDeadline <= 14 ? '#f59e0b' : '#22c55e' },
          { label: 'POSTURE', value: data.posture.toUpperCase(), color: data.posture === 'buyer' ? '#22c55e' : data.posture === 'seller' ? '#ef4444' : '#6b7280' },
          { label: 'BUDGET LEFT', value: `$${data.budgetRemaining.toFixed(1)}M`, color: '#3b82f6' },
          { label: 'DEALS DONE', value: data.completedDeals, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>TASK CHECKLIST</div>
        {data.tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid #1f2937' : 'none' }}>
            <span style={{ fontSize: 10, padding: '2px 6px', fontWeight: 700, color: getPriorityColor(t.priority), border: `1px solid ${getPriorityColor(t.priority)}44` }}>
              {t.priority.toUpperCase()}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600, textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.task}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{t.notes}</div>
            </div>
            <span style={{ fontSize: 10, color: getStatusColor(t.status), fontWeight: 600 }}>
              {t.status.toUpperCase()}
            </span>
            {t.daysNeeded > 0 && (
              <span style={{ fontSize: 9, color: '#6b7280' }}>{t.daysNeeded}d</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>TRADE TARGETS</div>
        {data.targets.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i > 0 ? '1px solid #1f2937' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{t.playerName}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{t.team} | {t.position}</div>
            </div>
            <div style={{ width: 140, fontSize: 10, color: '#9ca3af' }}>{t.askingPrice}</div>
            <div style={{ width: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.likelihood >= 60 ? '#22c55e' : t.likelihood >= 40 ? '#f59e0b' : '#ef4444' }}>{t.likelihood}%</div>
            </div>
            <span style={{ fontSize: 10, padding: '2px 6px', fontWeight: 700, color: t.urgency === 'now' ? '#ef4444' : t.urgency === 'soon' ? '#f59e0b' : '#6b7280', border: `1px solid`, borderColor: t.urgency === 'now' ? '#ef444444' : t.urgency === 'soon' ? '#f59e0b44' : '#6b728044' }}>
              {t.urgency.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
