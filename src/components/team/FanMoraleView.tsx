/**
 * FanMoraleView – Fan Morale & Attendance Dashboard
 *
 * Bloomberg-terminal style dashboard showing fan satisfaction,
 * attendance trends, revenue impact, season ticket retention,
 * morale factors, and rivalry game effects.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoFanMorale,
  getMoraleColor,
  getTrendColor,
  getTrendArrow,
  getCategoryColor,
  type FanMoraleData,
  type MoraleFactor,
} from '../../engine/team/fanMoraleEngine';

const PANEL: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 4,
  padding: 14,
};

const HEADER: React.CSSProperties = {
  background: '#030712',
  borderBottom: '1px solid #374151',
  padding: '8px 20px',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: 1.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

function StatBox({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ ...PANEL, textAlign: 'center', minWidth: 100, flex: '1 1 0' }}>
      <div style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{label}</div>
      <div style={{ color: color ?? '#f59e0b', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ color: '#4b5563', fontSize: 9, fontFamily: 'monospace', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MoraleGauge({ score }: { score: number }) {
  const color = getMoraleColor(score);
  return (
    <div style={{ ...PANEL, textAlign: 'center', padding: 20 }}>
      <div style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginBottom: 8 }}>FAN MORALE SCORE</div>
      <div style={{ fontSize: 52, fontWeight: 700, fontFamily: 'monospace', color, lineHeight: 1 }}>{score}</div>
      <div style={{ width: '100%', maxWidth: 200, margin: '12px auto 0', height: 8, background: '#030712', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function FactorRow({ factor, isSelected, onClick }: { factor: MoraleFactor; isSelected: boolean; onClick: () => void }) {
  const impactColor = factor.impact >= 0 ? '#22c55e' : '#ef4444';
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#1e293b' : 'transparent',
        fontFamily: 'monospace',
        fontSize: 11,
        transition: 'background 0.15s',
      }}
    >
      <td style={{ padding: '7px 8px' }}>
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 2,
          background: getCategoryColor(factor.category),
          marginRight: 8,
        }} />
        <span style={{ color: isSelected ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{factor.name}</span>
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', fontSize: 9, color: getCategoryColor(factor.category) }}>
        {factor.category.toUpperCase()}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#d1d5db' }}>{factor.currentValue}</td>
      <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: impactColor }}>
        {factor.impact >= 0 ? '+' : ''}{factor.impact}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: getTrendColor(factor.trend), fontWeight: 600 }}>
        {getTrendArrow(factor.trend)}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
        <div style={{ width: 40, height: 5, background: '#030712', borderRadius: 3, overflow: 'hidden', display: 'inline-block' }}>
          <div style={{ width: `${factor.weight * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 9, color: '#6b7280', marginLeft: 4 }}>{Math.round(factor.weight * 100)}%</span>
      </td>
    </tr>
  );
}

function AttendanceChart({ trend }: { trend: FanMoraleData['attendanceTrend'] }) {
  const maxAtt = Math.max(...trend.map(t => t.capacity));
  return (
    <div style={PANEL}>
      <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 12 }}>
        ATTENDANCE TREND
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginBottom: 8 }}>
        {trend.map((t, i) => {
          const isProjected = t.month.includes('proj');
          const barHeight = (t.averageAttendance / maxAtt) * 100;
          const capHeight = (t.capacity / maxAtt) * 100;
          const color = isProjected ? '#3b82f6' : '#22c55e';
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#9ca3af', marginBottom: 4 }}>
                {(t.averageAttendance / 1000).toFixed(1)}K
              </div>
              <div style={{ position: 'relative', height: capHeight }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '10%',
                  right: '10%',
                  height: barHeight,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  opacity: isProjected ? 0.5 : 0.8,
                  border: isProjected ? '1px dashed #3b82f6' : 'none',
                }} />
              </div>
              <div style={{ fontSize: 8, fontFamily: 'monospace', color: '#4b5563', marginTop: 4 }}>
                {t.month.replace(' (proj)', '')}
              </div>
              <div style={{ fontSize: 8, fontFamily: 'monospace', color: '#6b7280' }}>
                {t.capacityPct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 9, fontFamily: 'monospace' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#22c55e', borderRadius: 2, marginRight: 4 }} />Actual</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#3b82f6', borderRadius: 2, marginRight: 4, opacity: 0.5 }} />Projected</span>
      </div>
    </div>
  );
}

function RevenueTable({ revenue }: { revenue: FanMoraleData['revenueImpact'] }) {
  const totalCurrent = revenue.reduce((s, r) => s + r.currentRevenue, 0);
  const totalProjected = revenue.reduce((s, r) => s + r.projectedRevenue, 0);
  const totalDelta = revenue.reduce((s, r) => s + r.delta, 0);

  return (
    <div style={PANEL}>
      <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 10 }}>
        REVENUE IMPACT OF FAN MORALE
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280', fontSize: 10 }}>
            <th style={{ padding: '5px 8px', textAlign: 'left' }}>CATEGORY</th>
            <th style={{ padding: '5px 8px', textAlign: 'right' }}>CURRENT ($M)</th>
            <th style={{ padding: '5px 8px', textAlign: 'right' }}>PROJECTED ($M)</th>
            <th style={{ padding: '5px 8px', textAlign: 'right' }}>DELTA ($M)</th>
            <th style={{ padding: '5px 8px', textAlign: 'right' }}>DELTA %</th>
          </tr>
        </thead>
        <tbody>
          {revenue.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '5px 8px', color: '#d1d5db' }}>{r.category}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#9ca3af' }}>${r.currentRevenue.toFixed(1)}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#d1d5db' }}>${r.projectedRevenue.toFixed(1)}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: r.delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(1)}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: r.deltaPercent >= 10 ? '#22c55e' : '#9ca3af' }}>
                +{r.deltaPercent.toFixed(1)}%
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #374151' }}>
            <td style={{ padding: '6px 8px', color: '#f59e0b', fontWeight: 700 }}>TOTAL</td>
            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9ca3af', fontWeight: 700 }}>${totalCurrent.toFixed(1)}</td>
            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#d1d5db', fontWeight: 700 }}>${totalProjected.toFixed(1)}</td>
            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>+{totalDelta.toFixed(1)}</td>
            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>
              +{((totalDelta / totalCurrent) * 100).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function FanMoraleView() {
  const data = useMemo<FanMoraleData>(() => generateDemoFanMorale(), []);
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [tab, setTab] = useState<'factors' | 'revenue' | 'tickets'>('factors');

  const selected = selectedFactor ? data.factors.find(f => f.id === selectedFactor) ?? null : null;
  const trendColor = getTrendColor(data.moraleTrend);

  return (
    <div style={{ padding: 18, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100vh' }}>
      {/* Header */}
      <div style={HEADER}>
        <span>FAN MORALE & ATTENDANCE</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>FRANCHISE ENGAGEMENT ENGINE</span>
      </div>

      {/* Top Row: Morale Gauge + Summary Stats */}
      <div style={{ display: 'flex', gap: 14, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 180px' }}>
          <MoraleGauge score={data.moraleScore} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatBox label="GRADE" value={data.moraleGrade} color={getMoraleColor(data.moraleScore)} />
            <StatBox
              label="TREND"
              value={`${getTrendArrow(data.moraleTrend)} ${data.moraleTrend.toUpperCase()}`}
              color={trendColor}
              sub={`${data.moraleTrendDelta >= 0 ? '+' : ''}${data.moraleTrendDelta} pts (30d)`}
            />
            <StatBox
              label="AVG ATTENDANCE"
              value={data.currentAttendance.toLocaleString()}
              sub={`of ${data.stadiumCapacity.toLocaleString()} capacity`}
            />
            <StatBox
              label="CAPACITY"
              value={`${Math.round((data.currentAttendance / data.stadiumCapacity) * 100)}%`}
              color={data.currentAttendance / data.stadiumCapacity >= 0.85 ? '#22c55e' : '#f59e0b'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatBox label="AVG TICKET" value={`$${data.avgTicketPrice}`} color="#eab308" />
            <StatBox label="FANBASE" value={`${data.fanbaseSize}K`} color="#3b82f6" />
            <StatBox label="SOCIAL SENTIMENT" value={data.socialSentiment} color={data.socialSentiment >= 65 ? '#22c55e' : '#f59e0b'} />
            <StatBox label="MERCH INDEX" value={data.merchandiseIndex} color="#8b5cf6" />
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div style={{ marginBottom: 16 }}>
        <AttendanceChart trend={data.attendanceTrend} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
        {([
          { key: 'factors' as const, label: 'MORALE FACTORS' },
          { key: 'revenue' as const, label: 'REVENUE IMPACT' },
          { key: 'tickets' as const, label: 'SEASON TICKETS' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 20px',
              border: '1px solid #374151',
              background: tab === t.key ? '#1e293b' : '#030712',
              color: tab === t.key ? '#f59e0b' : '#6b7280',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #f59e0b' : '1px solid #374151',
              letterSpacing: 1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'factors' && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Factors Table */}
          <div style={{ flex: '1 1 540px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280', fontFamily: 'monospace', fontSize: 10 }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>FACTOR</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>CATEGORY</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>VALUE</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>IMPACT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>TREND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>WEIGHT</th>
                </tr>
              </thead>
              <tbody>
                {data.factors.map(f => (
                  <FactorRow
                    key={f.id}
                    factor={f}
                    isSelected={selectedFactor === f.id}
                    onClick={() => setSelectedFactor(f.id)}
                  />
                ))}
              </tbody>
            </table>

            {/* Net Impact Summary */}
            <div style={{ ...PANEL, marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>NET POSITIVE IMPACT</div>
                <div style={{ color: '#22c55e', fontSize: 18, fontWeight: 700 }}>
                  +{data.factors.filter(f => f.impact > 0).reduce((s, f) => s + f.impact, 0)}
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>NET NEGATIVE IMPACT</div>
                <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 700 }}>
                  {data.factors.filter(f => f.impact < 0).reduce((s, f) => s + f.impact, 0)}
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>NET MORALE IMPACT</div>
                <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>
                  +{data.factors.reduce((s, f) => s + f.impact, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Factor Detail */}
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            {selected ? (
              <div style={PANEL}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                  {selected.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: getCategoryColor(selected.category) + '22',
                    color: getCategoryColor(selected.category),
                    fontWeight: 600,
                  }}>
                    {selected.category.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: getTrendColor(selected.trend) + '22',
                    color: getTrendColor(selected.trend),
                    fontWeight: 600,
                  }}>
                    {getTrendArrow(selected.trend)} {selected.trend.toUpperCase()}
                  </span>
                </div>

                <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                  {selected.description}
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>VALUE</div>
                    <div style={{ color: '#d1d5db', fontSize: 22, fontWeight: 700 }}>{selected.currentValue}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>IMPACT</div>
                    <div style={{
                      color: selected.impact >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: 22,
                      fontWeight: 700,
                    }}>
                      {selected.impact >= 0 ? '+' : ''}{selected.impact}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>WEIGHT</div>
                    <div style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>{Math.round(selected.weight * 100)}%</div>
                  </div>
                </div>

                {/* Impact Bar */}
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>IMPACT MAGNITUDE</div>
                <div style={{
                  height: 12,
                  background: '#030712',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    width: 1,
                    height: '100%',
                    background: '#374151',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: selected.impact >= 0 ? '50%' : `${50 + (selected.impact / 30) * 50}%`,
                    width: `${Math.abs(selected.impact) / 30 * 50}%`,
                    height: '100%',
                    background: selected.impact >= 0 ? '#22c55e' : '#ef4444',
                    borderRadius: 6,
                  }} />
                </div>
              </div>
            ) : (
              <div style={{ ...PANEL, textAlign: 'center', color: '#4b5563', padding: 40 }}>
                Select a morale factor for details
              </div>
            )}

            {/* Rivalry Games */}
            <div style={{ ...PANEL, marginTop: 14 }}>
              <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 10 }}>
                RIVALRY GAME BOOSTS
              </div>
              {data.rivalryBoosts.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: i < data.rivalryBoosts.length - 1 ? '1px solid #1f2937' : 'none',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}>
                  <div>
                    <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{r.opponent}</div>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>{r.gamesRemaining} games left | Avg {r.avgAttendance.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 12 }}>+{r.attendanceBoost}% ATT</div>
                    <div style={{ color: '#3b82f6', fontSize: 9 }}>+{r.moraleBoost} morale</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'revenue' && (
        <RevenueTable revenue={data.revenueImpact} />
      )}

      {tab === 'tickets' && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Season Ticket Overview */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={PANEL}>
              <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 14 }}>
                SEASON TICKET HOLDER RETENTION
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>TOTAL HOLDERS</div>
                  <div style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>{data.seasonTickets.totalHolders.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>RENEWAL RATE</div>
                  <div style={{ color: data.seasonTickets.renewalRate >= 85 ? '#22c55e' : '#f59e0b', fontSize: 22, fontWeight: 700 }}>
                    {data.seasonTickets.renewalRate}%
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>PROJ RENEWALS</div>
                  <div style={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}>{data.seasonTickets.projectedRenewals.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>AT-RISK HOLDERS</div>
                  <div style={{ color: '#ef4444', fontSize: 22, fontWeight: 700 }}>{data.seasonTickets.atRiskHolders.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>REVENUE AT RISK</div>
                  <div style={{ color: '#ef4444', fontSize: 22, fontWeight: 700 }}>${data.seasonTickets.revenueAtRisk}M</div>
                </div>
              </div>

              {/* Retention Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>RETENTION VISUALIZATION</div>
                <div style={{ height: 20, background: '#030712', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${data.seasonTickets.renewalRate}%`,
                    height: '100%',
                    background: '#22c55e',
                    borderRadius: '4px 0 0 4px',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${data.seasonTickets.renewalRate}%`,
                    width: `${100 - data.seasonTickets.renewalRate}%`,
                    height: '100%',
                    top: 0,
                    background: '#ef4444',
                    borderRadius: '0 4px 4px 0',
                    opacity: 0.6,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    {data.seasonTickets.renewalRate}% renewal
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Non-Renewal Reasons */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={PANEL}>
              <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 12 }}>
                TOP REASONS FOR NON-RENEWAL
              </div>
              {data.seasonTickets.topReasons.map((reason, i) => {
                const pctMatch = reason.match(/\((\d+)%/);
                const pct = pctMatch ? parseInt(pctMatch[1]) : 0;
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace' }}>
                        {i + 1}. {reason.replace(/\s*\(\d+%.*?\)/, '')}
                      </span>
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#030712', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct * 2.5}%`,
                        height: '100%',
                        background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? '#f59e0b' : '#6b7280',
                        borderRadius: 3,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
