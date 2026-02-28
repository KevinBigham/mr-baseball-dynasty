/**
 * PayrollFlexibilityView – Payroll flexibility and cap space dashboard
 *
 * Bloomberg-terminal style financial analysis with luxury tax tracking,
 * year-by-year projections, and contract assessments.
 */
import { useMemo } from 'react';
import {
  FLEX_DISPLAY,
  generateDemoPayrollFlex,
} from '../../engine/finance/payrollFlexibility';

export default function PayrollFlexibilityView() {
  const data = useMemo(() => generateDemoPayrollFlex(), []);
  const fg = FLEX_DISPLAY[data.currentFlexGrade];

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PAYROLL FLEXIBILITY — FINANCIAL OUTLOOK
      </div>

      {/* ── Top Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Current Payroll', value: `$${data.currentPayroll}M` },
          { label: 'Luxury Tax Line', value: `$${data.luxuryTaxThreshold}M` },
          { label: 'Room Under Tax', value: `$${data.currentRoom}M`, color: data.currentRoom > 0 ? '#22c55e' : '#ef4444' },
          { label: 'Flexibility', value: `${fg.emoji} ${fg.label}`, color: fg.color },
          { label: 'Dead Money', value: `$${data.deadMoney}M`, color: '#ef4444' },
          { label: 'Pre-Arb Players', value: data.preArbPlayers, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Year Projections ── */}
      <div className="bloomberg-border" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>YEAR-BY-YEAR PAYROLL PROJECTION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ textAlign: 'center', padding: 6 }}>Year</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Committed</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Options</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Arb Est.</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Projected</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Tax Line</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Room</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {data.yearProjections.map(yr => {
              const yf = FLEX_DISPLAY[yr.flexGrade];
              return (
                <tr key={yr.year} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{yr.year}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>${yr.committed}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>${yr.options}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>${yr.arbitration}M</td>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 600 }}>${yr.projected}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#666' }}>${yr.luxuryTaxLine}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: yr.room > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    ${yr.room}M
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: yf.color }}>{yf.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Visual bar chart */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
          {data.yearProjections.map(yr => {
            const pct = (yr.projected / yr.luxuryTaxLine) * 100;
            return (
              <div key={yr.year} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ position: 'relative', height: 50 }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: '15%', right: '15%',
                    height: `${Math.min(pct, 100)}%`,
                    background: pct > 100 ? '#ef4444' : pct > 85 ? '#f97316' : '#3b82f6',
                    borderRadius: 2,
                  }} />
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    borderBottom: '1px dashed #555', height: 0,
                  }} />
                </div>
                <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{yr.year}</div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'right', fontSize: 9, color: '#555', marginTop: 2 }}>
          — dashed line = luxury tax threshold
        </div>
      </div>

      {/* ── Biggest Contracts ── */}
      <div className="bloomberg-border" style={{ padding: 12 }}>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>LARGEST CONTRACTS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
              <th style={{ textAlign: 'center', padding: 6 }}>AAV</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Yrs Left</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Movable</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Trade Value</th>
            </tr>
          </thead>
          <tbody>
            {data.biggestContracts.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{c.pos}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>${c.aav}M</td>
                <td style={{ padding: 6, textAlign: 'center' }}>{c.yearsLeft}</td>
                <td style={{ padding: 6, textAlign: 'center', color: c.isMovable ? '#22c55e' : '#ef4444' }}>
                  {c.isMovable ? 'YES' : 'NO'}
                </td>
                <td style={{
                  padding: 6, textAlign: 'center',
                  color: c.tradeValue === 'positive' ? '#22c55e' : c.tradeValue === 'neutral' ? '#eab308' : '#ef4444',
                }}>
                  {c.tradeValue.toUpperCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
