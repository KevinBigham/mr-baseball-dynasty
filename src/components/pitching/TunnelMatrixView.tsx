/**
 * TunnelMatrixView – Pitch tunneling matrix dashboard
 *
 * Bloomberg-terminal style tunnel analysis with pair-by-pair
 * deception scores, distance metrics, and run value analysis.
 */
import { useState, useMemo } from 'react';
import {
  PitcherTunnelProfile,
  getTunnelColor,
  getTunnelSummary,
  generateDemoTunnelMatrix,
} from '../../engine/pitching/tunnelMatrix';

export default function TunnelMatrixView() {
  const profiles = useMemo(() => generateDemoTunnelMatrix(), []);
  const summary = useMemo(() => getTunnelSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<PitcherTunnelProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TUNNEL MATRIX — PITCH DECEPTION
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Avg Tunnel', value: summary.avgTeamTunnel },
          { label: 'Best Tunneler', value: summary.bestTunneler },
          { label: 'Best Pair', value: summary.bestPairOverall },
          { label: 'Elite Tunnelers', value: summary.eliteTunnelers, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pitches</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tunnel</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Best Pair</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
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
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.team}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.pitches.length}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: getTunnelColor(p.overallTunnelGrade), fontWeight: 700 }}>{p.overallTunnelGrade}</td>
                  <td style={{ padding: 6, fontSize: 10 }}>{p.bestPair}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Matrix Detail ── */}
        <div style={{ flex: '1 1 460px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · OVR {selected.overall}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: getTunnelColor(selected.overallTunnelGrade), fontWeight: 700 }}>Tunnel Grade: {selected.overallTunnelGrade}</span>
                <span style={{ color: '#888', marginLeft: 12, fontSize: 11 }}>Arsenal: {selected.pitches.join(', ')}</span>
              </div>

              {/* Tunnel Pair Table */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TUNNEL PAIR MATRIX</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pair</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>T-Dist</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>P-Dist</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Decep.</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>RV/100</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.matrix.map((pair, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600, fontSize: 10 }}>{pair.pitch1} → {pair.pitch2}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: getTunnelColor(pair.tunnelScore), fontWeight: 700 }}>{pair.tunnelScore}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.tunnelDistance <= 3 ? '#22c55e' : '#ccc' }}>{pair.tunnelDistance}"</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{pair.plateDistance}"</td>
                      <td style={{ padding: 4, textAlign: 'center', color: getTunnelColor(pair.effectiveDeception) }}>{pair.effectiveDeception}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.whiffRateCombo >= 30 ? '#f59e0b' : '#ccc' }}>{pair.whiffRateCombo}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.runValuePer100 <= -2 ? '#22c55e' : pair.runValuePer100 >= 0 ? '#ef4444' : '#ccc' }}>{pair.runValuePer100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Best/Worst */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 6, border: '1px solid #22c55e' }}>
                  <div style={{ color: '#888', fontSize: 9 }}>BEST PAIR</div>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 11 }}>{selected.bestPair}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 6, border: '1px solid #ef4444' }}>
                  <div style={{ color: '#888', fontSize: 9 }}>WORST PAIR</div>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 11 }}>{selected.worstPair}</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view tunnel matrix
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
