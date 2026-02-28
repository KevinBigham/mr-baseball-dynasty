/**
 * RelieverLevIndexView – Reliever Leverage Index dashboard
 *
 * Bloomberg-terminal style view showing reliever leverage profiles,
 * appearance logs with tier color coding, ERA/WHIP/K9, and hold pct bars.
 */
import { useMemo, useState } from 'react';
import {
  LEVERAGE_DISPLAY,
  RESULT_DISPLAY,
  ROLE_DISPLAY,
  generateDemoRelieverLeverage,
  type RelieverLeverageProfile,
  type LeverageAppearance,
} from '../../engine/pitching/relieverLeverageIndex';

export default function RelieverLevIndexView() {
  const relievers = useMemo(() => generateDemoRelieverLeverage(), []);
  const [selectedId, setSelectedId] = useState<number>(relievers[0]?.pitcherId ?? 0);

  const selected = relievers.find(r => r.pitcherId === selectedId) ?? relievers[0];

  const avgTeamLI = relievers.length > 0
    ? Math.round((relievers.reduce((s, r) => s + r.avgLeverage, 0) / relievers.length) * 100) / 100
    : 0;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: '#f59e0b', letterSpacing: 1,
        borderBottom: '1px solid #f59e0b', paddingBottom: 6, marginBottom: 14,
      }}>
        RELIEVER LEVERAGE INDEX — BULLPEN HIGH-LEVERAGE TRACKER
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Relievers', value: relievers.length },
          { label: 'Avg LI', value: avgTeamLI.toFixed(2), color: '#f59e0b' },
          { label: 'Top LI', value: relievers.length > 0 ? Math.max(...relievers.map(r => r.avgLeverage)).toFixed(2) : '0', color: '#ef4444' },
          { label: 'Top Hold%', value: relievers.length > 0 ? Math.max(...relievers.map(r => r.holdPct)) + '%' : '0%', color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{
            border: '1px solid #333', padding: '8px 14px', minWidth: 100, textAlign: 'center',
            background: '#111827',
          }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Reliever Table ── */}
      <div style={{ border: '1px solid #333', padding: 12, overflowX: 'auto', background: '#111827', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              {['Pitcher', 'Role', 'Avg LI', 'Hi-Lev%', 'ERA', 'WHIP', 'K/9', 'Hold%', 'Apps'].map(h => (
                <th key={h} style={{ textAlign: h === 'Pitcher' ? 'left' : 'center', padding: 6 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {relievers.map(r => {
              const rd = ROLE_DISPLAY[r.role];
              const isSelected = r.pitcherId === selectedId;
              return (
                <tr
                  key={r.pitcherId}
                  onClick={() => setSelectedId(r.pitcherId)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: isSelected ? '#1e293b' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600, color: isSelected ? '#f59e0b' : '#e0e0e0' }}>
                    {r.name}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <span style={{
                      background: rd.color, color: '#000', padding: '1px 6px',
                      fontSize: 10, fontWeight: 700, borderRadius: 2,
                    }}>
                      {rd.label}
                    </span>
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 700,
                    color: r.avgLeverage >= 2.0 ? '#ef4444' : r.avgLeverage >= 1.5 ? '#f59e0b' : '#888',
                  }}>
                    {r.avgLeverage.toFixed(2)}
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: r.highLevPct >= 60 ? '#f59e0b' : '#ccc',
                  }}>
                    {r.highLevPct}%
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: r.era <= 2.0 ? '#22c55e' : r.era >= 4.0 ? '#ef4444' : '#ccc',
                  }}>
                    {r.era.toFixed(2)}
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: r.whip <= 1.0 ? '#22c55e' : r.whip >= 1.3 ? '#ef4444' : '#ccc',
                  }}>
                    {r.whip.toFixed(2)}
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: r.kPer9 >= 11 ? '#22c55e' : '#ccc',
                  }}>
                    {r.kPer9.toFixed(1)}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <HoldPctBar pct={r.holdPct} />
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>
                    {r.appearances.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Detail: Selected Reliever ── */}
      {selected && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Stats Panel */}
          <div style={{ border: '1px solid #333', padding: 12, background: '#111827', flex: '1 1 260px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              {selected.name} — PROFILE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Avg Leverage', value: selected.avgLeverage.toFixed(2) },
                { label: 'High-Lev%', value: selected.highLevPct + '%' },
                { label: 'ERA', value: selected.era.toFixed(2) },
                { label: 'WHIP', value: selected.whip.toFixed(2) },
                { label: 'K/9', value: selected.kPer9.toFixed(1) },
                { label: 'Hold%', value: selected.holdPct + '%' },
                { label: 'Role', value: ROLE_DISPLAY[selected.role].label },
                { label: 'Appearances', value: String(selected.appearances.length) },
              ].map(s => (
                <div key={s.label} style={{ borderBottom: '1px solid #222', paddingBottom: 4 }}>
                  <div style={{ color: '#888', fontSize: 10 }}>{s.label}</div>
                  <div style={{ color: '#e0e0e0', fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Hold Pct Bar Large */}
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>HOLD CONVERSION RATE</div>
              <div style={{ background: '#1e293b', height: 18, width: '100%', position: 'relative' }}>
                <div style={{
                  background: selected.holdPct >= 75 ? '#22c55e' : selected.holdPct >= 50 ? '#f59e0b' : '#ef4444',
                  height: '100%', width: `${selected.holdPct}%`, transition: 'width 0.3s',
                }} />
                <span style={{
                  position: 'absolute', right: 4, top: 1, fontSize: 11, color: '#fff', fontWeight: 700,
                }}>
                  {selected.holdPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Appearance Log */}
          <div style={{ border: '1px solid #333', padding: 12, background: '#111827', flex: '2 1 400px', maxHeight: 340, overflowY: 'auto' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              APPEARANCE LOG ({selected.appearances.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                  {['Date', 'Inn', 'Leverage', 'Result', 'PC', 'IP'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Date' ? 'left' : 'center', padding: 4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.appearances.slice(0, 30).map((a: LeverageAppearance, i: number) => {
                  const ld = LEVERAGE_DISPLAY[a.leverageTier];
                  const rsd = RESULT_DISPLAY[a.result];
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: 4, color: '#888' }}>{a.date}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{a.inning}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>
                        <span style={{
                          color: '#000', background: ld.color, padding: '0 5px',
                          fontSize: 10, fontWeight: 700, borderRadius: 2,
                        }}>
                          {ld.label.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: rsd.color, fontWeight: 600 }}>
                        {rsd.label}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: a.pitchCount > 25 ? '#ef4444' : '#ccc' }}>
                        {a.pitchCount}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{a.ip.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Hold Pct Inline Bar ── */
function HoldPctBar({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: 80 }}>
      <div style={{ background: '#1e293b', height: 10, flex: 1, position: 'relative' }}>
        <div style={{
          background: pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444',
          height: '100%', width: `${pct}%`,
        }} />
      </div>
      <span style={{ fontSize: 10, color: '#888', minWidth: 28 }}>{pct}%</span>
    </div>
  );
}
