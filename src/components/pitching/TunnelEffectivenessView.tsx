/**
 * TunnelEffectivenessView – Pitch tunnel effectiveness dashboard
 *
 * Bloomberg-terminal style tunnel point analysis measuring pitch deception
 * at the decision point, with tunnel distances, reaction times, and effectiveness.
 */
import { useState, useMemo } from 'react';
import {
  TunnelProfile,
  TUNNEL_GRADE_DISPLAY,
  tunnelGradeFromScore,
  getTunnelEffectivenessSummary,
  generateDemoTunnelEffectiveness,
} from '../../engine/pitching/pitchTunnelEffectiveness';

export default function TunnelEffectivenessView() {
  const profiles = useMemo(() => generateDemoTunnelEffectiveness(), []);
  const summary = useMemo(() => getTunnelEffectivenessSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<TunnelProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH TUNNEL EFFECTIVENESS — DECEPTION ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Best Tunneler', value: summary.bestTunneler, color: '#22c55e' },
          { label: 'Avg Score', value: summary.avgTunnelScore },
          { label: 'Best Pair', value: summary.bestPair },
          { label: 'Tightest', value: summary.tightestTunnel },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rank</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg Dist</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const grade = tunnelGradeFromScore(p.overallTunnelScore);
                const gd = TUNNEL_GRADE_DISPLAY[grade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team} · {p.role}</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 700 }}>{p.overallTunnelScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>#{p.deceptionRank}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.avgTunnelDist.toFixed(1)}"</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 600, fontSize: 10 }}>{gd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 460px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.role}</span>
              </div>
              <div style={{ color: TUNNEL_GRADE_DISPLAY[tunnelGradeFromScore(selected.overallTunnelScore)].color, fontWeight: 700, marginBottom: 12 }}>
                {TUNNEL_GRADE_DISPLAY[tunnelGradeFromScore(selected.overallTunnelScore)].label} · Score {selected.overallTunnelScore} · Rank #{selected.deceptionRank}
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>{selected.avgTunnelDist.toFixed(1)}"</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Avg Tunnel Dist</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.releaseConsistency >= 85 ? '#22c55e' : '#ccc', fontWeight: 700, fontSize: 18 }}>{selected.releaseConsistency}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Release Consistency</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>{selected.bestPair}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Best Pair</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>{selected.worstPair}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Worst Pair</div>
                </div>
              </div>

              {/* Tunnel Pairs */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TUNNEL PAIR ANALYSIS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pair</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Dist"</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>React ms</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Eff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>CSt%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pairs.map((pair, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600, fontSize: 10 }}>{pair.pitch1} → {pair.pitch2}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.tunnelDistance <= 2.0 ? '#22c55e' : pair.tunnelDistance >= 4.0 ? '#ef4444' : '#ccc', fontWeight: 700 }}>
                        {pair.tunnelDistance.toFixed(1)}"
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.reactionTime <= 150 ? '#ef4444' : '#888' }}>{pair.reactionTime}ms</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.effectivenessPct >= 80 ? '#22c55e' : pair.effectivenessPct >= 60 ? '#facc15' : '#ef4444', fontWeight: 700 }}>
                        {pair.effectivenessPct}%
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.whiffRateCombo >= 35 ? '#22c55e' : '#ccc' }}>
                        {typeof pair.whiffRateCombo === 'number' ? (pair.whiffRateCombo > 1 ? pair.whiffRateCombo.toFixed(1) : (pair.whiffRateCombo * 100).toFixed(1)) : pair.whiffRateCombo}%
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>
                        {typeof pair.calledStrikeRate === 'number' ? (pair.calledStrikeRate > 1 ? pair.calledStrikeRate.toFixed(1) : (pair.calledStrikeRate * 100).toFixed(1)) : pair.calledStrikeRate}%
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
              Select a pitcher to view tunnel effectiveness
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
