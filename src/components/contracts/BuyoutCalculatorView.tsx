/**
 * BuyoutCalculatorView – Contract buyout decision dashboard
 *
 * Bloomberg-terminal style buyout analyzer with NPV comparisons,
 * option type breakdowns, vesting progress, and recommendations.
 */
import { useState, useMemo } from 'react';
import {
  BuyoutScenario,
  REC_DISPLAY,
  OPTION_DISPLAY,
  getBuyoutSummary,
  generateDemoBuyouts,
} from '../../engine/contracts/buyoutCalculator';

export default function BuyoutCalculatorView() {
  const scenarios = useMemo(() => generateDemoBuyouts(), []);
  const summary = useMemo(() => getBuyoutSummary(scenarios), [scenarios]);
  const [selected, setSelected] = useState<BuyoutScenario | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CONTRACT BUYOUT CALCULATOR — OPTION DECISIONS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Options', value: summary.totalOptions },
          { label: 'Exercise', value: summary.exerciseCount, color: '#22c55e' },
          { label: 'Decline', value: summary.declineCount, color: '#ef4444' },
          { label: 'Buyout Cost', value: `$${summary.totalBuyoutCost}M` },
          { label: 'Biggest Decision', value: summary.biggestDecision },
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
                <th style={{ textAlign: 'center', padding: 6 }}>Type</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Option</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Buyout</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rec</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === s.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{s.name} <span style={{ color: '#666', fontSize: 10 }}>{s.pos}</span></td>
                  <td style={{ padding: 6, textAlign: 'center', color: OPTION_DISPLAY[s.optionType].color, fontSize: 10, fontWeight: 600 }}>
                    {OPTION_DISPLAY[s.optionType].label}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${s.optionYear}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>${s.buyout}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: REC_DISPLAY[s.recommendation].color, fontWeight: 700, fontSize: 10 }}>
                    {REC_DISPLAY[s.recommendation].label}
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
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · Age {selected.age}</span>
              </div>
              <div style={{ color: REC_DISPLAY[selected.recommendation].color, fontWeight: 700, marginBottom: 12 }}>
                {REC_DISPLAY[selected.recommendation].label} — {OPTION_DISPLAY[selected.optionType].label} OPTION
              </div>

              {/* Financial Comparison */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>FINANCIAL COMPARISON</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center', padding: 8, border: '1px solid #333', flex: 1 }}>
                  <div style={{ color: '#888', fontSize: 9 }}>EXERCISE</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>${selected.optionYear}M</div>
                  <div style={{ color: selected.npvExercise >= 0 ? '#22c55e' : '#ef4444', fontSize: 11 }}>NPV: ${selected.npvExercise}M</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, border: '1px solid #333', flex: 1 }}>
                  <div style={{ color: '#888', fontSize: 9 }}>DECLINE</div>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>${selected.buyout}M</div>
                  <div style={{ color: selected.npvDecline >= 0 ? '#22c55e' : '#ef4444', fontSize: 11 }}>NPV: ${selected.npvDecline}M</div>
                </div>
              </div>

              {/* Performance */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PERFORMANCE & VALUE</div>
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
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>${selected.marketValue}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Market AAV</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.costSavings > 0 ? '#22c55e' : '#888', fontWeight: 700 }}>${selected.costSavings}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Savings</div>
                </div>
              </div>

              {/* Vesting Progress */}
              {selected.vestingCondition && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>VESTING PROGRESS</div>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>
                    Condition: <span style={{ color: '#f59e0b' }}>{selected.vestingCondition}</span>
                  </div>
                  <div style={{ background: '#222', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ background: selected.vestingProgress! >= 75 ? '#22c55e' : '#f59e0b', height: '100%', width: `${selected.vestingProgress}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{selected.vestingProgress}% complete</div>
                </div>
              )}

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select an option to view buyout analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
