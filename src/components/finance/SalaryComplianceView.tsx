import { useState } from 'react';
import { generateDemoSalaryCompliance, type ComplianceStatus } from '../../engine/finance/salaryCapCompliance';

const data = generateDemoSalaryCompliance();

const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

const statusBadge: Record<ComplianceStatus, { label: string; color: string }> = {
  under: { label: 'UNDER', color: '#22c55e' },
  first_time: { label: '1ST TIME', color: '#f59e0b' },
  repeat: { label: 'REPEAT', color: '#ef4444' },
  severe: { label: 'SEVERE', color: '#dc2626' },
};

export default function SalaryComplianceView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const team = data[selectedIdx];
  const sb = statusBadge[team.status];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SALARY CAP COMPLIANCE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>CBT status, tax brackets, and payroll compliance monitoring</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((t, i) => (
          <button key={t.teamId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'PAYROLL', value: fmt(team.totalPayroll), color: '#e5e7eb' },
          { label: 'CBT THRESHOLD', value: fmt(team.cbtThreshold), color: '#9ca3af' },
          { label: 'STATUS', value: sb.label, color: sb.color },
          { label: 'TAX OWED', value: team.totalTaxOwed > 0 ? fmt(team.totalTaxOwed) : '$0', color: team.totalTaxOwed > 0 ? '#ef4444' : '#22c55e' },
          { label: 'DEAD MONEY', value: fmt(team.deadMoney), color: team.deadMoney > 5_000_000 ? '#ef4444' : '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tax brackets */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TAX BRACKETS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['THRESHOLD', 'RATE', 'STATUS', 'OVERAGE', 'TAX'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.brackets.map((b, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{fmt(b.threshold)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{(b.rate * 100).toFixed(0)}%</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: b.exceeded ? '#ef4444' : '#22c55e' }}>{b.exceeded ? 'OVER' : 'CLEAR'}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{b.overage > 0 ? fmt(b.overage) : '—'}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: b.taxOwed > 0 ? '#ef4444' : '#9ca3af', fontWeight: 700 }}>{b.taxOwed > 0 ? fmt(b.taxOwed) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#6b7280' }}>Years Over CBT: <span style={{ color: team.yearsOverCBT > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{team.yearsOverCBT}</span></span>
            <span style={{ color: '#6b7280' }}>Next Year Proj: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(team.projectedNextYear)}</span></span>
          </div>
        </div>

        {/* Top contracts */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TOP CONTRACTS</div>
          {team.topContracts.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{c.position}</div>
              </div>
              <div style={{ width: 80, textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.isTopEarner ? '#f59e0b' : '#e5e7eb' }}>{fmt(c.aav)}</div>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{c.pctOfPayroll}%</div>
              </div>
              <div style={{ width: 60, marginLeft: 8 }}>
                <div style={{ height: 6, background: '#1f2937' }}>
                  <div style={{ width: `${c.pctOfPayroll}%`, height: '100%', background: c.pctOfPayroll > 15 ? '#ef4444' : '#f59e0b' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
