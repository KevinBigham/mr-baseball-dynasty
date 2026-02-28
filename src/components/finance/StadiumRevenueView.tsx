import { useState } from 'react';
import { generateDemoStadiumRevenue, type StadiumRevenueData } from '../../engine/finance/stadiumRevenueImpact';

const data = generateDemoStadiumRevenue();

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

const trendIcon: Record<string, { icon: string; color: string }> = {
  up: { icon: '\u25B2', color: '#22c55e' },
  flat: { icon: '\u25AC', color: '#9ca3af' },
  down: { icon: '\u25BC', color: '#ef4444' },
};

export default function StadiumRevenueView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const team = data[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>STADIUM REVENUE IMPACT</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Venue features, game-day revenue breakdown, and ROI analysis</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((t, i) => (
          <button key={t.teamId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'STADIUM', value: team.stadiumName, color: '#e5e7eb' },
          { label: 'CAPACITY', value: team.capacity.toLocaleString(), color: '#e5e7eb' },
          { label: 'AVG ATTENDANCE', value: `${team.avgAttendance.toLocaleString()} (${team.attendancePct}%)`, color: team.attendancePct > 85 ? '#22c55e' : team.attendancePct < 70 ? '#ef4444' : '#f59e0b' },
          { label: 'TOTAL REVENUE', value: fmt(team.totalRevenue), color: '#f59e0b' },
          { label: '$/FAN', value: `$${team.revenuePerFan.toFixed(2)}`, color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Game Day Breakdown */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>GAME-DAY REVENUE</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#6b7280' }}>CATEGORY</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>PER GAME</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>SEASON</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>%</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>TREND</th>
              </tr>
            </thead>
            <tbody>
              {team.gameDayBreakdown.map(g => {
                const t = trendIcon[g.trend];
                return (
                  <tr key={g.category} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '4px 6px', color: '#e5e7eb' }}>{g.category}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{fmt(g.perGame)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{fmt(g.perSeason)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ flex: 1, height: 6, background: '#1f2937' }}>
                          <div style={{ width: `${g.pctOfTotal}%`, height: '100%', background: '#f59e0b' }} />
                        </div>
                        <span style={{ color: '#9ca3af', width: 28, textAlign: 'right' }}>{g.pctOfTotal}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: t.color }}>{t.icon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Venue Features */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>VENUE FEATURES</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#6b7280' }}>FEATURE</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>STATUS</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>REV/YR</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>ROI</th>
                <th style={{ padding: '4px 6px', color: '#6b7280' }}>SAT</th>
              </tr>
            </thead>
            <tbody>
              {team.features.map(f => (
                <tr key={f.feature} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '4px 6px', color: '#e5e7eb' }}>{f.label}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 700, background: f.installed ? '#22c55e22' : '#ef444422', color: f.installed ? '#22c55e' : '#ef4444', border: `1px solid ${f.installed ? '#22c55e44' : '#ef444444'}` }}>
                      {f.installed ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: f.installed ? '#e5e7eb' : '#4b5563' }}>{f.installed ? fmt(f.annualRevenue) : '—'}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: f.roi > 0 && f.roi < 5 ? '#22c55e' : f.roi > 10 ? '#ef4444' : '#9ca3af' }}>
                    {f.installed ? `${f.roi}yr` : '—'}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: f.satisfactionImpact > 70 ? '#22c55e' : f.satisfactionImpact < 40 ? '#ef4444' : '#f59e0b' }}>
                    {f.satisfactionImpact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
