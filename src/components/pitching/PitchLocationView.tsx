/**
 * PitchLocationView – Pitch location tendency dashboard
 *
 * Bloomberg-terminal style view showing zone heat maps by count,
 * whiff rate and contact rate overlays, and pitcher selector tabs.
 */
import { useState, useMemo } from 'react';
import {
  PitcherLocationProfile,
  CountState,
  CountTendency,
  ALL_COUNTS,
  ZONE_GRID,
  ZONE_LABELS,
  getHeatColor,
  generateDemoPitchLocation,
} from '../../engine/pitching/pitchLocationTendency';

type Overlay = 'pct' | 'whiff' | 'contact';

export default function PitchLocationView() {
  const profiles = useMemo(() => generateDemoPitchLocation(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedCount, setSelectedCount] = useState<CountState>('0-0');
  const [overlay, setOverlay] = useState<Overlay>('pct');

  const pitcher: PitcherLocationProfile = profiles[selectedIdx];
  const countData: CountTendency | undefined = pitcher.counts.find(c => c.count === selectedCount);

  const getZoneValue = (zone: string): { display: string; bgColor: string } => {
    if (!countData) return { display: '-', bgColor: '#1e293b' };
    const loc = countData.zones.find(z => z.zone === zone);
    if (!loc) return { display: '-', bgColor: '#1e293b' };
    if (overlay === 'pct') return { display: `${loc.pct}%`, bgColor: getHeatColor(loc.pct) };
    if (overlay === 'whiff') return { display: `${loc.whiffRate}%`, bgColor: loc.whiffRate >= 30 ? '#22c55e' : loc.whiffRate >= 20 ? '#3b82f6' : '#1e293b' };
    return { display: `${loc.contactRate}%`, bgColor: loc.contactRate >= 75 ? '#ef4444' : loc.contactRate >= 60 ? '#f97316' : '#1e293b' };
  };

  const wasteData = countData?.zones.find(z => z.zone === 'waste');

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH LOCATION TENDENCY — ZONE ANALYSIS
      </div>

      {/* ── Pitcher Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 14, flexWrap: 'wrap' }}>
        {profiles.map((p, i) => (
          <button
            key={p.pitcherId}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: '6px 14px',
              background: i === selectedIdx ? '#f59e0b' : '#1a1a2e',
              color: i === selectedIdx ? '#000' : '#ccc',
              border: '1px solid #333',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: i === selectedIdx ? 700 : 400,
            }}
          >
            {p.name} ({p.throws})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Left Panel: Controls + Zone Grid ── */}
        <div style={{ flex: '1 1 380px' }}>
          {/* Count Selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <div>
              <span style={{ color: '#888', fontSize: 10, marginRight: 6 }}>COUNT</span>
              <select
                value={selectedCount}
                onChange={e => setSelectedCount(e.target.value as CountState)}
                style={{
                  background: '#111',
                  color: '#f59e0b',
                  border: '1px solid #333',
                  padding: '4px 8px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {ALL_COUNTS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Overlay Toggle */}
            <div style={{ display: 'flex', gap: 2 }}>
              {([
                { key: 'pct' as Overlay, label: 'USAGE%' },
                { key: 'whiff' as Overlay, label: 'WHIFF%' },
                { key: 'contact' as Overlay, label: 'CONTACT%' },
              ]).map(o => (
                <button
                  key={o.key}
                  onClick={() => setOverlay(o.key)}
                  style={{
                    padding: '4px 10px',
                    background: overlay === o.key ? '#f59e0b' : '#1a1a2e',
                    color: overlay === o.key ? '#000' : '#888',
                    border: '1px solid #333',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: overlay === o.key ? 700 : 400,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zone Grid 3x3 */}
          <div className="bloomberg-border" style={{ padding: 12, marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>
              STRIKE ZONE — {pitcher.name} — {selectedCount} ({countData?.totalPitches ?? 0} pitches)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, maxWidth: 320 }}>
              {ZONE_GRID.flat().map(zone => {
                const { display, bgColor } = getZoneValue(zone);
                const isPrimary = countData?.primaryZone === zone;
                return (
                  <div
                    key={zone}
                    style={{
                      background: bgColor,
                      padding: '14px 6px',
                      textAlign: 'center',
                      border: isPrimary ? '2px solid #f59e0b' : '1px solid #333',
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontSize: 9, color: '#aaa', marginBottom: 2 }}>{ZONE_LABELS[zone]}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{display}</div>
                    {isPrimary && (
                      <div style={{ fontSize: 8, color: '#f59e0b', marginTop: 2 }}>PRIMARY</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Waste zone row */}
            <div style={{
              marginTop: 6,
              background: wasteData ? getHeatColor(wasteData.pct) : '#1e293b',
              padding: '10px 6px',
              textAlign: 'center',
              border: countData?.primaryZone === 'waste' ? '2px solid #f59e0b' : '1px solid #333',
              maxWidth: 320,
            }}>
              <div style={{ fontSize: 9, color: '#aaa', marginBottom: 2 }}>Waste</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {wasteData
                  ? overlay === 'pct' ? `${wasteData.pct}%`
                    : overlay === 'whiff' ? `${wasteData.whiffRate}%`
                    : `${wasteData.contactRate}%`
                  : '-'}
              </div>
              {countData?.primaryZone === 'waste' && (
                <div style={{ fontSize: 8, color: '#f59e0b' }}>PRIMARY</div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 9, color: '#666' }}>
              {overlay === 'pct' && (
                <>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1e293b', marginRight: 3, verticalAlign: 'middle' }} />Low</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#eab308', marginRight: 3, verticalAlign: 'middle' }} />Med</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', marginRight: 3, verticalAlign: 'middle' }} />High</span>
                </>
              )}
              {overlay === 'whiff' && (
                <>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1e293b', marginRight: 3, verticalAlign: 'middle' }} />&lt;20%</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#3b82f6', marginRight: 3, verticalAlign: 'middle' }} />20-30%</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', marginRight: 3, verticalAlign: 'middle' }} />30%+</span>
                </>
              )}
              {overlay === 'contact' && (
                <>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1e293b', marginRight: 3, verticalAlign: 'middle' }} />&lt;60%</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f97316', marginRight: 3, verticalAlign: 'middle' }} />60-75%</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', marginRight: 3, verticalAlign: 'middle' }} />75%+</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Count-by-count summary ── */}
        <div style={{ flex: '1 1 420px' }}>
          <div className="bloomberg-border" style={{ padding: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>
              ALL COUNTS — {pitcher.name} ({pitcher.throws}HP)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                  <th style={{ textAlign: 'left', padding: 4 }}>Count</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>N</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Primary Zone</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Zone%</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Contact%</th>
                </tr>
              </thead>
              <tbody>
                {pitcher.counts.map(ct => {
                  const primaryZoneData = ct.zones.find(z => z.zone === ct.primaryZone);
                  const isSelected = ct.count === selectedCount;
                  return (
                    <tr
                      key={ct.count}
                      onClick={() => setSelectedCount(ct.count)}
                      style={{
                        borderBottom: '1px solid #1a1a2e',
                        cursor: 'pointer',
                        background: isSelected ? '#1a1a3e' : 'transparent',
                      }}
                    >
                      <td style={{ padding: 4, fontWeight: 700, color: isSelected ? '#f59e0b' : '#ccc' }}>
                        {ct.count}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>
                        {ct.totalPitches}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>
                        {ZONE_LABELS[ct.primaryZone]}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center' }}>
                        {primaryZoneData?.pct ?? '-'}%
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: (primaryZoneData?.whiffRate ?? 0) >= 30 ? '#22c55e' : '#ccc' }}>
                        {primaryZoneData?.whiffRate ?? '-'}%
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: (primaryZoneData?.contactRate ?? 0) >= 75 ? '#ef4444' : '#ccc' }}>
                        {primaryZoneData?.contactRate ?? '-'}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Zone detail for selected count ── */}
          {countData && (
            <div className="bloomberg-border" style={{ padding: 12, marginTop: 10 }}>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>
                ZONE DETAIL — {selectedCount} ({countData.totalPitches} pitches)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Zone</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Usage%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Contact%</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {countData.zones
                    .slice()
                    .sort((a, b) => b.pct - a.pct)
                    .map(z => (
                      <tr key={z.zone} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{
                          padding: 4,
                          fontWeight: z.zone === countData.primaryZone ? 700 : 400,
                          color: z.zone === countData.primaryZone ? '#f59e0b' : '#ccc',
                        }}>
                          {ZONE_LABELS[z.zone]}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{z.pct}%</td>
                        <td style={{ padding: 4, textAlign: 'center', color: z.whiffRate >= 30 ? '#22c55e' : '#ccc' }}>
                          {z.whiffRate}%
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: z.contactRate >= 75 ? '#ef4444' : '#ccc' }}>
                          {z.contactRate}%
                        </td>
                        <td style={{ padding: 4 }}>
                          <div style={{ background: '#111', height: 10, width: '100%', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', top: 0, left: 0,
                              height: '100%',
                              width: `${Math.min(z.pct * 3, 100)}%`,
                              background: getHeatColor(z.pct),
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
