import { useState } from 'react';
import { generateDemoDeadlineIndex, STATUS_DISPLAY, CONTRACT_DISPLAY, getDeadlineValueColor, type TeamDeadlineProfile } from '../../engine/trade/deadlineValueIndex';

const data = generateDemoDeadlineIndex();

export default function DeadlineValueView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const team = data[selectedIdx];
  const status = STATUS_DISPLAY[team.status];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>TRADE DEADLINE VALUE INDEX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Asset valuation, contention status, and projected returns</p>
      </div>

      {/* Team selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((t, i) => (
          <button key={t.teamId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'STATUS', value: status.label, color: status.color },
          { label: 'RECORD', value: team.record, color: '#e5e7eb' },
          { label: 'GAMES BACK', value: team.gamesBack === 0 ? 'LEAD' : String(team.gamesBack), color: team.gamesBack === 0 ? '#22c55e' : team.gamesBack > 10 ? '#ef4444' : '#f59e0b' },
          { label: 'TOTAL DL VALUE', value: String(team.totalDeadlineValue), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Assets */}
      {team.assets.length > 0 ? (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TRADEABLE ASSETS — {team.teamName}</div>
          {team.assets.map(a => {
            const contractDisp = CONTRACT_DISPLAY[a.contractStatus];
            return (
              <div key={a.playerId} style={{ padding: 12, background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{a.name}</span>
                    <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{a.position} | Age {a.age}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: contractDisp.color + '22', color: contractDisp.color, border: `1px solid ${contractDisp.color}44` }}>
                      {contractDisp.label}
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 700, color: getDeadlineValueColor(a.deadlineValue) }}>{a.deadlineValue}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                  {[
                    { label: 'WAR', value: a.currentWAR.toFixed(1), color: a.currentWAR >= 2 ? '#22c55e' : '#f59e0b' },
                    { label: 'DEADLINE VAL', value: String(a.deadlineValue), color: getDeadlineValueColor(a.deadlineValue) },
                    { label: 'SCARCITY', value: `+${a.scarcityBonus}`, color: a.scarcityBonus >= 15 ? '#22c55e' : '#9ca3af' },
                    { label: 'RECENT PERF', value: String(a.recentPerformance), color: a.recentPerformance >= 70 ? '#22c55e' : '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, color: '#6b7280' }}>
                  <span style={{ fontWeight: 700 }}>PROJECTED RETURN: </span>
                  <span style={{ color: '#e5e7eb' }}>{a.projectedReturn}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 24, textAlign: 'center' }}>
          <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>BUYER — NO ASSETS FOR SALE</div>
          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>This team is looking to acquire, not sell</div>
        </div>
      )}

      {/* League overview */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEADLINE MARKET OVERVIEW</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['TEAM', 'RECORD', 'GB', 'STATUS', 'ASSETS', 'TOTAL VALUE'].map(h => (
                <th key={h} style={{ padding: '4px 8px', color: '#6b7280', fontWeight: 700, textAlign: h === 'TEAM' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => {
              const st = STATUS_DISPLAY[t.status];
              return (
                <tr key={t.teamId} onClick={() => setSelectedIdx(i)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedIdx ? '#1f2937' : 'transparent' }}>
                  <td style={{ padding: '4px 8px', color: '#e5e7eb', fontWeight: 600 }}>{t.teamName}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#9ca3af' }}>{t.record}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: t.gamesBack === 0 ? '#22c55e' : '#ef4444' }}>{t.gamesBack === 0 ? '—' : t.gamesBack}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: st.color + '22', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#e5e7eb' }}>{t.assets.length}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{t.totalDeadlineValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
