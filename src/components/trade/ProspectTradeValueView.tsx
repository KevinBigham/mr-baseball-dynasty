import { useState } from 'react';
import { generateDemoProspectTradeValue, type ValueTier } from '../../engine/trade/prospectTradeValue';

const data = generateDemoProspectTradeValue();

const tierBadge: Record<ValueTier, { label: string; color: string }> = {
  franchise: { label: 'FRANCHISE', color: '#f59e0b' },
  premium: { label: 'PREMIUM', color: '#22c55e' },
  solid: { label: 'SOLID', color: '#3b82f6' },
  role: { label: 'ROLE', color: '#a855f7' },
  lottery: { label: 'LOTTERY', color: '#9ca3af' },
  marginal: { label: 'MARGINAL', color: '#6b7280' },
};

export default function ProspectTradeValueView() {
  const [sortBy, setSortBy] = useState<'value' | 'rank' | 'age'>('value');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sorted = [...data].sort((a, b) =>
    sortBy === 'value' ? b.tradeValue - a.tradeValue :
    sortBy === 'rank' ? a.overallRank - b.overallRank :
    a.age - b.age
  );

  const selected = selectedId !== null ? data.find(p => p.prospectId === selectedId) : null;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>PROSPECT TRADE VALUE</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Trade value assessment with factor breakdown and comparable returns</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['value', 'rank', 'age'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ padding: '3px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', border: '1px solid', borderColor: sortBy === s ? '#f59e0b' : '#374151', background: sortBy === s ? '#78350f' : 'transparent', color: sortBy === s ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['NAME', 'POS', 'AGE', 'LVL', 'RANK', 'VALUE', 'TIER', 'SURPLUS', 'STATUS'].map(h => (
                <th key={h} style={{ padding: '5px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'NAME' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const tb = tierBadge[p.tier];
              return (
                <tr key={p.prospectId} onClick={() => setSelectedId(p.prospectId === selectedId ? null : p.prospectId)}
                  style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selectedId === p.prospectId ? '#1f293780' : 'transparent' }}>
                  <td style={{ padding: '5px 6px', color: '#e5e7eb', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.position}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.age}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.currentLevel}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>#{p.overallRank}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <div style={{ width: 40, height: 6, background: '#1f2937' }}>
                        <div style={{ width: `${p.tradeValue}%`, height: '100%', background: tb.color }} />
                      </div>
                      <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{p.tradeValue}</span>
                    </div>
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 5px', fontSize: 9, fontWeight: 700, background: tb.color + '22', color: tb.color, border: `1px solid ${tb.color}44` }}>{tb.label}</span>
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{p.surplus}yr</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    {p.untouchable && <span style={{ padding: '1px 5px', fontSize: 9, fontWeight: 700, background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}>UNTOUCHABLE</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {selected && (
          <div style={{ border: '1px solid #374151', padding: 16, background: '#111827' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>{selected.position} | {selected.currentLevel} | Age {selected.age} | #{selected.overallRank}</div>

            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>VALUE FACTORS</div>
            {[
              { label: 'Tool Score', value: selected.factors.toolScore, max: 100 },
              { label: 'ETA Score', value: selected.factors.etaScore, max: 100 },
              { label: 'Position Value', value: selected.factors.positionValue, max: 20 },
              { label: 'Age Bonus', value: selected.factors.ageBonus, max: 15 },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 100, fontSize: 10, color: '#9ca3af' }}>{f.label}</div>
                <div style={{ flex: 1, height: 8, background: '#1f2937', margin: '0 8px' }}>
                  <div style={{ width: `${(f.value / f.max) * 100}%`, height: '100%', background: '#22c55e' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', width: 30, textAlign: 'right' }}>{f.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 100, fontSize: 10, color: '#ef4444' }}>Risk Discount</div>
              <div style={{ flex: 1, height: 8, background: '#1f2937', margin: '0 8px' }}>
                <div style={{ width: `${(selected.factors.riskDiscount / 30) * 100}%`, height: '100%', background: '#ef4444' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', width: 30, textAlign: 'right' }}>-{selected.factors.riskDiscount}</span>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#1f2937', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>COMPARABLE RETURN</div>
              <div style={{ fontSize: 12, color: '#e5e7eb' }}>{selected.comparableTradeReturn}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
