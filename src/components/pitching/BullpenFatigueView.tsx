/**
 * BullpenFatigueView – Bullpen fatigue & availability dashboard
 *
 * Bloomberg-terminal style fatigue tracker with workload metrics,
 * performance degradation analysis, and availability projections.
 */
import { useState, useMemo } from 'react';
import {
  RelieverFatigue,
  FATIGUE_DISPLAY,
  getBullpenFatigueSummary,
  generateDemoBullpenFatigue,
} from '../../engine/pitching/bullpenFatigue';

export default function BullpenFatigueView() {
  const relievers = useMemo(() => generateDemoBullpenFatigue(), []);
  const summary = useMemo(() => getBullpenFatigueSummary(relievers), [relievers]);
  const [selected, setSelected] = useState<RelieverFatigue | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        BULLPEN FATIGUE — AVAILABILITY MODEL
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Available', value: summary.availableCount, color: '#22c55e' },
          { label: 'Emergency Only', value: summary.emergencyOnly, color: '#f59e0b' },
          { label: 'Unavailable', value: summary.unavailableCount, color: '#ef4444' },
          { label: 'Avg Fatigue', value: `${summary.avgFatigueScore}%` },
          { label: 'Most Overworked', value: summary.mostOverworked },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Reliever List ── */}
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Fatigue</th>
                <th style={{ textAlign: 'center', padding: 6 }}>3-Day P</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Consec</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Avail</th>
              </tr>
            </thead>
            <tbody>
              {relievers.map(r => {
                const fd = FATIGUE_DISPLAY[r.fatigueLevel];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === r.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{r.role}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        <div style={{ width: 40, height: 6, background: '#111', borderRadius: 3 }}>
                          <div style={{ width: `${r.fatigueScore}%`, height: '100%', background: fd.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10 }}>{r.fatigueScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.pitchesLast3Days}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: r.consecutiveDays >= 2 ? '#ef4444' : '#888' }}>{r.consecutiveDays}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: fd.color, fontWeight: 600 }}>{fd.emoji} {fd.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: r.projAvailability === 'available' ? '#22c55e' : r.projAvailability === 'emergency' ? '#f59e0b' : '#ef4444' }}>
                      {r.projAvailability === 'available' ? '✓' : r.projAvailability === 'emergency' ? '⚠' : '✗'}
                    </td>
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
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: FATIGUE_DISPLAY[selected.fatigueLevel].color, fontWeight: 700, marginBottom: 12 }}>
                {FATIGUE_DISPLAY[selected.fatigueLevel].emoji} {FATIGUE_DISPLAY[selected.fatigueLevel].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>Score: {selected.fatigueScore}/100</span>
              </div>

              {/* Workload Metrics */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>WORKLOAD METRICS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'P (3d)', value: selected.pitchesLast3Days },
                  { label: 'P (7d)', value: selected.pitchesLast7Days },
                  { label: 'App (3d)', value: selected.appearancesLast3 },
                  { label: 'App (7d)', value: selected.appearancesLast7 },
                  { label: 'Consec', value: selected.consecutiveDays, color: selected.consecutiveDays >= 2 ? '#ef4444' : '#ccc' },
                  { label: 'Days Off', value: selected.daysSinceLastApp },
                  { label: 'Avg P/App', value: selected.avgPitchesPerApp },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Performance Impact */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>FATIGUE PERFORMANCE IMPACT</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{selected.eraWhenFresh}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>ERA (Fresh)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{selected.eraWhenTired}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>ERA (Tired)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14 }}>+{selected.performanceDrop}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Degradation</div>
                </div>
              </div>

              {/* Recent Appearances */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RECENT APPEARANCES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Date</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pitches</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>IP</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.recentApps.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4 }}>{a.date}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.pitches >= 20 ? '#f59e0b' : '#ccc' }}>{a.pitches}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.innings}</td>
                      <td style={{ padding: 4, color: '#888' }}>{a.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a reliever to view fatigue analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
