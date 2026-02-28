import { useState, useMemo } from 'react';
import {
  generateDemoDraftPickValue,
  type DraftPickValueData,
  type DraftSlotValue,
  type TradeScenario,
  type ValueTierBand,
} from '../../engine/draft/draftPickValueChart';

const data: DraftPickValueData = generateDemoDraftPickValue();

function formatMoney(n: number): string {
  return `$${n.toFixed(1)}M`;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function getValueColor(surplus: number): string {
  if (surplus >= 30) return '#22c55e';
  if (surplus >= 20) return '#3b82f6';
  if (surplus >= 12) return '#f59e0b';
  if (surplus >= 6)  return '#f97316';
  return '#ef4444';
}

function getHitRateColor(rate: number): string {
  if (rate >= 0.55) return '#22c55e';
  if (rate >= 0.40) return '#3b82f6';
  if (rate >= 0.28) return '#f59e0b';
  return '#ef4444';
}

function TierBadge({ tier }: { tier: ValueTierBand }) {
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      fontFamily: 'monospace',
      padding: '2px 6px',
      border: `1px solid ${tier.color}44`,
      background: `${tier.color}15`,
      color: tier.color,
    }}>
      {tier.label.toUpperCase()}
    </span>
  );
}

function BarFill({ value, max, color, width = 80 }: { value: number; max: number; color: string; width?: number }) {
  const pctW = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pctW}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
}

