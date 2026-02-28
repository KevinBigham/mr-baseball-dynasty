import { useState } from 'react';
import { generateDemoSalaryCapSim2, getCapColor } from '../../engine/finance/salaryCapSim2';

const data = generateDemoSalaryCapSim2();

export default function SalaryCapSim2View() {
  const [selScenario, setSelScenario] = useState(0);
  const sc = data.scenarios[selScenario];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SALARY CAP SIMULATOR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Model future payroll scenarios with prospect promotions and FA signings</p>
      </div>

      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {data.scenarios.map((s, i) => (
          <button key={s.name} onClick={() => setSelScenario(i)} style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: i === selScenario ? '#f59e0b22' : '#111827', border: `1px solid ${i === selScenario ? '#f59e0b' : '#374151'}`, color: i === selScenario ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {s.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Scenario summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL PAYROLL', value: `$${sc.totalPayroll}M`, color: getCapColor(sc.luxuryTaxPayroll, data.threshold) },
          { label: 'CBT PAYROLL', value: `$${sc.luxuryTaxPayroll}M`, color: sc.overThreshold ? '#ef4444' : '#22c55e' },
          { label: 'THRESHOLD', value: `$${data.threshold}M`, color: '#6b7280' },
          { label: 'TAX PENALTY', value: sc.taxPenalty > 0 ? `$${sc.taxPenalty}M` : 'None', color: sc.taxPenalty > 0 ? '#ef4444' : '#22c55e' },
          { label: 'PROJ WINS', value: sc.projectedWins, color: sc.projectedWins >= 90 ? '#22c55e' : '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12, padding: 10, background: '#111827', border: '1px solid #374151' }}>
        <div style={{ fontSize: 11, color: '#e5e7eb' }}>{sc.description}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Roster */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>ROSTER COMPOSITION</div>
          {sc.players.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', marginBottom: 3, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ flex: 1, fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{p.name}</div>
              <span style={{ fontSize: 9, color: '#6b7280' }}>{p.position}</span>
              <span style={{ padding: '1px 4px', fontSize: 8, fontWeight: 700, background: p.type === 'pre-arb' ? '#22c55e22' : p.type === 'fa-target' ? '#ef444422' : '#1f2937', color: p.type === 'pre-arb' ? '#22c55e' : p.type === 'fa-target' ? '#ef4444' : '#6b7280' }}>
                {p.type.toUpperCase()}
              </span>
              <div style={{ width: 50, fontSize: 10, color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}>${p.salary}M</div>
              <div style={{ width: 30, fontSize: 9, color: '#6b7280', textAlign: 'right' }}>{p.yearsRemaining}yr</div>
            </div>
          ))}
        </div>

        {/* Multi-year projection */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>MULTI-YEAR PROJECTION</div>
          {data.yearProjections.map(y => (
            <div key={y.year} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{y.year}</span>
                <span style={{ fontSize: 10, color: getCapColor(y.payroll, y.threshold) }}>${y.payroll}M / ${y.threshold}M</span>
              </div>
              <div style={{ height: 12, background: '#1f2937', borderRadius: 4, position: 'relative' as const }}>
                <div style={{ width: `${Math.min(100, (y.payroll / y.threshold) * 100)}%`, height: '100%', borderRadius: 4, background: getCapColor(y.payroll, y.threshold) }} />
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2, textAlign: 'right' }}>Buffer: ${y.buffer.toFixed(1)}M</div>
            </div>
          ))}

          {/* Scenario comparison */}
          <div style={{ marginTop: 16, padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>SCENARIO COMPARISON</div>
            {data.scenarios.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1f2937' }}>
                <span style={{ fontSize: 10, color: i === selScenario ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>${s.totalPayroll}M | {s.projectedWins}W</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
