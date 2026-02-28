/**
 * MiLBAffiliatesView – Minor league affiliate dashboard
 *
 * Bloomberg-terminal style MiLB overview with W-L records, top performers,
 * development scores, promotion activity, and level-by-level breakdowns.
 */
import { useState, useMemo } from 'react';
import {
  AffiliateTeam,
  getMiLBSummary,
  generateDemoMiLBAffiliates,
} from '../../engine/minors/milbAffiliates';

export default function MiLBAffiliatesView() {
  const affiliates = useMemo(() => generateDemoMiLBAffiliates(), []);
  const summary = useMemo(() => getMiLBSummary(affiliates), [affiliates]);
  const [selected, setSelected] = useState<AffiliateTeam | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        MINOR LEAGUE AFFILIATES — SYSTEM OVERVIEW
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'System W-L', value: `${summary.totalWins}-${summary.totalLosses}` },
          { label: 'Best Level', value: summary.bestLevel, color: '#22c55e' },
          { label: 'Playoff Teams', value: summary.playoffTeams, color: '#22c55e' },
          { label: 'Promotions', value: summary.promotionActivity },
          { label: 'Avg Dev Score', value: summary.avgDevScore },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>Level</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>W-L</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RD</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Dev</th>
                <th style={{ textAlign: 'center', padding: 6 }}>PO</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => {
                const winPct = a.wins / (a.wins + a.losses);
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === a.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{a.level}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{a.teamName}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: winPct >= 0.55 ? '#22c55e' : winPct <= 0.45 ? '#ef4444' : '#ccc' }}>
                      {a.wins}-{a.losses}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: a.runDiff >= 0 ? '#22c55e' : '#ef4444' }}>
                      {a.runDiff > 0 ? '+' : ''}{a.runDiff}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: a.devScore >= 80 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{a.devScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: a.playoffContender ? '#22c55e' : '#555' }}>
                      {a.playoffContender ? '✓' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.teamName}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.level} · {selected.league}</span>
              </div>
              <div style={{ color: selected.playoffContender ? '#22c55e' : '#888', fontWeight: 700, marginBottom: 12 }}>
                {selected.wins}-{selected.losses} ({(selected.wins / (selected.wins + selected.losses) * 100).toFixed(1)}%)
                {selected.playoffContender && <span style={{ color: '#22c55e', marginLeft: 8 }}>PLAYOFF CONTENDER</span>}
              </div>

              {/* Top Performers */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOP PERFORMERS</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: 8, border: '1px solid #333' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 2 }}>{selected.topHitter.name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{selected.topHitter.pos} {selected.topHitter.prospect ? '⭐' : ''}</div>
                  <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>{selected.topHitter.stat}</div>
                </div>
                <div style={{ flex: 1, padding: 8, border: '1px solid #333' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 2 }}>{selected.topPitcher.name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{selected.topPitcher.pos} {selected.topPitcher.prospect ? '⭐' : ''}</div>
                  <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>{selected.topPitcher.stat}</div>
                </div>
              </div>

              {/* Roster Moves */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ROSTER MOVEMENT</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>{selected.promotionsOut}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Promoted Up</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.promotionsIn}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Assigned In</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.devScore >= 80 ? '#22c55e' : '#ccc', fontWeight: 700, fontSize: 16 }}>{selected.devScore}/100</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Dev Score</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select an affiliate to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
