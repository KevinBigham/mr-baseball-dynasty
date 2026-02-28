/**
 * ArbProjectionsView – Salary arbitration projections dashboard
 *
 * Bloomberg-terminal style arb projection tracker with
 * filing ranges, comparable players, and outcome predictions.
 */
import { useState, useMemo } from 'react';
import {
  ArbPlayer,
  FILING_DISPLAY,
  getArbSummary,
  generateDemoArbProjections,
} from '../../engine/contracts/arbProjections';

export default function ArbProjectionsView() {
  const players = useMemo(() => generateDemoArbProjections(), []);
  const summary = useMemo(() => getArbSummary(players), [players]);
  const [selected, setSelected] = useState<ArbPlayer | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        ARBITRATION PROJECTIONS — SALARY FILINGS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Arb Eligible', value: summary.totalEligible },
          { label: 'Projected Total', value: `$${summary.projectedTotal}M` },
          { label: 'Avg Raise', value: `${summary.avgRaise}%`, color: '#f97316' },
          { label: 'Pending', value: summary.pendingCount, color: '#eab308' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Player List ── */}
        <div style={{ flex: '1 1 420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Arb Yr</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Current</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Projected</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const fo = FILING_DISPLAY[p.likelyOutcome];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.arbYear.replace('arb', 'Arb ').replace('super2', 'Super 2')}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>${p.currentSalary}M</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${p.projectedSalary}M</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.recentWAR}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: fo.color }}>{fo.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · Age {selected.age} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: '#888', marginBottom: 12, fontSize: 11 }}>
                Service Time: {selected.serviceTime} · {selected.arbYear.replace('arb', 'Arb ').replace('super2', 'Super 2')}
              </div>

              {/* Filing Range */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>FILING RANGE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>${selected.teamFiling}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Team</div>
                </div>
                <div style={{ flex: 1, height: 12, background: '#111', borderRadius: 6, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    background: '#f59e0b', width: 12, height: 12, borderRadius: '50%', zIndex: 2,
                  }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '2px solid #333' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>${selected.playerFiling}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Player</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ color: '#888' }}>Projected Settlement: </span>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>${selected.midpoint}M</span>
              </div>

              {/* Key Stats */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>KEY STATS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(selected.keyStats).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700 }}>{v}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{k}</div>
                  </div>
                ))}
              </div>

              {/* Comparables */}
              {selected.comparables.length > 0 && (
                <>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>COMPARABLE FILINGS</div>
                  {selected.comparables.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
                      <span>{c.name} ({c.year})</span>
                      <span style={{ color: '#f59e0b' }}>${c.salary}M · {c.war} WAR</span>
                    </div>
                  ))}
                </>
              )}

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4, marginTop: 12 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view arbitration projection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
