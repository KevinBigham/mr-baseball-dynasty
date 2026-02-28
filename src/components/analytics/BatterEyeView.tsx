import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoBatterEye,
  getZoneLabel,
  type BatterEyeProfile,
  type EyeZone,
} from '../../engine/analytics/batterEyeChart';

// ── Overlay Mode ───────────────────────────────────────────────────────────

type OverlayMode = 'swing' | 'xwoba' | 'ev';

const OVERLAY_LABELS: Record<OverlayMode, string> = {
  swing: 'SWING %',
  xwoba: 'xwOBA',
  ev: 'AVG EV',
};

// ── Color Helpers ──────────────────────────────────────────────────────────

function swingColor(pct: number): string {
  // Green = take (low swing%), Red = swing (high swing%)
  if (pct >= 75) return 'rgba(239, 68, 68, 0.7)';
  if (pct >= 60) return 'rgba(239, 68, 68, 0.45)';
  if (pct >= 45) return 'rgba(245, 158, 11, 0.4)';
  if (pct >= 30) return 'rgba(34, 197, 94, 0.35)';
  return 'rgba(34, 197, 94, 0.6)';
}

function xwobaColor(val: number): string {
  if (val >= 0.400) return 'rgba(239, 68, 68, 0.7)';
  if (val >= 0.350) return 'rgba(245, 158, 11, 0.55)';
  if (val >= 0.300) return 'rgba(234, 179, 8, 0.45)';
  if (val >= 0.250) return 'rgba(59, 130, 246, 0.4)';
  return 'rgba(59, 130, 246, 0.25)';
}

function evColor(val: number): string {
  if (val >= 95) return 'rgba(239, 68, 68, 0.7)';
  if (val >= 92) return 'rgba(245, 158, 11, 0.55)';
  if (val >= 88) return 'rgba(234, 179, 8, 0.45)';
  if (val >= 84) return 'rgba(59, 130, 246, 0.4)';
  return 'rgba(59, 130, 246, 0.25)';
}

function getZoneColor(zone: EyeZone, mode: OverlayMode): string {
  if (mode === 'xwoba') return xwobaColor(zone.xwOBA);
  if (mode === 'ev') return evColor(zone.avgEV);
  return swingColor(zone.swingPct);
}

function getZoneDisplay(zone: EyeZone, mode: OverlayMode): string {
  if (mode === 'xwoba') return zone.xwOBA.toFixed(3).replace(/^0/, '');
  if (mode === 'ev') return zone.avgEV.toFixed(1);
  return `${zone.swingPct}%`;
}

// ── Zone Cell ──────────────────────────────────────────────────────────────

function ZoneCell({ zone, mode }: { zone: EyeZone; mode: OverlayMode }) {
  const [hovered, setHovered] = useState(false);
  const isStrike = zone.row >= 1 && zone.row <= 3 && zone.col >= 1 && zone.col <= 3;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '56px',
        height: '56px',
        backgroundColor: getZoneColor(zone, mode),
        border: isStrike ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(75, 85, 99, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        cursor: 'crosshair',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e5e7eb' }}>
        {getZoneDisplay(zone, mode)}
      </div>
      <div style={{ fontSize: '8px', color: '#9ca3af' }}>
        {zone.pitchesSeen}p
      </div>

      {hovered && (
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          backgroundColor: '#111827',
          border: '1px solid #f59e0b',
          borderRadius: '4px',
          padding: '6px 8px',
          whiteSpace: 'nowrap',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#e5e7eb',
          pointerEvents: 'none',
        }}>
          <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '2px' }}>
            {getZoneLabel(zone.row, zone.col)}
          </div>
          <div>Swing: <span style={{ color: '#ef4444' }}>{zone.swingPct}%</span> Take: <span style={{ color: '#22c55e' }}>{zone.takePct}%</span></div>
          <div>Whiff: <span style={{ color: '#f97316' }}>{zone.whiffPct}%</span> EV: <span style={{ color: '#3b82f6' }}>{zone.avgEV}</span></div>
          <div>xwOBA: <span style={{ color: '#eab308' }}>{zone.xwOBA.toFixed(3)}</span> N: {zone.pitchesSeen}</div>
        </div>
      )}
    </div>
  );
}

// ── Stat Box ───────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      border: '1px solid #1f2937',
      padding: '8px 12px',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoBatterEye();

