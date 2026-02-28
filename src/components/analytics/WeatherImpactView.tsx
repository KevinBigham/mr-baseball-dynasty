/**
 * WeatherImpactView — Weather Impact Analysis Dashboard
 *
 * Bloomberg-terminal style visualization of how weather conditions
 * affect game outcomes: wind/temp/humidity impacts, park-by-park
 * weather profiles, weather-adjusted player stats, and game log.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoWeatherImpact,
  CONDITION_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  WIND_DIR_LABELS,
  formatParkFactor,
  getSeverityColor,
  type WeatherConditionImpact,
  type ParkWeatherProfile,
  type WeatherAdjustedStat,
  type WeatherGameLog,
} from '../../engine/analytics/weatherImpactAnalysis';

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: 18,
    color: '#e5e7eb',
    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
    fontSize: 12,
    background: '#030712',
    minHeight: '100%',
  },
  header: {
    background: '#111827',
    borderBottom: '1px solid #374151',
    padding: '8px 18px',
    marginBottom: 16,
    marginLeft: -18,
    marginRight: -18,
    marginTop: -18,
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    fontWeight: 700,
    fontSize: 13,
    color: '#f59e0b',
    letterSpacing: 1,
  },
  panel: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    marginBottom: 14,
  },
  panelHeader: {
    padding: '6px 12px',
    borderBottom: '1px solid #374151',
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statBox: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    padding: '8px 14px',
    minWidth: 100,
    textAlign: 'center' as const,
  },
  statLabel: { color: '#6b7280', fontSize: 9, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' as const },
  statValue: { fontSize: 18, fontWeight: 700 },
  btn: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
    border: active ? '1px solid #f59e0b' : '1px solid #374151',
    borderRadius: 3,
    background: active ? '#f59e0b' : 'transparent',
    color: active ? '#030712' : '#9ca3af',
    cursor: 'pointer' as const,
  }),
  catBadge: (cat: string) => ({
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    color: CATEGORY_COLORS[cat] ?? '#9ca3af',
    background: (CATEGORY_COLORS[cat] ?? '#9ca3af') + '22',
    letterSpacing: 0.5,
  }),
} as const;

// ── Impact multiplier format ─────────────────────────────────────────────────

function fmtMult(val: number): string {
  if (val >= 1) return `+${((val - 1) * 100).toFixed(0)}%`;
  return `${((val - 1) * 100).toFixed(0)}%`;
}

function multColor(val: number, higherIsBetter: boolean): string {
  const delta = val - 1;
  if (higherIsBetter) {
    return delta >= 0.05 ? '#22c55e' : delta <= -0.05 ? '#ef4444' : '#9ca3af';
  }
  return delta <= -0.05 ? '#22c55e' : delta >= 0.05 ? '#ef4444' : '#9ca3af';
}

function deltaColor(val: number): string {
  if (val > 0.3) return '#22c55e';
  if (val < -0.3) return '#ef4444';
  return '#9ca3af';
}

// ── Condition Impact Card ────────────────────────────────────────────────────

function ConditionCard({ condition }: { condition: WeatherConditionImpact }) {
  return (
    <div style={S.panel}>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={S.catBadge(condition.category)}>{CATEGORY_LABELS[condition.category]}</span>
            <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{condition.conditionType}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '1px 6px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 700,
              color: getSeverityColor(condition.severity),
              background: getSeverityColor(condition.severity) + '22',
            }}>
              {condition.severity.toUpperCase()} IMPACT
            </span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{condition.sampleSize} games</span>
          </div>
        </div>

        {/* Metric bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'HR RATE', value: condition.hrRateAdj, fmt: fmtMult(condition.hrRateAdj), color: multColor(condition.hrRateAdj, true) },
            { label: 'RUNS/GAME', value: condition.runsPerGameAdj, fmt: `${condition.runsPerGameAdj >= 0 ? '+' : ''}${condition.runsPerGameAdj.toFixed(1)}`, color: deltaColor(condition.runsPerGameAdj) },
            { label: 'FLY DIST', value: condition.avgDistAdj, fmt: `${condition.avgDistAdj >= 0 ? '+' : ''}${condition.avgDistAdj.toFixed(1)} ft`, color: deltaColor(condition.avgDistAdj) },
            { label: 'K RATE', value: condition.kRateAdj, fmt: fmtMult(condition.kRateAdj), color: multColor(condition.kRateAdj, false) },
            { label: 'BB RATE', value: condition.bbRateAdj, fmt: fmtMult(condition.bbRateAdj), color: multColor(condition.bbRateAdj, false) },
            { label: 'AVG', value: condition.avgAdj, fmt: fmtMult(condition.avgAdj), color: multColor(condition.avgAdj, true) },
          ].map(m => (
            <div key={m.label} style={{ background: '#0d1117', padding: '6px 10px', borderRadius: 3, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 8, color: '#6b7280', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.fmt}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: '1.5', fontStyle: 'italic' }}>
          {condition.description}
        </div>
      </div>
    </div>
  );
}

// ── Park Weather Card ────────────────────────────────────────────────────────

function ParkCard({ park, isExpanded, onToggle }: {
  park: ParkWeatherProfile;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hrPFColor = park.hrParkFactor >= 1.05 ? '#22c55e' : park.hrParkFactor <= 0.95 ? '#ef4444' : '#9ca3af';
  const runPFColor = park.runParkFactor >= 1.03 ? '#22c55e' : park.runParkFactor <= 0.97 ? '#ef4444' : '#9ca3af';

  return (
    <div style={S.panel}>
      <button onClick={onToggle} style={{
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'monospace',
        textAlign: 'left' as const,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>{park.parkName}</div>
          <div style={{ color: '#6b7280', fontSize: 9 }}>
            {park.city} | {park.team} | {park.elevation} ft {park.isDome ? '| DOME' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#6b7280' }}>HR PF</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: hrPFColor }}>{formatParkFactor(park.hrParkFactor)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#6b7280' }}>RUN PF</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: runPFColor }}>{formatParkFactor(park.runParkFactor)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#6b7280' }}>WIND</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>
              {park.avgWindSpeed} mph {park.isDome ? '' : WIND_DIR_LABELS[park.prevailingWind]}
            </div>
          </div>
          <svg style={{
            width: 14,
            height: 14,
            color: '#6b7280',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Key stats */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {[
              { label: 'AVG TEMP', value: `${park.avgTemp}F`, color: park.avgTemp > 80 ? '#ef4444' : park.avgTemp < 60 ? '#3b82f6' : '#e5e7eb' },
              { label: 'HUMIDITY', value: `${park.avgHumidity}%`, color: park.avgHumidity > 70 ? '#06b6d4' : '#e5e7eb' },
              { label: 'ELEVATION', value: `${park.elevation} ft`, color: park.elevation > 1000 ? '#a855f7' : '#e5e7eb' },
              { label: 'WX VARIABILITY', value: park.weatherVariability, color: park.weatherVariability > 60 ? '#f59e0b' : '#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0d1117', padding: '5px 10px', borderRadius: 3, border: '1px solid #1f2937', minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Weather types */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {park.topWeatherTypes.map(wt => (
              <span key={wt} style={{
                padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                background: '#1f2937', color: '#9ca3af', border: '1px solid #374151',
              }}>
                {wt}
              </span>
            ))}
          </div>

          {/* Monthly temps table */}
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  {['Month', 'High', 'Low', 'Rain Days', 'Wind'].map(h => (
                    <th key={h} style={{ padding: '3px 8px', textAlign: 'center', color: '#6b7280', fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {park.monthlyTemps.map(mt => (
                  <tr key={mt.month} style={{ borderBottom: '1px solid #0f1629' }}>
                    <td style={{ padding: '3px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{mt.month}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', color: mt.avgHigh > 85 ? '#ef4444' : '#e5e7eb' }}>{mt.avgHigh}F</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', color: mt.avgLow < 50 ? '#3b82f6' : '#e5e7eb' }}>{mt.avgLow}F</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', color: mt.rainDays > 5 ? '#06b6d4' : '#9ca3af' }}>{mt.rainDays}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', color: '#9ca3af' }}>{mt.windAvg} mph</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: '1.5', fontStyle: 'italic' }}>
            {park.notes}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Adjusted Stats Table ─────────────────────────────────────────────────────

function AdjustedStatsTable({ stats }: { stats: WeatherAdjustedStat[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['PLAYER', 'TEAM', 'POS', 'STAT', 'RAW', 'WX-ADJ', 'DELTA', '%', 'BENEFIT?'].map(h => (
              <th key={h} style={{ padding: '5px 8px', textAlign: h === 'PLAYER' ? 'left' : 'center', color: '#6b7280', fontSize: 9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => {
            const isRate = ['AVG', 'OPS', 'SLG', 'ERA'].includes(s.statType);
            const rawFmt = isRate ? s.rawStat.toFixed(3) : String(s.rawStat);
            const adjFmt = isRate ? s.weatherAdjStat.toFixed(3) : String(Math.round(s.weatherAdjStat));
            const deltaFmt = isRate ? (s.delta >= 0 ? '+' : '') + s.delta.toFixed(3) : (s.delta >= 0 ? '+' : '') + Math.round(s.delta);
            const isERA = s.statType === 'ERA';
            const deltaClr = isERA
              ? (s.delta > 0 ? '#ef4444' : s.delta < 0 ? '#22c55e' : '#9ca3af')
              : (s.delta > 0 ? '#22c55e' : s.delta < 0 ? '#ef4444' : '#9ca3af');

            return (
              <tr key={i} style={{ borderBottom: '1px solid #0f1629' }} title={s.explanation}>
                <td style={{ padding: '5px 8px', color: '#e5e7eb', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{s.team}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#9ca3af' }}>{s.position}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  <span style={{
                    padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    background: '#1f2937', color: '#d1d5db',
                  }}>{s.statType}</span>
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#e5e7eb', fontWeight: 600, fontFamily: 'monospace' }}>{rawFmt}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>{adjFmt}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: deltaClr, fontWeight: 600, fontFamily: 'monospace' }}>{deltaFmt}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: deltaClr, fontFamily: 'monospace' }}>
                  {s.deltaPercent >= 0 ? '+' : ''}{s.deltaPercent.toFixed(1)}%
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    color: s.benefitedFromWeather ? '#22c55e' : '#ef4444',
                    background: s.benefitedFromWeather ? '#22c55e22' : '#ef444422',
                  }}>
                    {s.benefitedFromWeather ? 'YES' : 'NO'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Recent Game Log ──────────────────────────────────────────────────────────

function GameLogTable({ games }: { games: WeatherGameLog[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['DATE', 'OPP', 'WX', 'TEMP', 'HUM', 'WIND', 'DIR', 'R', 'RA', 'HR', 'HRA'].map(h => (
              <th key={h} style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280', fontSize: 9, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((g, i) => {
            const won = g.runsScored > g.runsAllowed;
            const lost = g.runsScored < g.runsAllowed;
            return (
              <tr key={i} style={{
                borderBottom: '1px solid #0f1629',
                background: won ? 'rgba(34,197,94,0.04)' : lost ? 'rgba(239,68,68,0.04)' : 'transparent',
              }}>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>{g.date}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb', fontWeight: 600 }}>{g.opponent}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{
                    padding: '1px 5px', borderRadius: 3, fontSize: 8, fontWeight: 600,
                    background: '#1f2937', color: g.weather === 'Hot & Humid' ? '#ef4444' :
                      g.weather === 'Cold' ? '#3b82f6' : g.weather === 'Light Rain' ? '#06b6d4' : '#9ca3af',
                  }}>{g.weather}</span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: g.temp > 85 ? '#ef4444' : g.temp < 55 ? '#3b82f6' : '#e5e7eb' }}>
                  {g.temp}F
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{g.humidity}%</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: g.windSpeed > 12 ? '#f59e0b' : '#9ca3af' }}>
                  {g.windSpeed}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#3b82f6', fontSize: 9 }}>
                  {WIND_DIR_LABELS[g.windDir]}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: won ? '#22c55e' : '#e5e7eb', fontWeight: 700 }}>
                  {g.runsScored}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: lost ? '#ef4444' : '#e5e7eb', fontWeight: 700 }}>
                  {g.runsAllowed}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: g.hrsHit > 0 ? '#22c55e' : '#374151' }}>{g.hrsHit}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: g.hrsAllowed > 0 ? '#ef4444' : '#374151' }}>{g.hrsAllowed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function WeatherImpactView() {
  const data = useMemo(() => generateDemoWeatherImpact(), []);
  const [tab, setTab] = useState<'conditions' | 'parks' | 'adjusted' | 'gamelog'>('conditions');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [expandedPark, setExpandedPark] = useState<number | null>(data.parkWeather[0]?.parkId ?? null);

  const filteredConditions = useMemo(() => {
    if (catFilter === 'all') return data.conditions;
    return data.conditions.filter(c => c.category === catFilter);
  }, [data.conditions, catFilter]);

  // Count high-impact conditions
  const highImpact = data.conditions.filter(c => c.severity === 'high').length;
  const totalParks = data.parkWeather.length;
  const domes = data.parkWeather.filter(p => p.isDome).length;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <span>WEATHER IMPACT ANALYSIS</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>
          WAVE 71 | {data.conditions.length} CONDITIONS | {totalParks} PARKS
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'CONDITIONS', value: data.conditions.length, color: '#f59e0b' },
          { label: 'HIGH IMPACT', value: highImpact, color: '#ef4444' },
          { label: 'PARKS', value: totalParks, color: '#3b82f6' },
          { label: 'DOMES', value: domes, color: '#a855f7' },
          { label: 'LG AVG RPG', value: data.leagueAvgRPG.toFixed(2), color: '#22c55e' },
          { label: 'LG HR RATE', value: data.leagueAvgHRRate.toFixed(3), color: '#e5e7eb' },
        ].map(s => (
          <div key={s.label} style={S.statBox}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { key: 'conditions' as const, label: 'CONDITIONS' },
          { key: 'parks' as const, label: 'PARK WEATHER' },
          { key: 'adjusted' as const, label: 'ADJUSTED STATS' },
          { key: 'gamelog' as const, label: 'GAME LOG' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={S.btn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Conditions Tab */}
      {tab === 'conditions' && (
        <div>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#6b7280', letterSpacing: 0.5 }}>CATEGORY:</span>
            <button onClick={() => setCatFilter('all')} style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
              border: catFilter === 'all' ? '1px solid #f59e0b' : '1px solid #374151', borderRadius: 3,
              background: catFilter === 'all' ? '#f59e0b' : 'transparent',
              color: catFilter === 'all' ? '#030712' : '#9ca3af', cursor: 'pointer',
            }}>ALL</button>
            {CONDITION_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                border: catFilter === cat ? `1px solid ${CATEGORY_COLORS[cat]}` : '1px solid #374151', borderRadius: 3,
                background: catFilter === cat ? CATEGORY_COLORS[cat] : 'transparent',
                color: catFilter === cat ? '#030712' : '#9ca3af', cursor: 'pointer',
              }}>
                {CATEGORY_LABELS[cat].toUpperCase()}
              </button>
            ))}
          </div>

          {filteredConditions.map((c, i) => (
            <ConditionCard key={i} condition={c} />
          ))}
        </div>
      )}

      {/* Parks Tab */}
      {tab === 'parks' && (
        <div>
          {/* Quick ranking overview */}
          <div style={{ ...S.panel, marginBottom: 14 }}>
            <div style={S.panelHeader}>
              <span>PARK WEATHER RANKINGS</span>
              <span style={{ fontSize: 9, color: '#6b7280' }}>BY HR PARK FACTOR</span>
            </div>
            <div style={{ padding: 8 }}>
              {[...data.parkWeather]
                .sort((a, b) => b.hrParkFactor - a.hrParkFactor)
                .map((park, i) => {
                  const barWidth = Math.round(((park.hrParkFactor - 0.7) / 0.8) * 100);
                  return (
                    <div key={park.parkId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ width: 18, fontSize: 9, color: '#6b7280', textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ width: 130, fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{park.parkName}</span>
                      <div style={{ flex: 1, height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.max(2, barWidth)}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: park.hrParkFactor >= 1.05 ? '#22c55e' :
                            park.hrParkFactor >= 0.98 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                      <span style={{
                        width: 40,
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: park.hrParkFactor >= 1.05 ? '#22c55e' :
                          park.hrParkFactor >= 0.98 ? '#f59e0b' : '#ef4444',
                      }}>
                        {formatParkFactor(park.hrParkFactor)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Expandable park cards */}
          {data.parkWeather.map(park => (
            <ParkCard
              key={park.parkId}
              park={park}
              isExpanded={expandedPark === park.parkId}
              onToggle={() => setExpandedPark(expandedPark === park.parkId ? null : park.parkId)}
            />
          ))}
        </div>
      )}

      {/* Adjusted Stats Tab */}
      {tab === 'adjusted' && (
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span>WEATHER-ADJUSTED PLAYER STATS</span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{data.adjustedStats.length} PLAYERS | HOVER FOR EXPLANATION</span>
          </div>
          <AdjustedStatsTable stats={data.adjustedStats} />
        </div>
      )}

      {/* Game Log Tab */}
      {tab === 'gamelog' && (
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span>RECENT GAMES — WEATHER LOG</span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{data.recentGames.length} GAMES</span>
          </div>
          <GameLogTable games={data.recentGames} />
        </div>
      )}
    </div>
  );
}
