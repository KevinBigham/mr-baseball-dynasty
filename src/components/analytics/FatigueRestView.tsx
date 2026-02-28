import { useState, useMemo } from 'react';
import {
  generateDemoFatigueRest,
  FATIGUE_DISPLAY,
  URGENCY_DISPLAY,
  type FatigueData,
  type FatiguePlayer,
  type FatigueLevel,
  type PlayerType,
  type PerformanceCurve,
} from '../../engine/analytics/fatigueRestOptimizer';

const data: FatigueData = generateDemoFatigueRest();

function getFatigueColor(score: number): string {
  if (score <= 15) return '#22c55e';
  if (score <= 30) return '#4ade80';
  if (score <= 50) return '#f59e0b';
  if (score <= 70) return '#f97316';
  if (score <= 85) return '#ef4444';
  return '#dc2626';
}

function getRiskColor(mult: number): string {
  if (mult <= 1.3) return '#22c55e';
  if (mult <= 2.0) return '#f59e0b';
  if (mult <= 3.0) return '#f97316';
  return '#ef4444';
}

function FatigueBar({ score, width = 60 }: { score: number; width?: number }) {
  const color = getFatigueColor(score);
  return (
    <div style={{ width, height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
  );
}

function OVRDelta({ ovr, loss }: { ovr: number; loss: number }) {
  return (
    <span style={{ fontFamily: 'monospace' }}>
      <span style={{ fontWeight: 700, color: loss > 5 ? '#ef4444' : loss > 2 ? '#f59e0b' : '#e5e7eb' }}>{ovr}</span>
      {loss > 0 && (
        <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 2 }}>(-{loss})</span>
      )}
    </span>
  );
}

