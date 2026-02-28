/**
 * PlatoonSplitsView – Detailed platoon splits matrix dashboard
 *
 * Bloomberg-terminal style splits analysis with vs LHP/RHP stat
 * breakdowns, platoon grades, and lineup recommendations.
 */
import { useState, useMemo } from 'react';
import {
  PlatoonSplitPlayer,
  platoonGradeColor,
  getPlatoonSplitSummary,
  generateDemoPlatoonSplits,
} from '../../engine/analytics/platoonSplitsMatrix';

export default function PlatoonSplitsView() {
  const players = useMemo(() => generateDemoPlatoonSplits(), []);
  const summary = useMemo(() => getPlatoonSplitSummary(players), [players]);
  const [selected, setSelected] = useState<PlatoonSplitPlayer | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PLATOON SPLITS — HANDEDNESS MATRIX
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Everyday', value: summary.everydayCount, color: '#22c55e' },
          { label: 'Platoon Candidates', value: summary.platoonCandidates, color: '#f59e0b' },
          { label: 'Biggest Split', value: summary.biggestSplit },
          { label: 'Team vs LHP', value: summary.teamVsLHP_OPS.toFixed(3) },
          { label: 'Team vs RHP', value: summary.teamVsRHP_OPS.toFixed(3) },
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
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Bat</th>
                <th style={{ textAlign: 'center', padding: 6 }}>vs LHP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>vs RHP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Diff</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rec</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.batSide}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.vsLHP.ops.toFixed(3)}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.vsRHP.ops.toFixed(3)}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: Math.abs(p.platoonDiff) <= 50 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {p.platoonDiff > 0 ? '+' : ''}{p.platoonDiff}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: platoonGradeColor(p.platoonGrade), fontWeight: 700 }}>{p.platoonGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center', fontSize: 10 }}>{p.recommendation}</td>
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
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · Bats {selected.batSide}</span>
              </div>
              <div style={{ color: platoonGradeColor(selected.platoonGrade), fontWeight: 700, marginBottom: 12 }}>
                Platoon Grade: {selected.platoonGrade} · Strong vs {selected.strongSide}
              </div>

              {/* Split Comparison Table */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SPLIT COMPARISON</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Stat</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>vs LHP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>vs RHP</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stat: 'PA', l: selected.vsLHP.pa, r: selected.vsRHP.pa, fmt: false },
                    { stat: 'AVG', l: selected.vsLHP.avg, r: selected.vsRHP.avg, fmt: true },
                    { stat: 'OBP', l: selected.vsLHP.obp, r: selected.vsRHP.obp, fmt: true },
                    { stat: 'SLG', l: selected.vsLHP.slg, r: selected.vsRHP.slg, fmt: true },
                    { stat: 'OPS', l: selected.vsLHP.ops, r: selected.vsRHP.ops, fmt: true },
                    { stat: 'wOBA', l: selected.vsLHP.wOBA, r: selected.vsRHP.wOBA, fmt: true },
                    { stat: 'HR', l: selected.vsLHP.hr, r: selected.vsRHP.hr, fmt: false },
                    { stat: 'K%', l: selected.vsLHP.kPct, r: selected.vsRHP.kPct, fmt: false },
                    { stat: 'BB%', l: selected.vsLHP.bbPct, r: selected.vsRHP.bbPct, fmt: false },
                    { stat: 'ISO', l: selected.vsLHP.iso, r: selected.vsRHP.iso, fmt: true },
                  ].map(row => {
                    const lBetter = row.stat === 'K%' ? row.l < row.r : row.l > row.r;
                    const rBetter = !lBetter;
                    return (
                      <tr key={row.stat} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: 4, fontWeight: 600 }}>{row.stat}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: lBetter ? '#22c55e' : '#ccc', fontWeight: lBetter ? 700 : 400 }}>
                          {row.fmt ? (row.l as number).toFixed(3) : `${row.l}${row.stat.includes('%') ? '%' : ''}`}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: rBetter ? '#22c55e' : '#ccc', fontWeight: rBetter ? 700 : 400 }}>
                          {row.fmt ? (row.r as number).toFixed(3) : `${row.r}${row.stat.includes('%') ? '%' : ''}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>RECOMMENDATION</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                <strong>{selected.recommendation}</strong> — {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view platoon splits
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
