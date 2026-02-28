import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoHOFMonitor,
  STATUS_DISPLAY,
  type HOFCandidate,
  type HOFMetric,
  type CareerHighlight,
} from '../../engine/history/hofMonitor';

const DEMO_DATA = generateDemoHOFMonitor();

function StatusBadge({ status }: { status: HOFCandidate['status'] }) {
  const display = STATUS_DISPLAY[status];
  return (
    <span style={{
      padding: '2px 8px', fontSize: '10px', fontWeight: 'bold',
      borderRadius: '3px', fontFamily: 'monospace',
      backgroundColor: display.color + '22',
      color: display.color,
      border: `1px solid ${display.color}44`,
    }}>
      {display.label}
    </span>
  );
}

function MetricBar({ metric }: { metric: HOFMetric }) {
  const pct = Math.min(metric.pctOfThreshold, 150);
  const barWidth = Math.min(pct, 100);
  const overflowWidth = pct > 100 ? Math.min(pct - 100, 50) : 0;

  const color = pct >= 100 ? '#22c55e' : pct >= 70 ? '#eab308' : pct >= 40 ? '#f97316' : '#ef4444';

  // Format value: detect if this is a rate stat (AVG, WHIP) vs counting stat
  const isRate = metric.label === 'AVG' || metric.label === 'WHIP';
  const displayValue = isRate
    ? `.${metric.value}`
    : metric.label === 'Career WAR' || metric.label === 'OPS+' || metric.label === 'ERA+'
      ? metric.value.toFixed(1)
      : metric.value.toString();

  const displayThreshold = isRate
    ? `.${metric.threshold}`
    : metric.threshold.toString();

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '3px',
      }}>
        <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'monospace' }}>
          {metric.label}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
          <span style={{ color: color, fontWeight: 'bold' }}>{displayValue}</span>
          <span style={{ color: '#4b5563' }}> / {displayThreshold}</span>
          <span style={{ color: '#6b7280', marginLeft: '6px' }}>({metric.pctOfThreshold}%)</span>
        </span>
      </div>
      <div style={{
        width: '100%', height: '6px', backgroundColor: '#1f2937',
        borderRadius: '3px', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${barWidth}%`, height: '100%',
          backgroundColor: color, borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
        {overflowWidth > 0 && (
          <div style={{
            position: 'absolute', top: 0, left: '100%',
            transform: `translateX(-${overflowWidth}%)`,
            width: `${overflowWidth / 1.5}%`, height: '100%',
            backgroundColor: '#22c55e88', borderRadius: '0 3px 3px 0',
          }} />
        )}
      </div>
    </div>
  );
}

function HighlightTimeline({ highlights }: { highlights: CareerHighlight[] }) {
  if (highlights.length === 0) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        color: '#6b7280', fontSize: '10px', fontWeight: 'bold',
        fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em',
      }}>
        CAREER HIGHLIGHTS
      </div>
      <div style={{
        borderLeft: '2px solid #374151', paddingLeft: '12px',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {highlights.map((h, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: '-17px', top: '50%', transform: 'translateY(-50%)',
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#f59e0b', border: '2px solid #030712',
            }} />
            <span style={{ color: '#f59e0b', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', minWidth: '28px' }}>
              {h.season}
            </span>
            <span style={{ color: '#d1d5db', fontSize: '10px', fontFamily: 'monospace' }}>
              {h.achievement}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparablesList({ comparables }: { comparables: string[] }) {
  if (comparables.length === 0) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        color: '#6b7280', fontSize: '10px', fontWeight: 'bold',
        fontFamily: 'monospace', marginBottom: '4px', letterSpacing: '0.05em',
      }}>
        COMPARABLE HOF PLAYERS
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {comparables.map(name => (
          <span key={name} style={{
            padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
            backgroundColor: '#1f2937', color: '#9ca3af',
            borderRadius: '3px', border: '1px solid #374151',
          }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, isExpanded, onToggle }: {
  candidate: HOFCandidate;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const probColor = candidate.hofProbability >= 80 ? '#22c55e'
    : candidate.hofProbability >= 50 ? '#eab308'
    : candidate.hofProbability >= 20 ? '#f97316'
    : '#ef4444';

  return (
    <div style={{
      border: '1px solid #1f2937', borderRadius: '4px',
      backgroundColor: '#030712', overflow: 'hidden',
    }}>
      {/* Header row (clickable) */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '12px 16px', border: 'none',
          backgroundColor: 'transparent', cursor: 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Probability circle */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: `2px solid ${probColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', backgroundColor: `${probColor}11`,
          }}>
            <span style={{
              color: probColor, fontWeight: 'bold', fontSize: '14px',
              fontFamily: 'monospace', lineHeight: 1,
            }}>
              {candidate.hofProbability}
            </span>
            <span style={{ color: '#6b7280', fontSize: '7px', fontFamily: 'monospace' }}>
              %
            </span>
          </div>
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
              {candidate.name}
            </div>
            <div style={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace' }}>
              {candidate.position} | Age {candidate.age} | {candidate.yearsPlayed} yrs
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#4b5563', fontSize: '9px', fontFamily: 'monospace' }}>HOF SCORE</div>
            <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
              {candidate.hofScore}
            </div>
          </div>
          <StatusBadge status={candidate.status} />
          <span style={{
            color: '#6b7280', fontSize: '14px',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease', display: 'inline-block',
          }}>
            {'\u25BC'}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{
          padding: '0 16px 16px', borderTop: '1px solid #1f2937',
        }}>
          {/* Metrics */}
          <div style={{ marginTop: '12px' }}>
            <div style={{
              color: '#6b7280', fontSize: '10px', fontWeight: 'bold',
              fontFamily: 'monospace', marginBottom: '8px', letterSpacing: '0.05em',
            }}>
              HOF METRIC THRESHOLDS
            </div>
            {candidate.metrics.map(m => (
              <MetricBar key={m.label} metric={m} />
            ))}
          </div>

          {/* Two-column bottom: highlights + comparables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
            <HighlightTimeline highlights={candidate.highlights} />
            <ComparablesList comparables={candidate.comparables} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HOFMonitorView() {
  const { gameStarted } = useGameStore();
  const [candidates] = useState<HOFCandidate[]>(DEMO_DATA);
  const [expandedId, setExpandedId] = useState<number | null>(DEMO_DATA[0]?.playerId ?? null);
  const [statusFilter, setStatusFilter] = useState<HOFCandidate['status'] | 'all'>('all');

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

  const filtered = statusFilter === 'all'
    ? candidates
    : candidates.filter(c => c.status === statusFilter);

  const statuses: Array<HOFCandidate['status'] | 'all'> = ['all', 'lock', 'likely', 'borderline', 'longshot', 'no_chance'];

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px', padding: '8px 32px',
        backgroundColor: '#111827', borderBottom: '1px solid #f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>
          HALL OF FAME MONITOR
        </span>
        <span style={{ color: '#4b5563', fontSize: '10px' }}>
          {candidates.length} CANDIDATES
        </span>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
        marginBottom: '16px',
      }}>
        {(['lock', 'likely', 'borderline', 'longshot', 'no_chance'] as const).map(s => {
          const count = candidates.filter(c => c.status === s).length;
          const display = STATUS_DISPLAY[s];
          return (
            <div key={s} style={{
              border: '1px solid #1f2937', borderRadius: '4px',
              padding: '8px', textAlign: 'center', backgroundColor: '#030712',
            }}>
              <div style={{ color: display.color, fontWeight: 'bold', fontSize: '18px', fontFamily: 'monospace' }}>
                {count}
              </div>
              <div style={{ color: '#6b7280', fontSize: '9px', fontFamily: 'monospace' }}>
                {display.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const label = s === 'all' ? 'ALL' : STATUS_DISPLAY[s].label;
          const isActive = statusFilter === s;
          const btnColor = s === 'all' ? '#f59e0b' : STATUS_DISPLAY[s].color;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '3px 10px', fontSize: '10px', fontWeight: 'bold',
                borderRadius: '3px', border: 'none', cursor: 'pointer',
                fontFamily: 'monospace',
                backgroundColor: isActive ? btnColor : '#1f2937',
                color: isActive ? '#000' : '#6b7280',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Candidate list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(c => (
          <CandidateCard
            key={c.playerId}
            candidate={c}
            isExpanded={expandedId === c.playerId}
            onToggle={() => setExpandedId(expandedId === c.playerId ? null : c.playerId)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            padding: '24px', textAlign: 'center', color: '#4b5563',
            fontSize: '12px', fontFamily: 'monospace',
            border: '1px solid #1f2937', borderRadius: '4px',
          }}>
            No candidates match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
