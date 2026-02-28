/**
 * PitchCommandView – Pitch command analysis dashboard
 *
 * Bloomberg-terminal style view showing pitch location accuracy,
 * command grades by pitch type, and fatigue effects.
 */
import { useState, useMemo } from 'react';
import {
  CommandProfile,
  COMMAND_DISPLAY,
  getCommandSummary,
  generateDemoCommand,
} from '../../engine/pitching/pitchCommand';

export default function PitchCommandView() {
  const profiles = useMemo(() => generateDemoCommand(), []);
  const summary = useMemo(() => getCommandSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<CommandProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH COMMAND — LOCATION ACCURACY
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Zone%', value: `${summary.teamZoneRate}%` },
          { label: 'Team Edge%', value: `${summary.teamEdgeRate}%` },
          { label: 'FP Strike%', value: `${summary.teamFPStrikeRate}%` },
          { label: 'Elite Command', value: summary.eliteCommandCount, color: '#22c55e' },
          { label: 'Wild Arms', value: summary.wildCount, color: '#ef4444' },
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
                <th style={{ textAlign: 'center', padding: 6 }}>Zone%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Edge%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FPS%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>BB%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const cd = COMMAND_DISPLAY[p.overallCommandGrade];
                return (
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
                    <td style={{ padding: 6, textAlign: 'center', color: p.zoneRate >= 48 ? '#22c55e' : '#ccc' }}>{p.zoneRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.edgeRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.firstPitchStrikeRate >= 65 ? '#22c55e' : '#ccc' }}>{p.firstPitchStrikeRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.walkRate > 7 ? '#ef4444' : '#ccc' }}>{p.walkRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.wildPitchCount}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: cd.color, fontWeight: 600 }}>{cd.emoji} {cd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.pos} · OVR {selected.overall}
                </span>
              </div>
              <div style={{ color: COMMAND_DISPLAY[selected.overallCommandGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {COMMAND_DISPLAY[selected.overallCommandGrade].emoji} {COMMAND_DISPLAY[selected.overallCommandGrade].label}
              </div>

              {/* Overall stats */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Pitches', value: selected.totalPitches.toLocaleString() },
                  { label: 'HBP%', value: `${selected.hitByPitchRate}%` },
                  { label: 'Fatigue Drop', value: `${selected.fatigueCommandDrop}pts`, color: selected.fatigueCommandDrop > 8 ? '#ef4444' : '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pitch-by-pitch command */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>COMMAND BY PITCH TYPE</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>N</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Zone%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Edge%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Chase%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitchCommands.map(pc => {
                    const cg = COMMAND_DISPLAY[pc.commandGrade];
                    return (
                      <tr key={pc.pitchType} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, fontWeight: 600 }}>{pc.pitchType}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{pc.thrown}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{pc.zoneRate}%</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{pc.edgeRate}%</td>
                        <td style={{ padding: 4, textAlign: 'center', color: '#3b82f6' }}>{pc.chaseInduced}%</td>
                        <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b' }}>{pc.whiffRate}%</td>
                        <td style={{ padding: 4, textAlign: 'center', color: cg.color, fontSize: 10 }}>{cg.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Miss heatmap */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>MISS DISTRIBUTION</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(selected.missHeatmap).map(([zone, pct]) => (
                  <div key={zone} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 30, background: '#111', position: 'relative', border: '1px solid #222' }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${pct}%`,
                        background: zone === 'wild' ? '#ef4444' : zone === 'waste' ? '#f97316' : zone === 'chase' ? '#eab308' : '#3b82f6',
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{zone}</div>
                    <div style={{ fontSize: 10, color: '#ccc' }}>{pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view command profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
