/**
 * ExpectedBAView – Expected Batting Average (xBA) dashboard
 *
 * Bloomberg-terminal style xBA analysis comparing actual vs expected
 * batting average with exit velocity and luck analysis.
 */
import { useState, useMemo } from 'react';
import {
  XBAProfile,
  LUCK_DISPLAY,
  getXBASummary,
  generateDemoXBA,
} from '../../engine/analytics/expectedBattingAvg';

export default function ExpectedBAView() {
  const profiles = useMemo(() => generateDemoXBA(), []);
  const summary = useMemo(() => getXBASummary(profiles), [profiles]);
  const [selected, setSelected] = useState<XBAProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        EXPECTED BATTING AVERAGE (xBA) — LUCK ANALYSIS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players', value: summary.totalPlayers },
          { label: 'Luckiest', value: summary.luckiestPlayer, color: '#22c55e' },
          { label: 'Unluckiest', value: summary.unluckiestPlayer, color: '#ef4444' },
          { label: 'Avg Delta', value: summary.avgDelta },
          { label: 'Best Hard Hit', value: summary.bestHardHit },
          { label: 'Best Barrel', value: summary.bestBarrel, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Player List */}
        <div style={{ flex: '1 1 520px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>BA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>xBA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Delta</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Luck</th>
                <th style={{ textAlign: 'center', padding: 6 }}>EV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Hard%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Brl%</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const ld = LUCK_DISPLAY[p.luckLevel];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team} · {p.position}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{p.actualBA.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.expectedBA.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p.delta >= 0 ? '+' : ''}{(p.delta * 1000).toFixed(0)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: ld.color, fontWeight: 600, fontSize: 10 }}>{ld.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.avgExitVelo >= 92 ? '#22c55e' : '#ccc' }}>{p.avgExitVelo}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.hardHitPct >= 45 ? '#22c55e' : '#ccc' }}>{p.hardHitPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.barrelPct >= 15 ? '#22c55e' : '#ccc' }}>{p.barrelPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.position}</span>
              </div>
              <div style={{ color: LUCK_DISPLAY[selected.luckLevel].color, fontWeight: 700, marginBottom: 12 }}>
                {LUCK_DISPLAY[selected.luckLevel].label} · Delta {selected.delta >= 0 ? '+' : ''}{(selected.delta * 1000).toFixed(0)}
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Actual BA', value: selected.actualBA.toFixed(3), color: '#f59e0b' },
                  { label: 'Expected BA', value: selected.expectedBA.toFixed(3) },
                  { label: 'Avg EV', value: `${selected.avgExitVelo}`, color: selected.avgExitVelo >= 92 ? '#22c55e' : '#ccc' },
                  { label: 'Launch Angle', value: `${selected.avgLaunchAngle}°` },
                  { label: 'Hard Hit%', value: `${selected.hardHitPct}%`, color: '#22c55e' },
                  { label: 'Barrel%', value: `${selected.barrelPct}%`, color: '#22c55e' },
                  { label: 'Sprint', value: `${selected.sprintSpeed} ft/s` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#ccc', fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Batted Ball Buckets */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BATTED BALL BREAKDOWN</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>EV Range</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Count</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>BA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>xBA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.buckets.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontSize: 10 }}>{b.exitVeloRange}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{b.count}</td>
                      <td style={{ padding: 4, textAlign: 'center', fontWeight: 700 }}>{b.actualBA.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{b.expectedBA.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: b.delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {b.delta >= 0 ? '+' : ''}{(b.delta * 1000).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view xBA analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
