/**
 * SwingDecisionView – Swing Decision Analysis dashboard
 *
 * Bloomberg-terminal style swing quality metrics with chase rate,
 * zone contact, and decision grading.
 */
import { useState, useMemo } from 'react';
import {
  SwingProfile,
  DECISION_GRADE_DISPLAY,
  getSwingDecisionSummary,
  generateDemoSwingDecision,
} from '../../engine/analytics/swingDecision';

export default function SwingDecisionView() {
  const profiles = useMemo(() => generateDemoSwingDecision(), []);
  const summary = useMemo(() => getSwingDecisionSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<SwingProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SWING DECISION ANALYSIS — PLATE APPROACH
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players', value: summary.totalPlayers },
          { label: 'Best Decider', value: summary.bestDecider, color: '#22c55e' },
          { label: 'Lowest Chase', value: summary.lowestChase, color: '#22c55e' },
          { label: 'Best Contact', value: summary.bestContact },
          { label: 'Avg Score', value: summary.avgDecisionScore },
          { label: 'Avg Chase', value: summary.avgChaseRate },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 520px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Chase%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>IZ Sw%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>IZ Con%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Whiff%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>2K App</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const gd = DECISION_GRADE_DISPLAY[p.overallGrade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team} · {p.position}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 700 }}>{p.decisionScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontSize: 10, fontWeight: 700 }}>{gd.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.chaseRate <= 18 ? '#22c55e' : p.chaseRate >= 28 ? '#ef4444' : '#ccc', fontWeight: 700 }}>{p.chaseRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.inZoneSwingRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.inZoneContactRate >= 88 ? '#22c55e' : '#ccc' }}>{p.inZoneContactRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.whiffRate >= 25 ? '#ef4444' : '#ccc' }}>{p.whiffRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.twoStrikeApproach >= 70 ? '#22c55e' : p.twoStrikeApproach <= 40 ? '#ef4444' : '#888' }}>{p.twoStrikeApproach}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.position}</span>
              </div>
              <div style={{ color: DECISION_GRADE_DISPLAY[selected.overallGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {DECISION_GRADE_DISPLAY[selected.overallGrade].label} · Score {selected.decisionScore}
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Chase%', value: `${selected.chaseRate}%`, color: selected.chaseRate <= 18 ? '#22c55e' : '#ef4444' },
                  { label: 'IZ Contact', value: `${selected.inZoneContactRate}%`, color: '#22c55e' },
                  { label: 'Whiff%', value: `${selected.whiffRate}%`, color: selected.whiffRate <= 18 ? '#22c55e' : '#ef4444' },
                  { label: '1st Pitch Sw', value: `${selected.firstPitchSwingPct}%` },
                  { label: '2K Approach', value: selected.twoStrikeApproach.toString(), color: selected.twoStrikeApproach >= 70 ? '#22c55e' : '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#ccc', fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ZONE DECISION BREAKDOWN</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Zone</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Seen</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Sw%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Con%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Value%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.zoneDecisions.map(z => (
                    <tr key={z.zone} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 700, color: z.zone === 'heart' ? '#22c55e' : z.zone === 'chase' ? '#ef4444' : '#f59e0b', textTransform: 'uppercase', fontSize: 10 }}>{z.zone}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{z.pitchesSeen}</td>
                      <td style={{ padding: 4, textAlign: 'center', fontWeight: 700 }}>{z.swingPct.toFixed(1)}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.contactPct >= 85 ? '#22c55e' : '#ccc' }}>{z.contactPct.toFixed(1)}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.whiffPct >= 30 ? '#ef4444' : '#ccc' }}>{z.whiffPct.toFixed(1)}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: z.valuePct >= 50 ? '#22c55e' : '#888' }}>{z.valuePct.toFixed(1)}%</td>
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
              Select a player to view swing decision analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
