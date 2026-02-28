/**
 * PitcherWorkloadView – Pitcher workload monitor dashboard
 *
 * Bloomberg-terminal style workload tracker with IP progression,
 * fatigue indicators, velocity trends, and management recommendations.
 */
import { useState, useMemo } from 'react';
import {
  PitcherWorkloadProfile,
  STATUS_DISPLAY,
  getWorkloadSummary,
  generateDemoPitcherWorkload,
} from '../../engine/pitching/pitcherWorkload';

export default function PitcherWorkloadView() {
  const pitchers = useMemo(() => generateDemoPitcherWorkload(), []);
  const summary = useMemo(() => getWorkloadSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherWorkloadProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCHER WORKLOAD MONITOR — FATIGUE TRACKER
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Healthy', value: summary.greenCount, color: '#22c55e' },
          { label: 'Caution+', value: summary.cautionCount, color: '#f97316' },
          { label: 'Highest IP', value: summary.highestIP },
          { label: 'Avg Risk', value: `${summary.avgOveruseRisk}%` },
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
                <th style={{ textAlign: 'center', padding: 6 }}>IP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Proj</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Risk</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === p.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.name} <span style={{ color: '#666', fontSize: 10 }}>{p.team}</span></td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.role}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.currentIP}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.projectedIP > p.ipLimit ? '#ef4444' : '#ccc' }}>{p.projectedIP}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.overuseRisk >= 60 ? '#ef4444' : p.overuseRisk >= 40 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>
                    {p.overuseRisk}%
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: STATUS_DISPLAY[p.status].color, fontWeight: 600, fontSize: 10 }}>
                    {STATUS_DISPLAY[p.status].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 400px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · Age {selected.age}</span>
              </div>
              <div style={{ color: STATUS_DISPLAY[selected.status].color, fontWeight: 700, marginBottom: 12 }}>
                {STATUS_DISPLAY[selected.status].label} — Overuse Risk: {selected.overuseRisk}%
              </div>

              {/* IP Tracker */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>INNINGS TRACKER</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>{selected.currentIP}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Current IP</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.projectedIP > selected.ipLimit ? '#ef4444' : '#ccc', fontWeight: 700, fontSize: 16 }}>{selected.projectedIP}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Projected</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontWeight: 700, fontSize: 16 }}>{selected.careerHighIP}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Career High</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{selected.ipLimit}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>IP Limit</div>
                </div>
              </div>
              <div style={{ background: '#222', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ background: STATUS_DISPLAY[selected.status].color, height: '100%', width: `${Math.min(100, (selected.currentIP / selected.ipLimit) * 100)}%` }} />
              </div>

              {/* Velocity & ERA Trend */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PERFORMANCE TREND</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.velocityTrend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {selected.velocityTrend > 0 ? '+' : ''}{selected.velocityTrend} mph
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>Velo Trend</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.eraFirstHalf.toFixed(2)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>1st Half ERA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.eraSecondHalf > selected.eraFirstHalf + 0.5 ? '#ef4444' : '#ccc', fontWeight: 700 }}>{selected.eraSecondHalf.toFixed(2)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>2nd Half ERA</div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>MONTHLY WORKLOAD</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {selected.monthlyBreakdown.map(m => (
                  <div key={m.month} style={{ textAlign: 'center', fontSize: 10 }}>
                    <div style={{ color: '#888' }}>{m.month}</div>
                    <div style={{ color: '#ccc', fontWeight: 700 }}>{m.ip} IP</div>
                    <div style={{ color: '#666' }}>{m.avgPitchesPerStart} P/GS</div>
                  </div>
                ))}
              </div>

              {/* Fatigue Indicators */}
              {selected.fatigueIndicators.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 4 }}>FATIGUE INDICATORS</div>
                  {selected.fatigueIndicators.map(fi => (
                    <div key={fi} style={{ fontSize: 11, color: '#f97316', marginBottom: 2 }}>⚠ {fi}</div>
                  ))}
                </div>
              )}

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>RECOMMENDATION</div>
              <div style={{ padding: 6, background: '#111', border: `1px solid ${STATUS_DISPLAY[selected.status].color}`, color: '#eee', fontSize: 12 }}>
                {selected.recommendation}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view workload data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
