/**
 * DefAlignmentView – Defensive alignment strategy dashboard
 *
 * Bloomberg-terminal style alignment manager with spray tendencies,
 * optimal vs current alignment comparison, and per-preset results.
 */
import { useState, useMemo } from 'react';
import {
  BatterAlignment,
  ALIGNMENT_DISPLAY,
  getAlignmentSummary,
  generateDemoAlignments,
} from '../../engine/analytics/defAlignment';

export default function DefAlignmentView() {
  const batters = useMemo(() => generateDemoAlignments(), []);
  const summary = useMemo(() => getAlignmentSummary(batters), [batters]);
  const [selected, setSelected] = useState<BatterAlignment | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DEFENSIVE ALIGNMENT — STRATEGY MANAGER
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Optimal Rate', value: `${summary.optimalRate}%`, color: summary.optimalRate >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Misaligned', value: summary.totalMisaligned, color: summary.totalMisaligned > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Runs Saved', value: summary.totalRunsSaved },
          { label: 'Best Strategy', value: summary.bestAlignment },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Batter List ── */}
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Batter</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Hand</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pull%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>GB%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Current</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Optimal</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Match</th>
              </tr>
            </thead>
            <tbody>
              {batters.map(b => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === b.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{b.batterName}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{b.batterHand}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: b.pullPct >= 45 ? '#ef4444' : '#ccc' }}>{b.pullPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{b.groundBallPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: ALIGNMENT_DISPLAY[b.currentAlignment].color }}>{ALIGNMENT_DISPLAY[b.currentAlignment].abbr}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: ALIGNMENT_DISPLAY[b.optimalAlignment].color }}>{ALIGNMENT_DISPLAY[b.optimalAlignment].abbr}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: b.isOptimal ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {b.isOptimal ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.batterName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.batterTeam} · {selected.batterHand}HB</span>
              </div>

              {/* Spray Chart */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SPRAY DISTRIBUTION</div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14, height: 18 }}>
                <div style={{ width: `${selected.pullPct}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>
                  Pull {selected.pullPct}%
                </div>
                <div style={{ width: `${selected.centerPct}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000' }}>
                  Center {selected.centerPct}%
                </div>
                <div style={{ width: `${selected.oppoPct}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>
                  Oppo {selected.oppoPct}%
                </div>
              </div>

              {/* Alignment Comparison */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 8, border: `1px solid ${ALIGNMENT_DISPLAY[selected.currentAlignment].color}` }}>
                  <div style={{ color: '#888', fontSize: 9 }}>CURRENT</div>
                  <div style={{ color: ALIGNMENT_DISPLAY[selected.currentAlignment].color, fontWeight: 700 }}>{ALIGNMENT_DISPLAY[selected.currentAlignment].label}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 8, border: `1px solid ${ALIGNMENT_DISPLAY[selected.optimalAlignment].color}` }}>
                  <div style={{ color: '#888', fontSize: 9 }}>OPTIMAL</div>
                  <div style={{ color: ALIGNMENT_DISPLAY[selected.optimalAlignment].color, fontWeight: 700 }}>{ALIGNMENT_DISPLAY[selected.optimalAlignment].label}</div>
                </div>
              </div>

              {/* Results by Alignment */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RESULTS BY ALIGNMENT</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Alignment</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Used</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>BABIP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Outs+</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Runs Svd</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.results.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, color: ALIGNMENT_DISPLAY[r.preset].color }}>{ALIGNMENT_DISPLAY[r.preset].label}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{r.timesUsed}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: r.babip <= r.expectedBabip ? '#22c55e' : '#ef4444' }}>{r.babip.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: r.outsGained >= 0 ? '#22c55e' : '#ef4444' }}>{r.outsGained > 0 ? '+' : ''}{r.outsGained}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: r.runsSaved >= 0 ? '#22c55e' : '#ef4444' }}>{r.runsSaved > 0 ? '+' : ''}{r.runsSaved}</td>
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
              Select a batter to view alignment strategy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
