import { useState } from 'react';
import { generateDemoScoutReportV2, getThreatColor } from '../../engine/scouting/scoutReportV2';

const data = generateDemoScoutReportV2();

export default function ScoutReportV2View() {
  const [tab, setTab] = useState<'pitchers' | 'batters'>('pitchers');

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>ADVANCE SCOUT REPORT</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>vs. {data.opponentTeam} — {data.gameDate}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'OPPONENT', value: data.opponentTeam, color: '#e5e7eb' },
          { label: 'PITCHERS SCOUTED', value: data.pitcherReports.length, color: '#3b82f6' },
          { label: 'BATTERS SCOUTED', value: data.batterReports.length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Team tendencies */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TEAM TENDENCIES</div>
        {data.teamTendencies.map((t, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9ca3af', padding: '3px 0', borderBottom: i < data.teamTendencies.length - 1 ? '1px solid #1f2937' : 'none' }}>
            ▸ {t}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['pitchers', 'batters'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 14px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: tab === t ? '#f59e0b22' : '#111827', border: `1px solid ${tab === t ? '#f59e0b' : '#374151'}`, color: tab === t ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'pitchers' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>PITCHER SCOUTING REPORTS</div>
          {data.pitcherReports.map(p => (
            <div key={p.name} style={{ padding: '12px 14px', marginBottom: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{p.team}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>THREAT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: getThreatColor(p.overallThreat) }}>{p.overallThreat}</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontWeight: 700 }}>ARSENAL</div>
                {p.pitches.map(pitch => (
                  <div key={pitch.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 2, background: '#111827', border: '1px solid #1f2937' }}>
                    <div style={{ width: 70, fontSize: 10, fontWeight: 600, color: '#e5e7eb' }}>{pitch.name}</div>
                    <div style={{ width: 50, fontSize: 10, color: '#3b82f6' }}>{pitch.velocity} mph</div>
                    <div style={{ width: 40, fontSize: 10, color: '#6b7280' }}>{pitch.usage}%</div>
                    <div style={{ width: 50, fontSize: 10, color: pitch.whiffPct >= 30 ? '#22c55e' : '#f59e0b' }}>{pitch.whiffPct}% whiff</div>
                    <div style={{ flex: 1, fontSize: 9, color: '#ef4444', textAlign: 'right' }}>{pitch.weakness}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontWeight: 700 }}>TENDENCIES</div>
                {p.tendencies.map((t, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#9ca3af', padding: '2px 0' }}>▸ {t}</div>
                ))}
              </div>
              <div style={{ padding: '6px 8px', background: '#ef444422', border: '1px solid #ef4444', fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                KEY: {p.exploitableWeakness}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'batters' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>BATTER SCOUTING REPORTS</div>
          {data.batterReports.map(b => (
            <div key={b.name} style={{ padding: '12px 14px', marginBottom: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{b.name}</span>
                  <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{b.team}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>THREAT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: getThreatColor(b.overallThreat) }}>{b.overallThreat}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'CHASE RATE', value: `${b.chaseRate}%`, color: b.chaseRate >= 25 ? '#22c55e' : '#f59e0b' },
                  { label: 'PULL %', value: `${b.pullTendency}%`, color: '#ef4444' },
                  { label: 'WEAK PITCH', value: b.weakPitchType, color: '#3b82f6' },
                  { label: 'HOT ZONES', value: b.hotZones.length, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 6, background: '#111827', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: 7, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 10, marginBottom: 4 }}>
                <div>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>HOT: </span>
                  <span style={{ color: '#9ca3af' }}>{b.hotZones.join(', ')}</span>
                </div>
                <div>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>COLD: </span>
                  <span style={{ color: '#9ca3af' }}>{b.coldZones.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
