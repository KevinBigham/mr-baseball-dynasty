/**
 * TradeChipRankingView – League-Wide Trade Chip Rankings
 *
 * Bloomberg-terminal style ranking of the top 50 trade chips across
 * the league. Displays value breakdowns, filters by position/team/contract,
 * and shows trend direction for each player's ranking.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoTradeChipRanking,
  getTradeChipSummary,
  TIER_DISPLAY,
  CONTRACT_DISPLAY,
  type TradeChip,
} from '../../engine/trade/tradeChipRanking';

export default function TradeChipRankingView() {
  const allChips = useMemo(() => generateDemoTradeChipRanking(), []);
  const [selected, setSelected] = useState<TradeChip | null>(null);
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [contractFilter, setContractFilter] = useState<string>('ALL');

  const filteredChips = useMemo(() => {
    return allChips.filter(c => {
      if (posFilter !== 'ALL' && c.position !== posFilter) return false;
      if (teamFilter !== 'ALL' && c.team !== teamFilter) return false;
      if (contractFilter !== 'ALL' && c.contractStatus !== contractFilter) return false;
      return true;
    });
  }, [allChips, posFilter, teamFilter, contractFilter]);

  const summary = useMemo(() => getTradeChipSummary(allChips), [allChips]);

  const teams = useMemo(() => ['ALL', ...Array.from(new Set(allChips.map(c => c.team))).sort()], [allChips]);
  const positions = useMemo(() => ['ALL', ...Array.from(new Set(allChips.map(c => c.position))).sort()], [allChips]);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100vh' }}>
      <div style={{ marginBottom: 14, padding: '8px 16px', background: '#111827', borderBottom: '2px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          TRADE CHIP RANKINGS — LEAGUE-WIDE TOP 50
        </span>
        <span style={{ color: '#666', fontSize: 11 }}>VALUE-WEIGHTED COMPOSITE</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Ranked', value: summary.totalRanked },
          { label: 'Elite Tier', value: summary.eliteCount, color: '#22c55e' },
          { label: 'Premium Tier', value: summary.premiumCount, color: '#3b82f6' },
          { label: 'Avg Value', value: summary.avgValue },
          { label: 'Top Team', value: summary.topTeam },
          { label: 'Top Position', value: summary.topPosition },
          { label: 'Pre-Arb', value: summary.preArbCount, color: '#22c55e' },
          { label: 'Expiring', value: summary.expiringCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', minWidth: 90, textAlign: 'center', background: '#111827', border: '1px solid #374151' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 10 }}>POS:</span>
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            style={{ background: '#111827', color: '#e0e0e0', border: '1px solid #374151', padding: '3px 6px', fontFamily: 'monospace', fontSize: 11 }}
          >
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 10 }}>TEAM:</span>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            style={{ background: '#111827', color: '#e0e0e0', border: '1px solid #374151', padding: '3px 6px', fontFamily: 'monospace', fontSize: 11 }}
          >
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 10 }}>CONTRACT:</span>
          <select
            value={contractFilter}
            onChange={e => setContractFilter(e.target.value)}
            style={{ background: '#111827', color: '#e0e0e0', border: '1px solid #374151', padding: '3px 6px', fontFamily: 'monospace', fontSize: 11 }}
          >
            <option value="ALL">ALL</option>
            <option value="pre-arb">Pre-Arb</option>
            <option value="arb-eligible">Arb-Eligible</option>
            <option value="controlled">Controlled</option>
            <option value="expiring">Expiring</option>
            <option value="long-term">Long-Term</option>
          </select>
        </div>
        <span style={{ marginLeft: 'auto', color: '#555', fontSize: 10 }}>
          Showing {filteredChips.length} of {allChips.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Ranking Table */}
        <div style={{ flex: '1 1 600px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6, width: 36 }}>#</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Salary</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Yrs</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Contract</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Value</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tier</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredChips.map(c => {
                const tierInfo = TIER_DISPLAY[c.tier];
                const contractInfo = CONTRACT_DISPLAY[c.contractStatus];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      background: selected?.id === c.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, textAlign: 'center', color: c.rank <= 5 ? '#f59e0b' : c.rank <= 15 ? '#e0e0e0' : '#888', fontWeight: c.rank <= 5 ? 700 : 400 }}>
                      {c.rank}
                    </td>
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {c.name}
                      <span style={{ color: '#666', marginLeft: 6 }}>{c.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.position === 'SP' ? '#3b82f6' : c.position === 'RP' ? '#8b5cf6' : '#888' }}>
                      {c.position}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.age <= 25 ? '#22c55e' : c.age <= 30 ? '#e0e0e0' : '#f97316' }}>
                      {c.age}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>
                      {c.war.toFixed(1)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      ${c.salary.toFixed(1)}M
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.yearsControlled >= 4 ? '#22c55e' : c.yearsControlled >= 2 ? '#e0e0e0' : '#f97316' }}>
                      {c.yearsControlled}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: contractInfo.color, fontSize: 10 }}>
                      {contractInfo.label}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: tierInfo.color + '22',
                        color: tierInfo.color,
                        borderRadius: 3,
                      }}>
                        {c.totalValue}
                      </span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: tierInfo.color, fontWeight: 700, fontSize: 10 }}>
                      {tierInfo.badge} {tierInfo.label}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{
                        color: c.trending === 'up' ? '#22c55e' : c.trending === 'down' ? '#ef4444' : '#888',
                        fontWeight: 600,
                      }}>
                        {c.trending === 'up' ? '^' : c.trending === 'down' ? 'v' : '-'}
                        {c.trendDelta !== 0 && <span style={{ fontSize: 9 }}>{Math.abs(c.trendDelta)}</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div style={{ padding: 14, background: '#111827', border: '1px solid #374151' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
                #{selected.rank} {selected.name}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
                {selected.teamFull} | {selected.position} | Age {selected.age} | OVR {selected.overall} | POT {selected.potential}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 12px',
                background: TIER_DISPLAY[selected.tier].color + '22',
                color: TIER_DISPLAY[selected.tier].color,
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 14,
                borderRadius: 3,
              }}>
                {TIER_DISPLAY[selected.tier].badge} {TIER_DISPLAY[selected.tier].label} — Value {selected.totalValue}/100
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'WAR', value: selected.war.toFixed(1) },
                  { label: 'Proj WAR', value: selected.projectedWAR.toFixed(1) },
                  { label: 'Salary', value: `$${selected.salary.toFixed(1)}M` },
                  { label: 'Yrs Ctrl', value: selected.yearsControlled, color: selected.yearsControlled >= 4 ? '#22c55e' : '#e0e0e0' },
                  { label: 'Contract', value: CONTRACT_DISPLAY[selected.contractStatus].label, color: CONTRACT_DISPLAY[selected.contractStatus].color },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Value Breakdown Bars */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>VALUE BREAKDOWN</div>
              {[
                { label: 'Performance', value: selected.breakdown.performanceScore, weight: '30%' },
                { label: 'Surplus Value', value: Math.max(0, Math.min(100, (selected.breakdown.surplusValue + 20) * (100 / 60))), extra: `$${selected.breakdown.surplusValue}M`, weight: '20%' },
                { label: 'Contract', value: selected.breakdown.contractDesirability, weight: '18%' },
                { label: 'Age Factor', value: selected.breakdown.ageFactor, weight: '12%' },
                { label: 'Pos Scarcity', value: selected.breakdown.positionScarcity, weight: '10%' },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: '#888' }}>
                      {b.label} <span style={{ color: '#555' }}>({b.weight})</span>
                    </span>
                    <span style={{ color: '#e0e0e0' }}>
                      {Math.round(b.value)}{b.extra ? ` (${b.extra})` : ''}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#1f2937', borderRadius: 3 }}>
                    <div style={{
                      width: `${Math.min(100, b.value)}%`,
                      height: 6,
                      borderRadius: 3,
                      background: b.value >= 70 ? '#22c55e' : b.value >= 40 ? '#eab308' : '#ef4444',
                    }} />
                  </div>
                </div>
              ))}

              {/* Trend */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 14 }}>TREND</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: '#0a0a1a',
                border: '1px solid #1f2937',
                marginBottom: 14,
              }}>
                <span style={{
                  color: selected.trending === 'up' ? '#22c55e' : selected.trending === 'down' ? '#ef4444' : '#888',
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  {selected.trending === 'up' ? '^' : selected.trending === 'down' ? 'v' : '-'}
                </span>
                <span style={{ color: '#e0e0e0', fontSize: 12 }}>
                  {selected.trending === 'up' ? `Rank up ${Math.abs(selected.trendDelta)} spots in last 2 weeks` :
                   selected.trending === 'down' ? `Rank down ${Math.abs(selected.trendDelta)} spots in last 2 weeks` :
                   'Rank stable over last 2 weeks'}
                </span>
              </div>

              {/* Notes */}
              <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 8, background: '#0a0a1a', border: '1px solid #1f2937', color: '#ccc', lineHeight: 1.5, fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#555', background: '#111827', border: '1px solid #374151' }}>
              Select a player to view trade value breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
