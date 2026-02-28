/**
 * ScoutingReportsView – Detailed scouting reports on opposing players
 *
 * Bloomberg-terminal style scouting dossier with tendencies,
 * weaknesses, strengths, and tactical gameplans.
 */
import { useState, useMemo } from 'react';
import {
  ScoutingReport,
  ReportType,
  THREAT_DISPLAY,
  getReportSummary,
  generateDemoReports,
} from '../../engine/scouting/scoutingReports';

export default function ScoutingReportsView() {
  const reports = useMemo(() => generateDemoReports(), []);
  const summary = useMemo(() => getReportSummary(reports), [reports]);
  const [filter, setFilter] = useState<ReportType | 'all'>('all');
  const [selected, setSelected] = useState<ScoutingReport | null>(null);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.type === filter);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SCOUTING REPORTS — OPPONENT INTEL
      </div>

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Reports', value: summary.totalReports },
          { label: 'Hitter Reports', value: summary.hitterReports },
          { label: 'Pitcher Reports', value: summary.pitcherReports },
          { label: 'Dangerous', value: summary.dangerousCount, color: '#ef4444' },
          { label: 'Avg Confidence', value: `${summary.avgConfidence}/10` },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['all', 'hitter', 'pitcher'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? '#f59e0b' : '#1a1a2e',
              color: filter === f ? '#000' : '#ccc',
              border: '1px solid #333',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {f === 'all' ? 'ALL' : f.toUpperCase() + 'S'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Report List ── */}
        <div style={{ flex: '1 1 340px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Threat</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Conf</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const td = THREAT_DISPLAY[r.threatLevel];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === r.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{r.team}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{r.overall}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: td.color }}>{td.emoji} {td.label}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.scoutGrade}/10</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{selected.name}</span>
                  <span style={{ color: '#888', marginLeft: 8 }}>{selected.team} · {selected.pos} · {selected.type.toUpperCase()}</span>
                </div>
                <span style={{ color: THREAT_DISPLAY[selected.threatLevel].color, fontWeight: 700 }}>
                  {THREAT_DISPLAY[selected.threatLevel].emoji} {THREAT_DISPLAY[selected.threatLevel].label}
                </span>
              </div>

              {/* Key Stats */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>KEY STATS</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(selected.keyStats).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#f59e0b', fontWeight: 700 }}>{v}</div>
                      <div style={{ color: '#666', fontSize: 10 }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tendencies */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>TENDENCIES</div>
                {selected.tendencies.map((t, i) => (
                  <div key={i} style={{ paddingLeft: 8, color: '#ccc', marginBottom: 2 }}>• {t}</div>
                ))}
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 4 }}>STRENGTHS</div>
                {selected.strengths.map((s, i) => (
                  <div key={i} style={{ paddingLeft: 8, color: '#22c55e', marginBottom: 2 }}>+ {s}</div>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 4 }}>WEAKNESSES</div>
                {selected.weaknesses.map((w, i) => (
                  <div key={i} style={{ paddingLeft: 8, color: '#ef4444', marginBottom: 2 }}>- {w}</div>
                ))}
              </div>

              {/* Gameplan */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>GAMEPLAN</div>
                <div style={{ padding: 8, background: '#111', border: '1px solid #333', color: '#eee', lineHeight: 1.5 }}>
                  {selected.gameplan}
                </div>
              </div>

              <div style={{ color: '#555', fontSize: 10, textAlign: 'right' }}>
                Updated: {selected.lastUpdated} · Confidence: {selected.scoutGrade}/10
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view full scouting report
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
