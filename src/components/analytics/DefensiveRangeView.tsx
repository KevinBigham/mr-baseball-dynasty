import { useState } from 'react';
import { generateDemoDefensiveRange, getGradeColor, getOAAColor, ZONE_LABELS } from '../../engine/analytics/defensiveRangeChart';

const data = generateDemoDefensiveRange();

export default function DefensiveRangeView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const fielder = data.fielders[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DEFENSIVE RANGE CHART</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Zone coverage efficiency, range scores, and outs above average</p>
      </div>

      {/* Team defense summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TEAM DRS', value: String(data.teamDRS), color: data.teamDRS > 0 ? '#22c55e' : '#ef4444' },
          { label: 'TEAM OAA', value: String(data.teamOAA), color: data.teamOAA > 0 ? '#22c55e' : '#ef4444' },
          { label: 'FIELDER', value: fielder.name, color: '#f59e0b' },
          { label: 'DEF GRADE', value: fielder.overallGrade, color: getGradeColor(fielder.overallGrade) },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fielder selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.fielders.map((f, i) => (
          <button key={f.playerId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {f.name} ({f.position})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Zone coverage detail */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>ZONE COVERAGE — {fielder.name} ({fielder.position})</div>

          {/* Tool scores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'RANGE', value: fielder.rangeScore, color: fielder.rangeScore >= 80 ? '#22c55e' : fielder.rangeScore >= 60 ? '#f59e0b' : '#ef4444' },
              { label: 'ARM', value: fielder.armScore, color: fielder.armScore >= 80 ? '#22c55e' : fielder.armScore >= 60 ? '#f59e0b' : '#ef4444' },
              { label: 'FIRST STEP', value: fielder.firstStepScore, color: fielder.firstStepScore >= 80 ? '#22c55e' : fielder.firstStepScore >= 60 ? '#f59e0b' : '#ef4444' },
              { label: 'OAA', value: fielder.totalOAA, color: getOAAColor(fielder.totalOAA) },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 8, background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Zone breakdown */}
          {fielder.zones.map(z => {
            const diff = z.conversionRate - z.leagueAvgRate;
            return (
              <div key={z.zone} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '4px 8px', background: '#0a0f1a', border: '1px solid #1f2937' }}>
                <div style={{ width: 40, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{ZONE_LABELS[z.zone]}</div>
                <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 2 }}>
                  <div style={{ width: `${z.conversionRate * 100}%`, height: '100%', borderRadius: 2, background: diff >= 0.02 ? '#22c55e' : diff >= 0 ? '#3b82f6' : '#ef4444', opacity: 0.7 }} />
                </div>
                <div style={{ width: 38, fontSize: 10, fontWeight: 700, color: '#e5e7eb', textAlign: 'right' }}>{(z.conversionRate * 100).toFixed(0)}%</div>
                <div style={{ width: 38, fontSize: 10, color: diff >= 0 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>
                  {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}
                </div>
                <div style={{ width: 32, fontSize: 10, color: getOAAColor(z.oaa), fontWeight: 700, textAlign: 'right' }}>{z.oaa > 0 ? '+' : ''}{z.oaa}</div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4, fontSize: 9, color: '#6b7280' }}>
            <span>RATE</span><span>vs AVG</span><span>OAA</span>
          </div>
        </div>

        {/* All fielders comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEFENSIVE ROSTER</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['PLAYER', 'POS', 'OAA', 'RANGE', 'ARM', '1ST STEP', 'GRADE'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PLAYER' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.fielders.map((f, i) => (
                <tr key={f.playerId} onClick={() => setSelectedIdx(i)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: i === selectedIdx ? '#1f2937' : 'transparent' }}>
                  <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{f.name}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b' }}>{f.position}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: getOAAColor(f.totalOAA), fontWeight: 700 }}>{f.totalOAA > 0 ? '+' : ''}{f.totalOAA}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <div style={{ width: 30, height: 6, background: '#1f2937', borderRadius: 2 }}>
                        <div style={{ width: `${f.rangeScore}%`, height: '100%', borderRadius: 2, background: f.rangeScore >= 80 ? '#22c55e' : f.rangeScore >= 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span style={{ color: '#e5e7eb', fontSize: 10 }}>{f.rangeScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{f.armScore}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>{f.firstStepScore}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, background: getGradeColor(f.overallGrade) + '22', color: getGradeColor(f.overallGrade) }}>
                      {f.overallGrade.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Error rates */}
          <div style={{ marginTop: 16, color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ERROR RATES (per 100 chances)</div>
          {data.fielders.map(f => (
            <div key={f.playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 100, fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{f.name}</div>
              <div style={{ flex: 1, height: 8, background: '#1f2937', borderRadius: 2 }}>
                <div style={{ width: `${Math.min(f.errorRate * 33, 100)}%`, height: '100%', borderRadius: 2, background: f.errorRate <= 1.0 ? '#22c55e' : f.errorRate <= 1.5 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div style={{ width: 30, fontSize: 10, color: f.errorRate <= 1.0 ? '#22c55e' : f.errorRate <= 1.5 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{f.errorRate.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
