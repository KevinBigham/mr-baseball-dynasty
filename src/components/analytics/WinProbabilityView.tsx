/**
 * WinProbabilityView – In-game win probability chart
 *
 * Bloomberg-terminal style win probability tracker with
 * key moments, leverage index, and WPA calculations.
 */
import { useState, useMemo } from 'react';
import {
  WinProbGame,
  LEVERAGE_DISPLAY,
  generateDemoWinProb,
} from '../../engine/analytics/winProbability';

export default function WinProbabilityView() {
  const games = useMemo(() => generateDemoWinProb(), []);
  const [selected, setSelected] = useState<WinProbGame>(games[0]);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        WIN PROBABILITY — GAME LEVERAGE
      </div>

      {/* ── Game Selector ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {games.map(g => (
          <button
            key={g.id}
            onClick={() => setSelected(g)}
            style={{
              background: selected.id === g.id ? '#f59e0b' : '#1a1a2e',
              color: selected.id === g.id ? '#000' : '#ccc',
              border: '1px solid #333',
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {g.awayTeam} @ {g.homeTeam} ({g.date})
          </button>
        ))}
      </div>

      {/* ── Game Info ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>FINAL</div>
          <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{selected.finalScore}</div>
        </div>
        <div className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>PRE-GAME WIN%</div>
          <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{selected.preGameWinProb}%</div>
        </div>
        <div className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>MAX SWING</div>
          <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>{selected.maxSwing}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── WP Chart ── */}
        <div style={{ flex: '1 1 400px' }}>
          <div className="bloomberg-border" style={{ padding: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>WIN PROBABILITY TIMELINE</div>
            <div style={{ position: 'relative', height: 180 }}>
              {/* 50% line */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed #333' }} />
              {/* Points and lines */}
              <svg width="100%" height="180" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={selected.timeline.map((p, i) => `${(i / (selected.timeline.length - 1)) * 100},${100 - p.winProb}`).join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {selected.timeline.map((p, i) => (
                  <circle
                    key={i}
                    cx={(i / (selected.timeline.length - 1)) * 100}
                    cy={100 - p.winProb}
                    r="1.5"
                    fill={Math.abs(p.wpaDelta) >= 15 ? '#ef4444' : '#f59e0b'}
                  />
                ))}
              </svg>
              {/* Labels */}
              <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 9, color: '#22c55e' }}>100%</div>
              <div style={{ position: 'absolute', left: 0, bottom: 0, fontSize: 9, color: '#ef4444' }}>0%</div>
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#555' }}>50%</div>
            </div>

            {/* Timeline events */}
            <div style={{ marginTop: 12 }}>
              {selected.timeline.filter(p => Math.abs(p.wpaDelta) >= 5).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                  <span style={{ color: '#888' }}>Inn {p.inning} {p.half === 'top' ? '▲' : '▼'}</span>
                  <span style={{ color: '#ccc', flex: 1, marginLeft: 8 }}>{p.event}</span>
                  <span style={{ color: p.wpaDelta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
                    {p.wpaDelta > 0 ? '+' : ''}{p.wpaDelta}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Key Moments ── */}
        <div style={{ flex: '1 1 340px' }}>
          <div className="bloomberg-border" style={{ padding: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>KEY MOMENTS</div>
            {selected.keyMoments.map((km, i) => {
              const ld = LEVERAGE_DISPLAY[km.leverage];
              return (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: ld.color, fontWeight: 600 }}>{ld.emoji} {ld.label} Leverage</span>
                    <span style={{ color: '#888', fontSize: 11 }}>{km.inning}</span>
                  </div>
                  <div style={{ color: '#ccc', marginBottom: 4 }}>{km.description}</div>
                  <div style={{ color: km.wpaDelta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    WPA: {km.wpaDelta > 0 ? '+' : ''}{km.wpaDelta}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
