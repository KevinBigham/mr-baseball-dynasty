/**
 * CareerMilestonesView – Career Milestones Tracker dashboard
 *
 * Bloomberg-terminal style milestone tracking with progress toward
 * career benchmarks, HOF probability, and achievement history.
 */
import { useState, useMemo } from 'react';
import {
  MilestonePlayer,
  STATUS_DISPLAY,
  getMilestoneSummary,
  generateDemoMilestones,
} from '../../engine/history/careerMilestones';

export default function CareerMilestonesView() {
  const players = useMemo(() => generateDemoMilestones(), []);
  const summary = useMemo(() => getMilestoneSummary(players), [players]);
  const [selected, setSelected] = useState<MilestonePlayer | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CAREER MILESTONES TRACKER — LEGACY WATCH
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players', value: summary.totalPlayers },
          { label: 'Achieved', value: summary.achievedThisSeason, color: '#22c55e' },
          { label: 'Imminent', value: summary.imminent, color: '#4ade80' },
          { label: 'Next Up', value: summary.nextMilestone },
          { label: 'Best HOF', value: summary.highestHOFProb, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Yrs</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Achieved</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Imminent</th>
                <th style={{ textAlign: 'center', padding: 6 }}>HOF%</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>
                    {p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team} · {p.position}</span>
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.age}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.yearsPlayed}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{p.achievedCount}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.imminentCount > 0 ? '#4ade80' : '#444', fontWeight: 700 }}>{p.imminentCount}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.hofProbability >= 80 ? '#22c55e' : p.hofProbability >= 50 ? '#f59e0b' : '#888', fontWeight: 700 }}>
                    {p.hofProbability}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.position}</span>
              </div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
                Age {selected.age} · {selected.yearsPlayed} years · HOF: <span style={{ color: selected.hofProbability >= 80 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{selected.hofProbability}%</span>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>MILESTONE TRACKER</div>
              {selected.milestones.map((m, i) => {
                const sd = STATUS_DISPLAY[m.status];
                const pct = m.threshold > 0 ? Math.min(100, (m.current / m.threshold) * 100) : 100;
                return (
                  <div key={i} className="bloomberg-border" style={{ padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>{m.milestone}</span>
                      <span style={{ color: sd.color, fontWeight: 700, fontSize: 10 }}>{sd.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, marginBottom: 6 }}>
                      <span>Current: <span style={{ color: '#ccc', fontWeight: 700 }}>{m.current.toLocaleString()}</span></span>
                      <span>Remaining: <span style={{ color: m.remaining > 0 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{m.remaining}</span></span>
                      <span>ETA: <span style={{ color: '#888' }}>{m.eta}</span></span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ background: '#111', height: 10, borderRadius: 2 }}>
                      <div style={{
                        background: m.status === 'achieved' ? '#22c55e' : m.status === 'imminent' ? '#4ade80' : '#f59e0b',
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 9, color: '#666', marginTop: 2 }}>
                      {pct.toFixed(1)}% · Pace: {m.pace.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 10 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view milestone tracker
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
