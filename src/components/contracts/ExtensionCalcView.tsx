/**
 * ExtensionCalcView – Contract Extension Calculator dashboard
 *
 * Bloomberg-terminal style extension analyzer with scenario cards,
 * risk badges, surplus value bars, comparable contract references,
 * and sortable display by risk/value/position.
 */
import { useState, useMemo } from 'react';
import {
  ExtensionScenario,
  RISK_DISPLAY,
  getExtensionSummary,
  generateDemoExtensionCalc,
} from '../../engine/contracts/extensionCalculator';

type SortKey = 'risk' | 'value' | 'position' | 'surplus';

const RISK_ORDER = { low: 0, medium: 1, high: 2, extreme: 3 };

function sortScenarios(scenarios: ExtensionScenario[], key: SortKey): ExtensionScenario[] {
  const sorted = [...scenarios];
  switch (key) {
    case 'risk':
      sorted.sort((a, b) => RISK_ORDER[b.riskRating] - RISK_ORDER[a.riskRating]);
      break;
    case 'value':
      sorted.sort((a, b) => b.totalValue - a.totalValue);
      break;
    case 'position':
      sorted.sort((a, b) => a.position.localeCompare(b.position));
      break;
    case 'surplus':
      sorted.sort((a, b) => b.surplusValue - a.surplusValue);
      break;
  }
  return sorted;
}

export default function ExtensionCalcView() {
  const scenarios = useMemo(() => generateDemoExtensionCalc(), []);
  const summary = useMemo(() => getExtensionSummary(scenarios), [scenarios]);
  const [sortBy, setSortBy] = useState<SortKey>('surplus');
  const [selected, setSelected] = useState<ExtensionScenario | null>(null);

  const sorted = useMemo(() => sortScenarios(scenarios, sortBy), [scenarios, sortBy]);

  const maxAbsSurplus = Math.max(...scenarios.map(s => Math.abs(s.surplusValue)));

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CONTRACT EXTENSION CALCULATOR — SCENARIO ANALYSIS
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Scenarios', value: summary.totalScenarios },
          { label: 'Total Commitment', value: `$${summary.totalCommitment}M` },
          { label: 'Avg Surplus', value: `${summary.avgSurplus > 0 ? '+' : ''}$${summary.avgSurplus}M`, color: summary.avgSurplus >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Best Value', value: summary.bestValue, color: '#22c55e' },
          { label: 'Highest Risk', value: summary.highestRisk, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Sort Controls ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, fontSize: 11 }}>
        <span style={{ color: '#888' }}>Sort by:</span>
        {(['surplus', 'risk', 'value', 'position'] as SortKey[]).map(k => (
          <button
            key={k}
            onClick={() => setSortBy(k)}
            style={{
              background: sortBy === k ? '#f59e0b' : '#1f2937',
              color: sortBy === k ? '#000' : '#ccc',
              border: '1px solid #374151',
              padding: '2px 10px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: sortBy === k ? 700 : 400,
            }}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Scenario Cards ──────────────────────────────────────────── */}
        <div style={{ flex: '1 1 520px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {sorted.map(sc => {
              const risk = RISK_DISPLAY[sc.riskRating];
              const surplusPct = maxAbsSurplus > 0 ? Math.abs(sc.surplusValue) / maxAbsSurplus * 100 : 0;
              const isPositive = sc.surplusValue >= 0;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelected(sc)}
                  className="bloomberg-border"
                  style={{
                    padding: 12,
                    cursor: 'pointer',
                    background: selected?.id === sc.id ? '#1a1a3e' : '#111827',
                    borderColor: selected?.id === sc.id ? '#f59e0b' : '#374151',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{sc.playerName}</div>
                    <span style={{
                      background: risk.color,
                      color: '#000',
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                    }}>
                      {risk.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                    {sc.position} · Age {sc.currentAge} · {sc.proposedYears}yr / ${sc.proposedAAV}M AAV
                  </div>

                  {/* Total Value */}
                  <div style={{ fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#888' }}>Total: </span>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15 }}>${sc.totalValue}M</span>
                  </div>

                  {/* Surplus Value Bar */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 2 }}>
                      <span>Surplus</span>
                      <span style={{ color: isPositive ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {isPositive ? '+' : ''}{sc.surplusValue}M
                      </span>
                    </div>
                    <div style={{ background: '#1f2937', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${surplusPct}%`,
                        height: '100%',
                        background: isPositive ? '#22c55e' : '#ef4444',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail Panel ────────────────────────────────────────────── */}
        <div style={{ flex: '0 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.playerName}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                {selected.position} · Age {selected.currentAge}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ color: '#888' }}>Current AAV: </span>
                  <span>${selected.currentAAV}M</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Proposed AAV: </span>
                  <span style={{ fontWeight: 700 }}>${selected.proposedAAV}M</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Years: </span>
                  <span style={{ fontWeight: 700 }}>{selected.proposedYears}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Total: </span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>${selected.totalValue}M</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Surplus: </span>
                  <span style={{ color: selected.surplusValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {selected.surplusValue >= 0 ? '+' : ''}${selected.surplusValue}M
                  </span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Risk: </span>
                  <span style={{ color: RISK_DISPLAY[selected.riskRating].color, fontWeight: 700 }}>
                    {RISK_DISPLAY[selected.riskRating].label}
                  </span>
                </div>
              </div>

              {/* Comparable Contracts */}
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>COMPARABLE CONTRACTS</div>
              {selected.comparableContracts.map((comp, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid #222',
                    fontSize: 12,
                  }}
                >
                  <span>{comp.playerName}</span>
                  <span style={{ color: '#aaa' }}>
                    {comp.years}yr / ${comp.aav}M AAV
                    <span style={{ color: '#666', marginLeft: 6 }}>(${comp.totalValue}M)</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 14, textAlign: 'center', color: '#666' }}>
              Select a scenario for details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
