import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoStarterGameLog,
  type StarterGameLogData,
  type GameLogEntry,
} from '../../engine/pitching/starterGameLog';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  container: { padding: 16, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100%' } as const,
  header: { background: '#111827', borderBottom: '1px solid #1f2937', padding: '8px 32px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: -16, marginRight: -16, marginTop: -16 } as const,
  headerTitle: { color: '#f59e0b', fontWeight: 700, fontSize: 13, letterSpacing: 1 } as const,
  headerSub: { color: '#4b5563', fontSize: 10 } as const,
  card: { border: '1px solid #1f2937', marginBottom: 12 } as const,
  selectorBtn: (active: boolean) => ({
    padding: '6px 12px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer',
    border: '1px solid ' + (active ? '#f59e0b' : '#1f2937'),
    background: active ? '#f59e0b' : '#111827',
    color: active ? '#030712' : '#9ca3af',
  }) as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 11, fontFamily: 'monospace' },
  th: { padding: '6px 8px', textAlign: 'left' as const, color: '#6b7280', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #1f2937', letterSpacing: 0.5 },
  td: { padding: '5px 8px', borderBottom: '1px solid #111827', fontVariantNumeric: 'tabular-nums' as const },
  summaryBox: { border: '1px solid #1f2937', padding: '8px 12px', textAlign: 'center' as const },
  summaryLabel: { color: '#6b7280', fontSize: 10, fontWeight: 700 } as const,
  summaryValue: { fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' as const } as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resultColor(r: 'W' | 'L' | 'ND'): string {
  if (r === 'W') return '#22c55e';
  if (r === 'L') return '#ef4444';
  return '#6b7280';
}

function gameScoreColor(gs: number): string {
  if (gs >= 75) return '#22c55e';
  if (gs >= 60) return '#3b82f6';
  if (gs >= 50) return '#eab308';
  if (gs >= 40) return '#f97316';
  return '#ef4444';
}

function gameScoreBg(gs: number): string {
  return gameScoreColor(gs) + '18';
}

function eraColor(era: number): string {
  if (era <= 2.50) return '#22c55e';
  if (era <= 3.50) return '#3b82f6';
  if (era <= 4.50) return '#eab308';
  return '#ef4444';
}

// ─── Row Component ────────────────────────────────────────────────────────────

function GameLogRow({ entry, idx }: { entry: GameLogEntry; idx: number }) {
  const bg = idx % 2 === 0 ? 'transparent' : '#111827';
  return (
    <tr style={{ background: bg }}>
      <td style={S.td}><span style={{ color: '#9ca3af' }}>{entry.date}</span></td>
      <td style={S.td}><span style={{ color: '#d1d5db', fontWeight: 600 }}>{entry.opponent}</span></td>
      <td style={S.td}>
        <span style={{
          color: resultColor(entry.result), fontWeight: 700,
          padding: '1px 6px', borderRadius: 3,
          background: resultColor(entry.result) + '18',
        }}>
          {entry.result}
        </span>
      </td>
      <td style={{ ...S.td, color: '#e5e7eb' }}>{entry.ip}</td>
      <td style={{ ...S.td, color: '#9ca3af' }}>{entry.hits}</td>
      <td style={{ ...S.td, color: entry.earnedRuns >= 5 ? '#ef4444' : '#9ca3af' }}>{entry.runs}</td>
      <td style={{ ...S.td, color: entry.earnedRuns >= 5 ? '#ef4444' : '#e5e7eb' }}>{entry.earnedRuns}</td>
      <td style={{ ...S.td, color: entry.walks >= 4 ? '#eab308' : '#9ca3af' }}>{entry.walks}</td>
      <td style={{ ...S.td, color: entry.strikeouts >= 8 ? '#22c55e' : '#e5e7eb', fontWeight: entry.strikeouts >= 10 ? 700 : 400 }}>{entry.strikeouts}</td>
      <td style={{ ...S.td, color: entry.pitchCount >= 100 ? '#f97316' : '#9ca3af' }}>{entry.pitchCount}</td>
      <td style={{ ...S.td, color: eraColor(entry.era) }}>{entry.era.toFixed(2)}</td>
      <td style={S.td}>
        <span style={{
          color: gameScoreColor(entry.gameScore), fontWeight: 700,
          padding: '1px 6px', borderRadius: 3,
          background: gameScoreBg(entry.gameScore),
        }}>
          {entry.gameScore}
        </span>
      </td>
      <td style={S.td}>
        {entry.qualityStart && (
          <span style={{
            color: '#22c55e', fontWeight: 700, fontSize: 9,
            padding: '1px 5px', borderRadius: 3,
            background: '#22c55e18', border: '1px solid #22c55e44',
          }}>
            QS
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoStarterGameLog();

export default function StarterGameLogView() {
  const { gameStarted } = useGameStore();
  const [pitchers] = useState<StarterGameLogData[]>(DEMO_DATA);
  const [selectedId, setSelectedId] = useState<number>(DEMO_DATA[0]?.pitcherId ?? 0);

  if (!gameStarted) return <div style={{ padding: 16, color: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}>Start a game first.</div>;

  const selected = pitchers.find(p => p.pitcherId === selectedId) ?? pitchers[0]!;
  const wins = selected.entries.filter(e => e.result === 'W').length;
  const losses = selected.entries.filter(e => e.result === 'L').length;

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerTitle}>STARTER GAME LOG</span>
        <span style={S.headerSub}>{selected.entries.length} STARTS</span>
      </div>

      {/* Pitcher Selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {pitchers.map(p => (
          <button key={p.pitcherId} onClick={() => setSelectedId(p.pitcherId)} style={S.selectorBtn(selectedId === p.pitcherId)}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Season Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>ERA</div>
          <div style={{ ...S.summaryValue, color: eraColor(selected.seasonERA) }}>{selected.seasonERA.toFixed(2)}</div>
        </div>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>W-L</div>
          <div style={{ ...S.summaryValue, color: '#e5e7eb' }}>{wins}-{losses}</div>
        </div>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>IP</div>
          <div style={{ ...S.summaryValue, color: '#f59e0b' }}>{selected.seasonIP}</div>
        </div>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>QUALITY STARTS</div>
          <div style={{ ...S.summaryValue, color: '#22c55e' }}>{selected.totalQS}</div>
        </div>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>AVG GAME SCORE</div>
          <div style={{ ...S.summaryValue, color: gameScoreColor(selected.avgGameScore) }}>{selected.avgGameScore}</div>
        </div>
        <div style={S.summaryBox}>
          <div style={S.summaryLabel}>QS RATE</div>
          <div style={{ ...S.summaryValue, color: '#3b82f6' }}>
            {selected.entries.length > 0 ? ((selected.totalQS / selected.entries.length) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Game Log Table */}
      <div style={{ ...S.card, overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr style={{ background: '#111827' }}>
              <th style={S.th}>DATE</th>
              <th style={S.th}>OPP</th>
              <th style={S.th}>DEC</th>
              <th style={S.th}>IP</th>
              <th style={S.th}>H</th>
              <th style={S.th}>R</th>
              <th style={S.th}>ER</th>
              <th style={S.th}>BB</th>
              <th style={S.th}>K</th>
              <th style={S.th}>PC</th>
              <th style={S.th}>ERA</th>
              <th style={S.th}>GS</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {selected.entries.map((entry, i) => (
              <GameLogRow key={i} entry={entry} idx={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: '#6b7280' }}>
        <span>GS = Game Score (Bill James)</span>
        <span style={{ color: '#22c55e' }}>QS = Quality Start (6+ IP, 3 ER or fewer)</span>
        <span>PC = Pitch Count</span>
      </div>
    </div>
  );
}
