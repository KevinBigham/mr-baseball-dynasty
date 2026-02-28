import { useState } from 'react';
import { generateDemoCapSpace, OBLIGATION_COLORS, type CapSpaceData, type ObligationType } from '../../engine/finance/capSpaceCalculator';

const data = generateDemoCapSpace();

const TYPE_LABELS: Record<ObligationType, string> = {
  guaranteed:  'GUAR',
  option:      'OPT',
  buyout:      'BUY',
  arbitration: 'ARB',
  pre_arb:     'PRE',
};

export default function CapSpaceView() {
  const [teamIdx, setTeamIdx] = useState(0);
  const team: CapSpaceData = data[teamIdx];
  const pctUsed = Math.min(100, (team.currentPayroll / team.luxuryThreshold) * 100);
  const isOver = team.capSpace < 0;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>CAP SPACE CALCULATOR</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Payroll flexibility, obligations &amp; future projections</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(TYPE_LABELS).map(([type, lbl]) => (
            <span key={type} style={{ fontSize: 9, padding: '2px 6px', color: OBLIGATION_COLORS[type as ObligationType], border: `1px solid ${OBLIGATION_COLORS[type as ObligationType]}44`, background: `${OBLIGATION_COLORS[type as ObligationType]}11` }}>
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Team Selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.map((t, i) => (
          <button key={t.teamId} onClick={() => setTeamIdx(i)}
            style={{
              padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
              border: '1px solid', cursor: 'pointer',
              borderColor: i === teamIdx ? '#f59e0b' : '#374151',
              background: i === teamIdx ? '#78350f' : 'transparent',
              color: i === teamIdx ? '#f59e0b' : '#9ca3af',
            }}>
            {t.teamName}
          </button>
        ))}
      </div>

      {/* Payroll Gauge */}
      <div style={{ border: '1px solid #374151', background: '#111827', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>CURRENT PAYROLL vs LUXURY THRESHOLD</span>
          <span style={{ fontSize: 11, color: isOver ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
            {isOver ? 'OVER' : 'UNDER'} BY ${Math.abs(team.capSpace).toFixed(1)}M
          </span>
        </div>
        <div style={{ height: 24, background: '#1f2937', position: 'relative', marginBottom: 6 }}>
          <div style={{
            height: '100%', width: `${Math.min(pctUsed, 100)}%`,
            background: isOver ? '#ef4444' : pctUsed > 90 ? '#f59e0b' : '#22c55e',
            transition: 'width 0.3s',
          }} />
          {/* Threshold marker */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '100%',
            borderLeft: '2px dashed #f59e0b',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
          <span style={{ color: '#9ca3af' }}>${team.currentPayroll.toFixed(1)}M payroll</span>
          <span style={{ color: '#f59e0b' }}>${team.luxuryThreshold}M threshold</span>
        </div>
      </div>

      {/* Two-column layout: obligations + future summary */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Obligations List */}
        <div style={{ flex: 2 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>OBLIGATIONS BY YEAR</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['PLAYER', 'SEASON', 'AMOUNT', 'TYPE', 'FLEX'].map(h => (
                  <th key={h} style={{ padding: '5px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PLAYER' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.obligations.map((ob, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '5px 6px', color: '#e5e7eb' }}>{ob.name}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{ob.season}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#e5e7eb', fontWeight: 600 }}>${ob.amount.toFixed(1)}M</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <span style={{
                      padding: '1px 6px', fontSize: 9, fontWeight: 700,
                      color: OBLIGATION_COLORS[ob.type],
                      background: `${OBLIGATION_COLORS[ob.type]}11`,
                      border: `1px solid ${OBLIGATION_COLORS[ob.type]}33`,
                    }}>
                      {TYPE_LABELS[ob.type]}
                    </span>
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    {ob.isFlexible
                      ? <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>YES</span>
                      : <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>NO</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Future Summary */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>FUTURE PAYROLL OUTLOOK</div>
          {team.futureSummary.map(fs => {
            const maxBar = team.luxuryThreshold;
            const committedPct = (fs.committed / maxBar) * 100;
            const projectedPct = (fs.projected / maxBar) * 100;
            return (
              <div key={fs.season} style={{ border: '1px solid #374151', background: '#111827', padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{fs.season}</span>
                  <span style={{ fontSize: 10, color: fs.available > 30 ? '#22c55e' : fs.available > 0 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                    ${fs.available.toFixed(1)}M avail
                  </span>
                </div>
                {/* Stacked bar */}
                <div style={{ height: 16, background: '#1f2937', display: 'flex', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${Math.min(committedPct, 100)}%`, background: '#ef4444' }} />
                  <div style={{ height: '100%', width: `${Math.min(projectedPct, 100 - committedPct)}%`, background: '#f59e0b' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                  <span style={{ color: '#ef4444' }}>Committed ${fs.committed.toFixed(1)}M</span>
                  <span style={{ color: '#f59e0b' }}>Projected ${fs.projected.toFixed(1)}M</span>
                </div>
              </div>
            );
          })}

          {/* Flexibility Summary */}
          <div style={{ border: '1px solid #374151', background: '#111827', padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>FLEXIBILITY SUMMARY</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Flexible $</span>
              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                ${team.obligations.filter(o => o.isFlexible).reduce((s, o) => s + o.amount, 0).toFixed(1)}M
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Locked $</span>
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                ${team.obligations.filter(o => !o.isFlexible).reduce((s, o) => s + o.amount, 0).toFixed(1)}M
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Cap Space</span>
              <span style={{ fontSize: 11, color: isOver ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                ${team.capSpace.toFixed(1)}M
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
