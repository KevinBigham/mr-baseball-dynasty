import { useState } from 'react';
import { generateDemoDefOptimizer, getShiftColor } from '../../engine/analytics/defPositioningOptimizer';

const data = generateDemoDefOptimizer();

export default function DefOptView() {
  const [tab, setTab] = useState<'positions' | 'batters'>('positions');

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DEFENSIVE POSITIONING OPTIMIZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Optimal shifts and positioning recommendations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CURRENT RUNS SAVED', value: data.currentRunsSaved.toFixed(1), color: '#3b82f6' },
          { label: 'OPTIMAL RUNS SAVED', value: data.optimalRunsSaved.toFixed(1), color: '#22c55e' },
          { label: 'AVAILABLE GAIN', value: `+${data.gainAvailable.toFixed(1)}`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['positions', 'batters'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 14px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: tab === t ? '#f59e0b22' : '#111827', border: `1px solid ${tab === t ? '#f59e0b' : '#374151'}`, color: tab === t ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {t === 'positions' ? 'POSITIONING' : 'BATTER TENDENCIES'}
          </button>
        ))}
      </div>

      {tab === 'positions' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>FIELDER POSITIONING RECOMMENDATIONS</div>
          {data.positionRecs.map(r => (
            <div key={r.position} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{r.position}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{r.player}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Shift: ({r.currentX},{r.currentY}) → ({r.optimalX},{r.optimalY})</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>+{r.shiftSavings.toFixed(1)} runs</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{r.hitsPrevented} hits prevented</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'batters' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>OPPOSING BATTER TENDENCIES</div>
          {data.batterTendencies.map(b => (
            <div key={b.name} style={{ padding: '8px 10px', marginBottom: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{b.name}</span>
                  <span style={{ fontSize: 9, color: '#6b7280', marginLeft: 6 }}>{b.team}</span>
                </div>
                <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getShiftColor(b.shiftRecommendation) + '22', color: getShiftColor(b.shiftRecommendation) }}>
                  {b.shiftRecommendation.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                <span style={{ color: '#ef4444' }}>Pull: {b.pullPct}%</span>
                <span style={{ color: '#f59e0b' }}>Center: {b.centerPct}%</span>
                <span style={{ color: '#3b82f6' }}>Oppo: {b.oppoPct}%</span>
                <span style={{ color: '#6b7280' }}>|</span>
                <span style={{ color: '#6b7280' }}>GB: {b.gbPct}%</span>
                <span style={{ color: '#6b7280' }}>FB: {b.fbPct}%</span>
                <span style={{ color: '#6b7280' }}>LD: {b.ldPct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
