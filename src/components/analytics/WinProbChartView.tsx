import { generateDemoWinProbability, getWPColor, getDeltaColor } from '../../engine/analytics/winProbabilityChart';

const data = generateDemoWinProbability();

export default function WinProbChartView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>WIN PROBABILITY CHART</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} vs {data.opponent} — {data.finalScore} ({data.result})</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'FINAL SCORE', value: data.finalScore, color: data.result === 'W' ? '#22c55e' : '#ef4444' },
          { label: 'HIGH POINT', value: `${data.highPoint}%`, color: '#22c55e' },
          { label: 'LOW POINT', value: `${data.lowPoint}%`, color: '#ef4444' },
          { label: 'BIGGEST SWING', value: `${data.biggestSwing}%`, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>WIN PROBABILITY TIMELINE</div>

        <div style={{ marginBottom: 16 }}>
          {data.events.map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 30, fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
                {ev.halfInning === 'top' ? '\u25B2' : '\u25BC'}{ev.inning}
              </div>
              <div style={{ flex: 1, height: 14, background: '#1f2937', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${ev.wpAfter}%`, background: getWPColor(ev.wpAfter), transition: 'width 0.3s' }} />
                <div style={{ position: 'absolute', right: 4, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontSize: 9, color: '#e5e7eb', fontWeight: 700 }}>
                  {ev.wpAfter}%
                </div>
              </div>
              <div style={{ width: 50, fontSize: 10, fontWeight: 700, color: getDeltaColor(ev.wpDelta), textAlign: 'right' }}>
                {ev.wpDelta > 0 ? '+' : ''}{ev.wpDelta}%
              </div>
            </div>
          ))}
        </div>

        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>KEY EVENTS</div>
        {data.events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ width: 40, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>
              {ev.halfInning === 'top' ? 'T' : 'B'}{ev.inning}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#e5e7eb' }}>{ev.event}</div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{ev.player} | LI: {ev.leverage.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: getDeltaColor(ev.wpDelta) }}>
                {ev.wpDelta > 0 ? '+' : ''}{ev.wpDelta}%
              </div>
              <div style={{ fontSize: 9, color: '#6b7280' }}>{ev.wpBefore}% → {ev.wpAfter}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
