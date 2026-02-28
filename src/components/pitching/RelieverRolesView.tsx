/**
 * RelieverRolesView – Bullpen role management dashboard
 *
 * Bloomberg-terminal style reliever role tracker with
 * save/hold stats, high-leverage performance, and availability.
 */
import { useMemo } from 'react';
import {
  ROLE_DISPLAY,
  EFFECTIVENESS_DISPLAY,
  getBullpenRolesSummary,
  generateDemoRelieverRoles,
} from '../../engine/pitching/relieverRoles';

export default function RelieverRolesView() {
  const relievers = useMemo(() => generateDemoRelieverRoles(), []);
  const summary = useMemo(() => getBullpenRolesSummary(relievers), [relievers]);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        RELIEVER ROLES — BULLPEN HIERARCHY
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Relievers', value: summary.totalRelievers },
          { label: 'Closer', value: summary.closerName },
          { label: 'Saves', value: summary.closerSaves, color: '#22c55e' },
          { label: 'BP ERA', value: summary.teamBullpenERA.toFixed(2) },
          { label: 'Blown Saves', value: summary.blownSaveTotal, color: '#ef4444' },
          { label: 'Dominant Arms', value: summary.dominantCount, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Reliever Table ── */}
      <div className="bloomberg-border" style={{ padding: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
              <th style={{ textAlign: 'center', padding: 6 }}>ERA</th>
              <th style={{ textAlign: 'center', padding: 6 }}>SV</th>
              <th style={{ textAlign: 'center', padding: 6 }}>HLD</th>
              <th style={{ textAlign: 'center', padding: 6 }}>BS</th>
              <th style={{ textAlign: 'center', padding: 6 }}>IP</th>
              <th style={{ textAlign: 'center', padding: 6 }}>K/9</th>
              <th style={{ textAlign: 'center', padding: 6 }}>WHIP</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Hi-Lev ERA</th>
              <th style={{ textAlign: 'center', padding: 6 }}>IR Scored%</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Avail</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {relievers.map(r => {
              const rd = ROLE_DISPLAY[r.role];
              const ed = EFFECTIVENESS_DISPLAY[r.effectiveness];
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: rd.color }}>{rd.emoji} {rd.label}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.era <= 2.5 ? '#22c55e' : r.era >= 4.0 ? '#ef4444' : '#ccc' }}>{r.era.toFixed(2)}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: r.saves > 0 ? 700 : 400 }}>{r.saves}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{r.holds}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.blownSaves >= 3 ? '#ef4444' : '#ccc' }}>{r.blownSaves}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{r.inningsPitched}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.k9 >= 10 ? '#22c55e' : '#ccc' }}>{r.k9}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.whip <= 1.0 ? '#22c55e' : r.whip >= 1.3 ? '#ef4444' : '#ccc' }}>{r.whip.toFixed(2)}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.highLevERA <= 2.0 ? '#22c55e' : r.highLevERA >= 4.5 ? '#ef4444' : '#ccc' }}>{r.highLevERA.toFixed(2)}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.inheritedRunnersScored > 30 ? '#ef4444' : '#22c55e' }}>{r.inheritedRunnersScored}%</td>
                  <td style={{ padding: 6, textAlign: 'center', color: r.isAvailable ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {r.isAvailable ? 'YES' : 'NO'}
                    <span style={{ color: '#555', fontWeight: 400, marginLeft: 4, fontSize: 10 }}>({r.restDays}d rest)</span>
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: ed.color, fontWeight: 600 }}>{ed.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
