/**
 * GameLeverageView – Game leverage index dashboard
 *
 * Bloomberg-terminal style leverage tracker with moment-by-moment
 * LI breakdown, WPA swings, clutch performances, and game recaps.
 */
import { useState, useMemo } from 'react';
import {
  GameLeverageData,
  LEVERAGE_DISPLAY,
  leverageColor,
  getGameLeverageSummary,
  generateDemoGameLeverage,
} from '../../engine/analytics/gameLeverageIndex';

export default function GameLeverageView() {
  const games = useMemo(() => generateDemoGameLeverage(), []);
  const summary = useMemo(() => getGameLeverageSummary(games), [games]);
  const [selected, setSelected] = useState<GameLeverageData | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        GAME LEVERAGE INDEX — CLUTCH TRACKER
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Games', value: summary.totalGames },
          { label: 'Avg Peak LI', value: summary.avgPeakLI },
          { label: 'Most Clutch', value: summary.mostClutchPlayer, color: '#22c55e' },
          { label: 'High LI%', value: `${summary.highLeveragePct}%`, color: '#ef4444' },
          { label: 'Biggest Moment', value: summary.biggestMoment },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Matchup</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Peak LI</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Clutch</th>
                <th style={{ textAlign: 'center', padding: 6 }}>MVP</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr
                  key={g.id}
                  onClick={() => setSelected(g)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === g.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{g.awayTeam} @ {g.homeTeam} <span style={{ color: '#666', fontSize: 10 }}>{g.date}</span></td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{g.finalScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: leverageColor(g.peakLI), fontWeight: 700 }}>{g.peakLI.toFixed(1)}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: g.clutchMoments >= 5 ? '#ef4444' : '#ccc' }}>{g.clutchMoments}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontSize: 11 }}>{g.mvpPlayer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.awayTeam} @ {selected.homeTeam}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.date} · Final: {selected.finalScore}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: leverageColor(selected.peakLI), fontWeight: 700, fontSize: 20 }}>{selected.peakLI.toFixed(1)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Peak LI</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 20 }}>{selected.avgLI.toFixed(1)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Avg LI</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 20 }}>{selected.clutchMoments}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Clutch Moments</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 20 }}>{selected.mvpPlayer}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>MVP (+{selected.mvpWPA.toFixed(2)} WPA)</div>
                </div>
              </div>

              {/* Moment by Moment */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>KEY MOMENTS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Sit</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>LI</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Matchup</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Result</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>WPA</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.moments.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontSize: 10, color: '#888' }}>
                        {m.half === 'top' ? '▲' : '▼'}{m.inning} · {m.outs}out{m.runners ? ` · ${m.runners}` : ''} · {m.score}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: leverageColor(m.li), fontWeight: 700 }}>{m.li.toFixed(1)}</td>
                      <td style={{ padding: 4, fontSize: 10 }}>{m.batter} vs {m.pitcher}</td>
                      <td style={{ padding: 4, fontWeight: 600, fontSize: 10 }}>{m.result}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: m.wpaSwing >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {m.wpaSwing > 0 ? '+' : ''}{m.wpaSwing.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>GAME SUMMARY</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a game to view leverage breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
