import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoPitchEffectiveness,
  COUNT_BUCKETS,
  COUNT_LABELS,
  PITCH_LABELS,
  type PitcherCountProfile,
  type CountPitchEffectiveness,
  type CountBucket,
  type PitchTypeLabel,
} from '../../engine/pitching/pitchEffectivenessByCount';

const DEMO_DATA = generateDemoPitchEffectiveness();

type MetricKey = 'whiffRate' | 'csePct' | 'avgEV' | 'xwOBA' | 'putawayRate' | 'usage';

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'whiffRate', label: 'WHIFF%' },
  { key: 'usage', label: 'USAGE%' },
  { key: 'csePct', label: 'CSE%' },
  { key: 'avgEV', label: 'AVG EV' },
  { key: 'xwOBA', label: 'xwOBA' },
  { key: 'putawayRate', label: 'PUTAWAY%' },
];

function getCellColor(metric: MetricKey, value: number): string {
  // Higher is better for whiff, cse, putaway; lower is better for avgEV and xwOBA
  let intensity: number;
  if (metric === 'whiffRate') {
    intensity = Math.min(1, value / 40);
  } else if (metric === 'putawayRate') {
    intensity = Math.min(1, value / 35);
  } else if (metric === 'csePct') {
    intensity = Math.min(1, value / 25);
  } else if (metric === 'usage') {
    intensity = Math.min(1, value / 60);
  } else if (metric === 'avgEV') {
    intensity = Math.min(1, Math.max(0, (95 - value) / 15));
  } else {
    // xwOBA — lower is better
    intensity = Math.min(1, Math.max(0, (0.400 - value) / 0.200));
  }
  const alpha = Math.round(intensity * 60 + 10);
  const hex = alpha.toString(16).padStart(2, '0');
  if (metric === 'avgEV' || metric === 'xwOBA') {
    // Inverted: green = good (low value), red = bad (high value)
    return intensity > 0.5 ? `#22c55e${hex}` : `#ef4444${hex}`;
  }
  return `#f59e0b${hex}`;
}

function formatValue(metric: MetricKey, value: number): string {
  if (metric === 'xwOBA') return value.toFixed(3);
  if (metric === 'avgEV') return `${value.toFixed(1)}`;
  return `${value.toFixed(1)}%`;
}

