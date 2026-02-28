import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoTradePackage,
  type TradePackage,
  type TradeAsset,
} from '../../engine/trade/tradePackageBuilder';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  container: { padding: 16, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100%' } as const,
  header: { background: '#111827', borderBottom: '1px solid #1f2937', padding: '8px 32px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: -16, marginRight: -16, marginTop: -16 } as const,
  headerTitle: { color: '#f59e0b', fontWeight: 700, fontSize: 13, letterSpacing: 1 } as const,
  headerSub: { color: '#4b5563', fontSize: 10 } as const,
  card: { border: '1px solid #1f2937', marginBottom: 16 } as const,
  sideColumn: { flex: 1, padding: 12 } as const,
  divider: { width: 1, background: '#1f2937', alignSelf: 'stretch' as const } as const,
  assetCard: (type: TradeAsset['type']) => ({
    border: '1px solid ' + (type === 'player' ? '#1f2937' : type === 'prospect' ? '#854d0e44' : '#1e3a5f'),
    background: type === 'player' ? '#11182744' : type === 'prospect' ? '#854d0e11' : '#1e3a5f11',
    padding: '8px 10px', marginBottom: 6, borderRadius: 3,
  }) as const,
  badge: (color: string) => ({
    display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
    background: color + '22', color, border: '1px solid ' + color + '44',
  }) as const,
  valueBar: (pct: number, color: string) => ({
    height: 8, borderRadius: 4, background: color, width: `${Math.min(100, pct)}%`,
    transition: 'width 0.3s ease',
  }) as const,
  fairnessChip: (color: string) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
    background: color + '22', color, border: '1px solid ' + color + '55', letterSpacing: 0.5,
  }) as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeColor(type: TradeAsset['type']): string {
  if (type === 'player') return '#3b82f6';
  if (type === 'prospect') return '#f59e0b';
  return '#8b5cf6';
}

function typeLabel(type: TradeAsset['type']): string {
  if (type === 'player') return 'MLB';
  if (type === 'prospect') return 'PRSP';
  return 'PICK';
}

function fairnessColor(f: TradePackage['fairness']): string {
  if (f === 'fair') return '#22c55e';
  if (f === 'slight_edge_a' || f === 'slight_edge_b') return '#eab308';
  return '#ef4444';
}

function fairnessLabel(f: TradePackage['fairness']): string {
  if (f === 'fair') return 'FAIR TRADE';
  if (f === 'slight_edge_a') return 'SLIGHT EDGE: SIDE A';
  if (f === 'slight_edge_b') return 'SLIGHT EDGE: SIDE B';
  if (f === 'lopsided_a') return 'LOPSIDED: SIDE A WINS';
  return 'LOPSIDED: SIDE B WINS';
}

function valueColor(v: number): string {
  if (v >= 70) return '#22c55e';
  if (v >= 50) return '#3b82f6';
  if (v >= 30) return '#eab308';
  return '#9ca3af';
}

// ─── Asset Card Component ─────────────────────────────────────────────────────

function AssetCardView({ asset }: { asset: TradeAsset }) {
  return (
    <div style={S.assetCard(asset.type)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.badge(typeColor(asset.type))}>{typeLabel(asset.type)}</span>
          <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 12 }}>{asset.name}</span>
        </div>
        <span style={{ color: valueColor(asset.value), fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {asset.value}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
        <span style={{ color: '#6b7280' }}>{asset.position}</span>
        <div style={{ flex: 1, height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
          <div style={S.valueBar(asset.value, valueColor(asset.value))} />
        </div>
      </div>
    </div>
  );
}

// ─── Trade Card Component ─────────────────────────────────────────────────────

function TradeCardView({ trade, index }: { trade: TradePackage; index: number }) {
  const maxVal = Math.max(trade.valueA, trade.valueB, 1);
  const fColor = fairnessColor(trade.fairness);

  return (
    <div style={S.card}>
      {/* Trade Header */}
      <div style={{ background: '#111827', padding: '6px 12px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11 }}>TRADE #{index + 1}</span>
        <span style={S.fairnessChip(fColor)}>{fairnessLabel(trade.fairness)}</span>
      </div>

      {/* Two-column trade view */}
      <div style={{ display: 'flex' }}>
        {/* Side A */}
        <div style={S.sideColumn}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>SIDE A</span>
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{trade.valueA}</span>
          </div>
          <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#f59e0b', width: `${(trade.valueA / maxVal) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
          {trade.sideA.map((a, i) => <AssetCardView key={i} asset={a} />)}
        </div>

        {/* Divider */}
        <div style={S.divider} />

        {/* Side B */}
        <div style={S.sideColumn}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>SIDE B</span>
            <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{trade.valueB}</span>
          </div>
          <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#3b82f6', width: `${(trade.valueB / maxVal) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
          {trade.sideB.map((a, i) => <AssetCardView key={i} asset={a} />)}
        </div>
      </div>

      {/* Differential footer */}
      <div style={{ background: '#111827', padding: '6px 12px', borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: '#6b7280' }}>
          ASSETS: {trade.sideA.length} vs {trade.sideB.length}
        </span>
        <span style={{ color: fColor, fontWeight: 700 }}>
          DIFFERENTIAL: {trade.differential > 0 ? '+' : ''}{trade.differential}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoTradePackage();

export default function TradePackageView() {
  const { gameStarted } = useGameStore();
  const [trades] = useState<TradePackage[]>(DEMO_DATA);

  if (!gameStarted) return <div style={{ padding: 16, color: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}>Start a game first.</div>;

  const fairCount = trades.filter(t => t.fairness === 'fair').length;
  const lopsidedCount = trades.filter(t => t.fairness.startsWith('lopsided')).length;
  const avgDiff = trades.length > 0
    ? (trades.reduce((s, t) => s + Math.abs(t.differential), 0) / trades.length).toFixed(1)
    : '0';

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerTitle}>TRADE PACKAGE BUILDER</span>
        <span style={S.headerSub}>PACKAGE EVALUATION</span>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>PACKAGES</div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{trades.length}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>FAIR TRADES</div>
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{fairCount}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>LOPSIDED</div>
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{lopsidedCount}</div>
        </div>
        <div style={{ border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700 }}>AVG DIFF</div>
          <div style={{ color: '#eab308', fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{avgDiff}</div>
        </div>
      </div>

      {/* Trade Cards */}
      <div>
        {trades.map((t, i) => (
          <TradeCardView key={i} trade={t} index={i} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#6b7280' }}>Asset Types:</span>
        <span style={S.badge('#3b82f6')}>MLB</span>
        <span style={{ color: '#6b7280' }}>Major Leaguer</span>
        <span style={S.badge('#f59e0b')}>PRSP</span>
        <span style={{ color: '#6b7280' }}>Prospect</span>
        <span style={S.badge('#8b5cf6')}>PICK</span>
        <span style={{ color: '#6b7280' }}>Draft Pick</span>
      </div>
    </div>
  );
}
