import { useState } from 'react';
import { generateDemoDraftBoard, type DraftProspect, type DraftTier } from '../../engine/draft/draftBoardRankings';

const board = generateDemoDraftBoard();

const tierBadge: Record<DraftTier, { label: string; color: string }> = {
  elite: { label: 'ELITE', color: '#f59e0b' },
  plus: { label: 'PLUS', color: '#22c55e' },
  solid: { label: 'SOLID', color: '#3b82f6' },
  depth: { label: 'DEPTH', color: '#9ca3af' },
  flier: { label: 'FLIER', color: '#6b7280' },
};

const riskColor: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

export default function DraftBoardView() {
  const [filterTier, setFilterTier] = useState<DraftTier | 'all'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = filterTier === 'all' ? board.topProspects : board.topProspects.filter(p => p.tier === filterTier);
  const selected = selectedId !== null ? board.topProspects.find(p => p.prospectId === selectedId) : null;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DRAFT BOARD — {board.draftYear}</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>
            {board.classSummary.college} college / {board.classSummary.hs} HS | {board.classSummary.pitchers} P / {board.classSummary.hitters} H
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'elite', 'plus', 'solid', 'depth', 'flier'] as const).map(t => (
            <button key={t} onClick={() => setFilterTier(t)}
              style={{ padding: '3px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', border: '1px solid', borderColor: filterTier === t ? '#f59e0b' : '#374151', background: filterTier === t ? '#78350f' : 'transparent', color: filterTier === t ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Team picks */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {board.teamPicks.map(pk => (
          <div key={pk.round} style={{ padding: '6px 12px', background: '#111827', border: '1px solid #374151', fontSize: 11 }}>
            <span style={{ color: '#6b7280' }}>RD {pk.round}:</span> <span style={{ color: '#f59e0b', fontWeight: 700 }}>#{pk.overall}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['#', 'NAME', 'POS', 'AGE', 'SCHOOL', 'TIER', 'GRADE', 'SIGN%', 'RISK', 'SCOUTED'].map(h => (
                <th key={h} style={{ padding: '5px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'NAME' || h === 'SCHOOL' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const tb = tierBadge[p.tier];
              return (
                <tr key={p.prospectId} onClick={() => setSelectedId(p.prospectId === selectedId ? null : p.prospectId)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selectedId === p.prospectId ? '#1f293780' : 'transparent' }}>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{p.overallRank}</td>
                  <td style={{ padding: '5px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.position}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.age}</td>
                  <td style={{ padding: '5px 6px', color: '#9ca3af', fontSize: 10 }}>{p.school}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 5px', fontSize: 9, fontWeight: 700, background: tb.color + '22', color: tb.color, border: `1px solid ${tb.color}44` }}>{tb.label}</span>
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: p.scoutGrade >= 60 ? '#22c55e' : '#e5e7eb', fontWeight: 700 }}>{p.scoutGrade}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: p.signability > 80 ? '#22c55e' : p.signability < 60 ? '#ef4444' : '#f59e0b' }}>{p.signability}%</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: riskColor[p.risk] }}>{p.risk.toUpperCase()}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: p.scouted ? '#22c55e' : '#4b5563' }}>{p.scouted ? 'YES' : 'NO'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {selected && (
          <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
              {selected.position} | {selected.school} | Age {selected.age} | ETA: {selected.eta}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>CEILING: <span style={{ color: '#f59e0b' }}>{selected.ceiling}</span></div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>SLOT VALUE: <span style={{ color: '#22c55e' }}>${(selected.slotValue / 1_000_000).toFixed(2)}M</span></div>
            </div>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>TOOLS</div>
            {selected.tools.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ width: 70, fontSize: 10, color: '#9ca3af' }}>{t.label}</div>
                <div style={{ flex: 1, height: 8, background: '#1f2937', margin: '0 8px' }}>
                  <div style={{ width: `${(t.grade / 80) * 100}%`, height: '100%', background: t.grade >= 60 ? '#22c55e' : t.grade >= 50 ? '#f59e0b' : '#6b7280' }} />
                </div>
                <div style={{ width: 24, fontSize: 11, fontWeight: 700, color: t.grade >= 60 ? '#22c55e' : '#e5e7eb', textAlign: 'right' }}>{t.grade}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
