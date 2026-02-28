/**
 * ProspectPipelineView – Comprehensive prospect pipeline dashboard
 *
 * Bloomberg-terminal style prospect tracker with tool grades,
 * development status, ETA projections, and risk assessments.
 */
import { useState, useMemo } from 'react';
import {
  PipelineProspect,
  DEV_DISPLAY,
  RISK_DISPLAY,
  getPipelineSummary,
  generateDemoPipeline,
} from '../../engine/scouting/prospectPipeline';

export default function ProspectPipelineView() {
  const prospects = useMemo(() => generateDemoPipeline(), []);
  const summary = useMemo(() => getPipelineSummary(prospects), [prospects]);
  const [selected, setSelected] = useState<PipelineProspect | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PROSPECT PIPELINE — FARM SYSTEM INTEL
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Prospects', value: summary.totalProspects },
          { label: 'Avg Future Value', value: summary.avgFV },
          { label: 'Rising', value: summary.risingCount, color: '#22c55e' },
          { label: 'MLB Ready', value: summary.mlbReadyCount, color: '#3b82f6' },
          { label: 'FV 55+', value: summary.topTierCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Prospect List ── */}
        <div style={{ flex: '1 1 480px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Level</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const ds = DEV_DISPLAY[p.devStatus];
                const rs = RISK_DISPLAY[p.risk];
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
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.age}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.level === 'AAA' ? '#22c55e' : '#ccc' }}>{p.level}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.overallFV >= 60 ? '#f59e0b' : '#ccc', fontWeight: 700 }}>{p.overallFV}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.eta}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: ds.color }}>{ds.emoji} {ds.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: rs.color }}>{rs.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 300px' }}>
          {selected ? (() => {
            const ds = DEV_DISPLAY[selected.devStatus];
            const rs = RISK_DISPLAY[selected.risk];
            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>#{selected.orgRank} {selected.name}</span>
                    <div style={{ color: '#888', fontSize: 11 }}>{selected.pos} · Age {selected.age} · {selected.level}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>FV {selected.overallFV}</div>
                    <div style={{ color: '#888', fontSize: 10 }}>ETA: {selected.eta}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{ color: ds.color, fontWeight: 600 }}>{ds.emoji} {ds.label}</span>
                  <span style={{ color: rs.color }}>Risk: {rs.label}</span>
                </div>

                {/* Tool Grades */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOOL GRADES (20-80)</div>
                {selected.tools.map(tool => (
                  <div key={tool.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 70, color: '#888', fontSize: 11 }}>{tool.name}</span>
                    <div style={{ flex: 1, height: 8, background: '#111', borderRadius: 4, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: 8, borderRadius: 4,
                        width: `${((tool.current - 20) / 60) * 100}%`,
                        background: tool.current >= 60 ? '#22c55e' : tool.current >= 50 ? '#3b82f6' : tool.current >= 40 ? '#eab308' : '#ef4444',
                      }} />
                      <div style={{
                        position: 'absolute', top: -2, height: 12, width: 2, background: '#fff',
                        left: `${((tool.future - 20) / 60) * 100}%`,
                      }} />
                    </div>
                    <span style={{ width: 24, fontSize: 11, color: '#ccc', textAlign: 'right' }}>{tool.current}</span>
                    <span style={{ width: 24, fontSize: 11, color: '#f59e0b', textAlign: 'right' }}>{tool.future}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 2, marginBottom: 12, fontSize: 9, color: '#666' }}>
                  <span>Current</span>
                  <span style={{ color: '#f59e0b' }}>Future</span>
                </div>

                {/* Stats */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>KEY STATS</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  {Object.entries(selected.stats).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#f59e0b', fontWeight: 700 }}>{v}</div>
                      <div style={{ color: '#666', fontSize: 9 }}>{k}</div>
                    </div>
                  ))}
                </div>

                {/* Scout's Take */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUT'S TAKE</div>
                <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5, fontSize: 12 }}>
                  {selected.scouting}
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view full scouting profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
