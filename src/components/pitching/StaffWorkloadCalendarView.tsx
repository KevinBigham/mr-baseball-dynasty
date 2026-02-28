/**
 * StaffWorkloadCalendarView – Pitching Staff Workload Calendar
 *
 * Bloomberg-terminal style weekly calendar grid showing pitcher usage
 * across the entire staff. Tracks innings, pitch counts, consecutive
 * appearances, and flags overuse with color-coded alerts.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoStaffWorkloadCalendar,
  USAGE_DISPLAY,
  STATUS_DISPLAY,
  type PitcherWorkloadProfile,
  type WeeklyLog,
} from '../../engine/pitching/staffWorkloadCalendar';

export default function StaffWorkloadCalendarView() {
  const data = useMemo(() => generateDemoStaffWorkloadCalendar(), []);
  const [selected, setSelected] = useState<PitcherWorkloadProfile | null>(null);
  const [weekIndex, setWeekIndex] = useState<number>(data.pitchers[0]?.weeklyLogs.length - 1 ?? 0);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredPitchers = useMemo(() => {
    if (roleFilter === 'ALL') return data.pitchers;
    if (roleFilter === 'SP') return data.pitchers.filter(p => p.role === 'SP');
    return data.pitchers.filter(p => p.role !== 'SP');
  }, [data.pitchers, roleFilter]);

  const summary = data.staffSummary;

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100vh' }}>
      <div style={{ marginBottom: 14, padding: '8px 16px', background: '#111827', borderBottom: '2px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          STAFF WORKLOAD CALENDAR — {data.teamAbbr}
        </span>
        <span style={{ color: '#666', fontSize: 11 }}>Week {data.currentWeek} | {data.weekDates}</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Staff IP', value: summary.totalStaffIP, color: '#f59e0b' },
          { label: 'Starter IP', value: summary.starterIP },
          { label: 'Reliever IP', value: summary.relieverIP },
          { label: 'Well Rested', value: summary.wellRestedCount, color: '#22c55e' },
          { label: 'Moderate', value: summary.moderateCount, color: '#f59e0b' },
          { label: 'Overworked', value: summary.overworkedCount, color: '#ef4444' },
          { label: 'Alerts', value: summary.activeAlerts, color: summary.activeAlerts > 0 ? '#ef4444' : '#888' },
          { label: 'Most Used RP', value: summary.mostUsedReliever },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center', background: '#111827', border: '1px solid #374151' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ color: '#888', fontSize: 11 }}>WEEK:</div>
        {data.pitchers[0]?.weeklyLogs.map((w, i) => (
          <button
            key={i}
            onClick={() => setWeekIndex(i)}
            style={{
              background: weekIndex === i ? '#f59e0b' : '#111827',
              color: weekIndex === i ? '#030712' : '#e0e0e0',
              border: '1px solid #374151',
              padding: '4px 10px',
              fontFamily: 'monospace',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: weekIndex === i ? 700 : 400,
            }}
          >
            {w.weekLabel.split(' (')[0]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['ALL', 'SP', 'RP'].map(f => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              style={{
                background: roleFilter === f ? '#374151' : '#111827',
                color: roleFilter === f ? '#f59e0b' : '#888',
                border: '1px solid #374151',
                padding: '4px 10px',
                fontFamily: 'monospace',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Calendar Grid */}
        <div style={{ flex: '1 1 620px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6, minWidth: 140 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6, minWidth: 40 }}>Role</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <th key={d} style={{ textAlign: 'center', padding: 6, minWidth: 50 }}>{d}</th>
                ))}
                <th style={{ textAlign: 'center', padding: 6 }}>IP</th>
                <th style={{ textAlign: 'center', padding: 6 }}>P</th>
                <th style={{ textAlign: 'center', padding: 6 }}>App</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPitchers.map(p => {
                const week: WeeklyLog | undefined = p.weeklyLogs[weekIndex];
                if (!week) return null;
                const statusInfo = STATUS_DISPLAY[p.currentStatus];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {p.name}
                      {p.alerts.length > 0 && (
                        <span style={{ color: '#ef4444', marginLeft: 4, fontSize: 10 }}>
                          [{p.alerts.length}]
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.role === 'SP' ? '#3b82f6' : '#f59e0b', fontWeight: 600 }}>
                      {p.role}
                    </td>
                    {week.days.map((day, di) => {
                      const usg = USAGE_DISPLAY[day.usage];
                      return (
                        <td key={di} style={{ padding: 4, textAlign: 'center' }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: day.usage === 'start' ? '#1e3a5f' :
                                       day.usage === 'relief' ? '#3b2a0a' :
                                       '#111827',
                            border: `1px solid ${day.usage === 'rest' || day.usage === 'off' ? '#1f2937' : usg.color}`,
                            borderRadius: 3,
                          }}>
                            <span style={{ color: usg.color, fontWeight: 700, fontSize: 12 }}>
                              {usg.symbol}
                            </span>
                            {day.innings > 0 && (
                              <span style={{ color: '#888', fontSize: 8 }}>
                                {day.innings}ip
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 600, color: week.totalIP >= 12 && p.role !== 'SP' ? '#ef4444' : '#e0e0e0' }}>
                      {week.totalIP}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{week.totalPitches}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: week.appearances >= 5 ? '#ef4444' : '#e0e0e0' }}>
                      {week.appearances}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: statusInfo.color, fontWeight: 600, fontSize: 10 }}>
                      {statusInfo.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, padding: '8px 0', borderTop: '1px solid #1f2937' }}>
            {Object.entries(USAGE_DISPLAY).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888' }}>
                <div style={{ width: 14, height: 14, background: val.color, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>
                  {val.symbol}
                </div>
                {val.label}
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#666' }}>
              Click pitcher for details
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div style={{ padding: 14, background: '#111827', border: '1px solid #374151' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.role} | {selected.throws}HP | Age {selected.age} | OVR {selected.overall}
                </span>
              </div>
              <div style={{ color: STATUS_DISPLAY[selected.currentStatus].color, fontWeight: 700, marginBottom: 12 }}>
                {STATUS_DISPLAY[selected.currentStatus].emoji} {STATUS_DISPLAY[selected.currentStatus].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>ERA {selected.era}</span>
              </div>

              {/* Season Totals */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>SEASON TOTALS</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'IP', value: selected.seasonIP },
                  { label: 'Pitches', value: selected.seasonPitches },
                  { label: 'Apps', value: selected.seasonAppearances },
                  { label: selected.role === 'SP' ? 'Avg P/Start' : 'Avg P/App', value: selected.role === 'SP' ? selected.avgPitchesPerStart : selected.avgPitchesPerRelief },
                  { label: 'Consec', value: selected.daysOnConsecutive, color: selected.daysOnConsecutive >= 3 ? '#ef4444' : selected.daysOnConsecutive >= 2 ? '#f59e0b' : '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 14 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Weekly Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>WEEKLY BREAKDOWN</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Week</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>IP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pitches</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Apps</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Consec</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.weeklyLogs.map((w, wi) => (
                    <tr key={wi} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: 4, color: wi === weekIndex ? '#f59e0b' : '#ccc', fontWeight: wi === weekIndex ? 700 : 400 }}>
                        Wk {wi + 1}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: w.totalIP >= 12 && selected.role !== 'SP' ? '#ef4444' : '#ccc' }}>{w.totalIP}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{w.totalPitches}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: w.appearances >= 5 ? '#ef4444' : '#ccc' }}>{w.appearances}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: w.consecutiveDays >= 3 ? '#ef4444' : w.consecutiveDays >= 2 ? '#f59e0b' : '#888' }}>{w.consecutiveDays}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{w.restDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Alerts */}
              {selected.alerts.length > 0 && (
                <>
                  <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 6 }}>ACTIVE ALERTS</div>
                  {selected.alerts.map((a, ai) => (
                    <div
                      key={ai}
                      style={{
                        padding: '6px 10px',
                        marginBottom: 4,
                        background: a.severity === 'danger' ? '#2d0a0a' : '#2d1f0a',
                        border: `1px solid ${a.severity === 'danger' ? '#ef4444' : '#f59e0b'}`,
                        color: a.severity === 'danger' ? '#ef4444' : '#f59e0b',
                        fontSize: 11,
                      }}
                    >
                      {a.severity === 'danger' ? '!! ' : '~~ '}{a.message}
                    </div>
                  ))}
                </>
              )}

              {/* Day-by-Day for Current Week */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6, marginTop: 12 }}>
                DAY-BY-DAY — {selected.weeklyLogs[weekIndex]?.weekLabel ?? ''}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Day</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Type</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>IP</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Pitches</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>ER</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Dec</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.weeklyLogs[weekIndex]?.days.map((day, di) => {
                    const usg = USAGE_DISPLAY[day.usage];
                    return (
                      <tr key={di} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: 4 }}>{day.date}</td>
                        <td style={{ padding: 4, textAlign: 'center', color: usg.color, fontWeight: 600 }}>
                          {usg.label}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: day.innings > 0 ? '#e0e0e0' : '#444' }}>
                          {day.innings > 0 ? day.innings : '-'}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: day.pitchCount >= 100 ? '#ef4444' : day.pitchCount > 0 ? '#e0e0e0' : '#444' }}>
                          {day.pitchCount > 0 ? day.pitchCount : '-'}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: day.earnedRuns >= 3 ? '#ef4444' : '#888' }}>
                          {day.innings > 0 ? day.earnedRuns : '-'}
                        </td>
                        <td style={{ padding: 4, textAlign: 'center', color: day.decision === 'W' || day.decision === 'S' ? '#22c55e' : day.decision === 'L' ? '#ef4444' : '#888' }}>
                          {day.decision || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#555', background: '#111827', border: '1px solid #374151' }}>
              Select a pitcher to view workload details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
