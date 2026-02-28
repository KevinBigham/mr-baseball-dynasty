/**
 * SprayDirectionView – Spray direction matrix dashboard
 *
 * Bloomberg-terminal style spray chart analysis with directional tendencies,
 * pull/center/oppo splits by pitch type, power zones, and spray scores.
 */
import { useState, useMemo } from 'react';
import {
  SprayProfile,
  SPRAY_GRADE_DISPLAY,
  sprayGradeFromScore,
  getSprayDirectionSummary,
  generateDemoSprayDirection,
} from '../../engine/analytics/sprayDirectionMatrix';

const DIR_COLORS = {
  pull:   '#ef4444',
  center: '#f59e0b',
  oppo:   '#3b82f6',
};

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
          { label: 'Hitters', value: summary.totalHitters },
          { label: 'Best Spray', value: summary.bestSpray },
          { label: 'Avg Pull%', value: `${summary.avgPullPct}%` },
          { label: 'Avg Spray Score', value: summary.avgSprayScore },
          { label: 'Most Power', value: summary.mostPower },
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
                <th style={{ textAlign: 'center', padding: 6 }}>Spray</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const grade = sprayGradeFromScore(p.sprayScore);
                const gd = SPRAY_GRADE_DISPLAY[grade];
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
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name}
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{p.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIR_COLORS.pull }}>{p.overallPullPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIR_COLORS.center }}>{p.overallCenterPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: DIR_COLORS.oppo }}>{p.overallOppoPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 600 }}>
                      {p.sprayScore}
                    </td>
                  </tr>
                );
              })}
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
                  { label: 'Spray Score', value: `${selected.sprayScore}`, color: SPRAY_GRADE_DISPLAY[sprayGradeFromScore(selected.sprayScore)].color },
                  { label: 'Tendency', value: selected.tendencyLabel, color: '#ccc' },
                  { label: 'Pull Power', value: `${selected.pullPower}%`, color: selected.pullPower >= 75 ? '#22c55e' : '#ccc' },
                  { label: 'Gap-to-Gap', value: `${selected.gapToGapPct}%`, color: selected.gapToGapPct >= 40 ? '#22c55e' : '#ccc' },
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
                    <th style={{ textAlign: 'center', padding: 4 }}>Hit%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg EV</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>wOBA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>xBA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>HH%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.zones.map((z, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{z.zone.replace('_', ' ').toUpperCase()}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{z.hitPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.avgEV >= 92 ? '#22c55e' : '#ccc' }}>{z.avgEV}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.wOBA >= 0.370 ? '#22c55e' : '#ccc' }}>{z.wOBA.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{z.xBA.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.hardHitPct >= 40 ? '#f59e0b' : '#ccc' }}>{z.hardHitPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pitch Type Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH TYPE SPRAY</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pull%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Cen%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Opp%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitchTypeBreakdown.map((pt, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pt.pitchType}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: DIR_COLORS.pull }}>{pt.pullPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: DIR_COLORS.center }}>{pt.centerPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: DIR_COLORS.oppo }}>{pt.oppoPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Direction Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>DIRECTION BREAKDOWN</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {([
                  { dir: 'Pull', pct: selected.overallPullPct, color: DIR_COLORS.pull },
                  { dir: 'Center', pct: selected.overallCenterPct, color: DIR_COLORS.center },
                  { dir: 'Oppo', pct: selected.overallOppoPct, color: DIR_COLORS.oppo },
                ]).map(d => (
                  <div key={d.dir} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 40, background: '#111', position: 'relative', border: '1px solid #222' }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${d.pct}%`,
                        background: d.color,
                        opacity: 0.7,
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: d.color, marginTop: 2, fontWeight: 700 }}>{d.dir.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#ccc' }}>{d.pct}%</div>
                  </div>
                ))}
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
