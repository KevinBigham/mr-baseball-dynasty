import { useState } from 'react';
import { generateDemoScoutReports, type ProspectScoutReport, type ReportGrade } from '../../engine/scouting/prospectScoutingReport';

const reports = generateDemoScoutReports();

const gradeColor: Record<string, string> = {
  'A+': '#22c55e', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#f59e0b', 'B': '#f59e0b', 'B-': '#fbbf24',
  'C+': '#9ca3af', 'C': '#9ca3af', 'C-': '#6b7280',
  'D': '#ef4444',
};

const riskColor: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444', extreme: '#dc2626',
};

const trendIcon: Record<string, string> = {
  improving: '\u25B2', steady: '\u25AC', declining: '\u25BC',
};

const trendColor: Record<string, string> = {
  improving: '#22c55e', steady: '#9ca3af', declining: '#ef4444',
};

export default function ProspectReportView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = reports[selectedIdx];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT SCOUTING REPORTS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Detailed scouting evaluations from your scout network</p>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {reports.map((r, i) => (
          <button key={r.prospectId} onClick={() => setSelectedIdx(i)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: i === selectedIdx ? '#f59e0b' : '#374151', background: i === selectedIdx ? '#78350f' : 'transparent', color: i === selectedIdx ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {r.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: Player card */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{selected.position} | {selected.currentLevel} | Age {selected.age}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: gradeColor[selected.overallGrade] || '#9ca3af' }}>{selected.overallGrade}</span>
              <div style={{ fontSize: 10, color: '#6b7280' }}>OVERALL</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#6b7280' }}>ETA</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{selected.eta}</div>
            </div>
            <div style={{ padding: 8, background: '#1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#6b7280' }}>RISK</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: riskColor[selected.risk] }}>{selected.risk.toUpperCase()}</div>
            </div>
            <div style={{ padding: 8, background: '#1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#6b7280' }}>CEILING</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{selected.ceiling}</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>FLOOR: <span style={{ color: '#9ca3af' }}>{selected.floor}</span></div>

          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>TOOL GRADES</div>
            {selected.tools.map(t => (
              <div key={t.tool} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ width: 80, fontSize: 11, color: '#9ca3af' }}>{t.tool}</div>
                <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: '#e5e7eb', textAlign: 'center' }}>{t.current}</div>
                <div style={{ flex: 1, height: 8, background: '#1f2937', margin: '0 8px', position: 'relative' }}>
                  <div style={{ width: `${(t.current / 80) * 100}%`, height: '100%', background: '#f59e0b' }} />
                  <div style={{ position: 'absolute', left: `${(t.future / 80) * 100}%`, top: -2, width: 2, height: 12, background: '#22c55e' }} />
                </div>
                <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: '#22c55e', textAlign: 'center' }}>{t.future}</div>
                <span style={{ fontSize: 10, color: trendColor[t.trend], marginLeft: 4 }}>{trendIcon[t.trend]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Observations */}
        <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SCOUT OBSERVATIONS</div>
          {selected.observations.map((obs, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < selected.observations.length - 1 ? '1px solid #1f2937' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#f59e0b' }}>{obs.scout}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{obs.date}</span>
              </div>
              <p style={{ fontSize: 11, color: '#d1d5db', margin: '4px 0', lineHeight: 1.5 }}>{obs.note}</p>
              <div style={{ fontSize: 10, color: '#6b7280' }}>Confidence: {obs.confidence}%</div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 12, background: '#1f2937', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>SUMMARY</div>
            <p style={{ fontSize: 11, color: '#d1d5db', margin: 0, lineHeight: 1.5 }}>{selected.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
