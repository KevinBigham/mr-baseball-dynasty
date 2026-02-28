import { useState } from 'react';
import { generateDemoScoutTrips, getTripStatusColor, getPriorityColor, type ScoutTrip } from '../../engine/scouting/scoutingTripPlanner';

const data = generateDemoScoutTrips();

export default function ScoutTripPlannerView() {
  const [selectedTrip, setSelectedTrip] = useState<ScoutTrip | null>(data.trips[0]);

  const budgetPct = (data.budgetUsed / data.totalBudget) * 100;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SCOUTING TRIP PLANNER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Schedule, track, and manage scouting assignments across levels</p>
      </div>

      {/* Budget summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL BUDGET', value: `$${(data.totalBudget / 1000).toFixed(0)}K`, color: '#e5e7eb' },
          { label: 'USED', value: `$${(data.budgetUsed / 1000).toFixed(1)}K`, color: budgetPct > 80 ? '#ef4444' : '#f59e0b' },
          { label: 'REMAINING', value: `$${(data.budgetRemaining / 1000).toFixed(1)}K`, color: '#22c55e' },
          { label: 'ACTIVE SCOUTS', value: String(data.activeScouts), color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div style={{ marginBottom: 20, background: '#111827', border: '1px solid #374151', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>BUDGET UTILIZATION</span>
          <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{budgetPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: '#1f2937', borderRadius: 4 }}>
          <div style={{ width: `${budgetPct}%`, height: '100%', borderRadius: 4, background: budgetPct > 80 ? '#ef4444' : budgetPct > 50 ? '#f59e0b' : '#22c55e' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Trip list */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SCOUTING TRIPS</div>
          {data.trips.map(trip => (
            <div key={trip.tripId} onClick={() => setSelectedTrip(trip)}
              style={{ padding: 10, marginBottom: 6, background: selectedTrip?.tripId === trip.tripId ? '#1f2937' : '#0a0f1a', border: `1px solid ${selectedTrip?.tripId === trip.tripId ? '#f59e0b' : '#1f2937'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{trip.destination}</span>
                <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getTripStatusColor(trip.status) + '22', color: getTripStatusColor(trip.status), border: `1px solid ${getTripStatusColor(trip.status)}44` }}>
                  {trip.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>
                {trip.scoutName} | {trip.level} | {trip.startDate} - {trip.endDate}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                {trip.targets.length} target{trip.targets.length !== 1 ? 's' : ''} | ${trip.estimatedCost.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Trip detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          {selectedTrip ? (
            <>
              <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                TRIP DETAIL — {selectedTrip.destination}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'SCOUT', value: selectedTrip.scoutName, color: '#e5e7eb' },
                  { label: 'DURATION', value: `${selectedTrip.durationDays} days`, color: '#3b82f6' },
                  { label: 'GAMES', value: String(selectedTrip.gamesObserved), color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>TARGETS</div>
              {selectedTrip.targets.map(t => (
                <div key={t.playerId} style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{t.name}</span>
                      <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{t.position} | Age {t.age}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getPriorityColor(t.priority) + '22', color: getPriorityColor(t.priority) }}>
                        {t.priority.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.currentGrade >= 65 ? '#22c55e' : t.currentGrade >= 55 ? '#f59e0b' : '#9ca3af' }}>{t.currentGrade}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                    Last scouted: {t.lastScouted} ({t.daysSinceLastScout}d ago)
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{t.notes}</div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 40 }}>
              Select a trip to view details
            </div>
          )}
        </div>
      </div>

      {/* Upcoming high-priority targets */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>HIGH-PRIORITY UNSCOUTED TARGETS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['NAME', 'POS', 'AGE', 'LEVEL', 'GRADE', 'PRIORITY', 'LAST SCOUTED', 'DAYS AGO'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'NAME' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.upcomingTargets.map(t => (
              <tr key={t.playerId} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{t.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b' }}>{t.position}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{t.age}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#3b82f6' }}>{t.level}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: t.currentGrade >= 65 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{t.currentGrade}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: getPriorityColor(t.priority) + '22', color: getPriorityColor(t.priority) }}>
                    {t.priority.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>{t.lastScouted}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: t.daysSinceLastScout > 60 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{t.daysSinceLastScout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
