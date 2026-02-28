import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  REGION_DISPLAY,
  getEfficiencyGrade,
  getHitRateColor,
  getScoutBudgetSummary,
  generateDemoScoutBudget,
  type ScoutBudgetData,
  type ScoutAllocation,
} from '../../engine/management/scoutingBudgetAllocation';

/* ── Inline helpers ─────────────────────────────────────────────── */

function BudgetBar({ allocation, totalBudget }: { allocation: ScoutAllocation; totalBudget: number }) {
  const region = REGION_DISPLAY[allocation.region];
  const pct = (allocation.budget / totalBudget) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontFamily: 'monospace' }}>
      <span style={{ width: 50, color: region.color, fontWeight: 700 }}>{region.abbrev}</span>
      <div style={{ flex: 1, height: 14, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: region.color,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 9,
            color: '#e5e7eb',
            fontWeight: 700,
          }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
      <span style={{ width: 48, textAlign: 'right', color: '#d1d5db', fontWeight: 700 }}>
        ${allocation.budget.toFixed(1)}M
      </span>
    </div>
  );
}

function HitRateDot({ rate }: { rate: number }) {
  const color = getHitRateColor(rate);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
      <span style={{ color, fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>{rate.toFixed(1)}%</span>
    </div>
  );
}

function AllocationRow({ alloc, totalBudget }: { alloc: ScoutAllocation; totalBudget: number }) {
  const region = REGION_DISPLAY[alloc.region];
  const budgetPct = ((alloc.budget / totalBudget) * 100).toFixed(1);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 68px 48px 64px 80px 1fr',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(31,41,55,0.5)',
        fontSize: 11,
        fontFamily: 'monospace',
      }}
    >
      {/* Region */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: region.color, opacity: 0.8 }} />
        <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{region.label}</span>
      </div>
      {/* Budget */}
      <span style={{ color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}>
        ${alloc.budget.toFixed(1)}M
      </span>
      {/* Scouts */}
      <span style={{ color: '#9ca3af', textAlign: 'right' }}>{alloc.scouts}</span>
      {/* Prospects found */}
      <span style={{ color: '#d1d5db', fontWeight: 700, textAlign: 'right' }}>{alloc.prospectsFound}</span>
      {/* Hit rate */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <HitRateDot rate={alloc.hitRate} />
      </div>
      {/* Top find */}
      <div style={{ paddingLeft: 12 }}>
        <span style={{ color: '#6b7280', fontSize: 9 }}>TOP: </span>
        <span style={{ color: '#fdba74', fontSize: 10 }}>{alloc.topFind}</span>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function ScoutBudgetView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<ScoutBudgetData>(() => generateDemoScoutBudget());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getScoutBudgetSummary(data);
  const effGrade = getEfficiencyGrade(data.efficiency);

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', color: '#e5e7eb', backgroundColor: '#030712' }}>
      {/* Header */}
      <div
        style={{
          margin: '-16px -16px 16px -16px',
          padding: '8px 32px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
          SCOUTING BUDGET ALLOCATION
        </span>
        <span style={{ color: '#4b5563', fontSize: 10 }}>{data.teamName.toUpperCase()}</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center', backgroundColor: '#111827' }}>
          <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700 }}>TOTAL BUDGET</div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>{summary.totalBudget}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center', backgroundColor: '#111827' }}>
          <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700 }}>SCOUTS</div>
          <div style={{ color: '#d1d5db', fontWeight: 700, fontSize: 18 }}>{summary.totalScouts}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center', backgroundColor: '#111827' }}>
          <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700 }}>PROSPECTS</div>
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18 }}>{summary.totalProspects}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center', backgroundColor: '#111827' }}>
          <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700 }}>AVG HIT RATE</div>
          <div style={{ color: getHitRateColor(summary.avgHitRate), fontWeight: 700, fontSize: 18 }}>
            {summary.avgHitRate}%
          </div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center', backgroundColor: '#111827' }}>
          <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700 }}>LEAGUE RANK</div>
          <div style={{ color: data.leagueRank <= 10 ? '#22c55e' : data.leagueRank <= 20 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: 18 }}>
            #{data.leagueRank}
          </div>
        </div>
      </div>

      {/* Efficiency score */}
      <div style={{ border: '1px solid #1f2937', padding: '10px 16px', backgroundColor: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>EFFICIENCY SCORE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: effGrade.color }}>{data.efficiency}</span>
            <span style={{ fontSize: 11, color: effGrade.color, fontWeight: 700 }}>{effGrade.label}</span>
          </div>
        </div>
        <div style={{ flex: 1, height: 10, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${data.efficiency}%`,
              height: '100%',
              borderRadius: 4,
              background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: '#6b7280' }}>/100</span>
      </div>

      {/* Budget allocation bars (pie-style) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 8 }}>BUDGET ALLOCATION BY REGION</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.allocations.map(a => (
            <BudgetBar key={a.region} allocation={a} totalBudget={data.totalBudget} />
          ))}
        </div>
      </div>

      {/* Regional allocation table */}
      <div style={{ border: '1px solid #1f2937', backgroundColor: '#111827' }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 68px 48px 64px 80px 1fr',
            padding: '6px 12px',
            borderBottom: '1px solid #1f2937',
            fontSize: 9,
            fontWeight: 700,
            color: '#6b7280',
            backgroundColor: '#0a0f1a',
          }}
        >
          <span>REGION</span>
          <span style={{ textAlign: 'right' }}>BUDGET</span>
          <span style={{ textAlign: 'right' }}>SCOUTS</span>
          <span style={{ textAlign: 'right' }}>FOUND</span>
          <span style={{ textAlign: 'right' }}>HIT RATE</span>
          <span style={{ paddingLeft: 12 }}>TOP FIND</span>
        </div>

        {/* Rows */}
        {data.allocations.map(a => (
          <AllocationRow key={a.region} alloc={a} totalBudget={data.totalBudget} />
        ))}
      </div>

      {/* Top finds highlight */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 8 }}>TOP FINDS BY REGION</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {data.allocations
            .sort((a, b) => b.hitRate - a.hitRate)
            .slice(0, 3)
            .map(a => {
              const region = REGION_DISPLAY[a.region];
              return (
                <div
                  key={a.region}
                  style={{
                    border: '1px solid #1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#111827',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: region.color }} />
                    <span style={{ color: region.color, fontWeight: 700, fontSize: 10 }}>{region.label}</span>
                  </div>
                  <div style={{ color: '#fdba74', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
                    {a.topFind}
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>
                    Hit Rate: <span style={{ color: getHitRateColor(a.hitRate), fontWeight: 700 }}>{a.hitRate}%</span>
                    {' | '}
                    {a.prospectsFound} prospects found
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
