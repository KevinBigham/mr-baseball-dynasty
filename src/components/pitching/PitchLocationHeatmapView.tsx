/**
 * PitchLocationHeatmapView – Pitch Location Heatmap dashboard
 *
 * Bloomberg-terminal style 5x5 zone heatmap with color-coded cells,
 * cell click for detail, pitcher selector, summary stats, and
 * pitch count overlay toggle.
 */
import { useState, useMemo } from 'react';
import {
  HeatmapCell,
  PitcherHeatmapProfile,
  generateDemoPitchLocationHeatmap,
  getHeatmapSummary,
  getLocationLabel,
  commandColor,
  pitchCountColor,
} from '../../engine/pitching/pitchLocationHeatmap';

type OverlayMode = 'xwOBA' | 'count';

function cellBg(cell: HeatmapCell, mode: OverlayMode, maxCount: number): string {
  return mode === 'xwOBA' ? commandColor(cell.xwOBA) : pitchCountColor(cell.pitchCount, maxCount);
}

export default function PitchLocationHeatmapView() {
  const pitchers = useMemo(() => generateDemoPitchLocationHeatmap(), []);
  const summary = useMemo(() => getHeatmapSummary(pitchers), [pitchers]);
  const [pitcherIdx, setPitcherIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [overlay, setOverlay] = useState<OverlayMode>('xwOBA');

  const pitcher: PitcherHeatmapProfile = pitchers[pitcherIdx];
  const maxCount = Math.max(...pitcher.cells.map(c => c.pitchCount));

  /* Build 5x5 grid from flat array */
  const grid: HeatmapCell[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: HeatmapCell[] = [];
    for (let c = 0; c < 5; c++) {
      const found = pitcher.cells.find(cell => cell.row === r && cell.col === c);
      if (found) row.push(found);
    }
    grid.push(row);
  }

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH LOCATION HEATMAP — ZONE COMMAND ANALYSIS
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Best Command', value: `${summary.bestCommand.name} (${summary.bestCommand.score})`, color: '#22c55e' },
          { label: 'Lowest xwOBA', value: `${summary.lowestXwOBA.name}`, color: '#22c55e' },
          { label: 'Highest xwOBA', value: `${summary.highestXwOBA.name}`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Pitcher Selector ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: 11 }}>Pitcher:</span>
        {pitchers.map((p, i) => (
          <button
            key={p.pitcherId}
            onClick={() => { setPitcherIdx(i); setSelectedCell(null); }}
            style={{
              background: i === pitcherIdx ? '#f59e0b' : '#1f2937',
              color: i === pitcherIdx ? '#000' : '#ccc',
              border: '1px solid #374151',
              padding: '3px 10px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: i === pitcherIdx ? 700 : 400,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* ── Overlay Toggle ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: 11 }}>Overlay:</span>
        {(['xwOBA', 'count'] as OverlayMode[]).map(m => (
          <button
            key={m}
            onClick={() => setOverlay(m)}
            style={{
              background: overlay === m ? '#f59e0b' : '#1f2937',
              color: overlay === m ? '#000' : '#ccc',
              border: '1px solid #374151',
              padding: '2px 10px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: overlay === m ? 700 : 400,
            }}
          >
            {m === 'xwOBA' ? 'xwOBA (command)' : 'Pitch Count'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Heatmap Grid ────────────────────────────────────────────── */}
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>
            STRIKE ZONE — {pitcher.name.toUpperCase()}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 64px)',
            gridTemplateRows: 'repeat(5, 64px)',
            gap: 2,
            border: '2px solid #374151',
            borderRadius: 4,
            padding: 2,
            background: '#030712',
          }}>
            {grid.flat().map(cell => {
              const bg = cellBg(cell, overlay, maxCount);
              const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
              return (
                <div
                  key={`${cell.row}-${cell.col}`}
                  onClick={() => setSelectedCell(cell)}
                  style={{
                    width: 64,
                    height: 64,
                    background: bg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: isSelected ? '2px solid #fff' : '1px solid #374151',
                    opacity: isSelected ? 1 : 0.85,
                    transition: 'opacity 0.1s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                    {overlay === 'xwOBA' ? cell.xwOBA.toFixed(3) : cell.pitchCount}
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>
                    {overlay === 'xwOBA' ? `${cell.pitchCount}p` : `${cell.whiffRate}%W`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 8, fontSize: 10, color: '#888', display: 'flex', gap: 12 }}>
            {overlay === 'xwOBA' ? (
              <>
                <span><span style={{ color: '#22c55e' }}>&#9632;</span> Good command</span>
                <span><span style={{ color: '#facc15' }}>&#9632;</span> Average</span>
                <span><span style={{ color: '#ef4444' }}>&#9632;</span> Gets hit</span>
              </>
            ) : (
              <>
                <span><span style={{ color: '#3b82f6' }}>&#9632;</span> High freq</span>
                <span><span style={{ color: '#6366f1' }}>&#9632;</span> Medium</span>
                <span><span style={{ color: '#1e293b' }}>&#9632;</span> Low freq</span>
              </>
            )}
          </div>
        </div>

        {/* ── Detail Panel ────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 280px' }}>
          {/* Pitcher Summary */}
          <div className="bloomberg-border" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
              {pitcher.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: '#888' }}>Command: </span>
                <span style={{ color: pitcher.overallCommand >= 80 ? '#22c55e' : pitcher.overallCommand >= 70 ? '#facc15' : '#ef4444', fontWeight: 700 }}>
                  {pitcher.overallCommand}/100
                </span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Favorite: </span>
                <span style={{ color: '#22c55e' }}>{pitcher.favoriteLoc}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Avoid: </span>
                <span style={{ color: '#ef4444' }}>{pitcher.avoidLoc}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Zones: </span>
                <span>5x5 (25)</span>
              </div>
            </div>
          </div>

          {/* Selected Cell Detail */}
          {selectedCell ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                {getLocationLabel(selectedCell.row, selectedCell.col)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#888' }}>Pitch Count: </span>
                  <span style={{ fontWeight: 700 }}>{selectedCell.pitchCount}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Whiff Rate: </span>
                  <span style={{ fontWeight: 700 }}>{selectedCell.whiffRate}%</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>xwOBA: </span>
                  <span style={{ color: commandColor(selectedCell.xwOBA), fontWeight: 700 }}>
                    {selectedCell.xwOBA.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Avg Velo: </span>
                  <span style={{ fontWeight: 700 }}>{selectedCell.avgVelo} mph</span>
                </div>
              </div>

              {/* Visual bar for xwOBA */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>xwOBA Spectrum</div>
                <div style={{ background: '#1f2937', height: 10, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${Math.min(selectedCell.xwOBA / 0.500 * 100, 100)}%`,
                    height: '100%',
                    background: commandColor(selectedCell.xwOBA),
                    borderRadius: 5,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#666', marginTop: 2 }}>
                  <span>.000</span>
                  <span>.250</span>
                  <span>.500</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 14, textAlign: 'center', color: '#666' }}>
              Click a zone cell for details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
