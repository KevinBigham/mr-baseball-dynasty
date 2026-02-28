/**
 * DraftClassScoutingView – Draft class scouting reports dashboard
 *
 * Bloomberg-terminal style prospect evaluations with 20-80 tool grades,
 * projection ranges, comparison players, and detailed scout notes.
 */
import { useState, useMemo } from 'react';
import {
  DraftProspect,
  RISK_DISPLAY,
  gradeColor,
  getDraftClassSummary,
  generateDemoDraftClassScouting,
} from '../../engine/scouting/draftClassScouting';

export default function DraftClassScoutingView() {
  const prospects = useMemo(() => generateDemoDraftClassScouting(), []);
  const summary = useMemo(() => getDraftClassSummary(prospects), [prospects]);
  const [selected, setSelected] = useState<DraftProspect | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DRAFT CLASS SCOUTING REPORTS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Prospects', value: summary.totalProspects },
          { label: '#1 Overall', value: summary.topOverall, color: '#22c55e' },
          { label: 'Most Upside', value: summary.mostUpside, color: '#f59e0b' },
          { label: 'Avg Grade', value: summary.avgGrade },
          { label: 'HS / College', value: `${summary.hsCount} / ${summary.collegeCount}` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>Rk</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Lvl</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const rd = RISK_DISPLAY[p.riskLevel];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>#{p.projectedPick}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666', fontSize: 10 }}>({p.age})</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{p.position}</td>
                    <td style={{ padding: 6, textAlign: 'center', fontSize: 10 }}>{p.level}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gradeColor(p.overallGrade), fontWeight: 700 }}>{p.overallGrade}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gradeColor(p.futureGrade), fontWeight: 700 }}>{p.futureGrade}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: rd.color, fontSize: 10, fontWeight: 600 }}>{rd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 420px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.position} · Age {selected.age} · {selected.bats}/{selected.throws}
                </span>
              </div>
              <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
                {selected.school} · Projected Rd {selected.projectedRound}, Pick #{selected.projectedPick} · ETA: {selected.eta} yrs
              </div>

              {/* Grade Summary */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.overallGrade), fontWeight: 700, fontSize: 22 }}>{selected.overallGrade}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Current</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.futureGrade), fontWeight: 700, fontSize: 22 }}>{selected.futureGrade}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Future</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: RISK_DISPLAY[selected.riskLevel].color, fontWeight: 700, fontSize: 12 }}>{RISK_DISPLAY[selected.riskLevel].label}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Risk</div>
                </div>
              </div>

              {/* Tools */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SCOUTING TOOLS (Current / Future)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Tool</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Current</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Future</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.tools.map(t => (
                    <tr key={t.name} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.current), fontWeight: 700 }}>{t.current}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.future), fontWeight: 700 }}>{t.future}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: t.future > t.current ? '#22c55e' : '#888' }}>
                        {t.future > t.current ? `+${t.future - t.current}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Projection */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#22c55e', fontSize: 9, marginBottom: 2 }}>CEILING</div>
                  <div style={{ fontSize: 11 }}>{selected.ceilingLabel}</div>
                </div>
                <div style={{ flex: 1, padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#ef4444', fontSize: 9, marginBottom: 2 }}>FLOOR</div>
                  <div style={{ fontSize: 11 }}>{selected.floorLabel}</div>
                </div>
              </div>

              {/* Comparisons */}
              {selected.comparisons.length > 0 && (
                <>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>COMPARISONS</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    {selected.comparisons.map(c => (
                      <div key={c.playerName} style={{ padding: '4px 8px', border: '1px solid #333', fontSize: 11 }}>
                        <span style={{ color: '#f59e0b' }}>{c.playerName}</span>
                        <span style={{ color: '#666', marginLeft: 6 }}>{c.similarity}% match</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUT NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.scoutNotes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view scouting report
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
