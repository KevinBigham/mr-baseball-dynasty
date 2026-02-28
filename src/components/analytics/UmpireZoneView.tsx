import { useState } from 'react';
import { generateDemoUmpireZones, getConsistencyColor, getExpansionLabel, type UmpireProfile, type ZoneArea } from '../../engine/analytics/umpireStrikeZone';

const data = generateDemoUmpireZones();

const ZONE_LABELS: Record<ZoneArea, string> = {
  up_left: 'UP-L', up_mid: 'UP-M', up_right: 'UP-R',
  mid_left: 'MID-L', heart: 'HEART', mid_right: 'MID-R',
  low_left: 'LO-L', low_mid: 'LO-M', low_right: 'LO-R',
  high: 'HIGH', low: 'LOW', inside: 'IN', outside: 'OUT',
};

function diffColor(diff: number): string {
  if (diff > 0.04) return '#ef4444';
  if (diff > 0.01) return '#f59e0b';
  if (diff > -0.01) return '#9ca3af';
  if (diff > -0.04) return '#3b82f6';
  return '#22c55e';
}

export default function UmpireZoneView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const ump = data[selectedIdx];
  const expLabel = getExpansionLabel(ump.zoneExpansion);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>UMPIRE STRIKE ZONE TENDENCIES</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Zone expansion, consistency, and called strike rate analysis</p>
      </div>

      {/* Ump selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((u, i) => (
          <button key={u.umpId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {u.name}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'GAMES', value: String(ump.gamesUmped), color: '#e5e7eb' },
          { label: 'CONSISTENCY', value: String(ump.consistencyScore), color: getConsistencyColor(ump.consistencyScore) },
          { label: 'ZONE', value: expLabel.label, color: expLabel.color },
          { label: 'FAVORS', value: ump.favorsPitcher ? 'PITCHER' : 'HITTER', color: ump.favorsPitcher ? '#3b82f6' : '#22c55e' },
          { label: 'PITCHES/GAME', value: String(ump.avgPitchesPerGame), color: '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Zone grid (3x3 + edges) */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>STRIKE ZONE (CALLED STRIKE RATE vs LEAGUE AVG)</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12, maxWidth: 280 }}>
            {(['up_left', 'up_mid', 'up_right', 'mid_left', 'heart', 'mid_right', 'low_left', 'low_mid', 'low_right'] as ZoneArea[]).map(area => {
              const t = ump.tendencies.find(x => x.area === area)!;
              return (
                <div key={area} style={{ padding: 10, background: diffColor(t.differential) + '22', border: `1px solid ${diffColor(t.differential)}44`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{ZONE_LABELS[area]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: diffColor(t.differential) }}>{(t.calledStrikeRate * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: 9, color: t.differential > 0 ? '#ef4444' : t.differential < 0 ? '#22c55e' : '#6b7280' }}>
                    {t.differential > 0 ? '+' : ''}{(t.differential * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edge zones */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, maxWidth: 280 }}>
            {(['high', 'low', 'inside', 'outside'] as ZoneArea[]).map(area => {
              const t = ump.tendencies.find(x => x.area === area)!;
              return (
                <div key={area} style={{ padding: 6, background: '#0a0f1a', border: '1px solid #1f2937', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{ZONE_LABELS[area]}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: diffColor(t.differential) }}>{(t.calledStrikeRate * 100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>NOTABLE</div>
            <div style={{ fontSize: 11, color: '#e5e7eb' }}>{ump.notableCall}</div>
          </div>
        </div>

        {/* All umpires comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>UMPIRE COMPARISON</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['UMPIRE', 'CONS', 'ZONE', 'FAVORS', 'GAMES'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'UMPIRE' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sort((a, b) => b.consistencyScore - a.consistencyScore).map((u, i) => {
                const el = getExpansionLabel(u.zoneExpansion);
                return (
                  <tr key={u.umpId} onClick={() => setSelectedIdx(data.indexOf(u))}
                    style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: u.umpId === ump.umpId ? '#1f2937' : 'transparent' }}>
                    <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: getConsistencyColor(u.consistencyScore), fontWeight: 700 }}>{u.consistencyScore}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, background: el.color + '22', color: el.color }}>{el.label}</span>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: u.favorsPitcher ? '#3b82f6' : '#22c55e', fontSize: 10 }}>
                      {u.favorsPitcher ? 'P' : 'H'}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>{u.gamesUmped}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
