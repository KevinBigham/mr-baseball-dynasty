/**
 * SBSuccessModelView – Stolen Base Success Model dashboard
 *
 * Bloomberg-terminal style stolen base analytics with success rate bars,
 * runner profiles, attempt history, and break-even analysis.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoSBSuccessModel,
  type RunnerSBProfile,
  type SBAttempt,
} from '../../engine/analytics/stolenBaseSuccessModel';

const SPEED_COLORS: Record<string, string> = {
  'Elite': '#22c55e',
  'Above Avg': '#3b82f6',
  'Average': '#eab308',
  'Below Avg': '#f97316',
  'Slow': '#ef4444',
};

function RateBar({ rate, breakEven, width }: { rate: number; breakEven: number; width: number }) {
  const pct = Math.round(rate * 100);
  const bePct = Math.round(breakEven * 100);
  const barColor = rate >= breakEven ? '#22c55e' : '#ef4444';

  return (
    <div style={{ width, position: 'relative' }}>
      <div style={{ height: 10, background: '#1f2937', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4 }} />
        {/* Break-even marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${bePct}%`,
          width: 2,
          height: '100%',
          background: '#f59e0b',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 1 }}>
        <span style={{ color: barColor }}>{pct}%</span>
        <span style={{ color: '#6b7280' }}>BE: {bePct}%</span>
      </div>
    </div>
  );
}

export default function SBSuccessModelView() {
  const data = useMemo(() => generateDemoSBSuccessModel(), []);
  const [selected, setSelected] = useState<RunnerSBProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        STOLEN BASE SUCCESS MODEL
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>{data.teamName.toUpperCase()}</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'TEAM SB RATE', value: `${Math.round(data.teamSBRate * 100)}%`, color: data.teamSBRate >= 0.72 ? '#22c55e' : '#ef4444' },
          { label: 'NET VALUE', value: `${data.teamNetValue > 0 ? '+' : ''}${data.teamNetValue.toFixed(1)} runs`, color: data.teamNetValue >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'BEST STEALER', value: data.bestStealer, color: '#f59e0b' },
          { label: 'BREAK-EVEN', value: '72% (2B) / 80% (3B)', color: '#eab308' },
          { label: 'ATTEMPTS', value: `${data.totalSuccesses}/${data.totalAttempts}`, color: '#d1d5db' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Runner Table */}
        <div style={{ flex: '1 1 620px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Runner</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Speed</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>SB</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Att</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Success Rate</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Net Val</th>
              </tr>
            </thead>
            <tbody>
              {data.runners.map(r => {
                const nvColor = r.netValue > 0 ? '#22c55e' : r.netValue < 0 ? '#ef4444' : '#6b7280';
                return (
                  <tr
                    key={r.playerId}
                    onClick={() => setSelected(r)}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      background: selected?.playerId === r.playerId ? '#111827' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '7px 8px', fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: SPEED_COLORS[r.speedGrade] || '#d1d5db', fontSize: 10, fontWeight: 600 }}>
                      {r.speedGrade.toUpperCase()}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#d1d5db', fontWeight: 700 }}>
                      {r.successes}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9ca3af' }}>
                      {r.attempts}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <RateBar rate={r.rate} breakEven={r.breakEven} width={120} />
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: nvColor, fontWeight: 700 }}>
                      {r.netValue > 0 ? '+' : ''}{r.netValue.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 320px' }}>
          {selected ? (() => {
            const rateColor = selected.rate >= selected.breakEven ? '#22c55e' : '#ef4444';
            const nvColor = selected.netValue > 0 ? '#22c55e' : selected.netValue < 0 ? '#ef4444' : '#6b7280';
            const recentAttempts = selected.attemptHistory.slice(0, 10);

            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15 }}>{selected.name}</div>
                    <div style={{ color: SPEED_COLORS[selected.speedGrade], fontSize: 10, fontWeight: 600 }}>
                      {selected.speedGrade.toUpperCase()} SPEED
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: rateColor }}>
                      {Math.round(selected.rate * 100)}%
                    </div>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>SUCCESS RATE</div>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div style={{ marginBottom: 14 }}>
                  <RateBar rate={selected.rate} breakEven={selected.breakEven} width={280} />
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'STOLEN BASES', value: String(selected.successes), color: '#d1d5db' },
                    { label: 'ATTEMPTS', value: String(selected.attempts), color: '#9ca3af' },
                    { label: 'NET VALUE', value: `${selected.netValue > 0 ? '+' : ''}${selected.netValue.toFixed(2)} runs`, color: nvColor },
                    { label: 'BREAK-EVEN', value: `${Math.round(selected.breakEven * 100)}%`, color: '#eab308' },
                    { label: 'VS 2B RATE', value: `${Math.round(selected.successVs2B * 100)}%`, color: selected.successVs2B >= 0.72 ? '#22c55e' : '#ef4444' },
                    { label: 'VS 3B RATE', value: `${Math.round(selected.successVs3B * 100)}%`, color: selected.successVs3B >= 0.80 ? '#22c55e' : '#ef4444' },
                  ].map(s => (
                    <div key={s.label} className="bloomberg-border" style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Success Factors */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>SUCCESS FACTORS</div>
                  {[
                    { label: 'Avg Lead Distance', value: `${selected.avgLeadDistance.toFixed(1)} ft`, ideal: 12.5, actual: selected.avgLeadDistance },
                    { label: 'Avg Pitcher Delivery', value: `${selected.avgPitcherDelivery.toFixed(2)}s`, ideal: 1.40, actual: selected.avgPitcherDelivery },
                    { label: 'Avg Catcher Pop Time', value: `${selected.avgCatcherPop.toFixed(2)}s`, ideal: 2.00, actual: selected.avgCatcherPop },
                  ].map(f => {
                    const favorable = f.label.includes('Lead')
                      ? f.actual >= f.ideal
                      : f.actual >= f.ideal;
                    return (
                      <div key={f.label} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: '#111827',
                        border: '1px solid #1f2937',
                        marginBottom: 3,
                        fontSize: 11,
                      }}>
                        <span style={{ color: '#9ca3af' }}>{f.label}</span>
                        <span style={{ color: favorable ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{f.value}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Attempt History */}
                <div>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>RECENT ATTEMPTS</div>
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {recentAttempts.map((att: SBAttempt) => (
                      <div key={att.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: '#111827',
                        border: '1px solid #1f2937',
                        marginBottom: 2,
                        fontSize: 10,
                      }}>
                        <span style={{ color: '#9ca3af' }}>
                          Inn {att.inning} · {att.outs} out · {att.baseStolen}
                        </span>
                        <span style={{
                          color: att.success ? '#22c55e' : '#ef4444',
                          fontWeight: 700,
                          fontSize: 9,
                        }}>
                          {att.success ? 'SAFE' : 'OUT'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a runner to view stolen base details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
