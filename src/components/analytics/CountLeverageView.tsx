import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoCountLeverage,
  leverageHeatColor,
  leverageHeatBg,
  ADVANTAGE_DISPLAY,
  type CountLeverageData,
  type CountCell,
} from '../../engine/analytics/countLeverageHeatmap';

// ── Cell Component ──────────────────────────────────────────────────────────

function HeatCell({ cell }: { cell: CountCell }) {
  const advInfo = ADVANTAGE_DISPLAY[cell.avgResult];
  const levColor = leverageHeatColor(cell.avgLeverage);
  const levBg = leverageHeatBg(cell.avgLeverage);

  return (
    <div style={{
      border: '1px solid #1f2937',
      backgroundColor: levBg,
      padding: '8px',
      fontFamily: 'monospace',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* Count label */}
      <div style={{
        fontSize: '9px',
        color: '#6b7280',
        marginBottom: '4px',
        fontWeight: 'bold',
      }}>
        {cell.balls}-{cell.strikes}
      </div>

      {/* Leverage value */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: levColor,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: '1.1',
      }}>
        {cell.avgLeverage.toFixed(2)}
      </div>
      <div style={{ fontSize: '8px', color: '#4b5563', marginBottom: '4px' }}>LI</div>

      {/* Run Expectancy */}
      <div style={{
        fontSize: '11px',
        color: '#d1d5db',
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {cell.runExpectancy.toFixed(3)}
      </div>
      <div style={{ fontSize: '8px', color: '#4b5563', marginBottom: '4px' }}>RE</div>

      {/* Swing % */}
      <div style={{ fontSize: '10px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
        {cell.swingPct}% swing
      </div>

      {/* Advantage badge */}
      <div style={{
        marginTop: '4px',
        padding: '1px 4px',
        fontSize: '8px',
        fontWeight: 'bold',
        borderRadius: '2px',
        backgroundColor: advInfo.color + '22',
        color: advInfo.color,
        display: 'inline-block',
      }}>
        {advInfo.abbr}
      </div>

      {/* Sample size */}
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '4px',
        fontSize: '7px',
        color: '#374151',
      }}>
        n={cell.sampleSize}
      </div>
    </div>
  );
}

// ── Matrix Grid ─────────────────────────────────────────────────────────────

function CountMatrix({ data }: { data: CountLeverageData }) {
  return (
    <div>
      {/* Column headers (strikes) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px repeat(3, 1fr)',
        gap: '2px',
        marginBottom: '2px',
      }}>
        <div style={{ fontSize: '9px', color: '#4b5563', fontFamily: 'monospace', textAlign: 'center' }} />
        {[0, 1, 2].map(s => (
          <div key={s} style={{
            fontSize: '9px',
            color: '#f59e0b',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontWeight: 'bold',
            padding: '2px 0',
          }}>
            {s} STR
          </div>
        ))}
      </div>

      {/* Grid rows (balls) */}
      {[0, 1, 2, 3].map(b => (
        <div key={b} style={{
          display: 'grid',
          gridTemplateColumns: '40px repeat(3, 1fr)',
          gap: '2px',
          marginBottom: '2px',
        }}>
          {/* Row header */}
          <div style={{
            fontSize: '9px',
            color: '#f59e0b',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {b} BALL
          </div>
          {/* Cells */}
          {[0, 1, 2].map(s => {
            const cell = data.matrix.find(c => c.balls === b && c.strikes === s);
            return cell ? <HeatCell key={`${b}-${s}`} cell={cell} /> : null;
          })}
        </div>
      ))}
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const levels = [
    { label: '< 0.7', color: '#22c55e' },
    { label: '0.7-1.0', color: '#a3e635' },
    { label: '1.0-1.5', color: '#eab308' },
    { label: '1.5-2.0', color: '#f59e0b' },
    { label: '2.0-2.5', color: '#f97316' },
    { label: '2.5+', color: '#ef4444' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '9px',
      fontFamily: 'monospace',
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#6b7280', fontWeight: 'bold' }}>LEVERAGE:</span>
      {levels.map(l => (
        <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: l.color + '44',
            border: `1px solid ${l.color}`,
          }} />
          <span style={{ color: '#9ca3af' }}>{l.label}</span>
        </span>
      ))}
      <span style={{ color: '#6b7280', marginLeft: '8px' }}>|</span>
      {Object.values(ADVANTAGE_DISPLAY).map(a => (
        <span key={a.abbr} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: a.color + '44',
            border: `1px solid ${a.color}`,
          }} />
          <span style={{ color: '#9ca3af' }}>{a.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CountLeverageView() {
  const { gameStarted } = useGameStore();
  const [situations] = useState<CountLeverageData[]>(() => generateDemoCountLeverage());
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!gameStarted) {
    return (
      <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>
        Start a game first.
      </div>
    );
  }

  const current = situations[selectedIdx];

  // Compute summary stats for this situation
  const maxLev = Math.max(...current.matrix.map(c => c.avgLeverage));
  const minLev = Math.min(...current.matrix.map(c => c.avgLeverage));
  const avgLev = current.matrix.reduce((s, c) => s + c.avgLeverage, 0) / current.matrix.length;
  const hitterCells = current.matrix.filter(c => c.avgResult === 'hitter_advantage').length;
  const pitcherCells = current.matrix.filter(c => c.avgResult === 'pitcher_advantage').length;

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px',
        padding: '8px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #f59e0b',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f59e0b',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>COUNT LEVERAGE HEATMAP</span>
        <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: 'normal', letterSpacing: '0' }}>
          BALL-STRIKE LEVERAGE ANALYSIS
        </span>
      </div>

      {/* Situation selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '12px',
      }}>
        {situations.map((sit, idx) => (
          <button
            key={sit.situation}
            onClick={() => setSelectedIdx(idx)}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: idx === selectedIdx ? '#f59e0b' : '#1f2937',
              color: idx === selectedIdx ? '#030712' : '#9ca3af',
            }}
          >
            {sit.situation}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {[
          { label: 'MAX LEVERAGE', value: maxLev.toFixed(2), color: leverageHeatColor(maxLev) },
          { label: 'MIN LEVERAGE', value: minLev.toFixed(2), color: leverageHeatColor(minLev) },
          { label: 'AVG LEVERAGE', value: avgLev.toFixed(2), color: '#f59e0b' },
          { label: 'HITTER COUNTS', value: String(hitterCells), color: '#22c55e' },
          { label: 'PITCHER COUNTS', value: String(pitcherCells), color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{
            border: '1px solid #1f2937',
            padding: '8px 12px',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: s.color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{
        padding: '8px 12px',
        marginBottom: '12px',
        border: '1px solid #1f2937',
        backgroundColor: '#0a0f1a',
        fontSize: '11px',
        color: '#9ca3af',
        lineHeight: '1.5',
      }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{current.situation}:</span>{' '}
        {current.description}
      </div>

      {/* The heatmap grid */}
      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#030712',
        padding: '12px',
        marginBottom: '12px',
      }}>
        <CountMatrix data={current} />
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 12px',
        border: '1px solid #1f2937',
        backgroundColor: '#0a0f1a',
      }}>
        <Legend />
      </div>
    </div>
  );
}
