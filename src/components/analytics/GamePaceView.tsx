/**
 * GamePaceView – Game Pace & Time of Game dashboard
 *
 * Bloomberg-terminal style pace tracker with summary cards,
 * game log table, simplified pace trend bar chart, and
 * league average comparison.
 */
import { useState, useMemo } from 'react';
import {
  GamePaceEntry,
  generateDemoGamePace,
  getPaceSummary,
  paceColor,
} from '../../engine/analytics/gamePaceAnalysis';

export default function GamePaceView() {
  const profile = useMemo(() => generateDemoGamePace(), []);
  const summary = useMemo(() => getPaceSummary(profile), [profile]);
  const [selected, setSelected] = useState<GamePaceEntry | null>(null);

  const maxTime = Math.max(...profile.entries.map(e => e.gameTime));

  /* format minutes to H:MM */
  const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        GAME PACE &amp; TIME OF GAME — {profile.teamName.toUpperCase()}
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Avg Game Time', value: fmt(summary.avgGameTime), color: paceColor(summary.avgGameTime) },
          { label: 'Pace Rank', value: `#${summary.leagueRank}`, color: '#f59e0b' },
          { label: 'Fastest Game', value: fmt(summary.fastestGameTime), color: '#22c55e' },
          { label: 'Slowest Game', value: fmt(summary.slowestGameTime), color: '#ef4444' },
          { label: 'Avg Pitches/G', value: summary.avgPitchesPerGame },
          { label: 'Clock Violations', value: summary.totalViolations, color: summary.totalViolations > 10 ? '#ef4444' : '#facc15' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Game Log Table ───────────────────────────────────────────── */}
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>GAME LOG</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Date</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Opp</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Time</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Inn</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pace/Inn</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pitches</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Violations</th>
              </tr>
            </thead>
            <tbody>
              {profile.entries.map((e, i) => (
                <tr
                  key={i}
                  onClick={() => setSelected(e)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected === e ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, color: '#aaa' }}>{e.date}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{e.opponent}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: paceColor(e.gameTime), fontWeight: 700 }}>{fmt(e.gameTime)}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{e.inningsPlayed}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{e.pacePerInning} min</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{e.pitchesThrown}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: e.pitchClockViolations > 0 ? '#ef4444' : '#666' }}>
                    {e.pitchClockViolations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Right Panel: Trend Chart + Selected Detail ───────────────── */}
        <div style={{ flex: '1 1 380px' }}>
          {/* Pace Trend Bar Chart */}
          <div className="bloomberg-border" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>GAME TIME TREND (minutes)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
              {profile.entries.map((e, i) => {
                const pct = maxTime > 0 ? (e.gameTime / maxTime) * 100 : 0;
                return (
                  <div
                    key={i}
                    title={`${e.date} vs ${e.opponent}: ${fmt(e.gameTime)}`}
                    style={{
                      flex: 1,
                      height: `${pct}%`,
                      background: paceColor(e.gameTime),
                      borderRadius: '2px 2px 0 0',
                      cursor: 'pointer',
                      opacity: selected === e ? 1 : 0.7,
                      border: selected === e ? '1px solid #fff' : '1px solid transparent',
                    }}
                    onClick={() => setSelected(e)}
                  />
                );
              })}
            </div>
            {/* League average line label */}
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
              <div style={{ width: 20, height: 1, background: '#f59e0b' }} />
              <span style={{ color: '#888' }}>League Avg: {fmt(summary.leagueAvgGameTime)}</span>
              <span style={{ color: '#f59e0b', marginLeft: 'auto' }}>
                {summary.avgGameTime > summary.leagueAvgGameTime ? '+' : ''}{summary.avgGameTime - summary.leagueAvgGameTime} min vs avg
              </span>
            </div>
          </div>

          {/* Selected Game Detail */}
          {selected && (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                vs {selected.opponent}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{selected.date}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#888' }}>Game Time: </span>
                  <span style={{ color: paceColor(selected.gameTime), fontWeight: 700 }}>{fmt(selected.gameTime)}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Innings: </span>
                  <span style={{ fontWeight: 700 }}>{selected.inningsPlayed}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Pace/Inn: </span>
                  <span>{selected.pacePerInning} min</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Pitches: </span>
                  <span>{selected.pitchesThrown}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Violations: </span>
                  <span style={{ color: selected.pitchClockViolations > 0 ? '#ef4444' : '#22c55e' }}>
                    {selected.pitchClockViolations}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>vs Avg: </span>
                  <span style={{ color: selected.gameTime <= summary.avgGameTime ? '#22c55e' : '#ef4444' }}>
                    {selected.gameTime <= summary.avgGameTime ? '' : '+'}{selected.gameTime - summary.avgGameTime} min
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
