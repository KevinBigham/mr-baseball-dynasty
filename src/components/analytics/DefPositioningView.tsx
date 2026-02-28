/**
 * DefPositioningView – Defensive positioning analysis
 *
 * Bloomberg-terminal style defensive positioning tracker with
 * shift effectiveness, OAA from positioning, and BABIP impact.
 */
import { useState, useMemo } from 'react';
import {
  FielderPositioning,
  POSITIONING_DISPLAY,
  getPositioningSummary,
  generateDemoPositioning,
} from '../../engine/analytics/defPositioning';

export default function DefPositioningView() {
  const fielders = useMemo(() => generateDemoPositioning(), []);
  const summary = useMemo(() => getPositioningSummary(fielders), [fielders]);
  const [selected, setSelected] = useState<FielderPositioning | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DEFENSIVE POSITIONING — SHIFT ANALYTICS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team OAA', value: summary.teamOAA, color: summary.teamOAA >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'BABIP Impact', value: `${summary.teamBABIPImpact > 0 ? '+' : ''}${summary.teamBABIPImpact.toFixed(3)}` },
          { label: 'Hits Prevented', value: summary.totalHitsPrevented, color: '#22c55e' },
          { label: 'Elite Positioning', value: summary.elitePositioners },
          { label: 'Optimal Shift Rate', value: `${summary.optimalShiftRate}%` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Fielder List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OAA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>BABIP Imp</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Opt Shift%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {fielders.map(f => {
                const pg = POSITIONING_DISPLAY[f.positioningGrade];
                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelected(f)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === f.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{f.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{f.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: f.oaaFromPositioning >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {f.oaaFromPositioning > 0 ? '+' : ''}{f.oaaFromPositioning}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: f.babipImpact <= 0 ? '#22c55e' : '#ef4444' }}>
                      {f.babipImpact > 0 ? '+' : ''}{f.babipImpact.toFixed(3)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{f.optimalShiftPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: pg.color, fontWeight: 600 }}>{pg.emoji} {pg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: POSITIONING_DISPLAY[selected.positioningGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {POSITIONING_DISPLAY[selected.positioningGrade].emoji} {POSITIONING_DISPLAY[selected.positioningGrade].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>Best Shift: {selected.bestShift}</span>
              </div>

              {/* Shift Results */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SHIFT RESULTS BY TYPE</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Shift</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Times</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>BABIP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>OAA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Hits+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.shiftResults.map((sr, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{sr.shiftType.replace('_', ' ')}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{sr.timesUsed}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{sr.babipAgainst.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: sr.outsAboveAvg >= 0 ? '#22c55e' : '#ef4444' }}>
                        {sr.outsAboveAvg > 0 ? '+' : ''}{sr.outsAboveAvg}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: sr.hitsPreventedEst >= 0 ? '#22c55e' : '#ef4444' }}>
                        {sr.hitsPreventedEst > 0 ? '+' : ''}{sr.hitsPreventedEst}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a fielder to view positioning analytics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
