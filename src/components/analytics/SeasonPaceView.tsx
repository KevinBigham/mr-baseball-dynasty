/**
 * SeasonPaceView – Season Pace Tracker dashboard
 *
 * Bloomberg-terminal style pace table with projected wins, playoff pace
 * indicator, Pythagorean wins comparison, SOS ranking, and division lead pace.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoSeasonPace,
  getPaceSummary,
  type PaceProjection,
} from '../../engine/analytics/seasonPaceTracker';

function PaceRow({
  proj,
  rank,
  isSelected,
  onSelect,
}: {
  proj: PaceProjection;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const paceColor =
    proj.currentPace >= 95 ? '#22c55e' :
    proj.currentPace >= 88 ? '#3b82f6' :
    proj.currentPace >= 81 ? '#eab308' :
    proj.currentPace >= 72 ? '#f97316' : '#ef4444';

  const rdColor = proj.runDiff > 0 ? '#22c55e' : proj.runDiff < 0 ? '#ef4444' : '#6b7280';
  const pythDiff = proj.pythagWins - proj.projectedWins;
  const pythColor = pythDiff > 2 ? '#22c55e' : pythDiff < -2 ? '#ef4444' : '#6b7280';
  const divColor = proj.divisionLeadPace >= 0 ? '#22c55e' : '#ef4444';

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#111827' : 'transparent',
      }}
    >
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#4b5563', fontSize: 11, fontWeight: 700 }}>
        {rank}
      </td>
      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>
        {proj.teamName}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#d1d5db', fontSize: 12 }}>
        {proj.wins}-{proj.losses}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: paceColor, fontWeight: 700, fontSize: 14 }}>
        {proj.currentPace}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: paceColor, fontSize: 12 }}>
        {proj.projectedWins}-{proj.projectedLosses}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
        {proj.playoffPace ? (
          <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>YES</span>
        ) : (
          <span style={{ color: '#6b7280', fontSize: 10 }}>NO</span>
        )}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: rdColor, fontWeight: 600, fontSize: 12 }}>
        {proj.runDiff > 0 ? '+' : ''}{proj.runDiff}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', fontSize: 12 }}>
        <span style={{ color: '#d1d5db' }}>{proj.pythagWins}</span>
        {pythDiff !== 0 && (
          <span style={{ color: pythColor, fontSize: 9, marginLeft: 3 }}>
            ({pythDiff > 0 ? '+' : ''}{pythDiff})
          </span>
        )}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: divColor, fontWeight: 600, fontSize: 12 }}>
        {proj.divisionLeadPace > 0 ? '+' : ''}{proj.divisionLeadPace}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>
        {proj.strengthOfSchedule.toFixed(3)}
      </td>
    </tr>
  );
}

export default function SeasonPaceView() {
  const projections = useMemo(() => generateDemoSeasonPace(), []);
  const summary = useMemo(() => getPaceSummary(projections), [projections]);
  const [selected, setSelected] = useState<PaceProjection | null>(null);

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        SEASON PACE TRACKER
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>PROJECTED FINAL RECORDS</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'PLAYOFF PACE', value: String(summary.playoffTeams), color: '#22c55e' },
          { label: 'BEST PACE', value: `${summary.bestTeam} (${summary.bestPace}W)`, color: '#22c55e' },
          { label: 'WORST PACE', value: `${summary.worstTeam} (${summary.worstPace}W)`, color: '#ef4444' },
          { label: 'AVG RUN DIFF', value: summary.avgRunDiff > 0 ? `+${summary.avgRunDiff}` : String(summary.avgRunDiff), color: '#eab308' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Table */}
        <div style={{ flex: '1 1 780px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                <th style={{ textAlign: 'center', padding: '6px 8px', width: 28 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Team</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Record</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Pace</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Proj</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>PO Pace</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Run Diff</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>PythW</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Div Lead</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>SOS</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p, i) => (
                <PaceRow
                  key={p.teamId}
                  proj={p}
                  rank={i + 1}
                  isSelected={selected?.teamId === p.teamId}
                  onSelect={() => setSelected(p)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 280px' }}>
          {selected ? (() => {
            const paceColor =
              selected.currentPace >= 95 ? '#22c55e' :
              selected.currentPace >= 88 ? '#3b82f6' :
              selected.currentPace >= 81 ? '#eab308' :
              selected.currentPace >= 72 ? '#f97316' : '#ef4444';
            const rdColor = selected.runDiff > 0 ? '#22c55e' : selected.runDiff < 0 ? '#ef4444' : '#6b7280';
            const pythDiff = selected.pythagWins - selected.projectedWins;

            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15 }}>{selected.teamName}</div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>{selected.gamesRemaining} games remaining</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: paceColor }}>
                      {selected.currentPace}
                    </div>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>WIN PACE</div>
                  </div>
                </div>

                {/* Pace Meter */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                    <span>60W</span>
                    <span style={{ color: '#eab308' }}>81W</span>
                    <span style={{ color: '#3b82f6' }}>88W</span>
                    <span style={{ color: '#22c55e' }}>95W</span>
                    <span>110W</span>
                  </div>
                  <div style={{ height: 8, background: '#1f2937', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, ((selected.currentPace - 60) / 50) * 100))}%`,
                      background: paceColor,
                      borderRadius: 4,
                    }} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'CURRENT RECORD', value: `${selected.wins}-${selected.losses}`, color: '#d1d5db' },
                    { label: 'PROJECTED', value: `${selected.projectedWins}-${selected.projectedLosses}`, color: paceColor },
                    { label: 'RUN DIFF', value: `${selected.runDiff > 0 ? '+' : ''}${selected.runDiff}`, color: rdColor },
                    { label: 'PYTHAG WINS', value: String(selected.pythagWins), color: '#d1d5db' },
                    { label: 'PLAYOFF PACE', value: selected.playoffPace ? 'ON TRACK' : 'OFF TRACK', color: selected.playoffPace ? '#22c55e' : '#ef4444' },
                    { label: 'SOS', value: selected.strengthOfSchedule.toFixed(3), color: '#9ca3af' },
                  ].map(s => (
                    <div key={s.label} className="bloomberg-border" style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Pythag Analysis */}
                <div style={{
                  padding: '8px 10px',
                  background: pythDiff > 2 ? '#22c55e11' : pythDiff < -2 ? '#ef444411' : '#1f2937',
                  border: `1px solid ${pythDiff > 2 ? '#22c55e33' : pythDiff < -2 ? '#ef444433' : '#374151'}`,
                }}>
                  <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 3 }}>PYTHAGOREAN ANALYSIS</div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>
                    {pythDiff > 2
                      ? `Pythagorean record suggests ${selected.teamName} is underperforming by ${pythDiff} wins. Regression to the mean could boost their record.`
                      : pythDiff < -2
                      ? `${selected.teamName} is overperforming their Pythagorean expectation by ${Math.abs(pythDiff)} wins. Some regression may be expected.`
                      : `${selected.teamName}'s record closely matches their Pythagorean expectation. Their win total is sustainable.`
                    }
                  </div>
                </div>

                {/* Division Lead Pace */}
                <div style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  background: '#111827',
                  border: '1px solid #1f2937',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>DIV LEAD PACE (vs 95W)</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: selected.divisionLeadPace >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {selected.divisionLeadPace > 0 ? '+' : ''}{selected.divisionLeadPace}
                  </span>
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a team to view pace details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
