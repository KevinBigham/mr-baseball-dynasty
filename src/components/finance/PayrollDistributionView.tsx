import { useState } from 'react';
import { generateDemoPayrollDistribution, getTierColor } from '../../engine/finance/payrollDistribution';

const data = generateDemoPayrollDistribution();

export default function PayrollDistributionView() {
  const [selectedGroup, setSelectedGroup] = useState(0);
  const group = data.positionGroups[selectedGroup];
  const taxBuffer = data.threshold - data.luxuryTaxPayroll;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PAYROLL DISTRIBUTION</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Payroll breakdown by position group, performance tier, and cost efficiency</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL PAYROLL', value: `$${data.totalPayroll}M`, color: '#e5e7eb' },
          { label: 'CBT PAYROLL', value: `$${data.luxuryTaxPayroll}M`, color: '#f59e0b' },
          { label: 'TAX BUFFER', value: `$${taxBuffer.toFixed(1)}M`, color: taxBuffer > 30 ? '#22c55e' : taxBuffer > 10 ? '#f59e0b' : '#ef4444' },
          { label: 'LEAGUE RANK', value: `#${data.leagueRank}`, color: '#3b82f6' },
          { label: 'LEAGUE AVG', value: `$${data.leagueAvgPayroll}M`, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Position group bars */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>BY POSITION GROUP</div>
        {data.positionGroups.map((g, i) => (
          <div key={g.group} onClick={() => setSelectedGroup(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', padding: '4px 8px', background: i === selectedGroup ? '#1f2937' : 'transparent', border: `1px solid ${i === selectedGroup ? '#f59e0b44' : 'transparent'}` }}>
            <div style={{ width: 110, fontSize: 10, color: i === selectedGroup ? '#f59e0b' : '#e5e7eb', fontWeight: 700 }}>{g.group}</div>
            <div style={{ flex: 1, height: 14, background: '#1f2937', borderRadius: 2 }}>
              <div style={{ width: `${g.pctOfPayroll}%`, height: '100%', borderRadius: 2, background: i === selectedGroup ? '#f59e0b' : '#3b82f6', opacity: 0.7 }} />
            </div>
            <div style={{ width: 50, fontSize: 10, fontWeight: 700, color: '#e5e7eb', textAlign: 'right' }}>${g.totalSalary}M</div>
            <div style={{ width: 36, fontSize: 10, color: '#6b7280', textAlign: 'right' }}>{g.pctOfPayroll.toFixed(0)}%</div>
            <div style={{ width: 36, fontSize: 10, color: g.costPerWAR <= 4 ? '#22c55e' : g.costPerWAR <= 6 ? '#f59e0b' : '#ef4444', textAlign: 'right' }}>
              ${g.costPerWAR.toFixed(1)}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4, fontSize: 9, color: '#6b7280' }}>
          <span>TOTAL</span><span>%</span><span>$/WAR</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Group detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>{group.group.toUpperCase()} DETAIL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'TOTAL', value: `$${group.totalSalary}M`, color: '#e5e7eb' },
              { label: 'WAR', value: group.warProduced.toFixed(1), color: '#22c55e' },
              { label: '$/WAR', value: `$${group.costPerWAR.toFixed(1)}M`, color: group.costPerWAR <= 4 ? '#22c55e' : '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {group.players.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 4, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>{p.name}</div>
              </div>
              <span style={{ padding: '1px 4px', fontSize: 8, fontWeight: 700, background: getTierColor(p.tier) + '22', color: getTierColor(p.tier) }}>
                {p.tier.toUpperCase()}
              </span>
              <div style={{ width: 50, fontSize: 10, color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}>${p.salary}M</div>
              <div style={{ width: 36, fontSize: 10, color: p.war >= 3 ? '#22c55e' : p.war >= 1 ? '#f59e0b' : '#ef4444', textAlign: 'right' }}>{p.war.toFixed(1)}W</div>
            </div>
          ))}
        </div>

        {/* Tier breakdown */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>PERFORMANCE TIER ALLOCATION</div>
          {data.tierBreakdown.map(t => (
            <div key={t.tier} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700 }}>{t.tier}</span>
                <span style={{ fontSize: 10, color: '#f59e0b' }}>${t.totalSalary}M ({t.pctOfPayroll.toFixed(0)}%)</span>
              </div>
              <div style={{ height: 10, background: '#1f2937', borderRadius: 2, marginBottom: 4 }}>
                <div style={{ width: `${t.pctOfPayroll}%`, height: '100%', borderRadius: 2, background: t.tier === 'Dead Money' ? '#ef4444' : t.tier === 'Ace/Star' ? '#f59e0b' : t.tier === 'Core' ? '#22c55e' : t.tier === 'Role' ? '#3b82f6' : '#6b7280' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#6b7280' }}>
                <span>{t.playerCount} players</span>
                <span>{t.warProduced.toFixed(1)} WAR</span>
                <span>{t.warProduced > 0 ? `$${(t.totalSalary / t.warProduced).toFixed(1)}M/WAR` : 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* CBT gauge */}
          <div style={{ marginTop: 16, padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>CBT THRESHOLD</div>
            <div style={{ height: 12, background: '#1f2937', borderRadius: 4, position: 'relative' as const }}>
              <div style={{ width: `${(data.luxuryTaxPayroll / data.threshold) * 100}%`, height: '100%', borderRadius: 4, background: taxBuffer > 30 ? '#22c55e' : taxBuffer > 10 ? '#f59e0b' : '#ef4444' }} />
              <div style={{ position: 'absolute' as const, right: 0, top: -2, width: 2, height: 16, background: '#ef4444' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9 }}>
              <span style={{ color: '#6b7280' }}>$0</span>
              <span style={{ color: taxBuffer > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>Buffer: ${taxBuffer.toFixed(1)}M</span>
              <span style={{ color: '#ef4444' }}>${data.threshold}M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
