/**
 * PlateDisciplineView – Comprehensive plate discipline metrics
 *
 * Bloomberg-terminal style discipline dashboard with BB%, K%,
 * chase rates, contact rates, and discipline grades.
 */
import { useState, useMemo } from 'react';
import {
  DisciplinePlayer,
  DISCIPLINE_DISPLAY,
  getDisciplineSummary,
  generateDemoDiscipline,
} from '../../engine/analytics/plateDiscipline';

type SortKey = keyof Pick<DisciplinePlayer, 'bbRate' | 'kRate' | 'bbkRatio' | 'chaseRate' | 'contactRate' | 'pitchesPerPA'>;

export default function PlateDisciplineView() {
  const players = useMemo(() => generateDemoDiscipline(), []);
  const summary = useMemo(() => getDisciplineSummary(players), [players]);
  const [sortBy, setSortBy] = useState<SortKey>('bbRate');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<DisciplinePlayer | null>(null);

  const sorted = [...players].sort((a, b) => sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const sortArrow = (key: SortKey) => sortBy === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PLATE DISCIPLINE — EYE AT THE PLATE
      </div>

      {/* ── Summary Strip ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team BB%', value: `${summary.teamBBRate}%` },
          { label: 'Team K%', value: `${summary.teamKRate}%`, color: summary.teamKRate > 22 ? '#ef4444' : '#f59e0b' },
          { label: 'Team Chase%', value: `${summary.teamChaseRate}%`, color: summary.teamChaseRate > 28 ? '#ef4444' : '#f59e0b' },
          { label: 'Team Contact%', value: `${summary.teamContactRate}%` },
          { label: 'Elite Eyes', value: summary.eliteEyeCount, color: '#22c55e' },
          { label: 'Free Swingers', value: summary.freeSwingCount, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Table ── */}
        <div style={{ flex: '1 1 600px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('bbRate')}>BB%{sortArrow('bbRate')}</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('kRate')}>K%{sortArrow('kRate')}</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('bbkRatio')}>BB/K{sortArrow('bbkRatio')}</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('chaseRate')}>Chase%{sortArrow('chaseRate')}</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('contactRate')}>Contact%{sortArrow('contactRate')}</th>
                <th style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }} onClick={() => handleSort('pitchesPerPA')}>P/PA{sortArrow('pitchesPerPA')}</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const dg = DISCIPLINE_DISPLAY[p.disciplineGrade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.pos}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.bbRate >= 12 ? '#22c55e' : '#ccc' }}>{p.bbRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.kRate > 25 ? '#ef4444' : '#ccc' }}>{p.kRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.bbkRatio >= 0.6 ? '#22c55e' : '#ccc' }}>{p.bbkRatio}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.chaseRate > 30 ? '#ef4444' : '#ccc' }}>{p.chaseRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.contactRate >= 85 ? '#22c55e' : '#ccc' }}>{p.contactRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.pitchesPerPA}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: dg.color, fontWeight: 600 }}>{dg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 280px' }}>
          {selected ? (() => {
            const dg = DISCIPLINE_DISPLAY[selected.disciplineGrade];
            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                  {selected.name}
                  <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · OVR {selected.overall}</span>
                </div>

                <div style={{ color: dg.color, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  {dg.emoji} {dg.label}
                </div>

                {[
                  { label: 'Walk Rate', value: `${selected.bbRate}%`, good: selected.bbRate >= 10 },
                  { label: 'Strikeout Rate', value: `${selected.kRate}%`, good: selected.kRate < 20 },
                  { label: 'BB/K Ratio', value: `${selected.bbkRatio}`, good: selected.bbkRatio >= 0.5 },
                  { label: 'Chase Rate', value: `${selected.chaseRate}%`, good: selected.chaseRate < 25 },
                  { label: 'Contact Rate', value: `${selected.contactRate}%`, good: selected.contactRate >= 80 },
                  { label: 'Zone Contact', value: `${selected.zoneContactRate}%`, good: selected.zoneContactRate >= 90 },
                  { label: 'O-Swing%', value: `${selected.outZoneSwing}%`, good: selected.outZoneSwing < 28 },
                  { label: 'Z-Swing%', value: `${selected.zoneSwing}%`, good: selected.zoneSwing >= 68 },
                  { label: 'SwStr%', value: `${selected.swstrRate}%`, good: selected.swstrRate < 10 },
                  { label: '1st Pitch Swing%', value: `${selected.firstPitchSwing}%`, good: selected.firstPitchSwing < 35 },
                  { label: 'Pitches/PA', value: `${selected.pitchesPerPA}`, good: selected.pitchesPerPA >= 4.0 },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a1a2e' }}>
                    <span style={{ color: '#888' }}>{row.label}</span>
                    <span style={{ color: row.good ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view detailed discipline breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
