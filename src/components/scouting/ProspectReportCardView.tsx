/**
 * ProspectReportCardView – Detailed prospect scouting report card viewer
 *
 * Bloomberg-terminal style interface for viewing in-depth scouting reports
 * with 20-80 tool grades, written narratives, risk/reward analysis,
 * ceiling/floor projections, and MLB player comparables.
 */
import { useState, useMemo } from 'react';
import {
  ProspectReportCard,
  RISK_DISPLAY,
  REWARD_DISPLAY,
  gradeColor,
  gradeLabel,
  getReportCardSummary,
  generateDemoProspectReportCards,
} from '../../engine/scouting/prospectReportCard';

const PANEL = '#111827';
const BORDER = '#374151';
const ACCENT = '#f59e0b';
const BG = '#030712';

export default function ProspectReportCardView() {
  const cards = useMemo(() => generateDemoProspectReportCards(), []);
  const summary = useMemo(() => getReportCardSummary(cards), [cards]);
  const [selected, setSelected] = useState<ProspectReportCard | null>(null);

  const renderGradeBar = (present: number, future: number) => {
    const pctPresent = ((present - 20) / 60) * 100;
    const pctFuture = ((future - 20) / 60) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <div style={{ position: 'relative', flex: 1, height: 10, background: '#1f2937', borderRadius: 2 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${pctFuture}%`, background: '#374151', borderRadius: 2,
          }} />
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${pctPresent}%`, background: gradeColor(present), borderRadius: 2, opacity: 0.9,
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 13, background: BG, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: `1px solid ${BORDER}`, paddingBottom: 10 }}>
        <div>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>PROSPECT SCOUTING REPORT CARDS</span>
          <span style={{ color: '#6b7280', marginLeft: 12, fontSize: 11 }}>WAVE 76 // DETAILED SCOUTING ANALYSIS</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: 10 }}>20-80 SCALE // {cards.length} REPORTS</span>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Reports Filed', value: summary.totalReports, color: ACCENT },
          { label: 'Avg FV Grade', value: summary.avgFV, color: gradeColor(summary.avgFV) },
          { label: 'Highest Ceiling', value: `${summary.highestCeiling.name} (${summary.highestCeiling.war} WAR)`, color: '#22c55e' },
          { label: 'Safest Floor', value: `${summary.safestFloor.name} (${summary.safestFloor.war} WAR)`, color: '#3b82f6' },
          { label: 'Closest ETA', value: summary.closestETA, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', border: `1px solid ${BORDER}`, background: PANEL, minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: typeof s.value === 'number' ? 18 : 12, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left Panel: Prospect List */}
        <div style={{ width: 420, flexShrink: 0 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 0 }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Prospect Index
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Player</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>FV</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Ceil</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{
                      borderBottom: `1px solid #1f2937`,
                      cursor: 'pointer',
                      background: selected?.id === c.id ? '#1e293b' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontWeight: 600, color: selected?.id === c.id ? ACCENT : '#e5e7eb' }}>{c.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 10 }}>{c.team} / {c.level} / Age {c.age}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6, color: '#9ca3af' }}>{c.position}</td>
                    <td style={{ textAlign: 'center', padding: 6, color: gradeColor(c.overallFV), fontWeight: 700, fontSize: 14 }}>{c.overallFV}</td>
                    <td style={{ textAlign: 'center', padding: 6, color: '#d1d5db', fontSize: 10 }}>{c.eta}</td>
                    <td style={{ textAlign: 'center', padding: 6, color: RISK_DISPLAY[c.risk].color, fontSize: 10 }}>{RISK_DISPLAY[c.risk].label}</td>
                    <td style={{ textAlign: 'center', padding: 6, color: '#22c55e', fontWeight: 600 }}>{c.ceilingWAR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Full Report Card */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 0 }}>
              {/* Player Header */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: ACCENT }}>{selected.name}</div>
                  <div style={{ color: '#9ca3af', fontSize: 11 }}>
                    {selected.position} | {selected.team} | {selected.bats}/{selected.throws} | {selected.height}, {selected.weight} lbs | Age {selected.age}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>{selected.draftInfo} | Bonus: ${selected.signBonus}M</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: gradeColor(selected.overallFV), fontWeight: 700, fontSize: 32, lineHeight: 1 }}>{selected.overallFV}</div>
                  <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase' }}>Future Value</div>
                </div>
              </div>

              <div style={{ padding: '12px 16px' }}>
                {/* Tool Grades */}
                <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, borderBottom: `1px solid #1f2937`, paddingBottom: 4 }}>
                  Tool Grades (20-80 Scale)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ color: '#6b7280', borderBottom: `1px solid #1f2937` }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px', width: 70 }}>Tool</th>
                      <th style={{ textAlign: 'center', padding: 4, width: 55 }}>Present</th>
                      <th style={{ textAlign: 'center', padding: 4, width: 55 }}>Future</th>
                      <th style={{ textAlign: 'center', padding: 4, width: 20 }}></th>
                      <th style={{ padding: 4 }}>Grade Bar</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Scout Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.tools.map(t => (
                      <tr key={t.tool} style={{ borderBottom: `1px solid #0f172a` }}>
                        <td style={{ padding: '5px 6px', fontWeight: 600, color: '#d1d5db' }}>{t.tool}</td>
                        <td style={{ textAlign: 'center', padding: 4 }}>
                          <span style={{ color: gradeColor(t.present), fontWeight: 700 }}>{t.present}</span>
                          <span style={{ color: '#4b5563', fontSize: 9, marginLeft: 3 }}>{gradeLabel(t.present)}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: 4 }}>
                          <span style={{ color: gradeColor(t.future), fontWeight: 700 }}>{t.future}</span>
                          <span style={{ color: '#4b5563', fontSize: 9, marginLeft: 3 }}>{gradeLabel(t.future)}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: 4, color: t.trending === 'up' ? '#22c55e' : t.trending === 'down' ? '#ef4444' : '#6b7280' }}>
                          {t.trending === 'up' ? '▲' : t.trending === 'down' ? '▼' : '▬'}
                        </td>
                        <td style={{ padding: '5px 4px' }}>{renderGradeBar(t.present, t.future)}</td>
                        <td style={{ padding: '4px 6px', color: '#9ca3af', fontSize: 10, maxWidth: 260 }}>{t.scoutNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Risk / Reward + Projections Row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {/* Risk/Reward */}
                  <div style={{ flex: 1, border: `1px solid #1f2937`, padding: 10 }}>
                    <div style={{ color: '#9ca3af', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Risk / Reward</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', border: `1px solid ${RISK_DISPLAY[selected.risk].color}40` }}>
                        <div style={{ color: '#6b7280', fontSize: 9 }}>RISK</div>
                        <div style={{ color: RISK_DISPLAY[selected.risk].color, fontWeight: 700 }}>{RISK_DISPLAY[selected.risk].label}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', border: `1px solid ${REWARD_DISPLAY[selected.reward].color}40` }}>
                        <div style={{ color: '#6b7280', fontSize: 9 }}>REWARD</div>
                        <div style={{ color: REWARD_DISPLAY[selected.reward].color, fontWeight: 700 }}>{REWARD_DISPLAY[selected.reward].label}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>Risk Factors:</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: '#d1d5db' }}>
                      {selected.riskFactors.map((rf, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>{rf}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: 10, color: '#22c55e', marginTop: 6 }}>
                      <span style={{ color: '#9ca3af' }}>Upside:</span> {selected.upside}
                    </div>
                  </div>

                  {/* Projections */}
                  <div style={{ flex: 1, border: `1px solid #1f2937`, padding: 10 }}>
                    <div style={{ color: '#9ca3af', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Projections</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: '#0f172a' }}>
                        <div style={{ color: '#6b7280', fontSize: 9 }}>CEILING WAR</div>
                        <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 20 }}>{selected.ceilingWAR}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: '#0f172a' }}>
                        <div style={{ color: '#6b7280', fontSize: 9 }}>FLOOR WAR</div>
                        <div style={{ color: '#f97316', fontWeight: 700, fontSize: 20 }}>{selected.floorWAR}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: '#0f172a' }}>
                        <div style={{ color: '#6b7280', fontSize: 9 }}>ETA</div>
                        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13 }}>{selected.eta}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#d1d5db' }}>
                      <span style={{ color: '#9ca3af' }}>Projected Role:</span> {selected.projectedRole}
                    </div>
                    <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 4 }}>
                      <span style={{ color: '#9ca3af' }}>Season Line:</span> {selected.seasonStats}
                    </div>
                  </div>
                </div>

                {/* MLB Comparables */}
                <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, borderBottom: `1px solid #1f2937`, paddingBottom: 4 }}>
                  MLB Comparables
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  {selected.comparables.map((comp, i) => (
                    <div key={i} style={{ flex: 1, padding: 8, border: `1px solid #1f2937`, background: '#0f172a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>{comp.name}</span>
                        <span style={{
                          color: comp.similarity >= 80 ? '#22c55e' : comp.similarity >= 70 ? '#4ade80' : comp.similarity >= 60 ? '#f59e0b' : '#f97316',
                          fontWeight: 700, fontSize: 11,
                        }}>{comp.similarity}%</span>
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: 10 }}>{comp.note}</div>
                    </div>
                  ))}
                </div>

                {/* Scout Narrative */}
                <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, borderBottom: `1px solid #1f2937`, paddingBottom: 4 }}>
                  Scout Narrative
                </div>
                <div style={{ padding: 12, background: '#0f172a', border: `1px solid #1f2937`, color: '#d1d5db', fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                  {selected.narrative}
                </div>
                <div style={{ color: '#4b5563', fontSize: 10, textAlign: 'right' }}>
                  Report by <span style={{ color: '#9ca3af' }}>{selected.scoutName}</span> | Filed {selected.scoutDate}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 60, textAlign: 'center', color: '#4b5563' }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>SELECT A PROSPECT</div>
              <div style={{ fontSize: 11 }}>Click a player from the index to view their full scouting report card</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
