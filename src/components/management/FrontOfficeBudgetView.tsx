/**
 * FrontOfficeBudgetView – Front Office Budget dashboard
 *
 * Bloomberg-terminal style departmental budget tracking with
 * efficiency grades, spending progress, and department comparisons.
 */
import { useState, useMemo } from 'react';
import {
  BudgetDepartment,
  EFFICIENCY_DISPLAY,
  getFrontOfficeBudgetSummary,
  generateDemoFrontOfficeBudget,
} from '../../engine/management/frontOfficeBudget';

export default function FrontOfficeBudgetView() {
  const data = useMemo(() => generateDemoFrontOfficeBudget(), []);
  const summary = useMemo(() => getFrontOfficeBudgetSummary(data), [data]);
  const [selected, setSelected] = useState<BudgetDepartment | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        FRONT OFFICE BUDGET — {data.teamName.toUpperCase()} FY{data.fiscalYear}
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Budget', value: summary.totalBudget },
          { label: 'Total Spent', value: summary.totalSpent },
          { label: 'Burn Rate', value: summary.burnRate, color: parseFloat(summary.burnRate) >= 90 ? '#ef4444' : '#f59e0b' },
          { label: 'Overall', value: summary.overallGrade, color: EFFICIENCY_DISPLAY[data.overallEfficiency].color },
          { label: 'Top Dept', value: summary.topDept, color: '#22c55e' },
          { label: 'Needs Work', value: summary.worstDept, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Department</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Budget</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Spent</th>
                <th style={{ textAlign: 'center', padding: 6 }}>%Used</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Staff</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Eff</th>
                <th style={{ textAlign: 'center', padding: 6 }}>YoY</th>
              </tr>
            </thead>
            <tbody>
              {data.departments.map(d => {
                const ed = EFFICIENCY_DISPLAY[d.efficiency];
                const pctUsed = ((d.spent / d.budget) * 100).toFixed(0);
                return (
                  <tr
                    key={d.name}
                    onClick={() => setSelected(d)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.name === d.name ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>${d.budget.toFixed(1)}M</td>
                    <td style={{ padding: 6, textAlign: 'center', color: d.spent >= d.budget * 0.9 ? '#ef4444' : '#ccc' }}>${d.spent.toFixed(1)}M</td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{pctUsed}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{d.headcount}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: ed.color, fontWeight: 700, fontSize: 10 }}>{ed.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: d.yoyChange >= 0 ? '#22c55e' : '#ef4444', fontSize: 10 }}>
                      {d.yoyChange >= 0 ? '+' : ''}{d.yoyChange}%
                    </td>
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
              </div>
              <div style={{ color: EFFICIENCY_DISPLAY[selected.efficiency].color, fontWeight: 700, marginBottom: 12 }}>
                {EFFICIENCY_DISPLAY[selected.efficiency].label} · Score {selected.efficiencyScore}
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Budget', value: `$${selected.budget.toFixed(1)}M` },
                  { label: 'Spent', value: `$${selected.spent.toFixed(1)}M`, color: selected.spent >= selected.budget * 0.9 ? '#ef4444' : '#ccc' },
                  { label: 'Left', value: `$${selected.remaining.toFixed(1)}M`, color: selected.remaining <= 0.5 ? '#ef4444' : '#22c55e' },
                  { label: 'Staff', value: selected.headcount.toString() },
                  { label: 'Avg Salary', value: `$${selected.avgSalary}K` },
                  { label: 'YoY', value: `${selected.yoyChange >= 0 ? '+' : ''}${selected.yoyChange}%`, color: selected.yoyChange >= 0 ? '#22c55e' : '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#ccc', fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Budget Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>BUDGET UTILIZATION</div>
                <div style={{ background: '#111', height: 14, borderRadius: 2, position: 'relative' }}>
                  <div style={{
                    background: selected.spent / selected.budget >= 0.9 ? '#ef4444' : selected.spent / selected.budget >= 0.7 ? '#f59e0b' : '#22c55e',
                    height: '100%',
                    width: `${Math.min(100, (selected.spent / selected.budget) * 100)}%`,
                    borderRadius: 2,
                  }} />
                  <div style={{ position: 'absolute', top: 0, left: '50%', fontSize: 9, color: '#fff', fontWeight: 700, lineHeight: '14px' }}>
                    {((selected.spent / selected.budget) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>KEY METRIC</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#f59e0b', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {selected.keyMetric}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a department to view budget details
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, padding: 8, background: '#111', border: '1px solid #333', color: '#aaa', fontSize: 11 }}>
        {data.notes}
      </div>
    </div>
  );
}
