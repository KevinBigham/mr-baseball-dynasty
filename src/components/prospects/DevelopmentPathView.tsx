/**
 * DevelopmentPathView – Prospect development plan tracker
 *
 * Bloomberg-terminal style view showing development drills,
 * progress milestones, coaching assignments, and grad timelines.
 */
import { useState, useMemo } from 'react';
import {
  ProspectDevPath,
  DRILL_DISPLAY,
  MILESTONE_DISPLAY,
  generateDemoDevPaths,
} from '../../engine/prospects/developmentPath';

export default function DevelopmentPathView() {
  const prospects = useMemo(() => generateDemoDevPaths(), []);
  const [selected, setSelected] = useState<ProspectDevPath | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DEVELOPMENT PATHS — PROSPECT TRAINING
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Prospect List ── */}
        <div style={{ flex: '1 1 360px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Level</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Focus</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const df = DRILL_DISPLAY[p.currentFocus];
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
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>#{p.orgRank}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.level}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.overallFV}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: df.color }}>{df.emoji} {df.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.projectedGrad}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 440px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>#{selected.orgRank} {selected.name}</span>
                  <div style={{ color: '#888', fontSize: 11 }}>{selected.pos} · Age {selected.age} · {selected.level} · FV {selected.overallFV}</div>
                </div>
                <div style={{ textAlign: 'right', color: '#888', fontSize: 11 }}>
                  <div>Coach: {selected.assignedCoach}</div>
                  <div>ETA: {selected.projectedGrad}</div>
                </div>
              </div>

              {/* Active Drills */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ACTIVE DRILLS</div>
              {selected.drills.map((drill, i) => {
                const dd = DRILL_DISPLAY[drill.focus];
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: dd.color }}>
                        {dd.emoji} {drill.name}
                      </span>
                      <span style={{ color: '#888', fontSize: 11 }}>{drill.weeksRemaining}w left · {drill.expectedGain}</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#111', borderRadius: 4 }}>
                      <div style={{
                        width: `${drill.progressPct}%`, height: 8, borderRadius: 4,
                        background: drill.progressPct >= 70 ? '#22c55e' : drill.progressPct >= 40 ? '#eab308' : '#3b82f6',
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#666' }}>{drill.progressPct}%</div>
                  </div>
                );
              })}

              {/* Milestones */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6, marginTop: 12 }}>DEVELOPMENT MILESTONES</div>
              {selected.milestones.map((m, i) => {
                const ms = MILESTONE_DISPLAY[m.status];
                return (
                  <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #1a1a2e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{m.label}</span>
                      <span style={{ color: ms.color, fontSize: 11 }}>{ms.label}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: 11 }}>Target: {m.targetDate} — {m.notes}</div>
                  </div>
                );
              })}

              {/* Dev Notes */}
              <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4, marginTop: 12 }}>DEVELOPMENT NOTES</div>
              <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5, fontSize: 12 }}>
                {selected.devNotes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view development plan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
