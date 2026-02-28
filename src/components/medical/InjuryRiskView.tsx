/**
 * InjuryRiskView – Injury risk model dashboard
 *
 * Bloomberg-terminal style injury risk assessment with risk tiers,
 * workload tracking, injury history, and recommendations.
 */
import { useState, useMemo } from 'react';
import {
  PlayerInjuryRisk,
  RISK_TIER_DISPLAY,
  getInjuryRiskSummary,
  generateDemoInjuryRisk,
} from '../../engine/medical/injuryRiskModel';

export default function InjuryRiskView() {
  const players = useMemo(() => generateDemoInjuryRisk(), []);
  const summary = useMemo(() => getInjuryRiskSummary(players), [players]);
  const [selected, setSelected] = useState<PlayerInjuryRisk | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        INJURY RISK MODEL — HEALTH INTELLIGENCE
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Players Tracked', value: summary.totalPlayers },
          { label: 'High Risk', value: summary.highRiskCount, color: '#ef4444' },
          { label: 'Elevated', value: summary.elevatedCount, color: '#f97316' },
          { label: 'Avg Risk Score', value: summary.avgRiskScore },
          { label: 'Avg Workload', value: `${summary.avgWorkload}%` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Player List ── */}
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>DL Prob</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Workload</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const rt = RISK_TIER_DISPLAY[p.riskTier];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.age}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: rt.color }}>{rt.emoji} {rt.label}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.riskScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.injuryProbability >= 30 ? '#ef4444' : '#ccc' }}>{p.injuryProbability}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <div style={{ width: 40, height: 6, background: '#222', borderRadius: 3 }}>
                          <div style={{
                            width: `${p.workloadPct}%`, height: 6, borderRadius: 3,
                            background: p.workloadPct >= 90 ? '#ef4444' : p.workloadPct >= 75 ? '#eab308' : '#22c55e',
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#888' }}>{p.workloadPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (() => {
            const rt = RISK_TIER_DISPLAY[selected.riskTier];
            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                  {selected.name}
                  <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · Age {selected.age} · OVR {selected.overall}</span>
                </div>
                <div style={{ color: rt.color, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  {rt.emoji} {rt.label} — {selected.riskScore}/100 Risk · {selected.injuryProbability}% DL Probability
                </div>

                {/* Risk Factors */}
                <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RISK FACTORS</div>
                {selected.riskFactors.map((rf, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600 }}>{rf.factor}</span>
                      <span style={{ color: rf.score >= 70 ? '#ef4444' : rf.score >= 40 ? '#eab308' : '#22c55e' }}>{rf.score}/100</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: '#222', borderRadius: 2, marginBottom: 2 }}>
                      <div style={{
                        width: `${rf.score}%`, height: 4, borderRadius: 2,
                        background: rf.score >= 70 ? '#ef4444' : rf.score >= 40 ? '#eab308' : '#22c55e',
                      }} />
                    </div>
                    <div style={{ color: '#666', fontSize: 10 }}>{rf.description}</div>
                  </div>
                ))}

                {/* Injury History */}
                {selected.injuryHistory.length > 0 && (
                  <>
                    <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 12 }}>INJURY HISTORY</div>
                    {selected.injuryHistory.map((ih, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                        <span style={{ color: '#ccc' }}>{ih.year}: {ih.injury}</span>
                        <span style={{ color: '#ef4444' }}>{ih.daysOut} days</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Recommendation */}
                <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4, marginTop: 12 }}>RECOMMENDATION</div>
                <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5, fontSize: 12 }}>
                  {selected.recommendation}
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view injury risk profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
