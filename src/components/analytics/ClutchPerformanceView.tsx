/**
 * ClutchPerformanceView – Clutch Performance Index Dashboard
 *
 * Bloomberg-terminal style clutch analytics comparing player
 * performance in high-leverage vs regular situations. Shows
 * clutch ratings, split stats, OPS differentials, and
 * season highlights.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoClutchPerformance,
  getClutchPerformanceSummary,
  CLUTCH_LABEL_DISPLAY,
  type ClutchProfile,
} from '../../engine/analytics/clutchPerformanceIndex';

export default function ClutchPerformanceView() {
  const profiles = useMemo(() => generateDemoClutchPerformance(), []);
  const summary = useMemo(() => getClutchPerformanceSummary(profiles), [profiles]);
  const [selected, setSelected] = useState<ClutchProfile | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'ops-diff' | 'war'>('rating');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hitter' | 'pitcher'>('all');

  const sortedProfiles = useMemo(() => {
    let filtered = typeFilter === 'all' ? profiles :
                   profiles.filter(p => p.type === typeFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return b.clutchRating - a.clutchRating;
      if (sortBy === 'ops-diff') return b.opsDifferential - a.opsDifferential;
      return b.clutch.leverageWAR - a.clutch.leverageWAR;
    });
  }, [profiles, sortBy, typeFilter]);

  function fmtBA(n: number): string {
    return n.toFixed(3).replace(/^0/, '');
  }

  function fmtOPS(n: number): string {
    return n.toFixed(3);
  }

  function ratingColor(r: number): string {
    if (r >= 3.5) return '#22c55e';
    if (r >= 1.5) return '#3b82f6';
    if (r >= -1.0) return '#eab308';
    if (r >= -3.0) return '#f97316';
    return '#ef4444';
  }

  function diffColor(d: number): string {
    if (d >= 0.050) return '#22c55e';
    if (d >= 0) return '#4ade80';
    if (d >= -0.050) return '#f97316';
    return '#ef4444';
  }

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100vh' }}>
      <div style={{ marginBottom: 14, padding: '8px 16px', background: '#111827', borderBottom: '2px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          CLUTCH PERFORMANCE INDEX
        </span>
        <span style={{ color: '#666', fontSize: 11 }}>HIGH-LEVERAGE SITUATION ANALYTICS</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Ice Cold', value: summary.iceCount, color: '#22c55e' },
          { label: 'Clutch', value: summary.clutchCount, color: '#3b82f6' },
          { label: 'Steady', value: summary.steadyCount, color: '#eab308' },
          { label: 'Shaky', value: summary.shakyCount, color: '#f97316' },
          { label: 'Choke', value: summary.chokeCount, color: '#ef4444' },
          { label: 'Team Clutch OPS', value: fmtOPS(summary.teamClutchOPS) },
          { label: 'Avg Rating', value: summary.avgClutchRating > 0 ? `+${summary.avgClutchRating}` : `${summary.avgClutchRating}` },
          { label: 'Walk-Offs', value: summary.teamWalkoffs, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', minWidth: 90, textAlign: 'center', background: '#111827', border: '1px solid #374151' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 10 }}>SORT:</span>
          {([['rating', 'Rating'], ['ops-diff', 'OPS Diff'], ['war', 'Lev WAR']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                background: sortBy === key ? '#374151' : '#111827',
                color: sortBy === key ? '#f59e0b' : '#888',
                border: '1px solid #374151',
                padding: '3px 8px',
                fontFamily: 'monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 10 }}>TYPE:</span>
          {([['all', 'All'], ['hitter', 'Hitters'], ['pitcher', 'Pitchers']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                background: typeFilter === key ? '#374151' : '#111827',
                color: typeFilter === key ? '#f59e0b' : '#888',
                border: '1px solid #374151',
                padding: '3px 8px',
                fontFamily: 'monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Player Table */}
        <div style={{ flex: '1 1 640px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Label</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Reg OPS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Clutch OPS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OPS Diff</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RISP BA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Lev WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WalkOff</th>
              </tr>
            </thead>
            <tbody>
              {sortedProfiles.map(p => {
                const lbl = CLUTCH_LABEL_DISPLAY[p.clutchLabel];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name}
                      <span style={{ color: '#666', marginLeft: 6 }}>{p.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.type === 'pitcher' ? '#3b82f6' : '#888' }}>
                      {p.position}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{
                        color: ratingColor(p.clutchRating),
                        fontWeight: 700,
                        fontSize: 13,
                      }}>
                        {p.clutchRating > 0 ? '+' : ''}{p.clutchRating.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        background: lbl.color + '22',
                        color: lbl.color,
                        fontWeight: 600,
                        fontSize: 10,
                        borderRadius: 3,
                      }}>
                        {lbl.label}
                      </span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontFamily: 'monospace' }}>
                      {fmtOPS(p.regularOPS)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontFamily: 'monospace' }}>
                      {fmtOPS(p.clutchOPS)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: diffColor(p.opsDifferential), fontWeight: 600, fontFamily: 'monospace' }}>
                      {p.opsDifferential > 0 ? '+' : ''}{fmtOPS(p.opsDifferential)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontFamily: 'monospace' }}>
                      {p.type === 'hitter' ? fmtBA(p.clutch.rispBA) : (
                        <span style={{ color: '#888', fontSize: 10 }}>
                          {fmtBA(p.clutch.rispBA)} opp
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>
                      {p.clutch.leverageWAR.toFixed(1)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.clutch.walkoffHits > 0 ? '#22c55e' : '#444' }}>
                      {p.clutch.walkoffHits || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Rating Scale Legend */}
          <div style={{ display: 'flex', gap: 2, marginTop: 10, padding: '8px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: 10, marginRight: 8 }}>SCALE:</span>
            <div style={{ display: 'flex', gap: 0, flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#ef4444' }} title="-5 Choke" />
              <div style={{ flex: 1, background: '#f97316' }} title="-3 Shaky" />
              <div style={{ flex: 1, background: '#eab308' }} title="0 Steady" />
              <div style={{ flex: 1, background: '#3b82f6' }} title="+3 Clutch" />
              <div style={{ flex: 1, background: '#22c55e' }} title="+5 Ice Cold" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginLeft: 8 }}>
              <span style={{ color: '#ef4444', fontSize: 9 }}>-5</span>
              <span style={{ color: '#eab308', fontSize: 9 }}>0</span>
              <span style={{ color: '#22c55e', fontSize: 9 }}>+5</span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div style={{ padding: 14, background: '#111827', border: '1px solid #374151' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
                {selected.name}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                {selected.team} | {selected.position} | Age {selected.age} | OVR {selected.overall} | {selected.type === 'pitcher' ? 'Pitcher' : 'Hitter'}
              </div>

              {/* Clutch Rating Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${ratingColor(selected.clutchRating)}`,
                  background: ratingColor(selected.clutchRating) + '15',
                }}>
                  <span style={{ color: ratingColor(selected.clutchRating), fontWeight: 700, fontSize: 18 }}>
                    {selected.clutchRating > 0 ? '+' : ''}{selected.clutchRating.toFixed(1)}
                  </span>
                </div>
                <div>
                  <div style={{
                    color: CLUTCH_LABEL_DISPLAY[selected.clutchLabel].color,
                    fontWeight: 700,
                    fontSize: 15,
                  }}>
                    {CLUTCH_LABEL_DISPLAY[selected.clutchLabel].label}
                  </div>
                  <div style={{ color: '#888', fontSize: 11 }}>
                    Composite Score: {selected.compositeClutchScore}/100
                  </div>
                </div>
              </div>

              {/* Regular vs Clutch Split */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>REGULAR vs CLUTCH SPLITS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Split</th>
                    {selected.type === 'hitter' ? (
                      <>
                        <th style={{ textAlign: 'center', padding: 4 }}>AVG</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>OBP</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>SLG</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>OPS</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>WAR</th>
                      </>
                    ) : (
                      <>
                        <th style={{ textAlign: 'center', padding: 4 }}>oAVG</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>oOBP</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>oSLG</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>oOPS</th>
                        <th style={{ textAlign: 'center', padding: 4 }}>WAR</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: 4, color: '#888' }}>Regular</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{fmtBA(selected.regular.avg)}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{fmtBA(selected.regular.obp)}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{fmtBA(selected.regular.slg)}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{fmtOPS(selected.regularOPS)}</td>
                    <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b' }}>{selected.regular.war.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: 4, color: ratingColor(selected.clutchRating), fontWeight: 600 }}>Clutch</td>
                    <td style={{ padding: 4, textAlign: 'center', fontWeight: 600 }}>{fmtBA(selected.clutch.closeAndLateBA)}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 4, textAlign: 'center', fontWeight: 600, color: diffColor(selected.opsDifferential) }}>
                      {fmtOPS(selected.clutchOPS)}
                    </td>
                    <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{selected.clutch.leverageWAR.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 4, color: '#666' }}>Diff</td>
                    <td colSpan={3} />
                    <td style={{
                      padding: 4,
                      textAlign: 'center',
                      color: diffColor(selected.opsDifferential),
                      fontWeight: 700,
                    }}>
                      {selected.opsDifferential > 0 ? '+' : ''}{fmtOPS(selected.opsDifferential)}
                    </td>
                    <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>
                      {(selected.clutch.leverageWAR - selected.regular.war) > 0 ? '+' : ''}
                      {(selected.clutch.leverageWAR - selected.regular.war).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Clutch Metrics */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CLUTCH METRICS</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {selected.type === 'hitter' ? [
                  { label: 'RISP BA', value: fmtBA(selected.clutch.rispBA), color: selected.clutch.rispBA >= .300 ? '#22c55e' : selected.clutch.rispBA >= .250 ? '#eab308' : '#ef4444' },
                  { label: 'RISP OPS', value: fmtOPS(selected.clutch.rispOPS) },
                  { label: '2-Out RISP', value: fmtBA(selected.clutch.twoOutRISPBA) },
                  { label: 'Go-Ahead RBI', value: String(selected.clutch.goAheadRBIs), color: '#22c55e' },
                  { label: 'GA Rate', value: fmtBA(selected.clutch.goAheadRBIRate) },
                  { label: 'Walk-Offs', value: String(selected.clutch.walkoffHits), color: selected.clutch.walkoffHits > 0 ? '#22c55e' : '#444' },
                  { label: 'Hi-Lev PA', value: String(selected.clutch.highLevPA) },
                  { label: 'Hi-Lev OPS', value: fmtOPS(selected.clutch.highLevOPS) },
                ] : [
                  { label: 'opp C&L BA', value: fmtBA(selected.clutch.closeAndLateBA) },
                  { label: 'opp C&L OPS', value: fmtOPS(selected.clutch.closeAndLateOPS) },
                  { label: 'opp RISP BA', value: fmtBA(selected.clutch.rispBA), color: selected.clutch.rispBA <= .200 ? '#22c55e' : selected.clutch.rispBA <= .250 ? '#eab308' : '#ef4444' },
                  { label: 'Save Conv', value: `${Math.round(selected.clutch.saveConversion * 100)}%`, color: selected.clutch.saveConversion >= .900 ? '#22c55e' : '#f97316' },
                  { label: 'Hi-Lev PA', value: String(selected.clutch.highLevPA) },
                  { label: 'Hi-Lev oOPS', value: fmtOPS(selected.clutch.highLevOPS) },
                  { label: 'Lev WAR', value: selected.clutch.leverageWAR.toFixed(1), color: '#f59e0b' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ color: m.color ?? '#e0e0e0', fontWeight: 600, fontSize: 13 }}>{m.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Composite Gauge */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>COMPOSITE CLUTCH SCORE</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: '#ef4444' }}>Choke (0)</span>
                  <span style={{ fontWeight: 700, color: ratingColor(selected.clutchRating) }}>
                    {selected.compositeClutchScore}
                  </span>
                  <span style={{ color: '#22c55e' }}>Ice Cold (100)</span>
                </div>
                <div style={{ width: '100%', height: 10, background: '#1f2937', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${selected.compositeClutchScore}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: `linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)`,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${selected.compositeClutchScore}%`,
                    top: -2,
                    width: 3,
                    height: 14,
                    background: '#fff',
                    borderRadius: 2,
                    transform: 'translateX(-50%)',
                  }} />
                </div>
              </div>

              {/* Highlights */}
              {selected.seasonHighlights.length > 0 && (
                <>
                  <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>SEASON HIGHLIGHTS</div>
                  <div style={{ padding: 8, background: '#0a0a1a', border: '1px solid #1f2937' }}>
                    {selected.seasonHighlights.map((h, hi) => (
                      <div key={hi} style={{ padding: '3px 0', color: '#ccc', fontSize: 11, borderBottom: hi < selected.seasonHighlights.length - 1 ? '1px solid #1f2937' : 'none' }}>
                        <span style={{ color: '#f59e0b', marginRight: 6 }}>--</span>
                        {h}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#555', background: '#111827', border: '1px solid #374151' }}>
              Select a player to view clutch performance breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
