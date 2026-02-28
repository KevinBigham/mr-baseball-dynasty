/**
 * SalaryCapSim2View – Salary Cap Simulator v2 Dashboard
 *
 * Bloomberg-terminal style payroll projection tool. Shows 5-year salary
 * obligations, financial flexibility windows, committed vs projected costs,
 * and interactive "what if" scenario modeling for extensions, trades, and
 * free agent signings.
 */
import { useState, useMemo } from 'react';
import {
  WhatIfScenario,
  CONTRACT_TYPE_DISPLAY,
  FLEXIBILITY_DISPLAY,
  capSpaceColor,
  getCapSimSummary,
  generateDemoSalaryCapSim2,
} from '../../engine/finance/salaryCapSim2';

const PANEL = '#111827';
const BORDER = '#374151';
const ACCENT = '#f59e0b';
const BG = '#030712';

export default function SalaryCapSim2View() {
  const data = useMemo(() => generateDemoSalaryCapSim2(), []);
  const summary = useMemo(() => getCapSimSummary(data), [data]);
  const [activeScenarios, setActiveScenarios] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number>(data.currentYear);

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Calculate adjusted seasons based on active scenarios
  const adjustedSeasons = useMemo(() => {
    return data.seasons.map((season, yearIdx) => {
      let delta = 0;
      activeScenarios.forEach(scId => {
        const sc = data.scenarios.find(s => s.id === scId);
        if (sc && yearIdx < sc.impactByYear.length) {
          delta += sc.impactByYear[yearIdx];
        }
      });
      const newTotal = Math.round((season.totalProjected + delta) * 100) / 100;
      const newSpace = Math.round((season.luxuryThreshold - newTotal) * 100) / 100;
      return { ...season, totalProjected: newTotal, capSpace: newSpace };
    });
  }, [data.seasons, data.scenarios, activeScenarios]);

  const selectedSeason = adjustedSeasons.find(s => s.year === selectedYear) ?? adjustedSeasons[0];
  const rosterForYear = data.roster.filter(r => {
    const yearIdx = selectedYear - data.currentYear;
    return yearIdx < r.salaries.length && r.salaries[yearIdx] > 0;
  });

  const maxPayroll = Math.max(...adjustedSeasons.map(s => Math.max(s.totalProjected, s.luxuryThreshold))) * 1.1;

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 13, background: BG, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: `1px solid ${BORDER}`, paddingBottom: 10 }}>
        <div>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>SALARY CAP SIMULATOR v2</span>
          <span style={{ color: '#6b7280', marginLeft: 12, fontSize: 11 }}>{data.teamName} ({data.teamAbbr}) // 5-YEAR OUTLOOK</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: 10 }}>CBT THRESHOLD: ${data.luxuryThreshold}M</span>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Current Payroll', value: `$${summary.currentPayroll.toFixed(1)}M`, color: ACCENT },
          { label: 'Cap Space', value: `$${summary.currentCapSpace.toFixed(1)}M`, color: capSpaceColor(summary.currentCapSpace) },
          { label: 'Peak Payroll', value: `$${summary.peakPayrollAmount.toFixed(1)}M (${summary.peakPayrollYear})`, color: '#ef4444' },
          { label: 'Best Flex Year', value: `${summary.bestFlexYear} ($${summary.bestFlexSpace.toFixed(1)}M)`, color: '#22c55e' },
          { label: '5-Yr Committed', value: `$${summary.totalCommitted5Yr.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'Active Scenarios', value: activeScenarios.size, color: activeScenarios.size > 0 ? '#3b82f6' : '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', border: `1px solid ${BORDER}`, background: PANEL, minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: typeof s.value === 'number' ? 18 : 12, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 5-Year Payroll Chart */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 14, marginBottom: 16 }}>
        <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          5-Year Payroll Projection {activeScenarios.size > 0 && `(${activeScenarios.size} scenario${activeScenarios.size > 1 ? 's' : ''} applied)`}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, marginBottom: 8 }}>
          {adjustedSeasons.map(season => {
            const barHeight = (season.totalProjected / maxPayroll) * 130;
            const thresholdHeight = (season.luxuryThreshold / maxPayroll) * 130;
            const isOver = season.totalProjected > season.luxuryThreshold;
            const isSelected = season.year === selectedYear;
            return (
              <div
                key={season.year}
                onClick={() => setSelectedYear(season.year)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
              >
                {/* Threshold line */}
                <div style={{
                  position: 'absolute', bottom: thresholdHeight, left: 0, right: 0,
                  borderTop: '2px dashed #ef444480', zIndex: 1,
                }} />
                {/* Bar */}
                <div style={{
                  width: '80%', height: barHeight, borderRadius: '3px 3px 0 0',
                  background: isOver ? '#ef4444' : isSelected ? ACCENT : '#3b82f6',
                  border: isSelected ? `2px solid ${ACCENT}` : 'none',
                  opacity: isSelected ? 1 : 0.7,
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: 2,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>${season.totalProjected.toFixed(0)}M</div>
                </div>
                {/* Year label */}
                <div style={{ fontSize: 10, fontWeight: isSelected ? 700 : 400, color: isSelected ? ACCENT : '#9ca3af', marginTop: 4 }}>
                  {season.year}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#6b7280' }}>
          <span><span style={{ color: '#3b82f6' }}>■</span> Projected Payroll</span>
          <span><span style={{ color: '#ef4444' }}>- - -</span> Luxury Threshold</span>
          <span><span style={{ color: '#22c55e' }}>■</span> Under Threshold</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Season Detail + Roster */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Season Detail */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>{selectedYear} SEASON</span>
                <span style={{
                  marginLeft: 10, padding: '2px 8px', fontSize: 10, fontWeight: 600,
                  color: FLEXIBILITY_DISPLAY[selectedSeason.flexibility].color,
                  border: `1px solid ${FLEXIBILITY_DISPLAY[selectedSeason.flexibility].color}40`,
                }}>
                  {FLEXIBILITY_DISPLAY[selectedSeason.flexibility].label}
                </span>
              </div>
              <span style={{ color: capSpaceColor(selectedSeason.capSpace), fontWeight: 700, fontSize: 14 }}>
                Cap Space: ${selectedSeason.capSpace.toFixed(1)}M
              </span>
            </div>

            {/* Payroll Breakdown */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {[
                { label: 'Committed', value: selectedSeason.committedSalary, color: '#ef4444' },
                { label: 'Arb Projected', value: selectedSeason.arbProjection, color: '#f59e0b' },
                { label: 'Pre-Arb', value: selectedSeason.preArbCost, color: '#22c55e' },
                { label: 'FA Slots', value: selectedSeason.faSlotCost, color: '#6b7280' },
                { label: 'Total', value: selectedSeason.totalProjected, color: ACCENT },
                { label: 'Threshold', value: selectedSeason.luxuryThreshold, color: '#9ca3af' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '6px 0', background: '#0f172a', borderRadius: 2 }}>
                  <div style={{ color: '#6b7280', fontSize: 8, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>${s.value.toFixed(1)}M</div>
                </div>
              ))}
            </div>

            {/* Stacked bar */}
            <div style={{ height: 20, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1f2937' }}>
              {selectedSeason.committedSalary > 0 && (
                <div style={{ width: `${(selectedSeason.committedSalary / selectedSeason.luxuryThreshold) * 100}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>GTD</div>
              )}
              {selectedSeason.arbProjection > 0 && (
                <div style={{ width: `${(selectedSeason.arbProjection / selectedSeason.luxuryThreshold) * 100}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>ARB</div>
              )}
              {selectedSeason.preArbCost > 0 && (
                <div style={{ width: `${(selectedSeason.preArbCost / selectedSeason.luxuryThreshold) * 100}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>PA</div>
              )}
              {selectedSeason.faSlotCost > 0 && (
                <div style={{ width: `${(selectedSeason.faSlotCost / selectedSeason.luxuryThreshold) * 100}%`, background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>FA</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#6b7280', marginTop: 4 }}>
              <span><span style={{ color: '#ef4444' }}>■</span> Guaranteed</span>
              <span><span style={{ color: '#f59e0b' }}>■</span> Arbitration</span>
              <span><span style={{ color: '#22c55e' }}>■</span> Pre-Arb</span>
              <span><span style={{ color: '#6b7280' }}>■</span> FA Slots</span>
              <span style={{ marginLeft: 'auto' }}>{selectedSeason.openRosterSpots} open spot{selectedSeason.openRosterSpots !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Roster Obligations */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Roster Obligations ({selectedYear})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Player</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Type</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>{selectedYear} Salary</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Yrs Left</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Total Owed</th>
                </tr>
              </thead>
              <tbody>
                {rosterForYear.map((r, i) => {
                  const yearIdx = selectedYear - data.currentYear;
                  const salary = r.salaries[yearIdx] ?? 0;
                  const ct = CONTRACT_TYPE_DISPLAY[r.contractType];
                  const yearsAfter = r.salaries.slice(yearIdx).filter(s => s > 0).length;
                  const totalAfter = r.salaries.slice(yearIdx).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{r.name}</div>
                        <div style={{ color: '#4b5563', fontSize: 9, maxWidth: 250 }}>{r.note}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: 6, color: '#9ca3af' }}>{r.position}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}>
                        <span style={{ color: ct.color, fontSize: 9, fontWeight: 600, padding: '1px 5px', border: `1px solid ${ct.color}40` }}>
                          {ct.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: 6, color: '#9ca3af' }}>{r.age > 0 ? r.age + yearIdx : '-'}</td>
                      <td style={{ textAlign: 'center', padding: 6, color: ACCENT, fontWeight: 700 }}>${salary.toFixed(1)}M</td>
                      <td style={{ textAlign: 'center', padding: 6, color: '#9ca3af' }}>{yearsAfter}</td>
                      <td style={{ textAlign: 'center', padding: 6, color: '#d1d5db' }}>${totalAfter.toFixed(1)}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: What-If Scenarios */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              What-If Scenarios (toggle to model)
            </div>
            {data.scenarios.map((sc: WhatIfScenario) => {
              const isActive = activeScenarios.has(sc.id);
              const typeColor = sc.type === 'extension' ? '#3b82f6' : sc.type === 'trade' ? '#22c55e' : '#f59e0b';
              const riskColor = sc.riskLevel === 'low' ? '#22c55e' : sc.riskLevel === 'medium' ? '#f59e0b' : '#ef4444';
              return (
                <div
                  key={sc.id}
                  style={{
                    padding: '10px 12px', borderBottom: `1px solid #1f2937`, cursor: 'pointer',
                    background: isActive ? '#1e293b' : 'transparent',
                    borderLeft: isActive ? `3px solid ${typeColor}` : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => toggleScenario(sc.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? typeColor : '#1f2937', border: `1px solid ${typeColor}`,
                        color: '#fff', fontSize: 9, fontWeight: 700,
                      }}>
                        {isActive ? '✓' : ''}
                      </span>
                      <span style={{ fontWeight: 700, color: isActive ? ACCENT : '#e5e7eb', fontSize: 12 }}>{sc.name}</span>
                    </div>
                    <span style={{ color: typeColor, fontSize: 9, fontWeight: 600, padding: '1px 5px', border: `1px solid ${typeColor}40`, textTransform: 'uppercase' }}>
                      {sc.type}
                    </span>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 6, lineHeight: 1.4 }}>{sc.description}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
                    <span style={{ color: sc.totalCost >= 0 ? '#ef4444' : '#22c55e' }}>
                      {sc.totalCost >= 0 ? '+' : ''}{sc.totalCost > 0 ? `$${sc.totalCost}M` : `-$${Math.abs(sc.totalCost)}M`}
                    </span>
                    <span style={{ color: riskColor }}>
                      Risk: {sc.riskLevel.toUpperCase()}
                    </span>
                    {sc.projectedWARGain !== 0 && (
                      <span style={{ color: sc.projectedWARGain > 0 ? '#22c55e' : '#f97316' }}>
                        {sc.projectedWARGain > 0 ? '+' : ''}{sc.projectedWARGain} WAR
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div style={{ marginTop: 6, padding: 6, background: '#0f172a', borderRadius: 2 }}>
                      <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 4 }}>Year-by-Year Impact:</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {sc.impactByYear.map((imp, yi) => (
                          <div key={yi} style={{ flex: 1, textAlign: 'center', padding: '3px 0', background: '#111827', borderRadius: 2 }}>
                            <div style={{ color: '#6b7280', fontSize: 8 }}>{data.currentYear + yi}</div>
                            <div style={{ color: imp === 0 ? '#374151' : imp > 0 ? '#ef4444' : '#22c55e', fontWeight: 700, fontSize: 10 }}>
                              {imp === 0 ? '-' : `${imp > 0 ? '+' : ''}$${imp}M`}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: 9, marginTop: 4, lineHeight: 1.3 }}>{sc.note}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Flexibility Timeline */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginTop: 12 }}>
            <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Financial Flexibility Timeline
            </div>
            {adjustedSeasons.map(season => {
              const flex = season.capSpace >= 60 ? 'wide_open'
                : season.capSpace >= 30 ? 'flexible'
                : season.capSpace >= 0 ? 'moderate'
                : 'tight' as const;
              const pct = Math.max(0, Math.min(100, (season.capSpace / 100) * 100));
              return (
                <div key={season.year} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: season.year === selectedYear ? ACCENT : '#d1d5db', fontWeight: season.year === selectedYear ? 700 : 400 }}>
                      {season.year}
                    </span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: FLEXIBILITY_DISPLAY[flex].color, fontWeight: 600 }}>
                        {FLEXIBILITY_DISPLAY[flex].label}
                      </span>
                      <span style={{ color: capSpaceColor(season.capSpace) }}>
                        ${season.capSpace.toFixed(1)}M
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#1f2937', borderRadius: 2 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 2,
                      background: FLEXIBILITY_DISPLAY[flex].color,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
