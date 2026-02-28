import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoRevenueProjections,
  STREAM_LABELS,
  STREAM_COLORS,
  type RevenueProjectionData,
  type StreamProjection,
  type RevenueStream,
} from '../../engine/finance/revenueProjections';

const DEMO_DATA = generateDemoRevenueProjections();

function GrowthIndicator({ rate }: { rate: number }) {
  const isPositive = rate >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const arrow = isPositive ? '\u25B2' : '\u25BC';
  return (
    <span style={{ color, fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}>
      {arrow} {Math.abs(rate).toFixed(1)}%
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? '#22c55e' : confidence >= 60 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '50px', height: '4px', backgroundColor: '#1f2937',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${confidence}%`, height: '100%',
          backgroundColor: color, borderRadius: '2px',
        }} />
      </div>
      <span style={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace' }}>
        {confidence}%
      </span>
    </div>
  );
}

function StreamRow({ sp }: { sp: StreamProjection }) {
  const nextYear = sp.projections.find(p => p.season === 2027);
  const projected = nextYear ? nextYear.projected : sp.current;
  const delta = projected - sp.current;
  const deltaColor = delta >= 0 ? '#22c55e' : '#ef4444';
  const streamColor = STREAM_COLORS[sp.stream];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px 70px',
      alignItems: 'center', padding: '8px 12px',
      borderBottom: '1px solid #111827',
      fontFamily: 'monospace', fontSize: '11px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '2px',
          backgroundColor: streamColor,
        }} />
        <span style={{ color: '#d1d5db' }}>
          {STREAM_LABELS[sp.stream]}
        </span>
      </div>
      <span style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>
        ${sp.current.toFixed(1)}M
      </span>
      <span style={{ textAlign: 'right', color: '#9ca3af' }}>
        ${projected.toFixed(1)}M
      </span>
      <span style={{ textAlign: 'right', color: deltaColor, fontWeight: 'bold' }}>
        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}M
      </span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <GrowthIndicator rate={sp.growthRate} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ConfidenceBar confidence={sp.confidence} />
      </div>
    </div>
  );
}

function ProjectionTimeline({ streams }: { streams: StreamProjection[] }) {
  // Show total projections by year across all streams
  const years = streams[0]?.projections.map(p => p.season) ?? [];

  return (
    <div style={{
      border: '1px solid #1f2937', borderRadius: '4px',
      backgroundColor: '#030712', overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #1f2937',
        color: '#6b7280', fontSize: '10px', fontWeight: 'bold',
        fontFamily: 'monospace', letterSpacing: '0.05em',
      }}>
        YEARLY TOTAL PROJECTIONS
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${years.length}, 1fr)`,
        gap: '1px', padding: '8px 12px',
      }}>
        {years.map(year => {
          const total = streams.reduce((sum, st) => {
            const proj = st.projections.find(p => p.season === year);
            return sum + (proj ? proj.projected : 0);
          }, 0);
          const hasActual = streams.some(st =>
            st.projections.find(p => p.season === year && p.actual !== undefined),
          );
          return (
            <div key={year} style={{ textAlign: 'center', fontFamily: 'monospace' }}>
              <div style={{ color: '#4b5563', fontSize: '10px', marginBottom: '4px' }}>
                {year}
              </div>
              <div style={{
                color: hasActual ? '#f59e0b' : '#9ca3af',
                fontWeight: 'bold', fontSize: '12px',
              }}>
                ${total.toFixed(0)}M
              </div>
              {hasActual && (
                <div style={{ color: '#6b7280', fontSize: '9px', marginTop: '2px' }}>
                  ACTUAL
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{
      border: '1px solid #1f2937', borderRadius: '4px',
      padding: '10px 14px', textAlign: 'center',
      backgroundColor: '#030712',
    }}>
      <div style={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        color: color ?? '#f59e0b', fontWeight: 'bold', fontSize: '18px',
        fontFamily: 'monospace',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: '#4b5563', fontSize: '10px', fontFamily: 'monospace', marginTop: '2px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function RevenueProjectionsView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<RevenueProjectionData[]>(DEMO_DATA);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

  const team = data[selectedIdx];
  if (!team) return null;

  const revChange = team.totalProjected - team.totalCurrent;
  const revChangePct = ((revChange / team.totalCurrent) * 100).toFixed(1);
  const revChangeColor = revChange >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px', padding: '8px 32px',
        backgroundColor: '#111827', borderBottom: '1px solid #f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>
          REVENUE PROJECTIONS
        </span>
        <span style={{ color: '#4b5563', fontSize: '10px' }}>
          {data.length} TEAMS
        </span>
      </div>

      {/* Team selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {data.map((t, i) => (
          <button
            key={t.teamId}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
              borderRadius: '4px', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace',
              backgroundColor: i === selectedIdx ? '#f59e0b' : '#1f2937',
              color: i === selectedIdx ? '#000' : '#9ca3af',
            }}
          >
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <SummaryCard
          label="CURRENT REVENUE"
          value={`$${team.totalCurrent.toFixed(0)}M`}
        />
        <SummaryCard
          label="PROJECTED (NEXT SZN)"
          value={`$${team.totalProjected.toFixed(0)}M`}
          sub={`${revChange >= 0 ? '+' : ''}${revChangePct}%`}
          color={revChangeColor}
        />
        <SummaryCard
          label="MARKET RANK"
          value={`#${team.marketRank}`}
          sub="OF 30 TEAMS"
          color="#d1d5db"
        />
        <SummaryCard
          label="AVG ATTENDANCE"
          value={team.attendanceAvg.toLocaleString()}
          sub="PER GAME"
          color="#d1d5db"
        />
      </div>

      {/* Stream breakdown */}
      <div style={{
        border: '1px solid #1f2937', borderRadius: '4px',
        backgroundColor: '#030712', overflow: 'hidden', marginBottom: '16px',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px 70px',
          padding: '8px 12px', borderBottom: '1px solid #1f2937',
          fontFamily: 'monospace', fontSize: '10px', color: '#6b7280', fontWeight: 'bold',
        }}>
          <span>STREAM</span>
          <span style={{ textAlign: 'right' }}>CURRENT</span>
          <span style={{ textAlign: 'right' }}>PROJ</span>
          <span style={{ textAlign: 'right' }}>DELTA</span>
          <span style={{ textAlign: 'right' }}>GROWTH</span>
          <span style={{ textAlign: 'right' }}>CONF</span>
        </div>
        {team.streams.map(sp => (
          <StreamRow key={sp.stream} sp={sp} />
        ))}
        {/* Totals row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px 70px',
          alignItems: 'center', padding: '10px 12px',
          borderTop: '2px solid #f59e0b33',
          fontFamily: 'monospace', fontSize: '11px',
          backgroundColor: '#0a0f1a',
        }}>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>TOTAL</span>
          <span style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>
            ${team.totalCurrent.toFixed(1)}M
          </span>
          <span style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>
            ${team.totalProjected.toFixed(1)}M
          </span>
          <span style={{
            textAlign: 'right', color: revChangeColor, fontWeight: 'bold',
          }}>
            {revChange >= 0 ? '+' : ''}{revChange.toFixed(1)}M
          </span>
          <span />
          <span />
        </div>
      </div>

      {/* Timeline */}
      <ProjectionTimeline streams={team.streams} />
    </div>
  );
}
