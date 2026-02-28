/**
 * TeamWinSharesView – Team Win Shares Breakdown Dashboard
 *
 * Bloomberg-terminal style breakdown of team wins into individual player
 * contributions using the Bill James Win Shares model. Shows batting,
 * pitching, and fielding shares with salary value analysis and league leaders.
 */
import { useState, useMemo } from 'react';
import {
  PlayerWinShares,
  VALUE_DISPLAY,
  wsColor,
  costColor,
  getWinSharesSummary,
  generateDemoTeamWinShares,
} from '../../engine/analytics/teamWinShares';

const PANEL = '#111827';
const BORDER = '#374151';
const ACCENT = '#f59e0b';
const BG = '#030712';

type SortKey = 'totalWS' | 'battingWS' | 'pitchingWS' | 'fieldingWS' | 'salary' | 'costPerWS';
type LeaderCategory = 'overall' | 'batting' | 'pitching' | 'fielding';

export default function TeamWinSharesView() {
  const data = useMemo(() => generateDemoTeamWinShares(), []);
  const summary = useMemo(() => getWinSharesSummary(data), [data]);
  const [sortBy, setSortBy] = useState<SortKey>('totalWS');
  const [leaderCat, setLeaderCat] = useState<LeaderCategory>('overall');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWinShares | null>(null);

  const sortedPlayers = useMemo(() => {
    const copy = [...data.players];
    if (sortBy === 'costPerWS') return copy.sort((a, b) => a.costPerWS - b.costPerWS);
    return copy.sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [data.players, sortBy]);

  const filteredLeaders = useMemo(
    () => data.leagueLeaders.filter(l => l.category === leaderCat),
    [data.leagueLeaders, leaderCat],
  );

  const renderShareBar = (bat: number, pitch: number, field: number, total: number) => {
    if (total === 0) return null;
    const batPct = (bat / total) * 100;
    const pitchPct = (pitch / total) * 100;
    const fieldPct = (field / total) * 100;
    return (
      <div style={{ display: 'flex', height: 8, borderRadius: 2, overflow: 'hidden', background: '#1f2937' }}>
        {batPct > 0 && <div style={{ width: `${batPct}%`, background: '#3b82f6' }} title={`Batting: ${bat}`} />}
        {pitchPct > 0 && <div style={{ width: `${pitchPct}%`, background: '#ef4444' }} title={`Pitching: ${pitch}`} />}
        {fieldPct > 0 && <div style={{ width: `${fieldPct}%`, background: '#22c55e' }} title={`Fielding: ${field}`} />}
      </div>
    );
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      onClick={() => setSortBy(field)}
      style={{
        textAlign: 'center', padding: '6px 8px', cursor: 'pointer',
        color: sortBy === field ? ACCENT : '#6b7280',
        borderBottom: sortBy === field ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
      }}
    >
      {label} {sortBy === field ? '▼' : ''}
    </th>
  );

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 13, background: BG, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: `1px solid ${BORDER}`, paddingBottom: 10 }}>
        <div>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>TEAM WIN SHARES BREAKDOWN</span>
          <span style={{ color: '#6b7280', marginLeft: 12, fontSize: 11 }}>{data.teamName} ({data.teamAbbr}) // {data.teamWins}-{data.teamLosses}</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: 10 }}>BILL JAMES WIN SHARES MODEL</span>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team Wins', value: summary.teamWins, color: ACCENT },
          { label: 'Total Win Shares', value: summary.totalWS.toFixed(1), color: '#22c55e' },
          { label: 'Batting WS', value: `${summary.battingPct}%`, color: '#3b82f6' },
          { label: 'Pitching WS', value: `${summary.pitchingPct}%`, color: '#ef4444' },
          { label: 'Fielding WS', value: `${summary.fieldingPct}%`, color: '#22c55e' },
          { label: 'Top Contributor', value: summary.topContributor, sub: `${summary.topContributorWS} WS`, color: ACCENT },
          { label: 'Best Value', value: summary.bestValuePlayer, color: '#22c55e' },
          { label: 'Worst Value', value: summary.worstValuePlayer, color: '#ef4444' },
          { label: 'Avg $/WS', value: `$${summary.avgCostPerWS}M`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 12px', border: `1px solid ${BORDER}`, background: PANEL, minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: typeof s.value === 'number' ? 18 : 13, fontWeight: 700 }}>{s.value}</div>
            {'sub' in s && s.sub && <div style={{ color: '#6b7280', fontSize: 9 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Team WS Distribution Bar */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Win Shares Distribution
        </div>
        <div style={{ display: 'flex', height: 24, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${summary.battingPct}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            BAT {data.totalBattingWS.toFixed(1)}
          </div>
          <div style={{ width: `${summary.pitchingPct}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            PITCH {data.totalPitchingWS.toFixed(1)}
          </div>
          <div style={{ width: `${summary.fieldingPct}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            FIELD {data.totalFieldingWS.toFixed(1)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#9ca3af' }}>
          <span><span style={{ color: '#3b82f6' }}>■</span> Batting</span>
          <span><span style={{ color: '#ef4444' }}>■</span> Pitching</span>
          <span><span style={{ color: '#22c55e' }}>■</span> Fielding</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Main Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Player Win Shares (click column to sort)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>Player</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>Pos</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>GP</th>
                    <SortHeader label="Total" field="totalWS" />
                    <SortHeader label="Bat" field="battingWS" />
                    <SortHeader label="Pitch" field="pitchingWS" />
                    <SortHeader label="Field" field="fieldingWS" />
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, color: '#6b7280', minWidth: 100 }}>Split</th>
                    <SortHeader label="Salary" field="salary" />
                    <SortHeader label="$/WS" field="costPerWS" />
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, color: '#6b7280' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      style={{
                        borderBottom: '1px solid #1f2937',
                        cursor: 'pointer',
                        background: selectedPlayer?.id === p.id ? '#1e293b' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: p.isOverperformer ? '#22c55e' : p.isUnderperformer ? '#ef4444' : '#e5e7eb' }}>
                        {p.name}
                        {p.isOverperformer && <span style={{ color: '#22c55e', fontSize: 9, marginLeft: 4 }}>▲ OVER</span>}
                        {p.isUnderperformer && <span style={{ color: '#ef4444', fontSize: 9, marginLeft: 4 }}>▼ UNDER</span>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: '#9ca3af' }}>{p.position}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280' }}>{p.gamesPlayed}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: wsColor(p.totalWS), fontWeight: 700, fontSize: 13 }}>{p.totalWS.toFixed(1)}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: p.battingWS > 0 ? '#3b82f6' : '#374151' }}>{p.battingWS.toFixed(1)}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: p.pitchingWS > 0 ? '#ef4444' : '#374151' }}>{p.pitchingWS.toFixed(1)}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: p.fieldingWS > 0 ? '#22c55e' : '#374151' }}>{p.fieldingWS.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px' }}>{renderShareBar(p.battingWS, p.pitchingWS, p.fieldingWS, p.totalWS)}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: '#d1d5db' }}>${p.salary.toFixed(1)}M</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: costColor(p.costPerWS), fontWeight: 600 }}>${p.costPerWS.toFixed(2)}M</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                        <span style={{ color: VALUE_DISPLAY[p.valueRating].color, fontSize: 10 }}>
                          {VALUE_DISPLAY[p.valueRating].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Player Detail Card */}
          {selectedPlayer && (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 14, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>{selectedPlayer.name}</span>
                  <span style={{ color: '#6b7280', marginLeft: 10, fontSize: 11 }}>{selectedPlayer.position} | {selectedPlayer.gamesPlayed} GP</span>
                </div>
                <span style={{ color: VALUE_DISPLAY[selectedPlayer.valueRating].color, fontWeight: 700, fontSize: 12, padding: '3px 8px', border: `1px solid ${VALUE_DISPLAY[selectedPlayer.valueRating].color}40` }}>
                  {VALUE_DISPLAY[selectedPlayer.valueRating].label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Total WS', value: selectedPlayer.totalWS.toFixed(1), color: wsColor(selectedPlayer.totalWS) },
                  { label: 'Batting WS', value: selectedPlayer.battingWS.toFixed(1), color: '#3b82f6' },
                  { label: 'Pitching WS', value: selectedPlayer.pitchingWS.toFixed(1), color: '#ef4444' },
                  { label: 'Fielding WS', value: selectedPlayer.fieldingWS.toFixed(1), color: '#22c55e' },
                  { label: 'Salary', value: `$${selectedPlayer.salary.toFixed(1)}M`, color: '#d1d5db' },
                  { label: 'Cost per WS', value: `$${selectedPlayer.costPerWS.toFixed(2)}M`, color: costColor(selectedPlayer.costPerWS) },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#0f172a', borderRadius: 2 }}>
                    <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 4 }}>Win Share Composition</div>
                <div style={{ height: 16, borderRadius: 3, overflow: 'hidden', display: 'flex', background: '#1f2937' }}>
                  {selectedPlayer.battingWS > 0 && (
                    <div style={{ width: `${(selectedPlayer.battingWS / selectedPlayer.totalWS) * 100}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                      {((selectedPlayer.battingWS / selectedPlayer.totalWS) * 100).toFixed(0)}%
                    </div>
                  )}
                  {selectedPlayer.pitchingWS > 0 && (
                    <div style={{ width: `${(selectedPlayer.pitchingWS / selectedPlayer.totalWS) * 100}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                      {((selectedPlayer.pitchingWS / selectedPlayer.totalWS) * 100).toFixed(0)}%
                    </div>
                  )}
                  {selectedPlayer.fieldingWS > 0 && (
                    <div style={{ width: `${(selectedPlayer.fieldingWS / selectedPlayer.totalWS) * 100}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                      {((selectedPlayer.fieldingWS / selectedPlayer.totalWS) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: League Leaders */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              League Leaders
            </div>
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
              {(['overall', 'batting', 'pitching', 'fielding'] as LeaderCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setLeaderCat(cat)}
                  style={{
                    flex: 1, padding: '6px 4px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                    background: leaderCat === cat ? '#1e293b' : 'transparent',
                    color: leaderCat === cat ? ACCENT : '#6b7280',
                    border: 'none', borderBottom: leaderCat === cat ? `2px solid ${ACCENT}` : 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ padding: 0 }}>
              {filteredLeaders.map((l, i) => (
                <div
                  key={`${l.category}-${l.rank}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderBottom: '1px solid #1f2937',
                    background: l.team === data.teamAbbr ? '#1e293b' : 'transparent',
                  }}
                >
                  <span style={{ color: i === 0 ? ACCENT : '#6b7280', fontWeight: 700, width: 20, textAlign: 'center', fontSize: 12 }}>
                    {l.rank}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: l.team === data.teamAbbr ? ACCENT : '#e5e7eb', fontSize: 11 }}>
                      {l.name}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>{l.team} / {l.position}</div>
                  </div>
                  <span style={{ color: wsColor(l.categoryWS), fontWeight: 700, fontSize: 13 }}>
                    {l.categoryWS.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overperformers & Underperformers */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, marginTop: 12 }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Value Outliers
            </div>
            <div style={{ padding: '8px 12px' }}>
              <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>OVERPERFORMERS</div>
              {data.players.filter(p => p.isOverperformer).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid #0f172a' }}>
                  <span style={{ color: '#d1d5db' }}>{p.name}</span>
                  <span style={{ color: '#22c55e' }}>{p.totalWS.toFixed(1)} WS / ${p.salary.toFixed(1)}M</span>
                </div>
              ))}
              {data.players.filter(p => p.isOverperformer).length === 0 && (
                <div style={{ color: '#4b5563', fontSize: 10 }}>None identified</div>
              )}

              <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 600, marginTop: 10, marginBottom: 4 }}>UNDERPERFORMERS</div>
              {data.players.filter(p => p.isUnderperformer).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid #0f172a' }}>
                  <span style={{ color: '#d1d5db' }}>{p.name}</span>
                  <span style={{ color: '#ef4444' }}>{p.totalWS.toFixed(1)} WS / ${p.salary.toFixed(1)}M</span>
                </div>
              ))}
              {data.players.filter(p => p.isUnderperformer).length === 0 && (
                <div style={{ color: '#4b5563', fontSize: 10 }}>None identified</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
