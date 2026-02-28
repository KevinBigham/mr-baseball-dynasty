import { useState } from 'react';
import { generateDemoBullpenMatchup, getSplitColor, getKRateColor, type RelieverMatchup } from '../../engine/pitching/bullpenMatchupMatrix';

const data = generateDemoBullpenMatchup();

export default function BullpenMatchupMatrixView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const reliever = data.relievers[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>BULLPEN MATCHUP MATRIX</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Reliever performance vs handedness, lineup spots, and leverage situations</p>
      </div>

      {/* Reliever selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.relievers.map((r, i) => (
          <button key={r.pitcherId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {r.name} ({r.throws})
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'ROLE', value: reliever.role, color: '#f59e0b' },
          { label: 'ERA', value: reliever.overall.era.toFixed(2), color: reliever.overall.era <= 2.50 ? '#22c55e' : reliever.overall.era <= 3.50 ? '#f59e0b' : '#ef4444' },
          { label: 'WHIP', value: reliever.overall.whip.toFixed(2), color: reliever.overall.whip <= 1.00 ? '#22c55e' : reliever.overall.whip <= 1.20 ? '#f59e0b' : '#ef4444' },
          { label: 'K/9', value: reliever.overall.kPer9.toFixed(1), color: reliever.overall.kPer9 >= 10 ? '#22c55e' : '#f59e0b' },
          { label: 'IP', value: reliever.overall.ip.toFixed(1), color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Split and high-leverage */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>HANDEDNESS SPLITS</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'vs LHB', split: reliever.vsLHB },
              { label: 'vs RHB', split: reliever.vsRHB },
            ].map(({ label, split }) => (
              <div key={label} style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>{label} ({split.pa} PA)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'AVG', value: split.avg.toFixed(3), color: split.avg <= .200 ? '#22c55e' : split.avg <= .250 ? '#f59e0b' : '#ef4444' },
                    { label: 'OPS', value: split.ops.toFixed(3), color: getSplitColor(split.ops) },
                    { label: 'K%', value: `${split.k_pct.toFixed(1)}%`, color: getKRateColor(split.k_pct) },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* High leverage */}
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>HIGH LEVERAGE</div>
          <div style={{ padding: 10, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { label: 'PA', value: String(reliever.highLeverage.pa), color: '#e5e7eb' },
                { label: 'AVG', value: reliever.highLeverage.avg.toFixed(3), color: reliever.highLeverage.avg <= .200 ? '#22c55e' : '#f59e0b' },
                { label: 'ERA', value: reliever.highLeverage.era.toFixed(2), color: reliever.highLeverage.era <= 2.50 ? '#22c55e' : '#f59e0b' },
                { label: 'K%', value: `${reliever.highLeverage.kRate.toFixed(1)}%`, color: getKRateColor(reliever.highLeverage.kRate) },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Best/worst matchup */}
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>BEST: </span>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{reliever.bestMatchup}</span>
            </div>
            <div style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
              <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>WORST: </span>
              <span style={{ fontSize: 10, color: '#e5e7eb' }}>{reliever.worstMatchup}</span>
            </div>
          </div>
        </div>

        {/* Lineup spot matrix */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>BY LINEUP SPOT — {reliever.name}</div>
          {reliever.byLineupSpot.map(spot => (
            <div key={spot.spot} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 20, fontSize: 10, color: '#6b7280', fontWeight: 700, textAlign: 'right' }}>#{spot.spot}</div>
              <div style={{ flex: 1, height: 16, background: '#1f2937', borderRadius: 2, position: 'relative' as const }}>
                <div style={{ width: `${Math.min(spot.ops * 100, 100)}%`, height: '100%', borderRadius: 2, background: getSplitColor(spot.ops) + 'aa' }} />
              </div>
              <div style={{ width: 40, fontSize: 10, color: '#e5e7eb', fontWeight: 700, textAlign: 'right' }}>{spot.avg.toFixed(3)}</div>
              <div style={{ width: 40, fontSize: 10, color: getSplitColor(spot.ops), fontWeight: 700, textAlign: 'right' }}>{spot.ops.toFixed(3)}</div>
              <div style={{ width: 24, fontSize: 9, color: '#6b7280', textAlign: 'right' }}>{spot.pa}</div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, fontSize: 9, color: '#6b7280' }}>
            <span>AVG</span><span>OPS</span><span>PA</span>
          </div>
        </div>
      </div>

      {/* All relievers comparison */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          BULLPEN OVERVIEW (Team ERA: {data.teamBullpenERA} | WHIP: {data.teamBullpenWHIP})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['PITCHER', 'T', 'ROLE', 'ERA', 'WHIP', 'K/9', 'vsL OPS', 'vsR OPS', 'Hi-LEV ERA'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PITCHER' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.relievers.map((r, i) => (
              <tr key={r.pitcherId} onClick={() => setSelectedIdx(i)}
                style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedIdx ? '#1f2937' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: r.throws === 'L' ? '#3b82f6' : '#9ca3af' }}>{r.throws}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b', fontSize: 10 }}>{r.role}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: r.overall.era <= 2.50 ? '#22c55e' : r.overall.era <= 3.50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{r.overall.era.toFixed(2)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{r.overall.whip.toFixed(2)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: r.overall.kPer9 >= 10 ? '#22c55e' : '#f59e0b' }}>{r.overall.kPer9.toFixed(1)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: getSplitColor(r.vsLHB.ops), fontWeight: 700 }}>{r.vsLHB.ops.toFixed(3)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: getSplitColor(r.vsRHB.ops), fontWeight: 700 }}>{r.vsRHB.ops.toFixed(3)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: r.highLeverage.era <= 2.50 ? '#22c55e' : r.highLeverage.era <= 3.50 ? '#f59e0b' : '#ef4444' }}>{r.highLeverage.era.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
