import { generateDemoScheduleStrength, getDifficultyColor } from '../../engine/analytics/scheduleStrengthIndex';

const data = generateDemoScheduleStrength();

export default function ScheduleStrengthView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SCHEDULE STRENGTH INDEX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Remaining schedule difficulty and win projections</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OVERALL SOS', value: data.overallSOS, color: data.overallSOS >= 50 ? '#ef4444' : '#22c55e' },
          { label: 'SOS RANK', value: `#${data.sosRank}`, color: '#3b82f6' },
          { label: 'PROJ REMAINING W', value: data.projRemainingWins, color: '#22c55e' },
          { label: 'PROJ REMAINING L', value: data.projRemainingLosses, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Key stretches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 10, background: '#22c55e11', border: '1px solid #22c55e33' }}>
          <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>EASIEST STRETCH</div>
          <div style={{ fontSize: 11, color: '#e5e7eb', marginTop: 4 }}>{data.easiestStretch}</div>
        </div>
        <div style={{ padding: 10, background: '#ef444411', border: '1px solid #ef444433' }}>
          <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>HARDEST STRETCH</div>
          <div style={{ fontSize: 11, color: '#e5e7eb', marginTop: 4 }}>{data.hardestStretch}</div>
        </div>
      </div>

      {/* Schedule segments */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>SCHEDULE SEGMENTS</div>
        {data.segments.map(seg => (
          <div key={seg.period} style={{ padding: '10px 12px', marginBottom: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{seg.period}</span>
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{seg.games} games</span>
              </div>
              <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: getDifficultyColor(seg.difficulty) + '22', color: getDifficultyColor(seg.difficulty) }}>
                {seg.difficulty.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 6 }}>
              {[
                { label: 'OPP WIN%', value: seg.avgOppWinPct.toFixed(3), color: seg.avgOppWinPct >= .520 ? '#ef4444' : '#22c55e' },
                { label: 'HOME', value: seg.homeGames, color: '#3b82f6' },
                { label: 'AWAY', value: seg.awayGames, color: '#6b7280' },
                { label: 'PROJ W', value: seg.projWins, color: '#22c55e' },
                { label: 'PROJ L', value: seg.projLosses, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>Key opponents: {seg.keyOpponents.join(', ')}</div>
          </div>
        ))}
      </div>

      {/* Remaining games summary */}
      <div style={{ marginTop: 16, padding: 12, background: '#111827', border: '1px solid #374151', display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11 }}>
        <span style={{ color: '#6b7280' }}>Remaining: <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{data.remainingGames}G</span></span>
        <span style={{ color: '#6b7280' }}>Projected: <span style={{ color: '#22c55e', fontWeight: 700 }}>{data.projRemainingWins}W</span> - <span style={{ color: '#ef4444', fontWeight: 700 }}>{data.projRemainingLosses}L</span></span>
        <span style={{ color: '#6b7280' }}>Win%: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{(data.projRemainingWins / data.remainingGames).toFixed(3)}</span></span>
      </div>
    </div>
  );
}
