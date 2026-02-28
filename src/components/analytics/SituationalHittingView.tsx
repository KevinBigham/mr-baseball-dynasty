/**
 * SituationalHittingView – Situational performance splits dashboard
 *
 * Bloomberg-terminal style view showing RISP, bases loaded,
 * 2-out, and late-close performance with clutch ratings.
 */
import { useState, useMemo } from 'react';
import {
  SituationalPlayer,
  CLUTCH_DISPLAY,
  getSituationalSummary,
  generateDemoSituational,
} from '../../engine/analytics/situationalHitting';

export default function SituationalHittingView() {
  const players = useMemo(() => generateDemoSituational(), []);
  const summary = useMemo(() => getSituationalSummary(players), [players]);
  const [selected, setSelected] = useState<SituationalPlayer | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SITUATIONAL HITTING — CLUTCH PERFORMANCE
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team RISP AVG', value: summary.teamRISPAvg.toFixed(3) },
          { label: 'Bases Loaded AVG', value: summary.teamBasesLoadedAvg.toFixed(3) },
          { label: 'Lockdown Hitters', value: summary.lockdownCount, color: '#22c55e' },
          { label: 'Choke Artists', value: summary.chokesCount, color: '#ef4444' },
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
                <th style={{ textAlign: 'center', padding: 6 }}>AVG</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RISP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RBI Eff</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Walk-Off</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Clutch</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const cr = CLUTCH_DISPLAY[p.clutchRating];
                const rispSplit = p.splits.find(s => s.situation === 'RISP');
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
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.overallAvg.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: (rispSplit?.avg ?? 0) >= .300 ? '#22c55e' : '#ccc' }}>{rispSplit?.avg.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.rbiEfficiency}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.walkOffHits}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: cr.color, fontWeight: 600 }}>{cr.emoji} {cr.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: CLUTCH_DISPLAY[selected.clutchRating].color, fontWeight: 700, marginBottom: 12 }}>
                {CLUTCH_DISPLAY[selected.clutchRating].emoji} {CLUTCH_DISPLAY[selected.clutchRating].label} Performer
              </div>

              {/* Highlight stats */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: '2-Out RBI', value: selected.twoOutRBI },
                  { label: 'Go-Ahead RBI', value: selected.goAheadRBI },
                  { label: 'Walk-Off Hits', value: selected.walkOffHits },
                  { label: 'RBI Efficiency', value: `${selected.rbiEfficiency}%` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Splits Table */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SITUATIONAL SPLITS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Situation</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>PA</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>AVG</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>OBP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>SLG</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>K%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.splits.map(sp => (
                    <tr key={sp.situation} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{sp.situation}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{sp.pa}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: sp.avg >= .300 ? '#22c55e' : sp.avg < .220 ? '#ef4444' : '#ccc' }}>{sp.avg.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{sp.obp.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{sp.slg.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: sp.kRate > 22 ? '#ef4444' : '#ccc' }}>{sp.kRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view situational splits
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
