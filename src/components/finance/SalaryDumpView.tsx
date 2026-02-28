/**
 * SalaryDumpView – Salary dump trade analyzer dashboard
 *
 * Bloomberg-terminal style salary dump evaluator with difficulty ratings,
 * prospect cost, surplus value analysis, and potential trade partners.
 */
import { useState, useMemo } from 'react';
import {
  SalaryDumpCandidate,
  DIFFICULTY_DISPLAY,
  getSalaryDumpSummary,
  generateDemoSalaryDumps,
} from '../../engine/finance/salaryDumpAnalyzer';

export default function SalaryDumpView() {
  const candidates = useMemo(() => generateDemoSalaryDumps(), []);
  const summary = useMemo(() => getSalaryDumpSummary(candidates), [candidates]);
  const [selected, setSelected] = useState<SalaryDumpCandidate | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SALARY DUMP ANALYZER — CONTRACT EVALUATOR
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Candidates', value: summary.totalCandidates },
          { label: 'Dead Money', value: `$${summary.totalDeadMoney}M`, color: '#ef4444' },
          { label: 'Easiest Dump', value: summary.easiestDump, color: '#22c55e' },
          { label: 'Biggest Albatross', value: summary.biggestAlbatross, color: '#ef4444' },
          { label: 'Avg Surplus', value: `$${summary.avgSurplusDeficit}M` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>AAV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Yrs</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Surplus</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === c.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name} <span style={{ color: '#666', fontSize: 10 }}>{c.team}</span></td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{c.pos}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${c.aav}M</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{c.yearsRemaining}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: c.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {c.surplusValue > 0 ? '+' : ''}{c.surplusValue}M
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: DIFFICULTY_DISPLAY[c.dumpDifficulty].color, fontWeight: 600, fontSize: 10 }}>
                    {DIFFICULTY_DISPLAY[c.dumpDifficulty].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · Age {selected.age}</span>
              </div>
              <div style={{ color: DIFFICULTY_DISPLAY[selected.dumpDifficulty].color, fontWeight: 700, marginBottom: 12 }}>
                Dump Difficulty: {DIFFICULTY_DISPLAY[selected.dumpDifficulty].label}
              </div>

              {/* Contract */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CONTRACT DETAILS</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'AAV', value: `$${selected.aav}M` },
                  { label: 'Years Left', value: selected.yearsRemaining },
                  { label: 'Total Left', value: `$${selected.totalRemaining}M`, color: '#ef4444' },
                  { label: 'NTC', value: selected.ntcStatus.toUpperCase(), color: selected.ntcStatus === 'full' ? '#ef4444' : selected.ntcStatus === 'partial' ? '#f59e0b' : '#22c55e' },
                ].map(v => (
                  <div key={v.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: v.color ?? '#f59e0b', fontWeight: 700, fontSize: 14 }}>{v.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{v.label}</div>
                  </div>
                ))}
              </div>

              {/* Performance */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PERFORMANCE</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.currentWAR}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Current WAR</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.projectedWAR}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Proj WAR</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 16 }}>
                    {selected.surplusValue > 0 ? '+' : ''}${selected.surplusValue}M
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>Surplus Value</div>
                </div>
              </div>

              {/* Prospect Cost */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>PROSPECT COST TO MOVE</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#f59e0b', fontSize: 12, marginBottom: 12 }}>
                {selected.prospectCost}
              </div>

              {/* Trade Partners */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>POTENTIAL PARTNERS</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {selected.potentialPartners.length > 0 ? selected.potentialPartners.map(t => (
                  <span key={t} style={{ padding: '2px 8px', border: '1px solid #333', fontSize: 11, color: '#ccc' }}>{t}</span>
                )) : (
                  <span style={{ color: '#ef4444', fontSize: 11 }}>No willing partners</span>
                )}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view salary dump analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
