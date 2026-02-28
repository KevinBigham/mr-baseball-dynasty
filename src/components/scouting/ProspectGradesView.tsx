/**
 * ProspectGradesView – Prospect scouting grades dashboard
 *
 * Bloomberg-terminal style prospect card viewer with tool grades,
 * present/future splits, risk assessment, and player comps.
 */
import { useState, useMemo } from 'react';
import {
  ProspectGradeCard,
  RISK_DISPLAY,
  gradeColor,
  getProspectGradeSummary,
  generateDemoProspectGrades,
} from '../../engine/scouting/prospectGrades';

export default function ProspectGradesView() {
  const cards = useMemo(() => generateDemoProspectGrades(), []);
  const summary = useMemo(() => getProspectGradeSummary(cards), [cards]);
  const [selected, setSelected] = useState<ProspectGradeCard | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PROSPECT GRADES — SCOUTING CARDS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Prospects', value: summary.totalProspects },
          { label: 'Elite (60+ FV)', value: summary.eliteProspects, color: '#22c55e' },
          { label: 'Avg FV', value: summary.avgFV },
          { label: 'Lowest Risk', value: summary.lowestRisk },
          { label: 'Closest ETA', value: summary.closestETA },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Prospect List ── */}
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Level</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === c.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{c.overallRank}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{c.pos}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: gradeColor(c.fvGrade), fontWeight: 700 }}>{c.fvGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{c.level}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{c.eta}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: RISK_DISPLAY[c.risk].color }}>{RISK_DISPLAY[c.risk].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Scouting Card ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · Age {selected.age}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.fvGrade), fontWeight: 700, fontSize: 22 }}>{selected.fvGrade}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>FV Grade</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>#{selected.overallRank}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Overall</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>#{selected.orgRank}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Org Rank</div>
                </div>
              </div>

              {/* Info */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>PROFILE</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, fontSize: 11 }}>
                <span><span style={{ color: '#666' }}>Level:</span> {selected.level}</span>
                <span><span style={{ color: '#666' }}>ETA:</span> {selected.eta}</span>
                <span><span style={{ color: '#666' }}>Body:</span> {selected.bodyType}</span>
                <span><span style={{ color: '#666' }}>Pick:</span> {selected.draftPick}</span>
                <span><span style={{ color: '#666' }}>Bonus:</span> ${selected.signBonus}M</span>
              </div>

              {/* Tool Grades */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOOL GRADES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Tool</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Present</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Future</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.tools.map(t => (
                    <tr key={t.tool} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{t.tool}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.present), fontWeight: 700 }}>{t.present}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: gradeColor(t.future), fontWeight: 700 }}>{t.future}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: t.trending === 'up' ? '#22c55e' : t.trending === 'down' ? '#ef4444' : '#888' }}>
                        {t.trending === 'up' ? '▲' : t.trending === 'down' ? '▼' : '▬'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Risk & Comp */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 6, border: `1px solid ${RISK_DISPLAY[selected.risk].color}` }}>
                  <div style={{ color: '#888', fontSize: 9 }}>RISK</div>
                  <div style={{ color: RISK_DISPLAY[selected.risk].color, fontWeight: 700 }}>{RISK_DISPLAY[selected.risk].label}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#888', fontSize: 9 }}>COMP</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11 }}>{selected.comp}</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUTING REPORT</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view scouting card
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
