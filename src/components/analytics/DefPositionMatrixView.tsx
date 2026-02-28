/**
 * DefPositionMatrixView – Defensive Positioning Matrix dashboard
 *
 * Bloomberg-terminal style field zone diagram with efficiency bars,
 * total DRS display, shift rate indicator, and positioning grade badge.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoDefPositioning,
  getEfficiencyColor,
  getDRSColor,
  getGradeColor,
  type TeamDefPositioning,
  type ZoneEfficiency,
} from '../../engine/analytics/defensivePositioningMatrix';

const PANEL = '#111827';
const BORDER = '#374151';
const BG = '#030712';
const ACCENT = '#f59e0b';
const DIM = '#6b7280';
const TEXT = '#e5e7eb';

type ViewMode = 'field' | 'table';

export default function DefPositionMatrixView() {
  const data = useMemo(() => generateDemoDefPositioning(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('field');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <div style={{ padding: 18, color: TEXT, fontFamily: 'monospace', fontSize: 13, background: BG, minHeight: '100%' }}>
      <div style={{
        fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: ACCENT,
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 14,
      }}>
        DEFENSIVE POSITIONING MATRIX — {data.teamName.toUpperCase()}
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Total DRS */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '10px 18px',
          textAlign: 'center', minWidth: 110,
        }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 2 }}>TOTAL DRS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: getDRSColor(data.totalDRS) }}>
            {data.totalDRS > 0 ? '+' : ''}{data.totalDRS}
          </div>
        </div>

        {/* Shift Rate */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '10px 18px',
          textAlign: 'center', minWidth: 110,
        }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 2 }}>SHIFT RATE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: ACCENT }}>{data.shiftRate}%</div>
          <div style={{
            height: 4, background: '#1f2937', borderRadius: 2, marginTop: 4, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${data.shiftRate}%`, background: ACCENT, borderRadius: 2,
            }} />
          </div>
        </div>

        {/* Positioning Grade */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '10px 18px',
          textAlign: 'center', minWidth: 110,
        }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 2 }}>GRADE</div>
          <div style={{
            fontSize: 24, fontWeight: 700,
            color: getGradeColor(data.positioningGrade),
          }}>
            {data.positioningGrade}
          </div>
        </div>

        {/* Best zone */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '10px 18px',
          textAlign: 'center', minWidth: 120,
        }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 2 }}>BEST ZONE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{data.bestZone}</div>
        </div>

        {/* Worst zone */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '10px 18px',
          textAlign: 'center', minWidth: 120,
        }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 2 }}>WORST ZONE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{data.worstZone}</div>
        </div>
      </div>

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['field', 'table'] as const).map(m => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            style={{
              background: viewMode === m ? ACCENT : PANEL,
              color: viewMode === m ? BG : TEXT,
              border: `1px solid ${viewMode === m ? ACCENT : BORDER}`,
              padding: '5px 14px', fontSize: 11, fontFamily: 'monospace',
              fontWeight: viewMode === m ? 700 : 400, cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {m === 'field' ? 'Field View' : 'Table View'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Main view */}
        <div style={{ flex: '1 1 500px' }}>
          {viewMode === 'field'
            ? <FieldDiagram data={data} hoveredZone={hoveredZone} setHoveredZone={setHoveredZone} />
            : <TableView data={data} />
          }
        </div>

        {/* Zone detail panel */}
        <div style={{ flex: '0 0 240px' }}>
          <ZoneDetail data={data} hoveredZone={hoveredZone} />

          {/* Notes */}
          <div style={{
            background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginTop: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>
              NOTES
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.5 }}>
              {data.notes}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginTop: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
              EFFICIENCY LEGEND
            </div>
            {[
              { label: 'Elite (115%+)', color: '#22c55e' },
              { label: 'Above Avg (105-115%)', color: '#3b82f6' },
              { label: 'Average (95-105%)', color: '#f59e0b' },
              { label: 'Below Avg (85-95%)', color: '#f97316' },
              { label: 'Poor (<85%)', color: '#ef4444' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 12, height: 12, backgroundColor: l.color,
                  border: `1px solid ${BORDER}`, borderRadius: 2,
                }} />
                <span style={{ fontSize: 10, color: TEXT }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Field Diagram ────────────────────────────────────────────────────── */

function FieldDiagram({ data, hoveredZone, setHoveredZone }: {
  data: TeamDefPositioning;
  hoveredZone: string | null;
  setHoveredZone: (z: string | null) => void;
}) {
  // 3 rows x 5 cols grid representing the field
  const rows = [0, 1, 2];
  const cols = [0, 1, 2, 3, 4];

  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`, padding: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
        FIELD ZONE EFFICIENCY
      </div>
      <div style={{ marginBottom: 6, fontSize: 10, color: DIM, textAlign: 'center' }}>
        OUTFIELD
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {rows.flatMap(r =>
          cols.map(c => {
            const zone = data.zones.find(z => z.gridRow === r && z.gridCol === c);
            if (!zone) return <div key={`${r}-${c}`} />;
            const isHovered = hoveredZone === zone.zone;
            return (
              <div
                key={zone.zone}
                onMouseEnter={() => setHoveredZone(zone.zone)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{
                  background: isHovered ? '#1f2937' : BG,
                  border: `2px solid ${isHovered ? ACCENT : getEfficiencyColor(zone.efficiencyPct)}`,
                  padding: 8, textAlign: 'center', cursor: 'pointer',
                  minHeight: 72, display: 'flex', flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ fontSize: 9, color: DIM, marginBottom: 3 }}>
                  {zone.shortLabel}
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: getEfficiencyColor(zone.efficiencyPct),
                }}>
                  {zone.efficiencyPct}%
                </div>
                <div style={{
                  fontSize: 9, marginTop: 2,
                  color: zone.rangeRunsSaved >= 0 ? '#22c55e' : '#ef4444',
                }}>
                  {zone.rangeRunsSaved > 0 ? '+' : ''}{zone.rangeRunsSaved} RRS
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: DIM, textAlign: 'center' }}>
        INFIELD
      </div>
    </div>
  );
}

/* ── Table View ───────────────────────────────────────────────────────── */

function TableView({ data }: { data: TeamDefPositioning }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`, padding: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
        ZONE EFFICIENCY TABLE
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, color: DIM }}>
            <th style={{ textAlign: 'left', padding: 5 }}>Zone</th>
            <th style={{ textAlign: 'center', padding: 5 }}>Outs</th>
            <th style={{ textAlign: 'center', padding: 5 }}>xOuts</th>
            <th style={{ textAlign: 'center', padding: 5 }}>Eff%</th>
            <th style={{ textAlign: 'left', padding: 5, minWidth: 100 }}>Bar</th>
            <th style={{ textAlign: 'center', padding: 5 }}>RRS</th>
          </tr>
        </thead>
        <tbody>
          {data.zones.map((z: ZoneEfficiency) => {
            const barW = Math.min(100, (z.efficiencyPct / 130) * 100);
            return (
              <tr key={z.zone} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: 5, color: TEXT, fontWeight: 600 }}>{z.shortLabel}</td>
                <td style={{ padding: 5, textAlign: 'center', color: '#d1d5db' }}>{z.outsMade}</td>
                <td style={{ padding: 5, textAlign: 'center', color: DIM }}>{z.expectedOuts}</td>
                <td style={{
                  padding: 5, textAlign: 'center', fontWeight: 700,
                  color: getEfficiencyColor(z.efficiencyPct),
                }}>
                  {z.efficiencyPct}%
                </td>
                <td style={{ padding: 5 }}>
                  <div style={{ height: 8, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${barW}%`, borderRadius: 3,
                      background: getEfficiencyColor(z.efficiencyPct),
                    }} />
                  </div>
                </td>
                <td style={{
                  padding: 5, textAlign: 'center', fontWeight: 700,
                  color: z.rangeRunsSaved >= 0 ? '#22c55e' : '#ef4444',
                }}>
                  {z.rangeRunsSaved > 0 ? '+' : ''}{z.rangeRunsSaved}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Zone Detail Panel ────────────────────────────────────────────────── */

function ZoneDetail({ data, hoveredZone }: {
  data: TeamDefPositioning;
  hoveredZone: string | null;
}) {
  const zone = hoveredZone
    ? data.zones.find(z => z.zone === hoveredZone)
    : null;

  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`, padding: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
        ZONE DETAIL
      </div>
      {zone ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
            {zone.zone}
          </div>
          {[
            { label: 'Outs Made', value: zone.outsMade },
            { label: 'Expected Outs', value: zone.expectedOuts },
            { label: 'Efficiency', value: `${zone.efficiencyPct}%`, color: getEfficiencyColor(zone.efficiencyPct) },
            { label: 'Range Runs Saved', value: `${zone.rangeRunsSaved > 0 ? '+' : ''}${zone.rangeRunsSaved}`, color: zone.rangeRunsSaved >= 0 ? '#22c55e' : '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 5,
              fontSize: 11,
            }}>
              <span style={{ color: DIM }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: item.color ?? TEXT }}>{item.value}</span>
            </div>
          ))}
        </>
      ) : (
        <div style={{ fontSize: 11, color: DIM }}>
          Hover over a zone in the field view to see details.
        </div>
      )}
    </div>
  );
}
