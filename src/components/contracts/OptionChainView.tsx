/**
 * OptionChainView – Contract option chain dashboard
 *
 * Bloomberg-terminal style option analysis with exercise/decline
 * recommendations, vesting tracking, and financial impact analysis.
 */
import { useState, useMemo } from 'react';
import {
  ContractOption,
  OPTION_TYPE_DISPLAY,
  ACTION_DISPLAY,
  getOptionChainSummary,
  generateDemoOptionChain,
} from '../../engine/contracts/optionChain';

export default function OptionChainView() {
  const options = useMemo(() => generateDemoOptionChain(), []);
  const summary = useMemo(() => getOptionChainSummary(options), [options]);
  const [selected, setSelected] = useState<ContractOption | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        OPTION CHAIN — CONTRACT DECISIONS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Options', value: summary.totalOptions },
          { label: 'Exercise Value', value: `+$${summary.exerciseSavings}M`, color: '#22c55e' },
          { label: 'Buyout Cost', value: `$${summary.declineCost}M`, color: '#ef4444' },
          { label: 'Pending', value: summary.pendingCount, color: '#eab308' },
          { label: 'Total Commitment', value: `$${summary.commitmentIfExercised}M` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Option List ── */}
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Type</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Salary</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Buyout</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Proj WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Surplus</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {options.map(o => {
                const td = OPTION_TYPE_DISPLAY[o.optionType];
                const ad = ACTION_DISPLAY[o.recommendation];
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === o.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{o.playerName}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: td.color, fontWeight: 600 }}>{td.abbr}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>${o.optionSalary}M</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>${o.buyout}M</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{o.projectedWAR}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: o.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {o.surplusValue > 0 ? '+' : ''}{o.surplusValue}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: ad.color, fontWeight: 600 }}>{ad.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.playerName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · Age {selected.age}</span>
              </div>
              <div style={{ color: OPTION_TYPE_DISPLAY[selected.optionType].color, fontWeight: 700, marginBottom: 12 }}>
                {OPTION_TYPE_DISPLAY[selected.optionType].label} — {selected.optionYear}
              </div>

              {/* Financial Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>FINANCIAL ANALYSIS</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Option $', value: `$${selected.optionSalary}M` },
                  { label: 'Buyout', value: `$${selected.buyout}M` },
                  { label: 'Curr WAR', value: selected.currentWAR },
                  { label: 'Proj WAR', value: selected.projectedWAR },
                  { label: 'Surplus', value: `${selected.surplusValue > 0 ? '+' : ''}${selected.surplusValue}`, color: selected.surplusValue >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Overall', value: selected.overall },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Vesting Progress */}
              {selected.vestingThreshold && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>VESTING PROGRESS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 10, background: '#111', borderRadius: 5 }}>
                      <div style={{
                        width: `${selected.vestingProgress ?? 0}%`,
                        height: '100%',
                        background: (selected.vestingProgress ?? 0) >= 90 ? '#22c55e' : '#f59e0b',
                        borderRadius: 5,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#ccc' }}>{selected.vestingProgress}%</span>
                  </div>
                  <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>Threshold: {selected.vestingThreshold}</div>
                </div>
              )}

              {/* Recommendation */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>RECOMMENDATION</div>
              <div style={{
                padding: 10, background: '#111', border: `1px solid ${ACTION_DISPLAY[selected.recommendation].color}`,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: ACTION_DISPLAY[selected.recommendation].color, fontWeight: 700, fontSize: 14 }}>
                    {ACTION_DISPLAY[selected.recommendation].label.toUpperCase()}
                  </span>
                  <span style={{ color: '#888', fontSize: 11 }}>Confidence: {selected.confidence}%</span>
                </div>
                <div style={{ color: '#ccc', fontSize: 12 }}>{selected.notes}</div>
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select an option to view analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
