import { useState } from 'react';
import { generateDemoWeatherImpact, getSeverityColor, getAdjColor, CATEGORY_COLORS, CATEGORY_LABELS, formatParkFactor, type ParkWeatherProfile } from '../../engine/analytics/weatherImpactAnalysis';

const data = generateDemoWeatherImpact();

export default function WeatherImpactView() {
  const [selectedParkIdx, setSelectedParkIdx] = useState(0);
  const park = data.parkProfiles[selectedParkIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>WEATHER IMPACT ANALYSIS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>How weather conditions affect game outcomes, scoring, and ball flight</p>
      </div>

      {/* Condition impact cards */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>WEATHER CONDITION EFFECTS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['CONDITION', 'CATEGORY', 'GAMES', 'HR ADJ', 'RPG ADJ', 'DIST ADJ', 'SEVERITY'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'CONDITION' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.conditions.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{c.conditionType}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 700, background: (CATEGORY_COLORS[c.category] || '#6b7280') + '22', color: CATEGORY_COLORS[c.category] || '#6b7280' }}>
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>{c.sampleSize}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: getAdjColor(c.hrRateAdj), fontWeight: 700 }}>
                  {c.hrRateAdj >= 1 ? '+' : ''}{((c.hrRateAdj - 1) * 100).toFixed(0)}%
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: c.runsPerGameAdj >= 0 ? '#22c55e' : '#ef4444' }}>
                  {c.runsPerGameAdj >= 0 ? '+' : ''}{c.runsPerGameAdj.toFixed(2)}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: c.avgDistAdj >= 0 ? '#22c55e' : '#ef4444' }}>
                  {c.avgDistAdj >= 0 ? '+' : ''}{c.avgDistAdj.toFixed(0)}ft
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, background: getSeverityColor(c.severity) + '22', color: getSeverityColor(c.severity) }}>
                    {c.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Park selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.parkProfiles.map((p: ParkWeatherProfile, i: number) => (
          <button key={p.parkId} onClick={() => setSelectedParkIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedParkIdx ? '#f59e0b' : '#374151', background: i === selectedParkIdx ? '#78350f' : 'transparent', color: i === selectedParkIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {p.team}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Park weather profile */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>{park.parkName} — {park.city}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'ELEVATION', value: `${park.elevation}ft`, color: park.elevation > 3000 ? '#ef4444' : '#e5e7eb' },
              { label: 'AVG TEMP', value: `${park.avgTemp}°F`, color: park.avgTemp > 85 ? '#ef4444' : park.avgTemp < 60 ? '#3b82f6' : '#e5e7eb' },
              { label: 'AVG WIND', value: `${park.avgWindSpeed} mph`, color: park.avgWindSpeed > 12 ? '#f59e0b' : '#e5e7eb' },
              { label: 'HR FACTOR', value: formatParkFactor(park.hrParkFactor), color: park.hrParkFactor > 1.05 ? '#22c55e' : park.hrParkFactor < 0.95 ? '#ef4444' : '#f59e0b' },
              { label: 'RUN FACTOR', value: formatParkFactor(park.runParkFactor), color: park.runParkFactor > 1.05 ? '#22c55e' : '#f59e0b' },
              { label: 'DOME', value: park.isDome ? 'YES' : 'NO', color: park.isDome ? '#3b82f6' : '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 6, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly temps */}
          <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>MONTHLY TEMPERATURES</div>
          {park.monthlyTemps.map(mt => (
            <div key={mt.month} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ width: 30, fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{mt.month}</div>
              <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 2 }}>
                <div style={{ width: `${((mt.avgTemp - 30) / 80) * 100}%`, height: '100%', borderRadius: 2, background: mt.avgTemp > 85 ? '#ef4444' : mt.avgTemp > 70 ? '#f59e0b' : '#3b82f6' }} />
              </div>
              <div style={{ width: 32, fontSize: 10, color: '#e5e7eb', textAlign: 'right' }}>{mt.avgTemp}°</div>
            </div>
          ))}
        </div>

        {/* All parks comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>PARK WEATHER COMPARISON</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['PARK', 'TEMP', 'WIND', 'ELEV', 'HR PF', 'DOME'].map(h => (
                  <th key={h} style={{ padding: '4px 4px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PARK' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.parkProfiles.map((p: ParkWeatherProfile, i: number) => (
                <tr key={p.parkId} onClick={() => setSelectedParkIdx(i)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedParkIdx ? '#1f2937' : 'transparent' }}>
                  <td style={{ padding: '3px 4px', color: i === selectedParkIdx ? '#f59e0b' : '#e5e7eb', fontWeight: 600, fontSize: 10 }}>{p.team}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: p.avgTemp > 80 ? '#ef4444' : '#e5e7eb', fontSize: 10 }}>{p.avgTemp}°</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: p.avgWindSpeed > 10 ? '#f59e0b' : '#6b7280', fontSize: 10 }}>{p.avgWindSpeed}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: p.elevation > 1000 ? '#f59e0b' : '#6b7280', fontSize: 10 }}>{p.elevation}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: p.hrParkFactor > 1.05 ? '#22c55e' : p.hrParkFactor < 0.95 ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: 10 }}>
                    {formatParkFactor(p.hrParkFactor)}
                  </td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: p.isDome ? '#3b82f6' : '#6b7280', fontSize: 10 }}>{p.isDome ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