function SlotDetailPanel({ slot }: { slot: DraftSlotValue }) {
  const tier = data.tiers.find(t => slot.pick >= t.pickRange[0] && slot.pick <= t.pickRange[1]);
  return (
    <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
            PICK #{slot.pick}
          </span>
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>Round {slot.round}</span>
        </div>
        {tier && <TierBadge tier={tier} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'SURPLUS VALUE', value: formatMoney(slot.surplusValue), color: getValueColor(slot.surplusValue) },
          { label: 'EXPECTED WAR', value: slot.expectedWAR.toFixed(1), color: '#e5e7eb' },
          { label: 'SIGNING BONUS', value: formatMoney(slot.signingBonus), color: '#a78bfa' },
          { label: 'YEARS TO MLB', value: `~${slot.yearsToMLB}`, color: '#60a5fa' },
        ].map(item => (
          <div key={item.label} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, letterSpacing: 1 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Outcome probabilities */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, letterSpacing: 1 }}>OUTCOME PROBABILITIES</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Star', rate: slot.starRate, color: '#22c55e' },
            { label: 'Regular', rate: slot.hitRate - slot.starRate, color: '#3b82f6' },
            { label: 'Bust', rate: slot.bustRate, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: item.color }}>{item.label}</span>
                <span style={{ fontSize: 10, color: item.color, fontWeight: 700, fontFamily: 'monospace' }}>{pct(Math.max(0, item.rate))}</span>
              </div>
              <div style={{ height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(0, item.rate) * 100}%`, height: '100%', background: item.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equivalent player */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: '#6b7280' }}>EQUIVALENT PROVEN PLAYER</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', fontFamily: 'monospace' }}>
          {slot.equivalentPlayerOVR} OVR — {slot.equivalentPlayerLabel}
        </span>
      </div>

      {/* Historical notables */}
      {slot.historicalNotables.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, letterSpacing: 1 }}>NOTABLE PICKS AT THIS SLOT</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {slot.historicalNotables.map(name => (
              <span key={name} style={{ fontSize: 10, padding: '2px 8px', background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb33' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TradeScenarioCard({ scenario }: { scenario: TradeScenario }) {
  const verdictColors = { side1: '#22c55e', side2: '#3b82f6', even: '#f59e0b' };
  const verdictLabels = { side1: scenario.side1Label, side2: scenario.side2Label, even: 'EVEN' };

  return (
    <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', fontFamily: 'monospace' }}>{scenario.title}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{scenario.description}</div>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '3px 8px',
          background: `${verdictColors[scenario.verdict]}20`,
          color: verdictColors[scenario.verdict],
          border: `1px solid ${verdictColors[scenario.verdict]}44`,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          EDGE: {verdictLabels[scenario.verdict]}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 12 }}>
        {/* Side 1 */}
        <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10 }}>
          <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 6, letterSpacing: 1 }}>{scenario.side1Label.toUpperCase()}</div>
          {scenario.side1Picks.map(p => (
            <div key={p} style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>Pick #{p}</div>
          ))}
          {scenario.side1Players.map(p => (
            <div key={p} style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'monospace' }}>{p}</div>
          ))}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginTop: 8, fontFamily: 'monospace' }}>
            {formatMoney(scenario.side1TotalValue)}
          </div>
        </div>

        {/* VS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>VS</span>
        </div>

        {/* Side 2 */}
        <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10 }}>
          <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 6, letterSpacing: 1 }}>{scenario.side2Label.toUpperCase()}</div>
          {scenario.side2Picks.map(p => (
            <div key={p} style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>Pick #{p}</div>
          ))}
          {scenario.side2Players.map(p => (
            <div key={p} style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'monospace' }}>{p}</div>
          ))}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginTop: 8, fontFamily: 'monospace' }}>
            {formatMoney(scenario.side2TotalValue)}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.5, padding: '8px 0', borderTop: '1px solid #1f2937' }}>
        {scenario.analysis}
      </div>
    </div>
  );
}

export default function DraftPickValueView() {
  const [tab, setTab] = useState<'chart' | 'trades'>('chart');
  const [selectedPick, setSelectedPick] = useState<number>(1);
  const [showTop, setShowTop] = useState<number>(30);

  const selectedSlot = useMemo(() => data.slots.find(s => s.pick === selectedPick)!, [selectedPick]);
  const maxSurplus = data.slots[0].surplusValue;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>DRAFT PICK VALUE CHART</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>
            Surplus value, hit rates &amp; trade equivalencies for picks 1-{data.slots.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['chart', 'trades'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 14px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
              border: '1px solid', borderColor: tab === t ? '#f59e0b' : '#374151',
              background: tab === t ? '#78350f' : 'transparent',
              color: tab === t ? '#f59e0b' : '#9ca3af',
            }}>
              {t === 'chart' ? 'VALUE CHART' : 'TRADE SCENARIOS'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chart' ? (
        <>
          {/* Tier summary row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {data.tiers.map(tier => (
              <div key={tier.tier} style={{
                flex: 1, minWidth: 130,
                background: '#111827', border: `1px solid ${tier.color}33`, padding: '8px 12px',
              }}>
                <div style={{ fontSize: 9, color: tier.color, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                  {tier.label.toUpperCase()} (#{tier.pickRange[0]}-{tier.pickRange[1]})
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Avg Surplus</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{formatMoney(tier.avgSurplus)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Avg Hit Rate</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{pct(tier.avgHitRate)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[30, 40, 50].map(n => (
              <button key={n} onClick={() => setShowTop(n)} style={{
                padding: '3px 10px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                border: '1px solid', cursor: 'pointer',
                borderColor: showTop === n ? '#f59e0b' : '#374151',
                background: showTop === n ? '#78350f' : 'transparent',
                color: showTop === n ? '#f59e0b' : '#6b7280',
              }}>
                TOP {n}
              </button>
            ))}
          </div>

          {/* Value chart table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Left: table */}
            <div style={{ border: '1px solid #374151', background: '#111827', overflow: 'auto', maxHeight: 600 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151' }}>
                    {['#', 'RD', 'SURPLUS', 'xWAR', 'HIT%', 'STAR%', 'BONUS', 'ETA'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 700, fontSize: 9, textAlign: h === '#' || h === 'RD' ? 'center' : 'right', letterSpacing: 1, position: 'sticky', top: 0, background: '#111827', zIndex: 1 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slots.slice(0, showTop).map(slot => {
                    const isSelected = slot.pick === selectedPick;
                    return (
                      <tr key={slot.pick} onClick={() => setSelectedPick(slot.pick)} style={{
                        cursor: 'pointer',
                        background: isSelected ? '#1e3a5f' : 'transparent',
                        borderBottom: '1px solid #1f293744',
                      }}>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700, color: isSelected ? '#f59e0b' : '#9ca3af' }}>{slot.pick}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{slot.round}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: getValueColor(slot.surplusValue) }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <BarFill value={slot.surplusValue} max={maxSurplus} color={getValueColor(slot.surplusValue)} width={50} />
                            <span style={{ width: 48, textAlign: 'right' }}>{formatMoney(slot.surplusValue)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e5e7eb' }}>{slot.expectedWAR}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: getHitRateColor(slot.hitRate) }}>{pct(slot.hitRate)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: slot.starRate >= 0.15 ? '#22c55e' : '#6b7280' }}>{pct(slot.starRate)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#a78bfa' }}>{formatMoney(slot.signingBonus)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#60a5fa' }}>{slot.yearsToMLB}yr</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right: detail panel */}
            <div>
              <SlotDetailPanel slot={selectedSlot} />
            </div>
          </div>

          {/* Value curve visualization */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 12, letterSpacing: 1 }}>SURPLUS VALUE CURVE (PICKS 1-{showTop})</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
              {data.slots.slice(0, showTop).map(slot => {
                const h = (slot.surplusValue / maxSurplus) * 110;
                const isSelected = slot.pick === selectedPick;
                const tier = data.tiers.find(t => slot.pick >= t.pickRange[0] && slot.pick <= t.pickRange[1]);
                return (
                  <div key={slot.pick} onClick={() => setSelectedPick(slot.pick)} style={{
                    flex: 1,
                    height: Math.max(2, h),
                    background: isSelected ? '#f59e0b' : (tier?.color ?? '#374151'),
                    opacity: isSelected ? 1 : 0.6,
                    cursor: 'pointer',
                    borderRadius: '2px 2px 0 0',
                    transition: 'opacity 0.15s',
                  }}
                  title={`Pick #${slot.pick}: ${formatMoney(slot.surplusValue)}`}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#6b7280' }}>#1</span>
              <span style={{ fontSize: 9, color: '#6b7280' }}>#{showTop}</span>
            </div>
          </div>
        </>
      ) : (
        /* Trade Scenarios Tab */
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 12, letterSpacing: 1 }}>
            {data.tradeScenarios.length} TRADE SCENARIOS — PICK VALUE COMPARISON
          </div>
          {data.tradeScenarios.map(scenario => (
            <TradeScenarioCard key={scenario.id} scenario={scenario} />
          ))}

          {/* Reference table */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, letterSpacing: 1 }}>QUICK REFERENCE: TOP 10 PICK VALUES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {data.slots.slice(0, 10).map(slot => (
                <div key={slot.pick} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>#{slot.pick}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: getValueColor(slot.surplusValue), marginTop: 2 }}>{formatMoney(slot.surplusValue)}</div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{pct(slot.hitRate)} hit</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
