/**
 * PlatoonOptView – Platoon optimization dashboard
 *
 * Bloomberg-terminal style platoon pair evaluation with L/R matchup grades,
 * combined wOBA projections, optimal deployment splits, and platoon advantages.
 */
import { useState, useMemo } from 'react';
import {
  PlatoonPair,
  PLATOON_GRADE_DISPLAY,
  getPlatoonOptimizationSummary,
  generateDemoPlatoonOptimization,
} from '../../engine/analytics/platoonOptimization';

export default function PlatoonOptView() {
  const pairs = useMemo(() => generateDemoPlatoonOptimization(), []);
  const summary = useMemo(() => getPlatoonOptimizationSummary(pairs), [pairs]);
  const [selected, setSelected] = useState<PlatoonPair | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PLATOON OPTIMIZATION — DEPLOYMENT ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pairs', value: summary.totalPairs },
          { label: 'Best Pair', value: summary.bestPair, color: '#22c55e' },
          { label: 'Avg Advantage', value: summary.avgAdvantage },
          { label: 'Best wOBA', value: summary.bestCombinedWOBA, color: '#22c55e' },
          { label: 'Elite', value: summary.elitePlatoons },
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
                <th style={{ textAlign: 'left', padding: 6 }}>Position</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Players</th>
                <th style={{ textAlign: 'center', padding: 6 }}>wOBA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(p => {
                const gd = PLATOON_GRADE_DISPLAY[p.grade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 700, color: '#f59e0b' }}>{p.position}</td>
                    <td style={{ padding: 6, fontSize: 11 }}>{p.playerA.name} / {p.playerB.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.combinedWOBA >= .350 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{p.combinedWOBA.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{p.deploymentScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 600 }}>{gd.label}</td>
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
                {selected.position} PLATOON
                <span style={{ color: PLATOON_GRADE_DISPLAY[selected.grade].color, fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {PLATOON_GRADE_DISPLAY[selected.grade].label} · Score {selected.deploymentScore}
                </span>
              </div>
              <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
                Optimal: {selected.optimalSplit} · Combined wOBA: <span style={{ color: '#22c55e', fontWeight: 700 }}>{selected.combinedWOBA.toFixed(3)}</span>
              </div>

              {/* Player A */}
              <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>PLAYER A — {selected.playerA.name} (Bats {selected.playerA.bats})</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, border: '1px solid #333', padding: 8 }}>
                  <div style={{ color: '#888', fontSize: 9, marginBottom: 2 }}>vs LHP</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span>AVG <strong style={{ color: selected.playerA.splits.vsLHP.avg >= .270 ? '#22c55e' : '#ccc' }}>{selected.playerA.splits.vsLHP.avg.toFixed(3)}</strong></span>
                    <span>wOBA <strong style={{ color: selected.playerA.splits.vsLHP.wOBA >= .340 ? '#22c55e' : '#ccc' }}>{selected.playerA.splits.vsLHP.wOBA.toFixed(3)}</strong></span>
                    <span style={{ color: '#666' }}>{selected.playerA.splits.vsLHP.pa} PA</span>
                  </div>
                </div>
                <div style={{ flex: 1, border: '1px solid #333', padding: 8 }}>
                  <div style={{ color: '#888', fontSize: 9, marginBottom: 2 }}>vs RHP</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span>AVG <strong style={{ color: selected.playerA.splits.vsRHP.avg >= .270 ? '#22c55e' : '#ccc' }}>{selected.playerA.splits.vsRHP.avg.toFixed(3)}</strong></span>
                    <span>wOBA <strong style={{ color: selected.playerA.splits.vsRHP.wOBA >= .340 ? '#22c55e' : '#ccc' }}>{selected.playerA.splits.vsRHP.wOBA.toFixed(3)}</strong></span>
                    <span style={{ color: '#666' }}>{selected.playerA.splits.vsRHP.pa} PA</span>
                  </div>
                </div>
              </div>

              {/* Player B */}
              <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>PLAYER B — {selected.playerB.name} (Bats {selected.playerB.bats})</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, border: '1px solid #333', padding: 8 }}>
                  <div style={{ color: '#888', fontSize: 9, marginBottom: 2 }}>vs LHP</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span>AVG <strong style={{ color: selected.playerB.splits.vsLHP.avg >= .270 ? '#22c55e' : '#ccc' }}>{selected.playerB.splits.vsLHP.avg.toFixed(3)}</strong></span>
                    <span>wOBA <strong style={{ color: selected.playerB.splits.vsLHP.wOBA >= .340 ? '#22c55e' : '#ccc' }}>{selected.playerB.splits.vsLHP.wOBA.toFixed(3)}</strong></span>
                    <span style={{ color: '#666' }}>{selected.playerB.splits.vsLHP.pa} PA</span>
                  </div>
                </div>
                <div style={{ flex: 1, border: '1px solid #333', padding: 8 }}>
                  <div style={{ color: '#888', fontSize: 9, marginBottom: 2 }}>vs RHP</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span>AVG <strong style={{ color: selected.playerB.splits.vsRHP.avg >= .270 ? '#22c55e' : '#ccc' }}>{selected.playerB.splits.vsRHP.avg.toFixed(3)}</strong></span>
                    <span>wOBA <strong style={{ color: selected.playerB.splits.vsRHP.wOBA >= .340 ? '#22c55e' : '#ccc' }}>{selected.playerB.splits.vsRHP.wOBA.toFixed(3)}</strong></span>
                    <span style={{ color: '#666' }}>{selected.playerB.splits.vsRHP.pa} PA</span>
                  </div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a platoon pair to view deployment analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
