import { useState } from 'react';
import { generateDemoSeasonSim, getOddsColor } from '../../engine/analytics/seasonSimForecast';

const data = generateDemoSeasonSim();

export default function SeasonSimForecastView() {
  const [tab, setTab] = useState<'forecast' | 'division' | 'pace'>('forecast');

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>SEASON SIM FORECAST</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Monte Carlo projections ({data.simCount.toLocaleString()} simulations) — {data.currentRecord.wins}-{data.currentRecord.losses}, {data.gamesRemaining}G remaining</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PROJ RECORD', value: `${data.projectedWins}-${data.projectedLosses}`, color: '#e5e7eb' },
          { label: 'PLAYOFF ODDS', value: `${data.playoffOdds}%`, color: getOddsColor(data.playoffOdds) },
          { label: 'WIN DIVISION', value: `${data.divisionOdds}%`, color: getOddsColor(data.divisionOdds) },
          { label: 'WILD CARD', value: `${data.wildCardOdds}%`, color: getOddsColor(data.wildCardOdds) },
          { label: 'WORLD SERIES', value: `${data.worldSeriesOdds}%`, color: getOddsColor(data.worldSeriesOdds) },
          { label: 'WIN RANGE', value: `${data.worstCase}-${data.bestCase}`, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['forecast', 'division', 'pace'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 14px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: tab === t ? '#f59e0b22' : '#111827', border: `1px solid ${tab === t ? '#f59e0b' : '#374151'}`, color: tab === t ? '#f59e0b' : '#6b7280', cursor: 'pointer' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'forecast' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>WIN DISTRIBUTION</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
            {data.winDistribution.map(d => (
              <div key={d.wins} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: `${d.frequency * 12}px`, background: d.wins === data.projectedWins ? '#f59e0b' : d.wins >= 90 ? '#22c55e44' : '#3b82f644', borderRadius: '2px 2px 0 0', minHeight: 1 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginTop: 4 }}>
            <span>{data.winDistribution[0]?.wins}W</span>
            <span style={{ color: '#f59e0b' }}>Proj: {data.projectedWins}W</span>
            <span>{data.winDistribution[data.winDistribution.length - 1]?.wins}W</span>
          </div>
        </div>
      )}

      {tab === 'division' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>DIVISION STANDINGS PROJECTION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>TEAM</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>WIN DIV</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>WIN WC</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>PLAYOFFS</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>MISS</div>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, textAlign: 'center' }}>PROJ W-L</div>
          </div>
          {data.division.map(d => (
            <div key={d.abbr} style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', gap: 4, padding: '6px 0', borderBottom: '1px solid #1f2937', background: d.abbr === data.teamAbbr ? '#1f2937' : 'transparent' }}>
              <div style={{ fontSize: 11, color: d.abbr === data.teamAbbr ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{d.abbr} {d.team.split(' ').pop()}</div>
              <div style={{ fontSize: 10, color: getOddsColor(d.winDiv), textAlign: 'center', fontWeight: 700 }}>{d.winDiv}%</div>
              <div style={{ fontSize: 10, color: getOddsColor(d.winWC), textAlign: 'center' }}>{d.winWC}%</div>
              <div style={{ fontSize: 10, color: getOddsColor(d.makePlayoffs), textAlign: 'center', fontWeight: 700 }}>{d.makePlayoffs}%</div>
              <div style={{ fontSize: 10, color: d.miss > 50 ? '#ef4444' : '#6b7280', textAlign: 'center' }}>{d.miss}%</div>
              <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>{d.projWins}-{d.projLosses}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pace' && (
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 12 }}>MONTHLY PACE</div>
          {data.monthlyPace.map(m => (
            <div key={m.month} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{m.month}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{m.wins}-{m.losses} ({m.pace}-win pace)</span>
              </div>
              <div style={{ height: 10, background: '#1f2937', borderRadius: 4 }}>
                <div style={{ width: `${(m.wins / (m.wins + m.losses)) * 100}%`, height: '100%', borderRadius: 4, background: m.pace >= 90 ? '#22c55e' : m.pace >= 82 ? '#3b82f6' : '#f59e0b' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
