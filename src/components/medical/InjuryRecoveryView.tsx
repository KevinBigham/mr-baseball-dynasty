import { useState } from 'react';
import { generateDemoInjuryRecovery, getPhaseColor, getSeverityColor, type InjuredPlayer } from '../../engine/medical/injuryRecoveryTimeline';

const data = generateDemoInjuryRecovery();

export default function InjuryRecoveryView() {
  const [selectedPlayer, setSelectedPlayer] = useState<InjuredPlayer>(data.injured[0]);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>INJURY RECOVERY TIMELINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Rehab milestones, projected return dates, and setback risk</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'ON IL', value: String(data.injured.length), color: '#ef4444' },
          { label: 'IL STINTS (SZN)', value: String(data.ilStints), color: '#f59e0b' },
          { label: 'TOTAL WAR LOST', value: data.totalWARLost.toFixed(1), color: '#ef4444' },
          { label: 'NEXT RETURN', value: data.injured.reduce((min, p) => p.daysRemaining < min.daysRemaining ? p : min).name, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Player selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.injured.map(p => (
          <button key={p.playerId} onClick={() => setSelectedPlayer(p)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: selectedPlayer.playerId === p.playerId ? '#f59e0b' : '#374151', background: selectedPlayer.playerId === p.playerId ? '#78350f' : 'transparent', color: selectedPlayer.playerId === p.playerId ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Player detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>{selectedPlayer.name}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{selectedPlayer.position} | {selectedPlayer.injury}</div>
            </div>
            <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: getSeverityColor(selectedPlayer.severity) + '22', color: getSeverityColor(selectedPlayer.severity), border: `1px solid ${getSeverityColor(selectedPlayer.severity)}44` }}>
              {selectedPlayer.severity.toUpperCase()}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>RECOVERY PROGRESS</span>
              <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{selectedPlayer.progressPct}%</span>
            </div>
            <div style={{ height: 10, background: '#1f2937', borderRadius: 4 }}>
              <div style={{ width: `${selectedPlayer.progressPct}%`, height: '100%', borderRadius: 4, background: getPhaseColor(selectedPlayer.currentPhase) }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
            {[
              { label: 'INJURED', value: selectedPlayer.injuryDate, color: '#ef4444' },
              { label: 'DAYS OUT', value: String(selectedPlayer.daysOut), color: '#f59e0b' },
              { label: 'PROJ RETURN', value: selectedPlayer.projectedReturn, color: '#22c55e' },
              { label: 'SETBACK RISK', value: `${selectedPlayer.setbackRisk}%`, color: selectedPlayer.setbackRisk > 25 ? '#ef4444' : '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>CURRENT PHASE</div>
            <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: getPhaseColor(selectedPlayer.currentPhase) + '22', color: getPhaseColor(selectedPlayer.currentPhase) }}>
              {selectedPlayer.currentPhase.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 16 }}>REHAB TIMELINE — {selectedPlayer.name}</div>

          {selectedPlayer.milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 0 }}>
              {/* Timeline connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  background: m.completed ? getPhaseColor(m.phase) : 'transparent',
                  border: `2px solid ${getPhaseColor(m.phase)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.completed && <span style={{ fontSize: 8, color: '#fff' }}>✓</span>}
                </div>
                {i < selectedPlayer.milestones.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, background: m.completed ? getPhaseColor(m.phase) + '66' : '#374151' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: m.completed ? '#e5e7eb' : '#6b7280', fontWeight: 700 }}>{m.date}</span>
                  <span style={{ padding: '0px 4px', fontSize: 8, fontWeight: 700, background: getPhaseColor(m.phase) + '22', color: getPhaseColor(m.phase) }}>
                    {m.phase.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: m.completed ? '#e5e7eb' : '#6b7280' }}>{m.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All injured players */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>INJURED LIST</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['PLAYER', 'POS', 'INJURY', 'SEVERITY', 'PHASE', 'PROGRESS', 'ETA', 'RISK'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PLAYER' || h === 'INJURY' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.injured.map(p => (
              <tr key={p.playerId} onClick={() => setSelectedPlayer(p)}
                style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selectedPlayer.playerId === p.playerId ? '#1f2937' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b' }}>{p.position}</td>
                <td style={{ padding: '4px 6px', color: '#9ca3af' }}>{p.injury}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, background: getSeverityColor(p.severity) + '22', color: getSeverityColor(p.severity) }}>
                    {p.severity.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, color: getPhaseColor(p.currentPhase) }}>
                    {p.currentPhase.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ width: 40, height: 6, background: '#1f2937', borderRadius: 2 }}>
                      <div style={{ width: `${p.progressPct}%`, height: '100%', borderRadius: 2, background: getPhaseColor(p.currentPhase) }} />
                    </div>
                    <span style={{ color: '#e5e7eb', fontSize: 10, fontWeight: 700 }}>{p.progressPct}%</span>
                  </div>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{p.projectedReturn}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: p.setbackRisk > 25 ? '#ef4444' : '#f59e0b' }}>{p.setbackRisk}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
