/**
 * ZoneHeatmapView – Strike zone contact heatmap dashboard
 *
 * Bloomberg-terminal style zone analysis with 5x5 grid heatmap,
 * zone-by-zone batting averages, and chase rate tracking.
 */
import { useState, useMemo } from 'react';
import {
  HitterZoneProfile,
  getHeatColor,
  getZoneLabel,
  getZoneSummary,
  generateDemoZoneHeatmap,
} from '../../engine/analytics/zoneHeatmap';

export default function ZoneHeatmapView() {
  const profiles = useMemo(() => generateDemoZoneHeatmap(), []);
  const summary = useMemo(() => getZoneSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<HitterZoneProfile | null>(null);
  const [heatStat, setHeatStat] = useState<'battingAvg' | 'slugging' | 'whiffPct'>('battingAvg');

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        ZONE HEATMAP — CONTACT ANALYSIS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Chase%', value: `${summary.teamChaseRate}%` },
          { label: 'IZ Contact%', value: `${summary.teamInZoneContact}%` },
          { label: 'Hot Zone King', value: summary.bestHotZoneHitter },
          { label: 'Best Discipline', value: summary.coldZoneKing },
          { label: 'IZ Hard Hit%', value: `${summary.avgHardHitInZone}%` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Hitter List ── */}
        <div style={{ flex: '1 1 380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Side</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Chase%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>IZ Con%</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Best Zone</th>
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
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.batSide}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.chaseRate <= 25 ? '#22c55e' : p.chaseRate >= 35 ? '#ef4444' : '#ccc' }}>{p.chaseRate}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.inZoneContactRate >= 85 ? '#22c55e' : '#ccc' }}>{p.inZoneContactRate}%</td>
                  <td style={{ padding: 6, fontSize: 10 }}>{p.bestZone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Heatmap Detail ── */}
        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · {selected.batSide}HB</span>
              </div>

              {/* Stat Toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {([['battingAvg', 'AVG'], ['slugging', 'SLG'], ['whiffPct', 'Whiff%']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setHeatStat(k)}
                    style={{
                      background: heatStat === k ? '#f59e0b' : '#1a1a2e',
                      color: heatStat === k ? '#000' : '#888',
                      border: '1px solid #333',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: 10,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 5x5 Heatmap Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, marginBottom: 14 }}>
                {selected.zones.map((z, i) => {
                  const val = z[heatStat];
                  const maxVal = heatStat === 'battingAvg' ? 0.400 : heatStat === 'slugging' ? 0.800 : 50;
                  const displayVal = heatStat === 'whiffPct' ? `${val}%` : (val as number).toFixed(3);
                  return (
                    <div
                      key={i}
                      style={{
                        background: getHeatColor(val as number, maxVal),
                        padding: '8px 2px',
                        textAlign: 'center',
                        border: z.isStrikeZone ? '1px solid #555' : '1px solid #222',
                        borderRadius: 2,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{displayVal}</div>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>{getZoneLabel(z.row, z.col)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Zone Summary */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ZONE DISCIPLINE</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Chase%', value: `${selected.chaseRate}%`, color: selected.chaseRate <= 25 ? '#22c55e' : '#ef4444' },
                  { label: 'IZ Contact%', value: `${selected.inZoneContactRate}%` },
                  { label: 'IZ Whiff%', value: `${selected.inZoneWhiffRate}%` },
                  { label: 'OZ Swing%', value: `${selected.outZoneSwingRate}%` },
                  { label: 'Best Zone', value: selected.bestZone },
                  { label: 'Worst Zone', value: selected.worstZone },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 12 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a hitter to view zone heatmap
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
