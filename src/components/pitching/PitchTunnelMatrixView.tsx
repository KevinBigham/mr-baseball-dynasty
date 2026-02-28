/**
 * PitchTunnelMatrixView — NxN Pitch Tunneling Effectiveness Matrix
 *
 * Bloomberg-terminal style visualization showing pitch-pair tunnel scores,
 * best/worst tunnel combos, and per-pitcher analysis with league comparison.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoPitchTunnelMatrix,
  TUNNEL_PITCH_INFO,
  getGradeColor,
  getScoreColor,
  type PitcherTunnelProfile,
  type TunnelPairScore,
  type TunnelPitchType,
} from '../../engine/pitching/pitchTunnelMatrix';

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: 18,
    color: '#e5e7eb',
    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
    fontSize: 12,
    background: '#030712',
    minHeight: '100%',
  },
  header: {
    background: '#111827',
    borderBottom: '1px solid #374151',
    padding: '8px 18px',
    marginBottom: 16,
    marginLeft: -18,
    marginRight: -18,
    marginTop: -18,
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    fontWeight: 700,
    fontSize: 13,
    color: '#f59e0b',
    letterSpacing: 1,
  },
  panel: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    marginBottom: 14,
  },
  panelHeader: {
    padding: '6px 12px',
    borderBottom: '1px solid #374151',
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  statBox: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    padding: '8px 14px',
    minWidth: 100,
    textAlign: 'center' as const,
  },
  statLabel: { color: '#6b7280', fontSize: 9, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' as const },
  statValue: { fontSize: 18, fontWeight: 700 },
  muted: { color: '#6b7280' },
  accent: { color: '#f59e0b' },
  row: { display: 'flex' as const, gap: 12, flexWrap: 'wrap' as const },
  btn: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
    border: active ? '1px solid #f59e0b' : '1px solid #374151',
    borderRadius: 3,
    background: active ? '#f59e0b' : 'transparent',
    color: active ? '#030712' : '#9ca3af',
    cursor: 'pointer' as const,
  }),
} as const;

// ── Matrix Cell ──────────────────────────────────────────────────────────────

function MatrixCell({ pair, leagueAvg }: { pair: TunnelPairScore | null; leagueAvg: number }) {
  if (!pair) {
    return (
      <td style={{ padding: 4, textAlign: 'center', background: '#0a0f1a', border: '1px solid #1f2937', width: 64 }}>
        <span style={{ color: '#374151', fontSize: 10 }}>--</span>
      </td>
    );
  }

  const diff = pair.tunnelScore - leagueAvg;
  const bg = pair.tunnelScore >= 80 ? 'rgba(34,197,94,0.12)' :
    pair.tunnelScore >= 65 ? 'rgba(59,130,246,0.10)' :
    pair.tunnelScore >= 50 ? 'rgba(234,179,8,0.08)' :
    pair.tunnelScore >= 35 ? 'rgba(249,115,22,0.08)' :
    'rgba(239,68,68,0.10)';

  return (
    <td style={{ padding: 4, textAlign: 'center', background: bg, border: '1px solid #1f2937', width: 64, cursor: 'default' }}
      title={`${TUNNEL_PITCH_INFO[pair.pitchA].label} / ${TUNNEL_PITCH_INFO[pair.pitchB].label}: ${pair.tunnelScore} (${pair.grade}) | vs Lg: ${diff >= 0 ? '+' : ''}${diff}`}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(pair.tunnelScore) }}>{pair.tunnelScore}</div>
      <div style={{ fontSize: 8, color: getGradeColor(pair.grade), fontWeight: 600 }}>{pair.grade}</div>
      <div style={{ fontSize: 8, color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
        {diff >= 0 ? '+' : ''}{diff}
      </div>
    </td>
  );
}

// ── Diagonal Cell (self) ─────────────────────────────────────────────────────

function DiagCell({ pitchType }: { pitchType: TunnelPitchType }) {
  const info = TUNNEL_PITCH_INFO[pitchType];
  return (
    <td style={{
      padding: 4,
      textAlign: 'center',
      background: '#0d1117',
      border: '1px solid #1f2937',
      width: 64,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: info.color }}>{info.label.split(' ')[0]}</div>
      <div style={{ fontSize: 8, color: '#4b5563' }}>{info.avgVelo}</div>
    </td>
  );
}

// ── Tunnel Matrix Table ──────────────────────────────────────────────────────

function TunnelMatrix({ pitcher, leagueAvgs }: {
  pitcher: PitcherTunnelProfile;
  leagueAvgs: Record<string, number>;
}) {
  const types = pitcher.pitchTypes;

  // Build lookup map for pairs
  const pairMap = new Map<string, TunnelPairScore>();
  for (const p of pitcher.tunnelPairs) {
    pairMap.set(`${p.pitchA}-${p.pitchB}`, p);
    pairMap.set(`${p.pitchB}-${p.pitchA}`, p);
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead>
          <tr>
            <th style={{ padding: 6, border: '1px solid #1f2937', background: '#111827', width: 64 }}></th>
            {types.map(t => (
              <th key={t} style={{
                padding: 6,
                border: '1px solid #1f2937',
                background: '#111827',
                color: TUNNEL_PITCH_INFO[t].color,
                fontWeight: 700,
                fontSize: 10,
                width: 64,
                textAlign: 'center',
              }}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((row, ri) => (
            <tr key={row}>
              <td style={{
                padding: 6,
                border: '1px solid #1f2937',
                background: '#111827',
                color: TUNNEL_PITCH_INFO[row].color,
                fontWeight: 700,
                fontSize: 10,
                textAlign: 'center',
              }}>
                {row}
              </td>
              {types.map((col, ci) => {
                if (ri === ci) return <DiagCell key={col} pitchType={row} />;
                if (ci < ri) {
                  // Mirror: show same pair with lighter style
                  const pair = pairMap.get(`${col}-${row}`) ?? pairMap.get(`${row}-${col}`) ?? null;
                  const lgKey = pair ? `${pair.pitchA}-${pair.pitchB}` : '';
                  return <MatrixCell key={col} pair={pair} leagueAvg={leagueAvgs[lgKey] ?? 50} />;
                }
                const pair = pairMap.get(`${row}-${col}`) ?? null;
                const lgKey = pair ? `${pair.pitchA}-${pair.pitchB}` : '';
                return <MatrixCell key={col} pair={pair} leagueAvg={leagueAvgs[lgKey] ?? 50} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pair Detail Card ─────────────────────────────────────────────────────────

function PairDetail({ pair, leagueAvg }: { pair: TunnelPairScore; leagueAvg: number }) {
  const infoA = TUNNEL_PITCH_INFO[pair.pitchA];
  const infoB = TUNNEL_PITCH_INFO[pair.pitchB];
  const diff = pair.tunnelScore - leagueAvg;

  return (
    <div style={{ ...S.panel, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: infoA.color, fontWeight: 700 }}>{infoA.label}</span>
          <span style={{ color: '#4b5563' }}>/</span>
          <span style={{ color: infoB.color, fontWeight: 700 }}>{infoB.label}</span>
        </div>
        <div style={{
          padding: '2px 8px',
          borderRadius: 3,
          background: getGradeColor(pair.grade) + '22',
          color: getGradeColor(pair.grade),
          fontWeight: 700,
          fontSize: 13,
        }}>
          {pair.grade}
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'TUNNEL SCORE', value: pair.tunnelScore, color: getScoreColor(pair.tunnelScore) },
          { label: 'RELEASE SIM', value: pair.releaseSimilarity, color: getScoreColor(pair.releaseSimilarity) },
          { label: 'MOVE DIVERGE', value: pair.movementDivergence, color: getScoreColor(pair.movementDivergence) },
          { label: 'VELO DIFF', value: `${pair.veloDifferential} mph`, color: '#e5e7eb' },
          { label: 'WHIFF +/-', value: `+${pair.whiffRateDelta}%`, color: '#22c55e' },
          { label: 'VS LEAGUE', value: `${diff >= 0 ? '+' : ''}${diff}`, color: diff >= 0 ? '#22c55e' : '#ef4444' },
        ].map(m => (
          <div key={m.label} style={{ minWidth: 70 }}>
            <div style={{ fontSize: 8, color: '#6b7280', letterSpacing: 0.5, marginBottom: 1 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Bars */}
      {[
        { label: 'Release Similarity', value: pair.releaseSimilarity },
        { label: 'Movement Divergence', value: pair.movementDivergence },
      ].map(bar => (
        <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: '#6b7280', width: 120 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${bar.value}%`,
              height: '100%',
              borderRadius: 3,
              background: getScoreColor(bar.value),
            }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', width: 28, textAlign: 'right' }}>{bar.value}</span>
        </div>
      ))}

      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8, lineHeight: '1.5', fontStyle: 'italic' }}>
        {pair.scouting}
      </div>
    </div>
  );
}

// ── Pitcher Selector Card ────────────────────────────────────────────────────

function PitcherSelector({ pitcher, isSelected, onClick }: {
  pitcher: PitcherTunnelProfile;
  isSelected: boolean;
  onClick: () => void;
}) {
  const gradeColor = getGradeColor(pitcher.overallTunnelGrade);
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '8px 12px',
      border: isSelected ? '1px solid #f59e0b' : '1px solid #374151',
      borderRadius: 4,
      background: isSelected ? '#1a1a2e' : '#111827',
      cursor: 'pointer',
      fontFamily: 'monospace',
      textAlign: 'left' as const,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#1f2937',
        border: `2px solid ${gradeColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: gradeColor,
      }}>
        {pitcher.overallTunnelScore}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: isSelected ? '#f59e0b' : '#e5e7eb', fontWeight: 700, fontSize: 12 }}>{pitcher.name}</div>
        <div style={{ color: '#6b7280', fontSize: 9 }}>
          {pitcher.position} | {pitcher.pitchTypes.length} pitches | {pitcher.tunnelPairs.length} pairs
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: gradeColor,
        }}>{pitcher.overallTunnelGrade}</div>
        <div style={{ fontSize: 8, color: '#6b7280' }}>{pitcher.leaguePercentile}th pct</div>
      </div>
    </button>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function PitchTunnelMatrixView() {
  const data = useMemo(() => generateDemoPitchTunnelMatrix(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tab, setTab] = useState<'matrix' | 'pairs' | 'best'>('matrix');

  const pitcher = data.pitchers[selectedIdx];
  const leagueAvgs = data.leagueAverages.pairAverages;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <span>PITCH TUNNELING EFFECTIVENESS MATRIX</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>
          WAVE 71 | {data.pitchers.length} PITCHERS ANALYZED
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ ...S.row, marginBottom: 16 }}>
        {[
          { label: 'PITCHER', value: pitcher.name, color: '#f59e0b' },
          { label: 'TUNNEL GRADE', value: pitcher.overallTunnelGrade, color: getGradeColor(pitcher.overallTunnelGrade) },
          { label: 'AVG SCORE', value: pitcher.overallTunnelScore, color: getScoreColor(pitcher.overallTunnelScore) },
          { label: 'LEAGUE PCT', value: `${pitcher.leaguePercentile}th`, color: pitcher.leaguePercentile >= 75 ? '#22c55e' : '#e5e7eb' },
          { label: 'BEST PAIR', value: `${pitcher.bestPair.pitchA}/${pitcher.bestPair.pitchB}`, color: '#22c55e' },
          { label: 'LG AVG', value: data.leagueAverages.overallAvg, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={S.statBox}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Pitcher list sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={S.panel}>
            <div style={S.panelHeader}>PITCHING STAFF</div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.pitchers.map((p, i) => (
                <PitcherSelector
                  key={p.playerId}
                  pitcher={p}
                  isSelected={i === selectedIdx}
                  onClick={() => setSelectedIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { key: 'matrix' as const, label: 'MATRIX VIEW' },
              { key: 'pairs' as const, label: 'ALL PAIRS' },
              { key: 'best' as const, label: 'BEST / WORST' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={S.btn(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Matrix view */}
          {tab === 'matrix' && (
            <div style={S.panel}>
              <div style={S.panelHeader}>
                TUNNEL MATRIX — {pitcher.name.toUpperCase()} ({pitcher.pitchTypes.join(' / ')})
              </div>
              <div style={{ padding: 12 }}>
                <TunnelMatrix pitcher={pitcher} leagueAvgs={leagueAvgs} />
                <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 9, color: '#6b7280' }}>
                  <span>Score: tunnel deception (0-100)</span>
                  <span>Grade: letter grade</span>
                  <span>+/-: vs league average</span>
                  <span style={{ color: '#22c55e' }}>Green: elite</span>
                  <span style={{ color: '#3b82f6' }}>Blue: good</span>
                  <span style={{ color: '#eab308' }}>Yellow: avg</span>
                  <span style={{ color: '#ef4444' }}>Red: poor</span>
                </div>
              </div>
            </div>
          )}

          {/* All pairs view */}
          {tab === 'pairs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pitcher.tunnelPairs.map((p, i) => (
                <PairDetail
                  key={i}
                  pair={p}
                  leagueAvg={leagueAvgs[`${p.pitchA}-${p.pitchB}`] ?? data.leagueAverages.overallAvg}
                />
              ))}
            </div>
          )}

          {/* Best / worst view */}
          {tab === 'best' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                  BEST TUNNEL PAIR
                </div>
                <PairDetail
                  pair={pitcher.bestPair}
                  leagueAvg={leagueAvgs[`${pitcher.bestPair.pitchA}-${pitcher.bestPair.pitchB}`] ?? data.leagueAverages.overallAvg}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                  WORST TUNNEL PAIR
                </div>
                <PairDetail
                  pair={pitcher.worstPair}
                  leagueAvg={leagueAvgs[`${pitcher.worstPair.pitchA}-${pitcher.worstPair.pitchB}`] ?? data.leagueAverages.overallAvg}
                />
              </div>

              {/* Top 3 ranked */}
              <div style={S.panel}>
                <div style={S.panelHeader}>TUNNEL PAIR RANKINGS</div>
                <div style={{ padding: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                        <th style={{ padding: 6, textAlign: 'center' }}>#</th>
                        <th style={{ padding: 6, textAlign: 'left' }}>Pair</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Score</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Release</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Diverge</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Velo Gap</th>
                        <th style={{ padding: 6, textAlign: 'center' }}>Whiff+</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pitcher.tunnelPairs.map((p, i) => (
                        <tr key={i} style={{
                          borderBottom: '1px solid #1f2937',
                          background: i === 0 ? 'rgba(34,197,94,0.06)' : i === pitcher.tunnelPairs.length - 1 ? 'rgba(239,68,68,0.06)' : 'transparent',
                        }}>
                          <td style={{ padding: 6, textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                          <td style={{ padding: 6 }}>
                            <span style={{ color: TUNNEL_PITCH_INFO[p.pitchA].color, fontWeight: 700 }}>{p.pitchA}</span>
                            <span style={{ color: '#4b5563' }}> / </span>
                            <span style={{ color: TUNNEL_PITCH_INFO[p.pitchB].color, fontWeight: 700 }}>{p.pitchB}</span>
                          </td>
                          <td style={{ padding: 6, textAlign: 'center', color: getScoreColor(p.tunnelScore), fontWeight: 700 }}>{p.tunnelScore}</td>
                          <td style={{ padding: 6, textAlign: 'center', color: getGradeColor(p.grade), fontWeight: 700 }}>{p.grade}</td>
                          <td style={{ padding: 6, textAlign: 'center', color: '#9ca3af' }}>{p.releaseSimilarity}</td>
                          <td style={{ padding: 6, textAlign: 'center', color: '#9ca3af' }}>{p.movementDivergence}</td>
                          <td style={{ padding: 6, textAlign: 'center', color: '#9ca3af' }}>{p.veloDifferential}</td>
                          <td style={{ padding: 6, textAlign: 'center', color: '#22c55e' }}>+{p.whiffRateDelta}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