function PerformanceCurveChart({ curves }: { curves: PerformanceCurve[] }) {
  const chartW = 400;
  const chartH = 150;
  const padL = 35;
  const padB = 20;
  const padT = 10;
  const padR = 10;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padB - padT;

  return (
    <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
      <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>PERFORMANCE DECLINE CURVES</div>

      <svg width={chartW} height={chartH} style={{ overflow: 'visible' }}>
        {/* Y-axis labels */}
        {[1.0, 0.8, 0.6].map(v => {
          const y = padT + plotH * (1 - v);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#1f2937" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#4b5563" fontSize={8} fontFamily="monospace">{(v * 100).toFixed(0)}%</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 25, 50, 75, 100].map(f => {
          const x = padL + (f / 100) * plotW;
          return (
            <text key={f} x={x} y={chartH - 2} textAnchor="middle" fill="#4b5563" fontSize={8} fontFamily="monospace">{f}</text>
          );
        })}

        {/* Curve lines */}
        {curves.map(curve => {
          const pathData = curve.points.map((pt, i) => {
            const x = padL + (pt.fatigueLevel / 100) * plotW;
            const y = padT + plotH * (1 - pt.ovrMultiplier);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          return (
            <path key={curve.label} d={pathData} fill="none" stroke={curve.color} strokeWidth={2} opacity={0.8} />
          );
        })}

        {/* Danger zone overlay */}
        <rect x={padL + (70 / 100) * plotW} y={padT} width={(30 / 100) * plotW} height={plotH} fill="#ef444415" />

        {/* Axis labels */}
        <text x={padL + plotW / 2} y={chartH + 12} textAnchor="middle" fill="#6b7280" fontSize={9} fontFamily="monospace">Fatigue Level</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {curves.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 3, background: c.color, borderRadius: 2 }} />
            <span style={{ fontSize: 9, color: '#9ca3af' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerDetailPanel({ player }: { player: FatiguePlayer }) {
  const fatigueInfo = FATIGUE_DISPLAY[player.fatigueLevel];
  const urgencyInfo = URGENCY_DISPLAY[player.restUrgency];

  return (
    <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
      {/* Player header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{player.name}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
            {player.position} | Age {player.age} | {player.overall} OVR
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: getFatigueColor(player.fatigueScore), fontFamily: 'monospace' }}>
            {player.fatigueScore}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 8px',
            background: `${fatigueInfo.color}20`, color: fatigueInfo.color,
            border: `1px solid ${fatigueInfo.color}44`,
          }}>
            {fatigueInfo.label}
          </span>
        </div>
      </div>

      {/* Fatigue bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#6b7280' }}>FATIGUE LEVEL</span>
          <span style={{ fontSize: 10, color: getFatigueColor(player.fatigueScore), fontWeight: 700 }}>{player.fatigueScore}/100</span>
        </div>
        <div style={{ height: 12, background: '#1f2937', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${player.fatigueScore}%`, height: '100%', background: getFatigueColor(player.fatigueScore), borderRadius: 6, transition: 'width 0.3s' }} />
          {/* Threshold markers */}
          {[30, 50, 70, 85].map(threshold => (
            <div key={threshold} style={{
              position: 'absolute', left: `${threshold}%`, top: 0, bottom: 0,
              width: 1, background: '#374151',
            }} />
          ))}
        </div>
      </div>

      {/* Key metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'CURRENT OVR', value: `${player.currentOVR}`, sub: player.ovrLoss > 0 ? `(-${player.ovrLoss} from fatigue)` : 'No impact', color: player.ovrLoss > 5 ? '#ef4444' : player.ovrLoss > 2 ? '#f59e0b' : '#22c55e' },
          { label: 'PERF MULT', value: `${(player.performanceMultiplier * 100).toFixed(1)}%`, sub: player.performanceMultiplier >= 0.95 ? 'Performing at peak' : 'Decline detected', color: player.performanceMultiplier >= 0.95 ? '#22c55e' : player.performanceMultiplier >= 0.85 ? '#f59e0b' : '#ef4444' },
          { label: 'INJURY RISK', value: `${player.injuryRiskMultiplier.toFixed(1)}x`, sub: `History: ${player.injuryHistory}/5`, color: getRiskColor(player.injuryRiskMultiplier) },
        ].map(m => (
          <div key={m.label} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
            <div style={{ fontSize: 8, color: '#4b5563', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Workload details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10 }}>
          <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 6 }}>WORKLOAD</div>
          {[
            { label: 'Games Played', value: `${player.gamesPlayed}` },
            { label: 'Consecutive', value: `${player.consecutiveGames} games` },
            { label: 'Days Since Rest', value: `${player.daysSinceRest}` },
            { label: 'Season Workload', value: `${player.seasonWorkload}%` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>{row.label}</span>
              <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700, fontFamily: 'monospace' }}>{row.value}</span>
            </div>
          ))}
          {player.playerType !== 'hitter' && player.pitchCount7Day !== undefined && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>7-Day Pitch Count</span>
                <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700, fontFamily: 'monospace' }}>{player.pitchCount7Day}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Season IP</span>
                <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700, fontFamily: 'monospace' }}>{player.inningsPitched}</span>
              </div>
            </>
          )}
          {player.playerType === 'hitter' && player.plateAppearances !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>Plate Appearances</span>
              <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700, fontFamily: 'monospace' }}>{player.plateAppearances}</span>
            </div>
          )}
        </div>

        <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10 }}>
          <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 6 }}>REST RECOMMENDATION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px',
              background: `${urgencyInfo.color}20`, color: urgencyInfo.color,
              border: `1px solid ${urgencyInfo.color}44`,
            }}>
              {urgencyInfo.label}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Rest Days Needed</span>
            <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700, fontFamily: 'monospace' }}>{player.recommendedRestDays}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Next Rest</span>
            <span style={{ fontSize: 10, color: urgencyInfo.color, fontWeight: 700, fontFamily: 'monospace' }}>{player.nextSuggestedRest}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FatigueRestView() {
  const [tab, setTab] = useState<'roster' | 'schedule' | 'curves'>('roster');
  const [selectedPlayerId, setSelectedPlayerId] = useState(data.players[0].id);
  const [typeFilter, setTypeFilter] = useState<'all' | PlayerType>('all');
  const [sortBy, setSortBy] = useState<'fatigue' | 'urgency' | 'name' | 'ovr'>('fatigue');

  const selectedPlayer = useMemo(() => data.players.find(p => p.id === selectedPlayerId)!, [selectedPlayerId]);

  const filteredPlayers = useMemo(() => {
    let list = typeFilter === 'all' ? data.players : data.players.filter(p => p.playerType === typeFilter);
    switch (sortBy) {
      case 'fatigue': list = [...list].sort((a, b) => b.fatigueScore - a.fatigueScore); break;
      case 'urgency': {
        const order: Record<string, number> = { mandatory: 0, urgent: 1, recommended: 2, optional: 3, none: 4 };
        list = [...list].sort((a, b) => order[a.restUrgency] - order[b.restUrgency]);
        break;
      }
      case 'name': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'ovr': list = [...list].sort((a, b) => b.overall - a.overall); break;
    }
    return list;
  }, [typeFilter, sortBy]);

  const seasonPct = Math.round((data.gamesIntoSeason / data.totalGames) * 100);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>FATIGUE & REST OPTIMIZER</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>
            Game {data.gamesIntoSeason}/{data.totalGames} ({seasonPct}% of season) | Team avg fatigue: {data.teamFatigueAvg}/100
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['roster', 'schedule', 'curves'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 14px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
              border: '1px solid', borderColor: tab === t ? '#f59e0b' : '#374151',
              background: tab === t ? '#78350f' : 'transparent',
              color: tab === t ? '#f59e0b' : '#9ca3af',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'TEAM FATIGUE', value: `${data.teamFatigueAvg}`, color: getFatigueColor(data.teamFatigueAvg) },
          { label: 'FRESH/RESTED', value: `${data.freshCount}`, color: '#22c55e' },
          { label: 'TIRED/EXHAUSTED', value: `${data.tiredCount}`, color: '#f97316' },
          { label: 'DANGER ZONE', value: `${data.dangerCount}`, color: '#ef4444' },
        ].map(card => (
          <div key={card.label} style={{ background: '#111827', border: '1px solid #374151', padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: 'monospace' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {tab === 'roster' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left: player list */}
          <div style={{ border: '1px solid #374151', background: '#111827' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', flexWrap: 'wrap' }}>
              {([
                { key: 'all', label: 'ALL' },
                { key: 'hitter', label: 'HITTERS' },
                { key: 'starter', label: 'STARTERS' },
                { key: 'reliever', label: 'RELIEVERS' },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
                  padding: '3px 8px', fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: typeFilter === f.key ? '#f59e0b' : '#374151',
                  background: typeFilter === f.key ? '#78350f' : 'transparent',
                  color: typeFilter === f.key ? '#f59e0b' : '#6b7280',
                }}>
                  {f.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {([
                { key: 'fatigue', label: 'FATIGUE' },
                { key: 'urgency', label: 'URGENCY' },
                { key: 'ovr', label: 'OVR' },
              ] as const).map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                  padding: '3px 8px', fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: sortBy === s.key ? '#60a5fa' : '#374151',
                  background: sortBy === s.key ? '#1e3a5f' : 'transparent',
                  color: sortBy === s.key ? '#60a5fa' : '#6b7280',
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ overflow: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151' }}>
                    {['PLAYER', 'POS', 'OVR', 'FATIGUE', 'STATUS', 'REST'].map(h => (
                      <th key={h} style={{
                        padding: '6px 6px', color: '#6b7280', fontWeight: 700, fontSize: 9,
                        textAlign: h === 'PLAYER' ? 'left' : 'center', letterSpacing: 1,
                        position: 'sticky', top: 0, background: '#111827', zIndex: 1,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(p => {
                    const fatigueInfo = FATIGUE_DISPLAY[p.fatigueLevel];
                    const urgencyInfo = URGENCY_DISPLAY[p.restUrgency];
                    const isSelected = p.id === selectedPlayerId;
                    return (
                      <tr key={p.id} onClick={() => setSelectedPlayerId(p.id)} style={{
                        cursor: 'pointer', background: isSelected ? '#1e3a5f' : 'transparent',
                        borderBottom: '1px solid #1f293744',
                      }}>
                        <td style={{ padding: '5px 6px', fontWeight: 700, color: isSelected ? '#f59e0b' : '#e5e7eb' }}>{p.name}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', color: '#6b7280' }}>{p.position}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                          <OVRDelta ovr={p.currentOVR} loss={p.ovrLoss} />
                        </td>
                        <td style={{ padding: '5px 6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <FatigueBar score={p.fatigueScore} width={40} />
                            <span style={{ fontSize: 10, color: getFatigueColor(p.fatigueScore), fontWeight: 700, width: 20, textAlign: 'right' }}>{p.fatigueScore}</span>
                          </div>
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: fatigueInfo.color }}>{fatigueInfo.label}</span>
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 8, fontWeight: 700, padding: '1px 4px',
                            background: `${urgencyInfo.color}20`, color: urgencyInfo.color,
                            border: `1px solid ${urgencyInfo.color}33`,
                          }}>
                            {urgencyInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: detail panel */}
          <div>
            <PlayerDetailPanel player={selectedPlayer} />
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>7-DAY REST SCHEDULE OPTIMIZATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {data.restSchedule.map(day => (
              <div key={day.dayLabel} style={{
                border: '1px solid #374151', background: '#111827', padding: 12,
                borderColor: day.isDoubleHeader ? '#f59e0b44' : '#374151',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>{day.dayOfWeek}</div>
                <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{day.dayLabel}</div>
                <div style={{ fontSize: 9, color: '#60a5fa', marginBottom: 8 }}>
                  {day.opponent}
                  {day.isDoubleHeader && <span style={{ color: '#f59e0b', marginLeft: 4 }}>DH</span>}
                </div>

                <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
                  {day.availableCount}/{day.totalRosterSize} available
                </div>

                {day.restingPlayers.length > 0 ? (
                  <div style={{ borderTop: '1px solid #1f2937', paddingTop: 6 }}>
                    <div style={{ fontSize: 8, color: '#ef4444', letterSpacing: 1, marginBottom: 4 }}>RESTING</div>
                    {day.restingPlayers.map(rp => (
                      <div key={rp.id} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700 }}>{rp.name}</div>
                        <div style={{ fontSize: 8, color: '#6b7280' }}>{rp.position} - {rp.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid #1f2937', paddingTop: 6 }}>
                    <div style={{ fontSize: 9, color: '#22c55e' }}>Full roster available</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rest distribution summary */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>REST DISTRIBUTION — PLAYERS NEEDING REST</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data.players.filter(p => p.recommendedRestDays > 0).sort((a, b) => b.fatigueScore - a.fatigueScore).map(p => {
                const fatigueInfo = FATIGUE_DISPLAY[p.fatigueLevel];
                return (
                  <div key={p.id} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: '6px 10px', minWidth: 140 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb' }}>{p.name}</span>
                      <span style={{ fontSize: 9, color: fatigueInfo.color, fontWeight: 700 }}>{p.fatigueScore}</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>{p.position} | {p.recommendedRestDays} day{p.recommendedRestDays > 1 ? 's' : ''} rest</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'curves' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Performance curve chart */}
            <PerformanceCurveChart curves={data.performanceCurves} />

            {/* Injury risk chart */}
            <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
              <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>INJURY RISK MULTIPLIER BY FATIGUE</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {data.performanceCurves[0].points.map(pt => {
                  const h = Math.min(110, (pt.injuryRisk / 4) * 110);
                  return (
                    <div key={pt.fatigueLevel} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: Math.max(3, h),
                        background: getRiskColor(pt.injuryRisk),
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.7,
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 8, color: '#6b7280' }}>0 (Fresh)</span>
                <span style={{ fontSize: 8, color: '#6b7280' }}>100 (Depleted)</span>
              </div>
              <div style={{ fontSize: 9, color: '#4b5563', marginTop: 8, lineHeight: 1.5 }}>
                Injury risk increases exponentially with fatigue. Players over 70 fatigue face 2x+ baseline risk.
                Age and injury history compound the effect further.
              </div>
            </div>
          </div>

          {/* Fatigue factor reference */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>FATIGUE LEVEL REFERENCE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {(Object.entries(FATIGUE_DISPLAY) as [FatigueLevel, { label: string; color: string }][]).map(([level, info]) => {
                const ranges: Record<FatigueLevel, string> = {
                  fresh: '0-15', rested: '16-30', normal: '31-50',
                  tired: '51-70', exhausted: '71-85', danger: '86-100',
                };
                const effects: Record<FatigueLevel, string> = {
                  fresh: 'Peak performance. No impact.',
                  rested: 'Minimal fatigue. Negligible effect.',
                  normal: 'Standard workload. Slight decline possible.',
                  tired: 'Notable fatigue. -3 to -6 OVR. Rest recommended.',
                  exhausted: 'Severe fatigue. -8 to -12 OVR. Injury risk elevated.',
                  danger: 'Critical fatigue. -15+ OVR. High injury risk. Mandatory rest.',
                };
                return (
                  <div key={level} style={{ background: '#0a0f1a', border: `1px solid ${info.color}33`, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: info.color, marginBottom: 4 }}>{info.label}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{ranges[level]}</div>
                    <div style={{ fontSize: 9, color: '#4b5563', lineHeight: 1.4 }}>{effects[level]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current roster fatigue distribution */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>ROSTER FATIGUE DISTRIBUTION</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
              {data.players.sort((a, b) => a.fatigueScore - b.fatigueScore).map(p => {
                const h = (p.fatigueScore / 100) * 75;
                return (
                  <div key={p.id} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => { setSelectedPlayerId(p.id); setTab('roster'); }}
                    title={`${p.name}: ${p.fatigueScore}`}
                  >
                    <div style={{
                      height: Math.max(3, h),
                      background: getFatigueColor(p.fatigueScore),
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.8,
                    }} />
                    <div style={{ fontSize: 7, color: '#4b5563', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {p.position}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
