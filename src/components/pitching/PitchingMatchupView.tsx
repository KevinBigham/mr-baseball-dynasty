/**
 * PitchingMatchupView – Pitching Matchup Heatmap dashboard
 *
 * Bloomberg-terminal style batter vs pitcher zone tendency analysis
 * with 5x5 zone grid, matchup stats, advantage indicators, and
 * detailed tendency breakdowns.
 */
import { useState, useMemo } from 'react';
import {
  PitchingMatchup,
  getMatchupHeatmapSummary,
  generateDemoMatchupHeatmap,
  getMatchupHeatColor,
  getMatchupZoneLabel,
} from '../../engine/pitching/pitchingMatchupHeatmap';

type ZoneMode = 'whiff' | 'hit' | 'pitch';

const ADVANTAGE_DISPLAY: Record<PitchingMatchup['advantage'], { label: string; color: string }> = {
  pitcher: { label: 'PITCHER', color: '#22c55e' },
  batter:  { label: 'BATTER',  color: '#ef4444' },
  neutral: { label: 'NEUTRAL', color: '#f59e0b' },
};

export default function PitchingMatchupView() {
  const matchups = useMemo(() => generateDemoMatchupHeatmap(), []);
  const summary = useMemo(() => getMatchupHeatmapSummary(matchups), [matchups]);
  const [selected, setSelected] = useState<PitchingMatchup | null>(null);
  const [zoneMode, setZoneMode] = useState<ZoneMode>('whiff');

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCHING MATCHUP HEATMAP — BATTER VS PITCHER ZONE ANALYSIS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Matchups', value: summary.totalMatchups },
          { label: 'Pitcher Adv', value: summary.pitcherAdvantage, color: '#22c55e' },
          { label: 'Batter Adv', value: summary.batterAdvantage, color: '#ef4444' },
          { label: 'Top Whiff', value: `${summary.highestWhiffMatchup.pitcher} vs ${summary.highestWhiffMatchup.batter}`, color: '#f59e0b' },
          { label: 'Top wOBA', value: `${summary.highestWobaMatchup.batter} (${summary.highestWobaMatchup.wOBA})`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Matchup List Table */}
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Batter</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Hand</th>
                <th style={{ textAlign: 'center', padding: 6 }}>wOBA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Adv</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map(m => {
                const advInfo = ADVANTAGE_DISPLAY[m.advantage];
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === m.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {m.pitcherName}
                      <span style={{ color: '#666', fontSize: 10, marginLeft: 4 }}>{m.pitcherTeam}</span>
                    </td>
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {m.batterName}
                      <span style={{ color: '#666', fontSize: 10, marginLeft: 4 }}>{m.batterTeam}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{m.batterHand}</td>
                    <td style={{
                      padding: 6, textAlign: 'center', fontWeight: 700,
                      color: m.result.wOBA >= 0.370 ? '#ef4444' : m.result.wOBA <= 0.300 ? '#22c55e' : '#f59e0b',
                    }}>
                      {m.result.wOBA.toFixed(3)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: advInfo.color, fontWeight: 700, fontSize: 10 }}>
                      {advInfo.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 520px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.pitcherName}
                <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}> ({selected.pitcherTeam})</span>
                <span style={{ color: '#ccc', fontWeight: 400, fontSize: 13 }}> vs </span>
                {selected.batterName}
                <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}> ({selected.batterTeam} · {selected.batterHand}HB)</span>
              </div>

              {/* Advantage Badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  background: ADVANTAGE_DISPLAY[selected.advantage].color,
                  color: '#000',
                  letterSpacing: 0.5,
                }}>
                  {ADVANTAGE_DISPLAY[selected.advantage].label} ADVANTAGE
                </span>
              </div>

              {/* Zone Mode Toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['whiff', 'hit', 'pitch'] as ZoneMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setZoneMode(mode)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      background: zoneMode === mode ? '#f59e0b' : '#111',
                      color: zoneMode === mode ? '#000' : '#666',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      fontWeight: zoneMode === mode ? 700 : 400,
                    }}
                  >
                    {mode === 'whiff' ? 'WHIFF %' : mode === 'hit' ? 'HIT %' : 'PITCH %'}
                  </button>
                ))}
              </div>

              {/* 5x5 Zone Grid */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, maxWidth: 320 }}>
                  {selected.zones.map(z => {
                    const val = zoneMode === 'whiff' ? z.whiffPct : zoneMode === 'hit' ? z.hitPct : z.pitchPct;
                    const bg = getMatchupHeatColor(val, zoneMode);
                    return (
                      <div
                        key={`${z.row}-${z.col}`}
                        title={`${getMatchupZoneLabel(z.row, z.col)}\nPitch: ${z.pitchPct}%\nHit: ${z.hitPct}%\nSwing: ${z.swingPct}%\nWhiff: ${z.whiffPct}%`}
                        style={{
                          background: bg,
                          opacity: 0.85,
                          padding: '8px 4px',
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          borderRadius: 2,
                        }}
                      >
                        {val.toFixed(1)}
                      </div>
                    );
                  })}
                </div>
                <div style={{ color: '#555', fontSize: 9, marginTop: 4 }}>
                  {zoneMode === 'whiff' ? 'Whiff% (red=high swing-and-miss)' : zoneMode === 'hit' ? 'Hit% (red=dangerous zone)' : 'Pitch% density (red=frequent target)'}
                </div>
              </div>

              {/* Matchup Stats */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>MATCHUP STATS</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'AB', value: selected.result.atBats, color: '#ccc' },
                  { label: 'H', value: selected.result.hits, color: '#f59e0b' },
                  { label: 'K', value: selected.result.strikeouts, color: selected.result.strikeouts >= 10 ? '#22c55e' : '#ccc' },
                  { label: 'BB', value: selected.result.walks, color: selected.result.walks >= 6 ? '#ef4444' : '#ccc' },
                  { label: 'Avg EV', value: `${selected.result.avgExitVelo}`, color: selected.result.avgExitVelo >= 92 ? '#ef4444' : '#ccc' },
                  { label: 'wOBA', value: selected.result.wOBA.toFixed(3), color: selected.result.wOBA >= 0.370 ? '#ef4444' : selected.result.wOBA <= 0.300 ? '#22c55e' : '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tendency */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>TENDENCY</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#ccc', fontSize: 12, marginBottom: 12 }}>
                {selected.tendency}
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a matchup to view zone heatmap and stats
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
