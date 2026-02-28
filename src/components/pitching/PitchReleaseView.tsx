/**
 * PitchReleaseView – Pitch release point analysis dashboard
 *
 * Bloomberg-terminal style release point tracker with consistency grades,
 * extension metrics, deception/tunnel scores, and per-pitch release data.
 */
import { useState, useMemo } from 'react';
import {
  PitcherReleaseProfile,
  CONSISTENCY_DISPLAY,
  getReleasePointSummary,
  generateDemoPitchRelease,
} from '../../engine/pitching/pitchReleasePoint';

export default function PitchReleaseView() {
  const pitchers = useMemo(() => generateDemoPitchRelease(), []);
  const summary = useMemo(() => getReleasePointSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherReleaseProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH RELEASE POINT — DECEPTION ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Best Deception', value: summary.bestDeception, color: '#22c55e' },
          { label: 'Avg Extension', value: `${summary.avgExtension} ft` },
          { label: 'Avg Tunnel', value: summary.avgTunnelScore },
          { label: 'Elite Consistency', value: summary.eliteConsistency, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>T</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Ext</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Decep</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tunnel</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team}</span></td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.throws}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.avgExtension} ft</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.deceptionScore >= 80 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{p.deceptionScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.tunnelScore >= 85 ? '#22c55e' : '#ccc' }}>{p.tunnelScore}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: CONSISTENCY_DISPLAY[p.overallConsistency].color, fontWeight: 600 }}>
                    {CONSISTENCY_DISPLAY[p.overallConsistency].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · {selected.throws}HP</span>
              </div>
              <div style={{ color: CONSISTENCY_DISPLAY[selected.overallConsistency].color, fontWeight: 700, marginBottom: 12 }}>
                Consistency: {CONSISTENCY_DISPLAY[selected.overallConsistency].label}
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>{selected.avgExtension} ft</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Extension</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.deceptionScore >= 80 ? '#22c55e' : '#ccc', fontWeight: 700, fontSize: 18 }}>{selected.deceptionScore}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Deception</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.tunnelScore >= 85 ? '#22c55e' : '#ccc', fontWeight: 700, fontSize: 18 }}>{selected.tunnelScore}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Tunnel Score</div>
                </div>
              </div>

              {/* Per-Pitch Release Data */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RELEASE POINT BY PITCH</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>H-Rel</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>V-Rel</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Ext</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>H-Spread</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>V-Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitches.map(pt => (
                    <tr key={pt.pitchType} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pt.pitchType} <span style={{ color: '#666', fontSize: 9 }}>{pt.usagePct}%</span></td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.horzRelease} ft</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pt.vertRelease} ft</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.extension >= 6.8 ? '#22c55e' : '#ccc' }}>{pt.extension} ft</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.horzSpread <= 1.0 ? '#22c55e' : pt.horzSpread >= 1.5 ? '#ef4444' : '#ccc' }}>{pt.horzSpread}"</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pt.vertSpread <= 0.7 ? '#22c55e' : pt.vertSpread >= 1.2 ? '#ef4444' : '#ccc' }}>{pt.vertSpread}"</td>
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
              Select a pitcher to view release point data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
