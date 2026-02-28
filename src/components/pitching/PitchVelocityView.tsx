/**
 * PitchVelocityView – Pitch velocity bands dashboard
 *
 * Bloomberg-terminal style velocity analysis with distribution bands,
 * inning-by-inning decay tracking, stamina grades, and consistency scores.
 */
import { useState, useMemo } from 'react';
import {
  VelocityProfile,
  STAMINA_GRADE_DISPLAY,
  getVelocityBandsSummary,
  generateDemoVelocityBands,
} from '../../engine/pitching/pitchVelocityBands';

export default function PitchVelocityView() {
  const profiles = useMemo(() => generateDemoVelocityBands(), []);
  const summary = useMemo(() => getVelocityBandsSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<VelocityProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH VELOCITY BANDS
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Hardest', value: summary.hardestThrower },
          { label: 'Best Stamina', value: summary.bestStamina },
          { label: 'Avg FB', value: `${summary.avgFBVelo} mph` },
          { label: 'Avg Drop', value: `${summary.avgVeloDrop} mph` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FB Velo</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Max</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Drop</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Stamina</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const sg = STAMINA_GRADE_DISPLAY[p.staminaGrade];
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
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{p.team} · {p.role}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.primaryVelo >= 96 ? '#22c55e' : '#ccc' }}>
                      {p.primaryVelo}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.maxVelo >= 100 ? '#f59e0b' : '#ccc', fontWeight: 600 }}>
                      {p.maxVelo}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.veloDropPerInning >= 0.6 ? '#ef4444' : '#22c55e' }}>
                      {p.veloDropPerInning.toFixed(1)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: sg.color, fontWeight: 600, fontSize: 10 }}>
                      {sg.label}
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
                  {selected.team} · {selected.role}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Primary Velo', value: `${selected.primaryVelo} mph`, color: '#f59e0b' },
                  { label: 'Max Velo', value: `${selected.maxVelo} mph`, color: selected.maxVelo >= 100 ? '#22c55e' : '#ccc' },
                  { label: 'Consistency', value: selected.consistencyScore, color: selected.consistencyScore >= 80 ? '#22c55e' : '#eab308' },
                  { label: 'Stamina', value: STAMINA_GRADE_DISPLAY[selected.staminaGrade].label, color: STAMINA_GRADE_DISPLAY[selected.staminaGrade].color },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pitch Type Velocities */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH TYPE VELOCITIES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Max</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>P95</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>P5</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitchTypes.map(pt => (
                    <tr key={pt.pitchType} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pt.pitchType}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.avgVelo}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b' }}>{pt.maxVelo}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#ccc' }}>{pt.p95}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{pt.p5}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.spread <= 4.5 ? '#22c55e' : '#eab308' }}>{pt.spread}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Velocity Bands */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>
                VELOCITY BANDS — {selected.primaryPitch.toUpperCase()}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Range</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pct</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>wOBA</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.velocityBands.map(vb => (
                    <tr key={vb.range} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{vb.range}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{vb.pct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: vb.whiffPct >= 30 ? '#22c55e' : '#ccc' }}>{vb.whiffPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: vb.wOBA <= 0.260 ? '#22c55e' : vb.wOBA >= 0.340 ? '#ef4444' : '#ccc' }}>
                        {vb.wOBA.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Inning by Inning */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>INNING BY INNING</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'center', padding: 4 }}>INN</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Avg Velo</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Max Velo</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Drop</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.inningByInning.map(iv => (
                    <tr key={iv.inning} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, textAlign: 'center', fontWeight: 600 }}>{iv.inning}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{iv.avgVelo}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b' }}>{iv.maxVelo}</td>
                      <td style={{
                        padding: 4, textAlign: 'center',
                        color: iv.veloDrop === 0 ? '#666' : iv.veloDrop >= 2.0 ? '#ef4444' : iv.veloDrop >= 1.0 ? '#eab308' : '#22c55e',
                      }}>
                        {iv.veloDrop === 0 ? '--' : `-${iv.veloDrop.toFixed(1)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Analysis Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view velocity profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
