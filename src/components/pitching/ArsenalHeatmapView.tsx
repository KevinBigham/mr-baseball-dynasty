/**
 * ArsenalHeatmapView – Pitch Arsenal Heatmap dashboard
 *
 * Bloomberg-terminal style 5x5 zone heatmaps per pitch type,
 * showing usage, whiff rate, wOBA, and zone command.
 */
import { useState, useMemo } from 'react';
import {
  ArsenalHeatmapProfile,
  PitchArsenalMap,
  getArsenalHeatmapSummary,
  generateDemoArsenalHeatmap,
  getWhiffHeatColor,
  getWobaHeatColor,
  getZoneLabel,
} from '../../engine/pitching/pitchArsenalHeatmap';

type HeatMode = 'whiff' | 'woba' | 'usage';

export default function ArsenalHeatmapView() {
  const profiles = useMemo(() => generateDemoArsenalHeatmap(), []);
  const summary = useMemo(() => getArsenalHeatmapSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<ArsenalHeatmapProfile | null>(null);
  const [activePitch, setActivePitch] = useState<PitchArsenalMap | null>(null);
  const [heatMode, setHeatMode] = useState<HeatMode>('whiff');

  const handleSelectPitcher = (p: ArsenalHeatmapProfile) => {
    setSelected(p);
    setActivePitch(p.pitchMaps[0] ?? null);
  };

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH ARSENAL HEATMAP — ZONE COMMAND ANALYSIS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Most Types', value: `${summary.mostPitches.name} (${summary.mostPitches.count})` },
          { label: 'Best Ctrl', value: summary.bestZoneControl, color: '#22c55e' },
          { label: 'Avg Types', value: summary.avgPitchTypes },
          { label: 'Best Whiff', value: `${summary.bestWhiffPitch.name} ${summary.bestWhiffPitch.pitch}`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Pitcher List */}
        <div style={{ flex: '1 1 280px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Types</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Best</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Worst</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr
                  key={p.id}
                  onClick={() => handleSelectPitcher(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>
                    {p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team} · {p.role} · {p.throws}HP</span>
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.pitchMaps.length}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#22c55e', fontSize: 10 }}>{p.bestZone}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ef4444', fontSize: 10 }}>{p.worstZone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 520px' }}>
          {selected && activePitch ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.role} · {selected.throws}HP
                </span>
              </div>

              {/* Pitch Type Selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {selected.pitchMaps.map(pm => (
                  <button
                    key={pm.pitchType}
                    onClick={() => setActivePitch(pm)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      background: activePitch.pitchType === pm.pitchType ? '#2563eb' : '#1a1a2e',
                      color: activePitch.pitchType === pm.pitchType ? '#fff' : '#888',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      fontWeight: activePitch.pitchType === pm.pitchType ? 700 : 400,
                    }}
                  >
                    {pm.pitchType} ({pm.avgVelo} mph · {pm.usagePct}%)
                  </button>
                ))}
              </div>

              {/* Heat Mode Toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['whiff', 'woba', 'usage'] as HeatMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setHeatMode(mode)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      background: heatMode === mode ? '#f59e0b' : '#111',
                      color: heatMode === mode ? '#000' : '#666',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      fontWeight: heatMode === mode ? 700 : 400,
                    }}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* 5x5 Zone Grid */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, maxWidth: 320 }}>
                  {activePitch.zones.map(z => {
                    const val = heatMode === 'whiff' ? z.whiffPct : heatMode === 'woba' ? z.wOBA : z.usagePct;
                    const bg = heatMode === 'whiff' ? getWhiffHeatColor(z.whiffPct) : heatMode === 'woba' ? getWobaHeatColor(z.wOBA) : getWhiffHeatColor(z.usagePct * 4);
                    const display = heatMode === 'woba' ? z.wOBA.toFixed(3).slice(1) : val.toFixed(1);
                    return (
                      <div
                        key={`${z.row}-${z.col}`}
                        title={`${getZoneLabel(z.row, z.col)}\nWhiff: ${z.whiffPct}%\nCSE: ${z.csePct}%\nwOBA: ${z.wOBA}\nEV: ${z.avgEV}`}
                        style={{
                          background: bg,
                          opacity: 0.85,
                          padding: '8px 4px',
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          borderRadius: 2,
                        }}
                      >
                        {display}
                      </div>
                    );
                  })}
                </div>
                <div style={{ color: '#555', fontSize: 9, marginTop: 4 }}>
                  {heatMode === 'whiff' ? 'Whiff% (red=high)' : heatMode === 'woba' ? 'wOBA (red=bad for pitcher)' : 'Usage% (red=high)'}
                </div>
              </div>

              {/* Pitch Stats */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH STATS</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>{activePitch.avgVelo}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Avg Velo</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: activePitch.overallWhiff >= 30 ? '#ef4444' : activePitch.overallWhiff >= 20 ? '#f59e0b' : '#ccc', fontWeight: 700, fontSize: 16 }}>
                    {activePitch.overallWhiff}%
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>Whiff Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{activePitch.usagePct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Usage</div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view arsenal heatmaps
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
