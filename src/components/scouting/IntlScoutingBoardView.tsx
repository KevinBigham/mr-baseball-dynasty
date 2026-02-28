/**
 * IntlScoutingBoardView – International amateur scouting dashboard
 *
 * Bloomberg-terminal style intl scouting board with prospect rankings,
 * tool grades, signing status, bonus projections, and scouting reports.
 */
import { useState, useMemo } from 'react';
import {
  IntlProspectEntry,
  STATUS_DISPLAY,
  RISK_DISPLAY,
  gradeColor,
  getIntlScoutingSummary,
  generateDemoIntlScoutingBoard,
} from '../../engine/scouting/intlScoutingBoard';

export default function IntlScoutingBoardView() {
  const prospects = useMemo(() => generateDemoIntlScoutingBoard(), []);
  const summary = useMemo(() => getIntlScoutingSummary(prospects), [prospects]);
  const [selected, setSelected] = useState<IntlProspectEntry | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        INTERNATIONAL SCOUTING BOARD — J2 PROSPECTS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Prospects', value: summary.totalProspects },
          { label: 'Signed', value: summary.signedCount, color: '#22c55e' },
          { label: 'Committed', value: summary.committedCount, color: '#4ade80' },
          { label: 'Top Country', value: summary.topCountry },
          { label: 'Bonus Pool', value: `$${summary.totalBonusPool}M`, color: '#f59e0b' },
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
                <th style={{ textAlign: 'center', padding: 6 }}>Country</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Bonus</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888', fontSize: 10 }}>{p.country}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.age}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: gradeColor(p.overallGrade), fontWeight: 700 }}>{p.overallGrade}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${p.projectedBonus}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: STATUS_DISPLAY[p.status].color, fontWeight: 600, fontSize: 10 }}>
                    {STATUS_DISPLAY[p.status].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.country} · Age {selected.age}</span>
              </div>
              <div style={{ color: STATUS_DISPLAY[selected.status].color, fontWeight: 700, marginBottom: 4 }}>
                {STATUS_DISPLAY[selected.status].label}
                {selected.committedTeam && <span style={{ color: '#22c55e', marginLeft: 8 }}>→ {selected.committedTeam}</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 11, color: '#888' }}>
                <span>{selected.height} / {selected.weight} lbs</span>
                <span>B: {selected.bats}</span>
                <span>T: {selected.throws}</span>
                <span>Class: {selected.signingClass}</span>
              </div>

              {/* Tool Grades */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOOL GRADES (20-80)</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.overallGrade), fontWeight: 700, fontSize: 18 }}>{selected.overallGrade}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Overall</div>
                </div>
                {selected.tools.map(t => (
                  <div key={t.tool} style={{ textAlign: 'center' }}>
                    <div style={{ color: gradeColor(t.grade), fontWeight: 700, fontSize: 14 }}>{t.grade}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{t.tool}</div>
                  </div>
                ))}
              </div>

              {/* Risk & Bonus */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center', padding: 6, border: `1px solid ${RISK_DISPLAY[selected.riskLevel].color}` }}>
                  <div style={{ color: '#888', fontSize: 9 }}>RISK</div>
                  <div style={{ color: RISK_DISPLAY[selected.riskLevel].color, fontWeight: 700 }}>{RISK_DISPLAY[selected.riskLevel].label}</div>
                </div>
                <div style={{ textAlign: 'center', padding: 6, border: '1px solid #f59e0b' }}>
                  <div style={{ color: '#888', fontSize: 9 }}>PROJ BONUS</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>${selected.projectedBonus}M</div>
                </div>
                <div style={{ textAlign: 'center', padding: 6, border: '1px solid #333' }}>
                  <div style={{ color: '#888', fontSize: 9 }}>COMP</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 10 }}>{selected.comp}</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUTING REPORT</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.scoutingReport}
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
