/**
 * GBFBTendenciesView – Groundball/Flyball tendencies dashboard
 *
 * Bloomberg-terminal style batted ball analysis with GB/FB/LD splits,
 * wOBA by batted ball type, exit velocity profiles, and spray data.
 */
import { useState, useMemo } from 'react';
import {
  PitcherBattedBall,
  PROFILE_DISPLAY,
  profileColor,
  getGBFBSummary,
  generateDemoGBFB,
} from '../../engine/analytics/gbfbTendencies';

export default function GBFBTendenciesView() {
  const pitchers = useMemo(() => generateDemoGBFB(), []);
  const summary = useMemo(() => getGBFBSummary(pitchers), [pitchers]);
  const [selected, setSelected] = useState<PitcherBattedBall | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        GB/FB TENDENCIES — BATTED BALL ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Pitchers', value: summary.totalPitchers },
          { label: 'Avg GB%', value: `${summary.avgGBPct}%` },
          { label: 'Avg FB%', value: `${summary.avgFBPct}%` },
          { label: 'Highest GB', value: summary.highestGB, color: '#22c55e' },
          { label: 'Team BABIP', value: summary.teamBABIP.toFixed(3) },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>IP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>GB%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>FB%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>LD%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>HR/FB</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Profile</th>
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
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.ip}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.gbPct >= 48 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{p.gbPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.fbPct >= 38 ? '#ef4444' : '#ccc' }}>{p.fbPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.ldPct}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.hrFbRate <= 10 ? '#22c55e' : '#ef4444' }}>{p.hrFbRate}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: profileColor(p.profile), fontWeight: 600, fontSize: 10 }}>
                    {PROFILE_DISPLAY[p.profile].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.role} · {selected.team} · {selected.ip} IP</span>
              </div>
              <div style={{ color: profileColor(selected.profile), fontWeight: 700, marginBottom: 12 }}>
                {PROFILE_DISPLAY[selected.profile].label} · BABIP {selected.babip.toFixed(3)}
              </div>

              {/* Batted Ball Distribution */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BATTED BALL DISTRIBUTION</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'GB%', value: selected.gbPct, color: '#22c55e' },
                  { label: 'FB%', value: selected.fbPct, color: '#f97316' },
                  { label: 'LD%', value: selected.ldPct, color: '#facc15' },
                  { label: 'IFFB%', value: selected.iffbPct, color: '#4ade80' },
                  { label: 'HR/FB', value: selected.hrFbRate, color: selected.hrFbRate <= 10 ? '#22c55e' : '#ef4444' },
                ].map(v => (
                  <div key={v.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: v.color, fontWeight: 700, fontSize: 14 }}>{v.value}%</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{v.label}</div>
                  </div>
                ))}
              </div>

              {/* wOBA by Type */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>wOBA BY BATTED BALL TYPE</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{selected.gbWOBA.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Ground Ball</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14 }}>{selected.fbWOBA.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Fly Ball</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{selected.ldWOBA.toFixed(3)}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Line Drive</div>
                </div>
              </div>

              {/* Contact Quality */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CONTACT QUALITY</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.avgEV} mph</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Avg EV</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.hardHitPct <= 30 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{selected.hardHitPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Hard Hit</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.softHitPct >= 25 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{selected.softHitPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Soft Hit</div>
                </div>
              </div>

              {/* Spray */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SPRAY DIRECTION</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.pullPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Pull</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.centerPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Center</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ccc', fontWeight: 700 }}>{selected.oppoPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Oppo</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view batted ball profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
