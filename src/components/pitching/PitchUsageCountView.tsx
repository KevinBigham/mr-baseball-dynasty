/**
 * PitchUsageCountView – Pitch Usage Heatmap by Count dashboard
 *
 * Bloomberg-terminal style 4x3 heatmap grid showing pitch type distribution
 * per ball-strike count. Color-coded cells indicate dominant pitch category.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoPitchUsageByCount,
  getPitchUsageCountSummary,
  getDominantColor,
  getDominantAlpha,
  type PitcherUsageProfile,
  type PitchUsageCell,
} from '../../engine/pitching/pitchUsageByCount';

const PANEL = '#111827';
const BORDER = '#374151';
const BG = '#030712';
const ACCENT = '#f59e0b';
const DIM = '#6b7280';
const TEXT = '#e5e7eb';

function cellBg(cell: PitchUsageCell): string {
  const color = getDominantColor(cell);
  const alpha = getDominantAlpha(cell);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function PitchUsageCountView() {
  const profiles = useMemo(() => generateDemoPitchUsageByCount(), []);
  const summary = useMemo(() => getPitchUsageCountSummary(profiles), [profiles]);
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.pitcherId ?? '');

  const selected: PitcherUsageProfile | undefined = profiles.find(p => p.pitcherId === selectedId);

  // Build a 4 (balls 0-3) x 3 (strikes 0-2) grid
  const grid: (PitchUsageCell | null)[][] = [];
  for (let b = 0; b <= 3; b++) {
    const row: (PitchUsageCell | null)[] = [];
    for (let s = 0; s <= 2; s++) {
      const cell = selected?.cells.find(c => c.count === `${b}-${s}`) ?? null;
      row.push(cell);
    }
    grid.push(row);
  }

  return (
    <div style={{ padding: 18, color: TEXT, fontFamily: 'monospace', fontSize: 13, background: BG, minHeight: '100%' }}>
      <div style={{
        fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: ACCENT,
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 14,
      }}>
        PITCH USAGE BY COUNT — HEATMAP ANALYSIS
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Avg 1st Pitch FB%', value: `${summary.avgFirstPitchFB}%` },
          { label: 'Avg 2-Strike FB%', value: `${summary.avg2StrikeFB}%` },
          { label: 'Most FB Heavy', value: summary.mostFBHeavy, color: '#ef4444' },
          { label: 'Most BRK Heavy', value: summary.mostBreakingHeavy, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{
            background: PANEL, border: `1px solid ${BORDER}`, padding: '8px 14px',
            minWidth: 110, textAlign: 'center',
          }}>
            <div style={{ color: DIM, fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? ACCENT, fontSize: 15, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pitcher selector buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {profiles.map(p => (
          <button
            key={p.pitcherId}
            onClick={() => setSelectedId(p.pitcherId)}
            style={{
              background: selectedId === p.pitcherId ? ACCENT : PANEL,
              color: selectedId === p.pitcherId ? BG : TEXT,
              border: `1px solid ${selectedId === p.pitcherId ? ACCENT : BORDER}`,
              padding: '6px 12px', fontSize: 11, fontFamily: 'monospace',
              fontWeight: selectedId === p.pitcherId ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {p.name} ({p.team} · {p.throws}HP)
          </button>
        ))}
      </div>

      {selected && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Heatmap grid */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: DIM }}>
              STRIKES {'\u2192'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: 3 }}>
              {/* Column headers */}
              <div style={{ padding: 6 }} />
              {[0, 1, 2].map(s => (
                <div key={`sh-${s}`} style={{
                  padding: 6, textAlign: 'center', fontSize: 11, fontWeight: 700, color: DIM,
                }}>
                  {s} STR
                </div>
              ))}

              {/* Rows by balls */}
              {grid.map((row, b) => (
                <>
                  <div key={`bh-${b}`} style={{
                    padding: 6, fontSize: 11, fontWeight: 700, color: DIM,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {b}B
                  </div>
                  {row.map((cell, s) => (
                    <div key={`${b}-${s}`} style={{
                      background: cell ? cellBg(cell) : PANEL,
                      border: `1px solid ${BORDER}`,
                      padding: 8, textAlign: 'center', minHeight: 70,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}>
                      {cell && (
                        <>
                          <div style={{ fontSize: 10, color: '#d1d5db', marginBottom: 4, fontWeight: 700 }}>
                            {cell.count}
                          </div>
                          <div style={{ fontSize: 11, color: '#fca5a5' }}>
                            FB {cell.fastballPct}%
                          </div>
                          <div style={{ fontSize: 11, color: '#93c5fd' }}>
                            BRK {cell.breakingPct}%
                          </div>
                          <div style={{ fontSize: 11, color: '#86efac' }}>
                            OFF {cell.offspeedPct}%
                          </div>
                          <div style={{ fontSize: 9, color: DIM, marginTop: 3 }}>
                            n={cell.sampleSize}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </>
              ))}
            </div>

            <div style={{ fontSize: 10, color: DIM, marginTop: 4 }}>
              {'\u2191'} BALLS
            </div>
          </div>

          {/* Right panel: legend + tendency */}
          <div style={{ flex: '0 0 220px' }}>
            {/* Legend */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
                LEGEND
              </div>
              {[
                { label: 'Fastball Heavy', color: '#ef4444' },
                { label: 'Breaking Heavy', color: '#3b82f6' },
                { label: 'Offspeed Heavy', color: '#22c55e' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{
                    width: 14, height: 14, backgroundColor: l.color, opacity: 0.7,
                    border: `1px solid ${BORDER}`,
                  }} />
                  <span style={{ fontSize: 11, color: TEXT }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Tendency note */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`, padding: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>
                TENDENCY
              </div>
              <div style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.5 }}>
                {selected.tendencyNote}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginTop: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>
                QUICK STATS
              </div>
              {(() => {
                const firstPitch = selected.cells.find(c => c.count === '0-0');
                const fullCount = selected.cells.find(c => c.count === '3-2');
                return (
                  <>
                    <div style={{ fontSize: 11, color: '#d1d5db', marginBottom: 4 }}>
                      0-0 FB%: <span style={{ color: '#fca5a5', fontWeight: 700 }}>{firstPitch?.fastballPct ?? '-'}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#d1d5db', marginBottom: 4 }}>
                      3-2 FB%: <span style={{ color: '#fca5a5', fontWeight: 700 }}>{fullCount?.fastballPct ?? '-'}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#d1d5db' }}>
                      3-2 BRK%: <span style={{ color: '#93c5fd', fontWeight: 700 }}>{fullCount?.breakingPct ?? '-'}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
