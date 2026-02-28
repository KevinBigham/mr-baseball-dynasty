/**
 * ChemistryDynamicsView – Event-driven team chemistry dashboard
 *
 * Bloomberg-terminal style view of morale, chemistry events,
 * player morale breakdown, and performance impact.
 */
import { useMemo } from 'react';
import {
  MORALE_DISPLAY,
  EVENT_DISPLAY,
  generateDemoChemistry,
} from '../../engine/clubhouse/chemistryDynamics';

export default function ChemistryDynamicsView() {
  const data = useMemo(() => generateDemoChemistry(), []);
  const morale = MORALE_DISPLAY[data.teamMorale];

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CHEMISTRY DYNAMICS — CLUBHOUSE PULSE
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="bloomberg-border" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>TEAM MORALE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: morale.color }}>
            {morale.emoji} {morale.label}
          </div>
        </div>
        {[
          { label: 'Chemistry Score', value: data.teamChemScore, color: data.teamChemScore >= 70 ? '#22c55e' : '#eab308' },
          { label: 'Performance Impact', value: `${data.performanceModifier > 0 ? '+' : ''}${data.performanceModifier}%`, color: data.performanceModifier >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Leadership Score', value: data.leadershipScore, color: data.leadershipScore >= 75 ? '#22c55e' : '#eab308' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
        <div className="bloomberg-border" style={{ padding: '8px 14px', flex: '1 1 200px' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>STREAK EFFECT</div>
          <div style={{ color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>{data.streakEffect}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Events Timeline ── */}
        <div style={{ flex: '1 1 420px' }}>
          <div className="bloomberg-border" style={{ padding: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>RECENT CHEMISTRY EVENTS</div>
            {data.recentEvents.map(ev => {
              const ed = EVENT_DISPLAY[ev.type];
              return (
                <div key={ev.id} style={{ padding: '10px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: ed.color, fontWeight: 600 }}>{ed.emoji} {ed.label}</span>
                    <span style={{ color: '#555', fontSize: 11 }}>{ev.date}</span>
                  </div>
                  <div style={{ color: '#ccc', marginBottom: 4 }}>{ev.description}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                    <span style={{ color: ev.chemistryImpact >= 0 ? '#22c55e' : '#ef4444' }}>
                      Impact: {ev.chemistryImpact > 0 ? '+' : ''}{ev.chemistryImpact}
                    </span>
                    <span style={{ color: '#888' }}>Duration: {ev.duration}</span>
                    <span style={{ color: '#666' }}>Affected: {ev.affectedPlayers.join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Player Morale ── */}
        <div style={{ flex: '1 1 380px' }}>
          <div className="bloomberg-border" style={{ padding: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>PLAYER MORALE BREAKDOWN</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Morale</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.playerMorale.map((pm, i) => {
                  const ml = MORALE_DISPLAY[pm.morale];
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{pm.name}</td>
                      <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{pm.pos}</td>
                      <td style={{ padding: 6, textAlign: 'center', color: ml.color }}>{ml.emoji} {ml.label}</td>
                      <td style={{ padding: 6, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <div style={{ width: 40, height: 6, background: '#222', borderRadius: 3 }}>
                            <div style={{
                              width: `${pm.chemScore}%`, height: 6, borderRadius: 3,
                              background: pm.chemScore >= 70 ? '#22c55e' : pm.chemScore >= 45 ? '#eab308' : '#ef4444',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#888' }}>{pm.chemScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: 6, textAlign: 'center', color: pm.recentChange > 0 ? '#22c55e' : pm.recentChange < 0 ? '#ef4444' : '#888' }}>
                        {pm.recentChange > 0 ? '+' : ''}{pm.recentChange}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Key factors */}
            <div style={{ marginTop: 12, color: '#888', fontSize: 10, marginBottom: 6 }}>KEY MORALE FACTORS</div>
            {data.playerMorale.map((pm, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                <span style={{ color: '#ccc' }}>{pm.name}</span>
                <span style={{ color: '#888' }}>{pm.keyFactor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
