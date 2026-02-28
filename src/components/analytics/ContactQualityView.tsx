/**
 * ContactQualityView – Contact quality & batted ball dashboard
 *
 * Bloomberg-terminal style exit velocity, barrel rate, expected stats,
 * and batted ball bucket breakdown for each hitter.
 */
import { useState, useMemo } from 'react';
import {
  ContactProfile,
  CONTACT_DISPLAY,
  getContactTeamSummary,
  generateDemoContactQuality,
} from '../../engine/analytics/contactQuality';

export default function ContactQualityView() {
  const profiles = useMemo(() => generateDemoContactQuality(), []);
  const summary = useMemo(() => getContactTeamSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<ContactProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CONTACT QUALITY — BATTED BALL ANALYSIS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Avg EV', value: `${summary.teamAvgEV} mph` },
          { label: 'Hard Hit%', value: `${summary.teamHardHitPct}%` },
          { label: 'Barrel%', value: `${summary.teamBarrelPct}%` },
          { label: 'Team xwOBA', value: summary.teamXwOBA.toFixed(3) },
          { label: 'Elite Hitters', value: summary.eliteHitters, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Hitter List ── */}
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg EV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Hard%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Barrel%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>xwOBA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>wOBA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const cg = CONTACT_DISPLAY[p.contactGrade];
                const diff = p.actualwOBA - p.xwOBA;
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
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.avgExitVelo}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.hardHitPct >= 45 ? '#22c55e' : '#ccc' }}>{p.hardHitPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.barrelPct >= 12 ? '#22c55e' : '#ccc' }}>{p.barrelPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{p.xwOBA.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: diff >= 0.01 ? '#22c55e' : diff <= -0.01 ? '#ef4444' : '#ccc' }}>
                      {p.actualwOBA.toFixed(3)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: cg.color, fontWeight: 600 }}>{cg.emoji} {cg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: CONTACT_DISPLAY[selected.contactGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {CONTACT_DISPLAY[selected.contactGrade].emoji} {CONTACT_DISPLAY[selected.contactGrade].label}
              </div>

              {/* Key Metrics */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>EXIT VELOCITY & LAUNCH</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Avg EV', value: `${selected.avgExitVelo} mph` },
                  { label: 'Max EV', value: `${selected.maxExitVelo} mph` },
                  { label: 'Avg LA', value: `${selected.avgLaunchAngle}°` },
                  { label: 'Sweet Spot%', value: `${selected.sweetSpotPct}%` },
                  { label: 'Hard Hit%', value: `${selected.hardHitPct}%`, color: selected.hardHitPct >= 45 ? '#22c55e' : '#ccc' },
                  { label: 'Barrel%', value: `${selected.barrelPct}%`, color: selected.barrelPct >= 12 ? '#22c55e' : '#ccc' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Expected vs Actual */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>EXPECTED vs ACTUAL</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Stat</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Expected</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Actual</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stat: 'BA', expected: selected.xBA, actual: selected.actualBA },
                    { stat: 'SLG', expected: selected.xSLG, actual: selected.actualSLG },
                    { stat: 'wOBA', expected: selected.xwOBA, actual: selected.actualwOBA },
                  ].map(row => {
                    const diff = row.actual - row.expected;
                    return (
                      <tr key={row.stat} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, fontWeight: 600 }}>{row.stat}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b' }}>{row.expected.toFixed(3)}</td>
                        <td style={{ padding: 4, textAlign: 'center' }}>{row.actual.toFixed(3)}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: diff >= 0.005 ? '#22c55e' : diff <= -0.005 ? '#ef4444' : '#888', fontWeight: 600 }}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Batted Ball Buckets */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BATTED BALL BUCKETS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Type</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg EV</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg LA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>xBA</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.buckets.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{b.type}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{b.pct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: b.avgEV >= 95 ? '#f59e0b' : '#888' }}>{b.avgEV}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{b.avgLA}°</td>
                      <td style={{ padding: 4, textAlign: 'center', color: b.xBA >= 0.400 ? '#22c55e' : '#ccc' }}>{b.xBA.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a hitter to view contact quality analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
