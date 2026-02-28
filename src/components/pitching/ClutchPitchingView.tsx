/**
 * ClutchPitchingView – Clutch pitching index dashboard
 *
 * Bloomberg-terminal style clutch pitcher evaluator with high-leverage
 * splits, RISP performance, composure grades, and situational breakdowns.
 */
import { useState, useMemo } from 'react';
import {
  ClutchPitcherProfile,
  COMPOSURE_DISPLAY,
  getClutchPitchingSummary,
  generateDemoClutchPitching,
} from '../../engine/pitching/clutchPitchingIndex';

export default function ClutchPitchingView() {
  const pitchers = useMemo(() => generateDemoClutchPitching(), []);
  const summary = useMemo(() => getClutchPitchingSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<ClutchPitcherProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CLUTCH PITCHING INDEX — PRESSURE PERFORMANCE
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Best Clutch', value: summary.bestClutch, color: '#22c55e' },
          { label: 'Worst Clutch', value: summary.worstClutch, color: '#ef4444' },
          { label: 'Avg Clutch Score', value: summary.avgClutchScore },
          { label: 'Ice Cold', value: summary.iceCount, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Clutch</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Hi-LI ERA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>RISP BA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Composure</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => {
                const cd = COMPOSURE_DISPLAY[p.composure];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team}</span></td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.role}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.clutchScore >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p.clutchScore > 0 ? '+' : ''}{p.clutchScore}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.highLevERA <= 3.0 ? '#22c55e' : p.highLevERA >= 5.0 ? '#ef4444' : '#ccc' }}>
                      {p.highLevERA.toFixed(2)}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.rispBA.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: cd.color, fontWeight: 600 }}>{cd.emoji} {cd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · {selected.ip} IP</span>
              </div>
              <div style={{ color: COMPOSURE_DISPLAY[selected.composure].color, fontWeight: 700, marginBottom: 12 }}>
                {COMPOSURE_DISPLAY[selected.composure].emoji} {COMPOSURE_DISPLAY[selected.composure].label} · Clutch Score: {selected.clutchScore > 0 ? '+' : ''}{selected.clutchScore}
              </div>

              {/* High Leverage Splits */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>HIGH LEVERAGE vs LOW LEVERAGE</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Hi-LI ERA', value: selected.highLevERA.toFixed(2), color: selected.highLevERA <= 3.0 ? '#22c55e' : '#ef4444' },
                  { label: 'Lo-LI ERA', value: selected.lowLevERA.toFixed(2), color: '#888' },
                  { label: 'Hi-LI K%', value: `${selected.highLevKPct}%`, color: selected.highLevKPct >= 25 ? '#22c55e' : '#ccc' },
                  { label: 'Hi-LI BB%', value: `${selected.highLevBBPct}%`, color: selected.highLevBBPct <= 8 ? '#22c55e' : '#ef4444' },
                ].map(v => (
                  <div key={v.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: v.color, fontWeight: 700, fontSize: 14 }}>{v.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{v.label}</div>
                  </div>
                ))}
              </div>

              {/* RISP Splits */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RUNNERS IN SCORING POSITION</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.rispBA <= .220 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.rispBA.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>RISP BA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.rispOPS <= .650 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.rispOPS.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>RISP OPS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.rispKPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>RISP K%</div>
                </div>
              </div>

              {/* Situational */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SITUATIONAL</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.strandRate >= 75 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.strandRate}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Strand Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.shutdownPct >= 65 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.shutdownPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Shutdown%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.inheritedScored <= 25 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.inheritedScored}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>IR Scored%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.basesLoadedBA.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Bases Loaded BA</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view clutch profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
