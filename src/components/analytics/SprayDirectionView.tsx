/**
 * SprayDirectionView – Spray direction matrix dashboard
 *
 * Bloomberg-terminal style spray chart analysis with directional tendencies,
 * pull/center/oppo splits by pitch type, power zones, and spray scores.
 */
import { useState, useMemo } from 'react';
import {
  SprayProfile,
  DIRECTION_DISPLAY,
  ZONE_DISPLAY,
  getSprayDirectionSummary,
  generateDemoSprayDirection,
} from '../../engine/analytics/sprayDirectionMatrix';

export default function SprayDirectionView() {
  const profiles = useMemo(() => generateDemoSprayDirection(), []);
  const summary = useMemo(() => getSprayDirectionSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<SprayProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SPRAY DIRECTION MATRIX
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Hitters', value: summary.totalBatters },
          { label: 'Best Spray', value: summary.bestOverallWOBA },
          { label: 'Avg Pull%', value: `${summary.avgPullPct}%` },
          { label: 'Avg HH%', value: `${summary.avgHardHitPct}%` },
          { label: 'Most Pull', value: summary.heaviestPuller },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Hitter List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Hitter</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pull%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Center%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Oppo%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>wOBA</th>
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
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name}
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{p.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIRECTION_DISPLAY.pull.color }}>{p.overallPullPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIRECTION_DISPLAY.center.color }}>{p.overallCenterPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIRECTION_DISPLAY.oppo.color }}>{p.overallOppoPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.overallWOBA >= 0.360 ? '#22c55e' : '#ccc', fontWeight: 600 }}>
                      {p.overallWOBA.toFixed(3)}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.team} · {selected.position} · Bats {selected.bats}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Overall wOBA', value: selected.overallWOBA.toFixed(3), color: '#f59e0b' },
                  { label: 'Best Dir', value: DIRECTION_DISPLAY[selected.bestDirection].label, color: DIRECTION_DISPLAY[selected.bestDirection].color },
                  { label: 'Lineup Slot', value: `#${selected.lineupSlot}`, color: '#ccc' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Spray Zones */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SPRAY ZONES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Zone</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Dir</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Hit%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg EV</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>wOBA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>HH%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.cells.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{ZONE_DISPLAY[c.zone].label}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: DIRECTION_DISPLAY[c.direction].color, fontWeight: 600 }}>
                        {DIRECTION_DISPLAY[c.direction].label}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{c.pct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.avgEV >= 92 ? '#22c55e' : '#ccc' }}>{c.avgEV}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.wOBA >= 0.370 ? '#22c55e' : '#ccc' }}>{c.wOBA.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.hardHitPct >= 40 ? '#f59e0b' : '#ccc' }}>{c.hardHitPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Key Metrics */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>KEY METRICS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'GB Pull%', value: `${selected.groundBallPullPct}%`, color: selected.groundBallPullPct >= 60 ? '#ef4444' : '#ccc' },
                  { label: 'FB Oppo%', value: `${selected.flyBallOppoPct}%`, color: selected.flyBallOppoPct >= 25 ? '#3b82f6' : '#ccc' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Direction Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>DIRECTION BREAKDOWN</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['pull', 'center', 'oppo'] as const).map(dir => {
                  const pct = dir === 'pull' ? selected.overallPullPct : dir === 'center' ? selected.overallCenterPct : selected.overallOppoPct;
                  const dInfo = DIRECTION_DISPLAY[dir];
                  return (
                    <div key={dir} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 40, background: '#111', position: 'relative', border: '1px solid #222' }}>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: `${pct}%`,
                          background: dInfo.color,
                          opacity: 0.7,
                        }} />
                      </div>
                      <div style={{ fontSize: 9, color: dInfo.color, marginTop: 2, fontWeight: 700 }}>{dInfo.label}</div>
                      <div style={{ fontSize: 11, color: '#ccc' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Analysis Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a hitter to view spray direction profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