function EffectivenessMatrix({ profile, metric }: {
  profile: PitcherCountProfile;
  metric: MetricKey;
}) {
  // Group data by pitchType
  const pitchTypes = [...new Set(profile.data.map(d => d.pitchType))];

  const getCell = (pt: PitchTypeLabel, cb: CountBucket): CountPitchEffectiveness | undefined =>
    profile.data.find(d => d.pitchType === pt && d.count === cb);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '11px' }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left', padding: '6px 8px', color: '#6b7280',
              borderBottom: '1px solid #374151', fontSize: '10px',
            }}>
              PITCH
            </th>
            {COUNT_BUCKETS.map(cb => (
              <th key={cb} style={{
                textAlign: 'center', padding: '6px 8px', color: '#6b7280',
                borderBottom: '1px solid #374151', fontSize: '10px', minWidth: '60px',
              }}>
                {COUNT_LABELS[cb]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pitchTypes.map(pt => (
            <tr key={pt}>
              <td style={{
                padding: '6px 8px', color: '#f59e0b', fontWeight: 'bold',
                borderBottom: '1px solid #1f2937',
              }}>
                {pt} <span style={{ color: '#4b5563', fontWeight: 'normal', fontSize: '10px' }}>
                  {PITCH_LABELS[pt]}
                </span>
              </td>
              {COUNT_BUCKETS.map(cb => {
                const cell = getCell(pt, cb);
                if (!cell) {
                  return (
                    <td key={cb} style={{
                      textAlign: 'center', padding: '6px 8px', color: '#374151',
                      borderBottom: '1px solid #1f2937',
                    }}>
                      --
                    </td>
                  );
                }
                const val = cell[metric];
                return (
                  <td key={cb} style={{
                    textAlign: 'center', padding: '6px 8px',
                    backgroundColor: getCellColor(metric, val),
                    color: '#e5e7eb', fontFamily: 'monospace',
                    borderBottom: '1px solid #1f2937',
                  }}>
                    {formatValue(metric, val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PutawayBadge({ profile }: { profile: PitcherCountProfile }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      backgroundColor: '#22c55e18', border: '1px solid #22c55e33',
      borderRadius: '4px', padding: '6px 12px',
    }}>
      <span style={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace' }}>BEST PUTAWAY</span>
      <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
        {profile.bestPutaway.pitchType}
      </span>
      <span style={{ color: '#22c55e', fontSize: '11px', fontFamily: 'monospace' }}>
        {profile.bestPutaway.rate}%
      </span>
    </div>
  );
}

function WorstCountBadge({ profile }: { profile: PitcherCountProfile }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      backgroundColor: '#ef444418', border: '1px solid #ef444433',
      borderRadius: '4px', padding: '6px 12px',
    }}>
      <span style={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace' }}>WORST COUNT</span>
      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
        {COUNT_LABELS[profile.worstCount.bucket]}
      </span>
      <span style={{ color: '#ef4444', fontSize: '11px', fontFamily: 'monospace' }}>
        {profile.worstCount.xwOBA.toFixed(3)} xwOBA
      </span>
    </div>
  );
}

export default function PitchEffectivenessView() {
  const { gameStarted } = useGameStore();
  const [profiles] = useState<PitcherCountProfile[]>(DEMO_DATA);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [metric, setMetric] = useState<MetricKey>('whiffRate');

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

  const active = profiles[selectedIdx];
  if (!active) return null;

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px', padding: '8px 32px',
        backgroundColor: '#111827', borderBottom: '1px solid #f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>
          PITCH EFFECTIVENESS BY COUNT
        </span>
        <span style={{ color: '#4b5563', fontSize: '10px' }}>
          {profiles.length} PITCHERS
        </span>
      </div>

      {/* Pitcher selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {profiles.map((p, i) => (
          <button
            key={p.pitcherId}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
              borderRadius: '4px', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace',
              backgroundColor: i === selectedIdx ? '#f59e0b' : '#1f2937',
              color: i === selectedIdx ? '#000' : '#9ca3af',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {METRIC_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setMetric(opt.key)}
            style={{
              padding: '3px 8px', fontSize: '10px', fontWeight: 'bold',
              borderRadius: '3px', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace',
              backgroundColor: metric === opt.key ? '#374151' : '#111827',
              color: metric === opt.key ? '#f59e0b' : '#6b7280',
              borderWidth: '1px', borderStyle: 'solid',
              borderColor: metric === opt.key ? '#f59e0b' : '#1f2937',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <PutawayBadge profile={active} />
        <WorstCountBadge profile={active} />
      </div>

      {/* Matrix */}
      <div style={{
        border: '1px solid #1f2937', borderRadius: '4px',
        backgroundColor: '#030712', overflow: 'hidden',
      }}>
        <EffectivenessMatrix profile={active} metric={metric} />
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '12px', padding: '8px 12px',
        border: '1px solid #1f2937', borderRadius: '4px',
        backgroundColor: '#0a0a0a',
      }}>
        <div style={{ color: '#4b5563', fontSize: '10px', fontFamily: 'monospace' }}>
          CELL INTENSITY = metric strength | Rows = pitch types | Columns = count situations
        </div>
        <div style={{ color: '#374151', fontSize: '9px', fontFamily: 'monospace', marginTop: '4px' }}>
          AHEAD = pitcher ahead in count | BEHIND = pitcher behind | EVEN = equal balls/strikes |
          2 STR = two-strike counts | FULL = 3-2 | 0-0 = first pitch
        </div>
      </div>
    </div>
  );
}
