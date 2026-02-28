/**
 * IntlScoutingBudgetView – International Scouting Budget Dashboard
 *
 * Bloomberg-terminal style international scouting view with summary cards,
 * regional allocation table, and prospect targets table with scout grades.
 */
import { useState, useMemo } from 'react';
import {
  IntlProspectTarget,
  getIntlBudgetSummary,
  generateDemoIntlBudget,
} from '../../engine/scouting/intlScoutingBudget';

function toolColor(value: number): string {
  if (value >= 65) return '#22c55e';
  if (value >= 55) return '#3b82f6';
  if (value >= 45) return '#f59e0b';
  return '#ef4444';
}

function roiColor(value: number): string {
  if (value >= 130) return '#22c55e';
  if (value >= 100) return '#f59e0b';
  return '#ef4444';
}

export default function IntlScoutingBudgetView() {
  const data = useMemo(() => generateDemoIntlBudget(), []);
  const summary = useMemo(() => getIntlBudgetSummary(data), [data]);
  const [selectedProspect, setSelectedProspect] = useState<IntlProspectTarget | null>(null);

  const poolPct = data.totalPool > 0
    ? Math.round((data.committed / data.totalPool) * 100)
    : 0;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* Header */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        INTERNATIONAL SCOUTING BUDGET
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Pool', value: summary.totalPool },
          { label: 'Committed', value: summary.committed },
          { label: 'Remaining', value: summary.remaining, color: data.remaining < 0.5 ? '#ef4444' : '#22c55e' },
          { label: 'Top Region', value: summary.topRegion },
          { label: 'Top Target', value: summary.topTarget },
          { label: 'Avg Grade', value: summary.avgScoutGrade },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: 'color' in s && s.color ? s.color : '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pool Usage Bar */}
      <div className="bloomberg-border" style={{ padding: '10px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#888', fontSize: 10 }}>POOL USAGE</span>
          <span style={{ color: poolPct >= 90 ? '#ef4444' : '#f59e0b', fontSize: 10, fontWeight: 700 }}>
            {poolPct}% committed
          </span>
        </div>
        <div style={{ height: 10, background: '#1a1a2e', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(poolPct, 100)}%`,
            background: poolPct >= 90 ? '#ef4444' : poolPct >= 70 ? '#f59e0b' : '#22c55e',
            borderRadius: 5,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Regional Allocation Table */}
        <div style={{ flex: '1 1 520px' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>REGIONAL ALLOCATION</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Region</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Budget</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Spent</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Scouts</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Prospects</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Best</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.regions.map(r => (
                <tr key={r.region} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{r.region}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>${r.budget.toFixed(1)}M</td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: r.spent > r.budget ? '#ef4444' : '#22c55e',
                  }}>
                    ${r.spent.toFixed(1)}M
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{r.scouts}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{r.prospectCount}</td>
                  <td style={{ padding: 6, color: r.bestProspect === '\u2014' ? '#555' : '#ccc', fontSize: 11 }}>{r.bestProspect}</td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 600,
                    color: roiColor(r.roi),
                  }}>
                    {r.roi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prospect Targets */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PROSPECT TARGETS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Region</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Bonus</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
                <th style={{ textAlign: 'center', padding: 6 }}>ETA</th>
              </tr>
            </thead>
            <tbody>
              {data.targets.map(t => (
                <tr
                  key={t.name}
                  onClick={() => setSelectedProspect(t)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selectedProspect?.name === t.name ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888', fontSize: 10 }}>{t.region}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{t.age}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 600, fontSize: 10 }}>{t.position}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.signingBonus >= 3.0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    ${t.signingBonus.toFixed(1)}M
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 700,
                    color: t.scoutGrade >= 65 ? '#22c55e' : t.scoutGrade >= 55 ? '#3b82f6' : t.scoutGrade >= 45 ? '#f59e0b' : '#ef4444',
                  }}>
                    {t.scoutGrade}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Prospect Detail Panel */}
        <div style={{ flex: '1 1 340px' }}>
          {selectedProspect ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              {/* Prospect Header */}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selectedProspect.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selectedProspect.position} · {selectedProspect.region}
                </span>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Age', value: selectedProspect.age, color: '#ccc' },
                  { label: 'Bonus', value: `$${selectedProspect.signingBonus.toFixed(1)}M`, color: selectedProspect.signingBonus >= 3.0 ? '#ef4444' : '#22c55e' },
                  { label: 'Grade', value: selectedProspect.scoutGrade, color: selectedProspect.scoutGrade >= 65 ? '#22c55e' : '#f59e0b' },
                  { label: 'ETA', value: selectedProspect.eta, color: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tool Grades */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>TOOL GRADES (20-80 SCALE)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Hit', value: selectedProspect.tools.hit },
                  { label: 'Power', value: selectedProspect.tools.power },
                  { label: 'Speed', value: selectedProspect.tools.speed },
                  { label: 'Arm', value: selectedProspect.tools.arm },
                  { label: 'Field', value: selectedProspect.tools.field },
                ].map(tool => {
                  const barPct = Math.max(0, Math.min(100, ((tool.value - 20) / 60) * 100));
                  return (
                    <div key={tool.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: '#ccc' }}>{tool.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: toolColor(tool.value) }}>{tool.value}</span>
                      </div>
                      <div style={{ height: 8, background: '#1a1a2e', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${barPct}%`,
                          background: toolColor(tool.value),
                          borderRadius: 4,
                          opacity: 0.85,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scouting Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUTING REPORT</div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222' }}>
                {selectedProspect.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view scouting details
            </div>
          )}
        </div>
      </div>

      {/* Budget Notes */}
      <div style={{ marginTop: 16 }}>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>BUDGET NOTES</div>
        <div style={{
          color: data.notes.startsWith('WARNING') ? '#ef4444' : '#aaa',
          fontSize: 11, lineHeight: 1.5, padding: '6px 8px', background: '#111', border: '1px solid #222',
        }}>
          {data.notes}
        </div>
      </div>
    </div>
  );
}
