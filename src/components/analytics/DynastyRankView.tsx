import { useState } from 'react';
import { generateDemoDynastyRankings, type DynastyTeam } from '../../engine/analytics/dynastyPowerRankings';

const data = generateDemoDynastyRankings();

const tierColor: Record<DynastyTeam['tier'], string> = {
  contender: '#22c55e', playoff: '#f59e0b', bubble: '#a855f7', rebuilding: '#9ca3af', tanking: '#ef4444',
};

const trendIcon: Record<DynastyTeam['trend'], { icon: string; color: string }> = {
  ascending: { icon: '\u25B2', color: '#22c55e' },
  peak: { icon: '\u2605', color: '#f59e0b' },
  declining: { icon: '\u25BC', color: '#ef4444' },
  rebuilding: { icon: '\u21BB', color: '#9ca3af' },
};

export default function DynastyRankView() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = selectedId !== null ? data.find(t => t.teamId === selectedId) : null;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DYNASTY POWER RANKINGS</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Long-term franchise strength rankings with factor analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['#', 'TEAM', 'SCORE', 'TIER', 'W PROJ', 'WINDOW', 'TREND', 'TITLES', 'LAST PO'].map(h => (
                <th key={h} style={{ padding: '5px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'TEAM' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(t => {
              const ti = trendIcon[t.trend];
              return (
                <tr key={t.teamId} onClick={() => setSelectedId(t.teamId === selectedId ? null : t.teamId)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selectedId === t.teamId ? '#1f293780' : 'transparent' }}>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{t.overallRank}</td>
                  <td style={{ padding: '5px 6px', color: '#e5e7eb', fontWeight: 600 }}>{t.teamName}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: t.dynastyScore > 75 ? '#22c55e' : t.dynastyScore > 55 ? '#f59e0b' : '#9ca3af' }}>{t.dynastyScore}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 5px', fontSize: 9, fontWeight: 700, background: tierColor[t.tier] + '22', color: tierColor[t.tier], border: `1px solid ${tierColor[t.tier]}44` }}>
                      {t.tier.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#e5e7eb' }}>{t.projectedWins}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: t.windowOpen ? '#22c55e' : '#ef4444' }}>
                    {t.windowOpen ? `${t.windowYears}yr` : 'CLOSED'}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: ti.color }}>{ti.icon} {t.trend.toUpperCase()}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: t.titles > 0 ? '#f59e0b' : '#6b7280' }}>{t.titles}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{t.lastPlayoffs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {selected && (
          <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{selected.teamName}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>
              Rank #{selected.overallRank} | Score: {selected.dynastyScore} | {selected.tier.toUpperCase()}
            </div>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>DYNASTY FACTORS</div>
            {selected.factors.map(f => (
              <div key={f.label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{f.label} ({(f.weight * 100).toFixed(0)}%)</span>
                  <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 700 }}>{f.score} (#{f.rank})</span>
                </div>
                <div style={{ height: 6, background: '#1f2937' }}>
                  <div style={{ width: `${f.score}%`, height: '100%', background: f.score > 75 ? '#22c55e' : f.score > 55 ? '#f59e0b' : '#9ca3af' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