export default function BatterEyeView() {
  const { gameStarted } = useGameStore();
  const [profiles] = useState<BatterEyeProfile[]>(DEMO_DATA);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [overlay, setOverlay] = useState<OverlayMode>('swing');

  const player = profiles[selectedIdx];

  const zoneGrid = useMemo(() => {
    if (!player) return [];
    const grid: EyeZone[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: EyeZone[] = [];
      for (let c = 0; c < 5; c++) {
        const zone = player.zones.find(z => z.row === r && z.col === c);
        if (zone) row.push(zone);
      }
      grid.push(row);
    }
    return grid;
  }, [player]);

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px',
        padding: '8px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #f59e0b',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f59e0b',
        letterSpacing: '0.1em',
      }}>
        BATTER EYE CHART
      </div>

      {/* Player Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
        {profiles.map((p, i) => (
          <button
            key={p.playerId}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: i === selectedIdx ? '#d97706' : '#1f2937',
              color: i === selectedIdx ? '#000' : '#9ca3af',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {player && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Left: Zone Grid */}
          <div>
            {/* Overlay Toggle */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {(['swing', 'xwoba', 'ev'] as OverlayMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setOverlay(m)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    borderRadius: '3px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: overlay === m ? '#d97706' : '#1f2937',
                    color: overlay === m ? '#000' : '#9ca3af',
                  }}
                >
                  {OVERLAY_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Player Name Badge */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>
                {player.name}
              </span>
              <span style={{
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '3px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
              }}>
                Bats {player.bats}
              </span>
            </div>

            {/* 5x5 Grid */}
            <div style={{
              display: 'inline-block',
              border: '1px solid #374151',
              backgroundColor: '#030712',
            }}>
              {zoneGrid.map((row, r) => (
                <div key={r} style={{ display: 'flex' }}>
                  {row.map((zone, c) => (
                    <ZoneCell key={`${r}-${c}`} zone={zone} mode={overlay} />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '9px', color: '#6b7280' }}>
              {overlay === 'swing' && (
                <>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(34,197,94,0.6)', marginRight: '4px' }} />Take Zone</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(245,158,11,0.4)', marginRight: '4px' }} />Neutral</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(239,68,68,0.7)', marginRight: '4px' }} />Swing Zone</span>
                </>
              )}
              {overlay === 'xwoba' && (
                <>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(59,130,246,0.25)', marginRight: '4px' }} />&lt;.250</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(234,179,8,0.45)', marginRight: '4px' }} />.300+</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(239,68,68,0.7)', marginRight: '4px' }} />.400+</span>
                </>
              )}
              {overlay === 'ev' && (
                <>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(59,130,246,0.25)', marginRight: '4px' }} />&lt;84 mph</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(234,179,8,0.45)', marginRight: '4px' }} />88+</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'rgba(239,68,68,0.7)', marginRight: '4px' }} />95+</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Summary Stats */}
          <div style={{ flex: '1', minWidth: '240px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <StatBox
                label="Chase Rate"
                value={`${player.overallChaseRate}%`}
                color={player.overallChaseRate < 20 ? '#22c55e' : player.overallChaseRate < 28 ? '#f59e0b' : '#ef4444'}
              />
              <StatBox
                label="Zone Swing"
                value={`${player.overallZoneSwingRate}%`}
                color={player.overallZoneSwingRate > 72 ? '#22c55e' : player.overallZoneSwingRate > 65 ? '#f59e0b' : '#ef4444'}
              />
              <StatBox
                label="Whiff Rate"
                value={`${player.overallWhiffRate}%`}
                color={player.overallWhiffRate < 18 ? '#22c55e' : player.overallWhiffRate < 26 ? '#f59e0b' : '#ef4444'}
              />
            </div>

            {/* Zone Breakdown Table */}
            <div style={{ border: '1px solid #1f2937' }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: '#111827',
                borderBottom: '1px solid #374151',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#9ca3af',
                letterSpacing: '0.05em',
              }}>
                ZONE BREAKDOWN
              </div>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left', color: '#6b7280', fontSize: '9px' }}>ZONE</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>SW%</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>WH%</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>EV</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>xwOBA</th>
                  </tr>
                </thead>
                <tbody>
                  {player.zones
                    .filter(z => z.row >= 1 && z.row <= 3 && z.col >= 1 && z.col <= 3)
                    .sort((a, b) => b.xwOBA - a.xwOBA)
                    .map(z => (
                      <tr key={`${z.row}-${z.col}`} style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}>
                        <td style={{ padding: '4px 8px', color: '#d1d5db' }}>{getZoneLabel(z.row, z.col)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{z.swingPct}%</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>{z.whiffPct}%</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>{z.avgEV}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#eab308', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                          {z.xwOBA.toFixed(3).replace(/^0/, '')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Chase Zone Table */}
            <div style={{ border: '1px solid #1f2937', marginTop: '8px' }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: '#111827',
                borderBottom: '1px solid #374151',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#9ca3af',
                letterSpacing: '0.05em',
              }}>
                CHASE ZONES (OUT OF STRIKE ZONE)
              </div>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left', color: '#6b7280', fontSize: '9px' }}>ZONE</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>SW%</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>WH%</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontSize: '9px' }}>N</th>
                  </tr>
                </thead>
                <tbody>
                  {player.zones
                    .filter(z => !(z.row >= 1 && z.row <= 3 && z.col >= 1 && z.col <= 3))
                    .sort((a, b) => b.swingPct - a.swingPct)
                    .slice(0, 6)
                    .map(z => (
                      <tr key={`${z.row}-${z.col}`} style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}>
                        <td style={{ padding: '4px 8px', color: '#9ca3af' }}>{getZoneLabel(z.row, z.col)}</td>
                        <td style={{
                          padding: '4px 8px',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: z.swingPct > 25 ? '#ef4444' : z.swingPct > 15 ? '#f59e0b' : '#22c55e',
                        }}>
                          {z.swingPct}%
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>{z.whiffPct}%</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{z.pitchesSeen}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
