/**
 * BattingApproachView – Batting Approach Index dashboard
 *
 * Bloomberg-terminal style view with approach index table, grade badges,
 * metric breakdowns with percentile bars, and strength/weakness highlights.
 */
import { useState, useMemo } from 'react';
import {
  APPROACH_DISPLAY,
  generateDemoBattingApproach,
  getApproachSummary,
  type BatterApproach,
  type ApproachMetric,
} from '../../engine/analytics/battingApproachIndex';

function PercentileBar({ metric }: { metric: ApproachMetric }) {
  const barColor =
    metric.percentile >= 80 ? '#22c55e' :
    metric.percentile >= 60 ? '#3b82f6' :
    metric.percentile >= 40 ? '#eab308' :
    metric.percentile >= 20 ? '#f97316' : '#ef4444';

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: '#9ca3af' }}>{metric.label}</span>
        <span style={{ color: '#e5e7eb', fontWeight: 700 }}>
          {metric.value.toFixed(1)}
          <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>
            Lg: {metric.leagueAvg.toFixed(1)}
          </span>
        </span>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            height: '100%',
            width: `${metric.percentile}%`,
            background: barColor,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 1 }}>
        <span style={{ color: '#4b5563' }}>{metric.description}</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{metric.percentile}th</span>
      </div>
    </div>
  );
}

function ApproachCard({ batter, isSelected, onSelect }: {
  batter: BatterApproach;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const gradeInfo = APPROACH_DISPLAY[batter.grade];
  const indexColor =
    batter.approachIndex >= 80 ? '#22c55e' :
    batter.approachIndex >= 65 ? '#3b82f6' :
    batter.approachIndex >= 45 ? '#eab308' :
    batter.approachIndex >= 30 ? '#f97316' : '#ef4444';

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#111827' : 'transparent',
      }}
    >
      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>
        {batter.name}
        <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>
          ({batter.bats})
        </span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <span style={{ color: indexColor, fontWeight: 700, fontSize: 16 }}>
          {batter.approachIndex}
        </span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <span
          style={{
            padding: '2px 8px',
            fontSize: 9,
            fontWeight: 700,
            background: gradeInfo.color + '22',
            color: gradeInfo.color,
            border: `1px solid ${gradeInfo.color}44`,
            fontFamily: 'monospace',
          }}
        >
          {gradeInfo.label}
        </span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: batter.chaseRate <= 22 ? '#22c55e' : batter.chaseRate <= 30 ? '#eab308' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
        {batter.chaseRate.toFixed(1)}%
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: batter.zoneContact >= 90 ? '#22c55e' : batter.zoneContact >= 85 ? '#eab308' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
        {batter.zoneContact.toFixed(1)}%
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#d1d5db', fontSize: 12 }}>
        {batter.firstPitchSwingPct.toFixed(1)}%
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: batter.twoStrikeApproach >= 75 ? '#22c55e' : batter.twoStrikeApproach >= 55 ? '#eab308' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
        {batter.twoStrikeApproach}
      </td>
    </tr>
  );
}

export default function BattingApproachView() {
  const batters = useMemo(() => generateDemoBattingApproach(), []);
  const summary = useMemo(() => getApproachSummary(batters), [batters]);
  const [selected, setSelected] = useState<BatterApproach | null>(null);
  const [sortKey, setSortKey] = useState<'approachIndex' | 'chaseRate' | 'zoneContact'>('approachIndex');

  const sorted = useMemo(() => {
    const copy = [...batters];
    if (sortKey === 'approachIndex') copy.sort((a, b) => b.approachIndex - a.approachIndex);
    else if (sortKey === 'chaseRate') copy.sort((a, b) => a.chaseRate - b.chaseRate);
    else copy.sort((a, b) => b.zoneContact - a.zoneContact);
    return copy;
  }, [batters, sortKey]);

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        BATTING APPROACH INDEX
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>SELECTIVITY & DISCIPLINE ANALYSIS</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'AVG INDEX', value: summary.avgIndex.toFixed(1), color: '#f59e0b' },
          { label: 'ELITE', value: String(summary.eliteCount), color: '#22c55e' },
          { label: 'POOR', value: String(summary.poorCount), color: '#ef4444' },
          { label: 'AVG CHASE%', value: summary.avgChaseRate.toFixed(1) + '%', color: '#eab308' },
          { label: 'AVG ZONE CT%', value: summary.avgZoneContact.toFixed(1) + '%', color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sort Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([
          { key: 'approachIndex' as const, label: 'APPROACH IDX' },
          { key: 'chaseRate' as const, label: 'CHASE RATE' },
          { key: 'zoneContact' as const, label: 'ZONE CONTACT' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setSortKey(tab.key)}
            style={{
              padding: '4px 14px',
              fontSize: 10,
              fontFamily: 'monospace',
              background: sortKey === tab.key ? '#f59e0b' : '#111827',
              color: sortKey === tab.key ? '#030712' : '#6b7280',
              border: '1px solid #374151',
              cursor: 'pointer',
              fontWeight: sortKey === tab.key ? 700 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Table */}
        <div style={{ flex: '1 1 580px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Batter</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>IDX</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Grade</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Chase%</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Zone CT%</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>1st P Sw%</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>2K App</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(b => (
                <ApproachCard
                  key={b.playerId}
                  batter={b}
                  isSelected={selected?.playerId === b.playerId}
                  onSelect={() => setSelected(b)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>
                    {selected.name}
                    <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
                      Bats: {selected.bats}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: selected.approachIndex >= 80 ? '#22c55e' :
                           selected.approachIndex >= 65 ? '#3b82f6' :
                           selected.approachIndex >= 45 ? '#eab308' :
                           selected.approachIndex >= 30 ? '#f97316' : '#ef4444',
                  }}>
                    {selected.approachIndex}
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>APPROACH IDX</div>
                </div>
              </div>

              {/* Metric Bars */}
              <div style={{ marginBottom: 14 }}>
                {selected.metrics.map(m => (
                  <PercentileBar key={m.label} metric={m} />
                ))}
              </div>

              {/* Strength & Weakness */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '8px 10px', background: '#22c55e11', border: '1px solid #22c55e33' }}>
                  <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, marginBottom: 3 }}>STRENGTH</div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>{selected.strength}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', background: '#ef444411', border: '1px solid #ef444433' }}>
                  <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>WEAKNESS</div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>{selected.weakness}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a batter to view approach breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
