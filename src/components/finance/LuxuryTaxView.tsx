/**
 * LuxuryTaxView – Competitive balance tax dashboard
 *
 * Bloomberg-terminal style luxury tax tracker with tier visualization,
 * payroll bar charts, biggest contracts, and penalty tracking.
 */
import { useState, useMemo } from 'react';
import {
  LuxuryTaxDashboard,
  TAX_TIER_DISPLAY,
  generateDemoLuxuryTax,
} from '../../engine/finance/luxuryTax';

export default function LuxuryTaxView() {
  const teams = useMemo(() => generateDemoLuxuryTax(), []);
  const [selected, setSelected] = useState<LuxuryTaxDashboard>(teams[0]);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        LUXURY TAX (CBT) — COMPETITIVE BALANCE
      </div>

      {/* ── Team Selector ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {teams.map(t => (
          <button
            key={t.teamName}
            onClick={() => setSelected(t)}
            style={{
              background: selected.teamName === t.teamName ? '#f59e0b' : '#1a1a2e',
              color: selected.teamName === t.teamName ? '#000' : '#ccc',
              border: '1px solid #333',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
            }}
          >
            {t.teamName.split(' ').pop()}
          </button>
        ))}
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'CBT Payroll', value: `$${selected.currentPayroll}M` },
          { label: 'Tax Tier', value: TAX_TIER_DISPLAY[selected.currentTier].label, color: TAX_TIER_DISPLAY[selected.currentTier].color },
          { label: 'Projected Tax', value: `$${selected.projectedTax}M`, color: selected.projectedTax > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Space Under', value: `$${selected.spaceUnderBase}M`, color: selected.spaceUnderBase >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Consec. Years', value: selected.consecutiveYearsOver },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Threshold Visualization ── */}
        <div style={{ flex: '1 1 420px' }}>
          <div className="bloomberg-border" style={{ padding: 14 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 10 }}>PAYROLL VS THRESHOLDS</div>
            {/* Threshold bars */}
            {selected.thresholds.map((th, i) => {
              const maxVal = selected.cohenThreshold + 40;
              const pctPayroll = (selected.currentPayroll / maxVal) * 100;
              const pctThreshold = (th.amount / maxVal) * 100;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 2 }}>
                    <span>{th.label} · ${th.amount}M</span>
                    <span style={{ color: th.exceeded ? '#ef4444' : '#22c55e' }}>{th.exceeded ? 'EXCEEDED' : 'CLEAR'} · {th.rate}%</span>
                  </div>
                  <div style={{ position: 'relative', height: 12, background: '#111', borderRadius: 3 }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${Math.min(pctPayroll, 100)}%`,
                      background: th.exceeded ? TAX_TIER_DISPLAY[th.tier].color : '#22c55e',
                      borderRadius: 3, opacity: 0.6,
                    }} />
                    <div style={{
                      position: 'absolute', left: `${pctThreshold}%`, top: -2, bottom: -2,
                      width: 2, background: '#fff', opacity: 0.5,
                    }} />
                  </div>
                </div>
              );
            })}

            {/* Penalties */}
            <div style={{ color: '#888', fontSize: 10, marginTop: 14, marginBottom: 6 }}>PENALTIES</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: selected.draftPickPenalty ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{selected.draftPickPenalty ? 'YES' : 'NO'}</div>
                <div style={{ color: '#666', fontSize: 9 }}>Draft Pick Loss</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: selected.intlPoolReduction ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{selected.intlPoolReduction ? 'YES' : 'NO'}</div>
                <div style={{ color: '#666', fontSize: 9 }}>IFA Reduction</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: selected.surchargeRate > 0 ? '#f97316' : '#22c55e', fontWeight: 700 }}>{selected.surchargeRate}%</div>
                <div style={{ color: '#666', fontSize: 9 }}>Surcharge</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Details ── */}
        <div style={{ flex: '1 1 360px' }}>
          {/* Year-by-Year */}
          <div className="bloomberg-border" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>YEAR-BY-YEAR</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                  <th style={{ textAlign: 'center', padding: 4 }}>Year</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Payroll</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Threshold</th>
                  <th style={{ textAlign: 'center', padding: 4 }}>Tax Paid</th>
                </tr>
              </thead>
              <tbody>
                {selected.yearByYear.map((y, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                    <td style={{ padding: 4, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>{y.season}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>${y.payroll}M</td>
                    <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>${y.threshold}M</td>
                    <td style={{ padding: 4, textAlign: 'center', color: y.taxPaid > 0 ? '#ef4444' : '#22c55e' }}>${y.taxPaid}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Biggest Contracts */}
          <div className="bloomberg-border" style={{ padding: 14 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BIGGEST CONTRACTS</div>
            {selected.biggestContracts.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span><span style={{ color: '#f59e0b' }}>${c.aav}M</span> <span style={{ color: '#666' }}>· {c.yearsLeft}yr</span></span>
              </div>
            ))}
            <div style={{ color: '#888', fontSize: 10, marginTop: 10, marginBottom: 4 }}>NOTES</div>
            <div style={{ padding: 4, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 11 }}>
              {selected.notes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
