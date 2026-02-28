/**
 * MiLBStandingsView – Minor League Standings dashboard
 *
 * Bloomberg-terminal style standings view with level selector tabs (AAA, AA, A+, A),
 * standings table per level with W-L, PCT, GB, streak, and detail panel
 * with prospect info and team notes.
 */
import { useState, useMemo } from 'react';
import {
  MinorLeagueLevel,
  MiLBTeamRecord,
  MiLBStandingsData,
  getMiLBStandingsSummary,
  generateDemoMiLBStandings,
} from '../../engine/minors/minorLeagueStandings';

export default function MiLBStandingsView() {
  const levels = useMemo(() => generateDemoMiLBStandings(), []);
  const summary = useMemo(() => getMiLBStandingsSummary(levels), [levels]);
  const [activeLevel, setActiveLevel] = useState<MinorLeagueLevel>('AAA');
  const [selected, setSelected] = useState<MiLBTeamRecord | null>(null);

  const currentLevel: MiLBStandingsData | undefined = levels.find(l => l.level === activeLevel);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        MINOR LEAGUE STANDINGS — ALL LEVELS
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Teams', value: summary.totalTeams },
          { label: 'Best Record', value: `${summary.bestRecord.name}`, color: '#22c55e' },
          { label: 'Best PCT', value: summary.bestRecord.pct.toFixed(3), color: '#22c55e' },
          { label: 'Worst Record', value: `${summary.worstRecord.name}`, color: '#ef4444' },
          { label: 'Longest Streak', value: `${summary.longestStreak.name} (${summary.longestStreak.streak})`, color: summary.longestStreak.streak.startsWith('W') ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 14, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Level Selector Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['AAA', 'AA', 'A+', 'A'] as MinorLeagueLevel[]).map(lvl => (
          <button
            key={lvl}
            onClick={() => { setActiveLevel(lvl); setSelected(null); }}
            style={{
              padding: '5px 16px',
              fontSize: 12,
              fontFamily: 'monospace',
              background: activeLevel === lvl ? '#f59e0b' : '#1a1a2e',
              color: activeLevel === lvl ? '#000' : '#888',
              border: '1px solid #333',
              cursor: 'pointer',
              fontWeight: activeLevel === lvl ? 700 : 400,
            }}
          >
            {lvl}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Standings Table */}
        <div style={{ flex: '1 1 520px' }}>
          {currentLevel && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                  <th style={{ textAlign: 'center', padding: 6, width: 30 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Parent</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>W</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>L</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>PCT</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>GB</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Strk</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>L10</th>
                </tr>
              </thead>
              <tbody>
                {currentLevel.teams.map((t, i) => {
                  const isWinning = t.pct >= 0.550;
                  const isLosing = t.pct < 0.450;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(t)}
                      style={{
                        borderBottom: '1px solid #222',
                        cursor: 'pointer',
                        background: selected?.id === t.id ? '#1a1a3e' : 'transparent',
                      }}
                    >
                      <td style={{ padding: 6, textAlign: 'center', color: '#555' }}>{i + 1}</td>
                      <td style={{ padding: 6, fontWeight: 700, color: isWinning ? '#22c55e' : isLosing ? '#ef4444' : '#ccc' }}>
                        {t.teamName}
                      </td>
                      <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{t.parentClub}</td>
                      <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{t.wins}</td>
                      <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{t.losses}</td>
                      <td style={{
                        padding: 6, textAlign: 'center', fontWeight: 700,
                        color: isWinning ? '#22c55e' : isLosing ? '#ef4444' : '#ccc',
                      }}>
                        {t.pct.toFixed(3)}
                      </td>
                      <td style={{ padding: 6, textAlign: 'center', color: t.gb === 0 ? '#f59e0b' : '#888' }}>
                        {t.gb === 0 ? '—' : t.gb.toFixed(1)}
                      </td>
                      <td style={{
                        padding: 6, textAlign: 'center', fontWeight: 700,
                        color: t.streak.startsWith('W') ? '#22c55e' : '#ef4444',
                      }}>
                        {t.streak}
                      </td>
                      <td style={{ padding: 6, textAlign: 'center', color: '#ccc' }}>{t.lastTen}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.teamName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.level} — {selected.parentClub}
                </span>
              </div>

              {/* Record */}
              <div style={{
                fontWeight: 700, fontSize: 18, marginBottom: 12,
                color: selected.pct >= 0.550 ? '#22c55e' : selected.pct < 0.450 ? '#ef4444' : '#ccc',
              }}>
                {selected.wins}-{selected.losses}
                <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                  ({selected.pct.toFixed(3)})
                </span>
                {selected.gb > 0 && (
                  <span style={{ color: '#666', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                    {selected.gb.toFixed(1)} GB
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Streak', value: selected.streak, color: selected.streak.startsWith('W') ? '#22c55e' : '#ef4444' },
                  { label: 'Last 10', value: selected.lastTen, color: '#ccc' },
                  { label: 'Parent', value: selected.parentClub, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top Prospect */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOP PROSPECT</div>
              <div className="bloomberg-border" style={{ padding: '8px 12px', marginBottom: 14 }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>{selected.topProspect}</div>
                <div style={{ color: '#666', fontSize: 10 }}>Top-ranked prospect at this level</div>
              </div>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
