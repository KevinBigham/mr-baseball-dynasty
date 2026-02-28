/**
 * PitchDesignLabView – Pitch design laboratory dashboard
 *
 * Bloomberg-terminal style pitch development tracker with prototype
 * progress, movement targets, and session results.
 */
import { useState, useMemo } from 'react';
import {
  PitcherLabProfile,
  DEV_STATUS_DISPLAY,
  getLabSummary,
  generateDemoPitchDesign,
} from '../../engine/pitching/pitchDesignLab';

export default function PitchDesignLabView() {
  const profiles = useMemo(() => generateDemoPitchDesign(), []);
  const summary = useMemo(() => getLabSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<PitcherLabProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH DESIGN LAB — PROTOTYPE DEVELOPMENT
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Active Prototypes', value: summary.activePprototypes },
          { label: 'Ready to Deploy', value: summary.readyToDeploy, color: '#22c55e' },
          { label: 'Avg Progress', value: `${summary.avgProgress}%` },
          { label: 'Top Pitch', value: summary.topPitch },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Adapt</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Lab</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Protos</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.team}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.overall}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.adaptability >= 65 ? '#22c55e' : '#ccc' }}>{p.adaptability}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.labGrade.startsWith('A') ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{p.labGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.prototypes.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 460px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.pos} · OVR {selected.overall}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: '#888' }}>Current Arsenal: </span>
                <span style={{ color: '#ccc' }}>{selected.currentPitches.join(', ')}</span>
                <span style={{ color: '#888', marginLeft: 12 }}>Adaptability: </span>
                <span style={{ color: selected.adaptability >= 65 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{selected.adaptability}</span>
              </div>

              {/* Prototypes */}
              {selected.prototypes.map((proto, i) => (
                <div key={i} className="bloomberg-border" style={{ padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{proto.pitchName} <span style={{ color: '#666', fontWeight: 400, fontSize: 10 }}>({proto.baseType})</span></span>
                    <span style={{ color: DEV_STATUS_DISPLAY[proto.devStatus].color, fontWeight: 600, fontSize: 11 }}>{DEV_STATUS_DISPLAY[proto.devStatus].label}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 8, background: '#111', borderRadius: 4 }}>
                      <div style={{
                        width: `${proto.progress}%`,
                        height: '100%',
                        background: DEV_STATUS_DISPLAY[proto.devStatus].color,
                        borderRadius: 4,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#ccc', minWidth: 30 }}>{proto.progress}%</span>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    {[
                      { label: 'Grade', value: `${proto.currentGrade}→${proto.projectedGrade}` },
                      { label: 'Velo', value: `${proto.currentVelo}→${proto.targetVelo}` },
                      { label: 'Spin', value: `${proto.currentSpin}→${proto.targetSpin}` },
                      { label: 'H-Break', value: `${proto.currentHBreak}"→${proto.targetHBreak}"` },
                      { label: 'V-Break', value: `${proto.currentVBreak}"→${proto.targetVBreak}"` },
                      { label: 'Proj Whiff%', value: `${proto.projectedWhiffRate}%` },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 10 }}>{s.value}</div>
                        <div style={{ color: '#666', fontSize: 8 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 10, color: '#888' }}>
                    Sessions: {proto.sessionCount} · Last: <span style={{ color: '#ccc' }}>{proto.lastSessionResult}</span>
                  </div>
                </div>
              ))}

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 8 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view pitch design lab
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
