/**
 * PIVIndexView – Pitch Induced Vertigo index dashboard
 *
 * Bloomberg-terminal style PIV tracker with pitch pair analysis,
 * movement differentials, whiff rates, and deception rankings.
 */
import { useState, useMemo } from 'react';
import {
  PitcherPIVProfile,
  PIV_GRADE_DISPLAY,
  pivGradeColor,
  getPIVSummary,
  generateDemoPIVIndex,
} from '../../engine/pitching/pivIndex';

export default function PIVIndexView() {
  const pitchers = useMemo(() => generateDemoPIVIndex(), []);
  const summary = useMemo(() => getPIVSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherPIVProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PIV INDEX — PITCH INDUCED VERTIGO
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Best PIV', value: summary.bestPIV, color: '#22c55e' },
          { label: 'Avg PIV', value: summary.avgPIV },
          { label: 'Elite', value: summary.eliteCount, color: '#22c55e' },
          { label: 'Best Pair', value: summary.bestPair },
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
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>PIV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rank</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avg Diff</th>
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
                  <td style={{ padding: 6, textAlign: 'center', color: p.overallPIV >= 70 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{p.overallPIV}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>#{p.deceptionRank}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.avgMovementDiff}"</td>
                  <td style={{ padding: 6, textAlign: 'center', color: pivGradeColor(p.pivGrade), fontWeight: 600 }}>
                    {PIV_GRADE_DISPLAY[p.pivGrade].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · {selected.throws}HP</span>
              </div>
              <div style={{ color: pivGradeColor(selected.pivGrade), fontWeight: 700, marginBottom: 12 }}>
                PIV: {selected.overallPIV} — {PIV_GRADE_DISPLAY[selected.pivGrade].label} · Rank #{selected.deceptionRank}
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>{selected.avgMovementDiff}"</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Avg Mvmt Diff</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>{selected.bestCombo}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Best Combo</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>{selected.worstCombo}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Worst Combo</div>
                </div>
              </div>

              {/* Pitch Pairs */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCH PAIR ANALYSIS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Sequence</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Total"</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Use%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>PIV</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pairs.map((pair, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{pair.pitch1} → {pair.pitch2}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.totalDiff >= 18 ? '#22c55e' : '#ccc' }}>{pair.totalDiff.toFixed(1)}"</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{pair.usagePct}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.whiffRate >= 35 ? '#22c55e' : '#ccc' }}>{pair.whiffRate}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: pair.pivScore >= 80 ? '#22c55e' : pair.pivScore >= 60 ? '#facc15' : '#ef4444', fontWeight: 700 }}>{pair.pivScore}</td>
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
              Select a pitcher to view PIV breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
