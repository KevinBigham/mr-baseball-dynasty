/**
 * DefRunsSavedView – Defensive runs saved dashboard
 *
 * Bloomberg-terminal style DRS tracker with component breakdowns,
 * UZR/OAA comparisons, and defensive grade assessments.
 */
import { useState, useMemo } from 'react';
import {
  DefRunsPlayer,
  DEF_GRADE_DISPLAY,
  getDRSSummary,
  generateDemoDefRunsSaved,
} from '../../engine/analytics/defRunsSaved';

export default function DefRunsSavedView() {
  const players = useMemo(() => generateDemoDefRunsSaved(), []);
  const summary = useMemo(() => getDRSSummary(players), [players]);
  const [selected, setSelected] = useState<DefRunsPlayer | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DEFENSIVE RUNS SAVED — VALUE TRACKER
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team DRS', value: summary.teamDRS, color: summary.teamDRS >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Team UZR', value: summary.teamUZR },
          { label: 'Best Defender', value: summary.bestDefender },
          { label: 'GG Contenders', value: summary.goldGloveContenders, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>DRS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>UZR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OAA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>%ile</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const dg = DEF_GRADE_DISPLAY[p.defGrade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.totalDRS >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p.totalDRS > 0 ? '+' : ''}{p.totalDRS}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.uzr >= 0 ? '#22c55e' : '#ef4444' }}>{p.uzr > 0 ? '+' : ''}{p.uzr}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.oaa > 0 ? '+' : ''}{p.oaa}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.percentileRank >= 75 ? '#22c55e' : '#ccc' }}>{p.percentileRank}th</td>
                    <td style={{ padding: 6, textAlign: 'center', color: dg.color, fontWeight: 600 }}>{dg.emoji} {dg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: DEF_GRADE_DISPLAY[selected.defGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {DEF_GRADE_DISPLAY[selected.defGrade].emoji} {DEF_GRADE_DISPLAY[selected.defGrade].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>{selected.innings} IP · {selected.percentileRank}th percentile</span>
              </div>

              {/* DRS Components */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>DRS COMPONENTS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Total DRS', value: `${selected.totalDRS > 0 ? '+' : ''}${selected.totalDRS}`, color: selected.totalDRS >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Range', value: `${selected.components.rangeRuns > 0 ? '+' : ''}${selected.components.rangeRuns}`, color: selected.components.rangeRuns >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Arm', value: `${selected.components.armRuns > 0 ? '+' : ''}${selected.components.armRuns}`, color: selected.components.armRuns >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'DP', value: `${selected.components.dpRuns > 0 ? '+' : ''}${selected.components.dpRuns}`, color: selected.components.dpRuns >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Error', value: `${selected.components.errorRuns > 0 ? '+' : ''}${selected.components.errorRuns}`, color: selected.components.errorRuns >= 0 ? '#22c55e' : '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Plays */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PLAY TRACKING</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{selected.components.goodPlays}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Good Plays</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>{selected.components.misplays}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Misplays</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>{selected.uzr}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>UZR</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>{selected.oaa}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>OAA</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view defensive metrics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
