import { useState } from 'react';
import { generateDemoAgingProjections, getCategoryColor } from '../../engine/analytics/playerAgingProjections';

const data = generateDemoAgingProjections();

export default function PlayerAgingProjectionsView() {
  const [sel, setSel] = useState(0);
  const p = data.players[sel];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PLAYER AGING PROJECTIONS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Performance decline curves and contract alignment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'AVG TEAM AGE', value: data.avgTeamAge.toFixed(1), color: '#3b82f6' },
          { label: 'PRE-PEAK PLAYERS', value: data.players.filter(x => x.category === 'pre-peak').length, color: '#22c55e' },
          { label: 'DECLINING PLAYERS', value: data.players.filter(x => x.category === 'decline').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Player selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {data.players.map((player, i) => (
          <button key={player.name} onClick={() => setSel(i)} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: i === sel ? '#f59e0b22' : '#111827', border: `1px solid ${i === sel ? '#f59e0b' : '#374151'}`, color: i === sel ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {player.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Profile card */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PLAYER PROFILE — {p.name.toUpperCase()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'AGE', value: p.age, color: '#e5e7eb' },
              { label: 'CURRENT OVR', value: p.currentOVR, color: p.currentOVR >= 80 ? '#22c55e' : '#f59e0b' },
              { label: 'PEAK AGE', value: p.peakAge, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'DECLINE RATE', value: `${p.declineRate}/yr`, color: p.declineRate >= 2.5 ? '#ef4444' : '#f59e0b' },
              { label: 'CONTRACT LEFT', value: `${p.contractYearsLeft}yr`, color: '#e5e7eb' },
              { label: 'RISK', value: p.riskLevel.toUpperCase(), color: p.riskLevel === 'high' ? '#ef4444' : p.riskLevel === 'medium' ? '#f59e0b' : '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '6px 10px', background: getCategoryColor(p.category) + '22', border: `1px solid ${getCategoryColor(p.category)}`, textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: getCategoryColor(p.category) }}>{p.category.toUpperCase().replace('-', ' ')}</span>
          </div>
        </div>

        {/* Projection curve */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PROJECTION CURVE</div>
          {p.projections.map(proj => {
            const barWidth = Math.max(0, (proj.ovr / 100) * 100);
            return (
              <div key={proj.age} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 35, fontSize: 10, color: '#6b7280', textAlign: 'right' }}>Age {proj.age}</div>
                <div style={{ flex: 1, height: 18, background: '#0a0f1a', border: '1px solid #1f2937', position: 'relative' }}>
                  <div style={{ width: `${barWidth}%`, height: '100%', background: proj.age <= p.peakAge ? '#22c55e44' : '#ef444444', borderRight: `2px solid ${proj.age <= p.peakAge ? '#22c55e' : '#ef4444'}` }} />
                  <span style={{ position: 'absolute', right: 4, top: 1, fontSize: 10, fontWeight: 700, color: '#e5e7eb' }}>{proj.ovr} OVR</span>
                </div>
                <div style={{ width: 50, fontSize: 10, color: '#3b82f6', textAlign: 'right' }}>{proj.war.toFixed(1)} WAR</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All players summary */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginTop: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>ROSTER AGING OVERVIEW</div>
        {data.players.map(player => (
          <div key={player.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 10px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ width: 140, fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{player.name}</div>
            <div style={{ width: 30, fontSize: 10, color: '#6b7280' }}>{player.position}</div>
            <div style={{ width: 40, fontSize: 10, color: '#e5e7eb' }}>Age {player.age}</div>
            <div style={{ width: 50, fontSize: 10, fontWeight: 700, color: player.currentOVR >= 80 ? '#22c55e' : '#f59e0b' }}>{player.currentOVR} OVR</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getCategoryColor(player.category) + '22', color: getCategoryColor(player.category) }}>
                {player.category.toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: player.riskLevel === 'high' ? '#ef4444' : player.riskLevel === 'medium' ? '#f59e0b' : '#22c55e' }}>
                {player.riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
