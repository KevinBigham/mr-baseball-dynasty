import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoParkFactors,
  type ParkProfile,
  type ParkFactor,
  type ParkFactorStat,
} from '../../engine/analytics/parkFactorAnalysis';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  container: { padding: 16, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100%' } as const,
  header: { background: '#111827', borderBottom: '1px solid #1f2937', padding: '8px 32px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: -16, marginRight: -16, marginTop: -16 } as const,
  headerTitle: { color: '#f59e0b', fontWeight: 700, fontSize: 13, letterSpacing: 1 } as const,
  headerSub: { color: '#4b5563', fontSize: 10 } as const,
  card: { border: '1px solid #1f2937', marginBottom: 12 } as const,
  parkRow: (selected: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #111827',
    background: selected ? '#1f293766' : 'transparent',
    borderLeft: selected ? '3px solid #f59e0b' : '3px solid transparent',
  }) as const,
  badge: (color: string) => ({
    display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
    background: color + '22', color, border: '1px solid ' + color + '44',
  }) as const,
  factorCell: { padding: '5px 8px', textAlign: 'center' as const, fontVariantNumeric: 'tabular-nums' as const, fontSize: 11 },
  th: { padding: '6px 8px', textAlign: 'center' as const, color: '#6b7280', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #1f2937', letterSpacing: 0.5 },
  dimBox: { border: '1px solid #1f2937', padding: '6px 10px', textAlign: 'center' as const, flex: 1 } as const,
  infoLabel: { color: '#6b7280', fontSize: 10, fontWeight: 700 } as const,
  infoValue: { color: '#e5e7eb', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' as const } as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function factorColor(f: number): string {
  if (f >= 1.10) return '#ef4444';
  if (f >= 1.03) return '#f59e0b';
  if (f >= 0.97) return '#9ca3af';
  if (f >= 0.90) return '#3b82f6';
  return '#22c55e';
}

function overallColor(f: number): string {
  if (f >= 1.08) return '#ef4444';
  if (f >= 1.02) return '#f59e0b';
  if (f >= 0.98) return '#9ca3af';
  return '#22c55e';
}

function surfaceLabel(s: ParkProfile['surface']): string {
  return s === 'grass' ? 'Natural Grass' : 'Artificial Turf';
}

function roofLabel(r: ParkProfile['roofType']): string {
  if (r === 'open') return 'Open Air';
  if (r === 'retractable') return 'Retractable';
  return 'Fixed Dome';
}

function surfaceColor(s: ParkProfile['surface']): string {
  return s === 'grass' ? '#22c55e' : '#3b82f6';
}

function roofColor(r: ParkProfile['roofType']): string {
  if (r === 'open') return '#eab308';
  if (r === 'retractable') return '#8b5cf6';
  return '#6b7280';
}

const STAT_LABELS: Record<ParkFactorStat, string> = {
  runs: 'R', hr: 'HR', hits: 'H', doubles: '2B', triples: '3B', walks: 'BB', strikeouts: 'K',
};

const STAT_FULL: Record<ParkFactorStat, string> = {
  runs: 'Runs', hr: 'Home Runs', hits: 'Hits', doubles: 'Doubles', triples: 'Triples', walks: 'Walks', strikeouts: 'Strikeouts',
};

// ─── Factor Bar Component ─────────────────────────────────────────────────────

function FactorBar({ factor }: { factor: ParkFactor }) {
  const pct = Math.min(100, (factor.factor / 1.4) * 100);
  const neutral = (1.0 / 1.4) * 100;
  const color = factorColor(factor.factor);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, width: 24, textAlign: 'right' }}>{STAT_LABELS[factor.stat]}</span>
      <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
        {/* Neutral line */}
        <div style={{ position: 'absolute', left: `${neutral}%`, top: 0, bottom: 0, width: 1, background: '#4b5563', zIndex: 1 }} />
        <div style={{ height: '100%', borderRadius: 5, background: color, width: `${pct}%`, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 11, width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {factor.factor.toFixed(2)}
      </span>
      <span style={{ color: '#4b5563', fontSize: 9, width: 20, textAlign: 'right' }}>#{factor.rank}</span>
    </div>
  );
}

// ─── Park Detail Panel ────────────────────────────────────────────────────────

function ParkDetail({ park }: { park: ParkProfile }) {
  return (
    <div style={S.card}>
      {/* Park name header */}
      <div style={{ background: '#111827', padding: '8px 12px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>{park.parkName}</div>
          <div style={{ color: '#6b7280', fontSize: 10 }}>{park.teamName}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={S.badge(park.pitcherFriendly ? '#22c55e' : '#ef4444')}>
            {park.pitcherFriendly ? 'PITCHER FRIENDLY' : 'HITTER FRIENDLY'}
          </span>
          <span style={S.badge(overallColor(park.overallFactor))}>
            {park.overallFactor.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {/* Info row: Surface, Roof, Altitude */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>SURFACE</div>
            <div style={{ color: surfaceColor(park.surface), fontWeight: 700, fontSize: 11 }}>{surfaceLabel(park.surface)}</div>
          </div>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>ROOF</div>
            <div style={{ color: roofColor(park.roofType), fontWeight: 700, fontSize: 11 }}>{roofLabel(park.roofType)}</div>
          </div>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>ALTITUDE</div>
            <div style={S.infoValue}>{park.altitude.toLocaleString()} ft</div>
          </div>
        </div>

        {/* Dimensions display */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>LF</div>
            <div style={S.infoValue}>{park.dimensions.lf} ft</div>
          </div>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>CF</div>
            <div style={{ ...S.infoValue, color: '#f59e0b' }}>{park.dimensions.cf} ft</div>
          </div>
          <div style={{ ...S.dimBox }}>
            <div style={S.infoLabel}>RF</div>
            <div style={S.infoValue}>{park.dimensions.rf} ft</div>
          </div>
        </div>

        {/* Factor bars */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>PARK FACTORS</div>
          {park.factors.map(f => <FactorBar key={f.stat} factor={f} />)}
        </div>

        {/* Factor table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              <th style={{ ...S.th, textAlign: 'left' }}>STAT</th>
              <th style={S.th}>FACTOR</th>
              <th style={S.th}>RANK</th>
              <th style={S.th}>EFFECT</th>
            </tr>
          </thead>
          <tbody>
            {park.factors.map((f, i) => (
              <tr key={f.stat} style={{ background: i % 2 === 0 ? 'transparent' : '#111827' }}>
                <td style={{ padding: '4px 8px', color: '#9ca3af', fontSize: 10 }}>{STAT_FULL[f.stat]}</td>
                <td style={{ ...S.factorCell, color: factorColor(f.factor), fontWeight: 700 }}>{f.factor.toFixed(2)}</td>
                <td style={{ ...S.factorCell, color: '#6b7280' }}>#{f.rank}</td>
                <td style={{ ...S.factorCell }}>
                  <span style={{
                    color: f.factor >= 1.03 ? '#ef4444' : f.factor <= 0.97 ? '#22c55e' : '#6b7280',
                    fontWeight: 600,
                  }}>
                    {f.factor >= 1.03 ? 'BOOSTS' : f.factor <= 0.97 ? 'SUPPRESSES' : 'NEUTRAL'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoParkFactors();

export default function ParkFactorView() {
  const { gameStarted } = useGameStore();
  const [parks] = useState<ParkProfile[]>(DEMO_DATA);
  const [selectedId, setSelectedId] = useState<number>(DEMO_DATA[0]?.parkId ?? 0);

  if (!gameStarted) return <div style={{ padding: 16, color: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}>Start a game first.</div>;

  const selected = parks.find(p => p.parkId === selectedId) ?? parks[0]!;
  const hitterParks = parks.filter(p => !p.pitcherFriendly).length;
  const pitcherParks = parks.filter(p => p.pitcherFriendly).length;

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerTitle}>PARK FACTOR ANALYSIS</span>
        <span style={S.headerSub}>{parks.length} BALLPARKS</span>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>PARKS</div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{parks.length}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>HITTER PARKS</div>
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{hitterParks}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>PITCHER PARKS</div>
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{pitcherParks}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>AVG FACTOR</div>
          <div style={{ color: '#9ca3af', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
            {(parks.reduce((s, p) => s + p.overallFactor, 0) / parks.length).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Two-column layout: park list + detail */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Park list */}
        <div style={{ ...S.card, width: 320, flexShrink: 0, maxHeight: 520, overflowY: 'auto' }}>
          <div style={{ background: '#111827', padding: '6px 12px', borderBottom: '1px solid #1f2937' }}>
            <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>BALLPARKS (BY OVERALL FACTOR)</span>
          </div>
          {parks.map((p, i) => (
            <div key={p.parkId} onClick={() => setSelectedId(p.parkId)} style={S.parkRow(selectedId === p.parkId)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4b5563', fontSize: 10, width: 16, textAlign: 'right' }}>{i + 1}.</span>
                <div>
                  <div style={{ color: selectedId === p.parkId ? '#f59e0b' : '#d1d5db', fontWeight: 600, fontSize: 11 }}>{p.parkName}</div>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>{p.teamName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={S.badge(p.pitcherFriendly ? '#22c55e' : '#ef4444')}>
                  {p.pitcherFriendly ? 'P' : 'H'}
                </span>
                <span style={{ color: overallColor(p.overallFactor), fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {p.overallFactor.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1 }}>
          <ParkDetail park={selected} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: '#6b7280', flexWrap: 'wrap' }}>
        <span>Factor &gt; 1.00 = boosts stat production</span>
        <span>Factor &lt; 1.00 = suppresses stat production</span>
        <span style={{ color: '#ef4444' }}>H = Hitter Friendly</span>
        <span style={{ color: '#22c55e' }}>P = Pitcher Friendly</span>
      </div>
    </div>
  );
}
