/**
 * PipelineValueView – Minor League Pipeline Value dashboard
 *
 * Bloomberg-terminal style ranked team list with pipeline tier badges,
 * top prospect mini-cards, depth score bar, and recent grad count.
 */
import { useState, useMemo } from 'react';
import {
  PIPELINE_DISPLAY,
  generateDemoPipelineValue,
  getPipelineSummary,
  type PipelineData,
  type ProspectAsset,
} from '../../engine/minors/minorLeaguePipelineValue';

function DepthBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' :
    score >= 65 ? '#3b82f6' :
    score >= 45 ? '#eab308' :
    score >= 30 ? '#f97316' : '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

function ProspectMiniCard({ prospect }: { prospect: ProspectAsset }) {
  const gradeColor =
    prospect.overallGrade >= 65 ? '#22c55e' :
    prospect.overallGrade >= 55 ? '#3b82f6' :
    prospect.overallGrade >= 50 ? '#eab308' : '#9ca3af';

  return (
    <div style={{
      padding: '6px 10px',
      background: '#111827',
      border: '1px solid #1f2937',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    }}>
      <div>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11 }}>{prospect.name}</span>
        <span style={{ color: '#6b7280', fontSize: 9, marginLeft: 6 }}>
          {prospect.position} | {prospect.level} | Age {prospect.age}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: gradeColor }}>{prospect.overallGrade}</div>
          <div style={{ fontSize: 8, color: '#6b7280' }}>GRD</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{prospect.tradeValue}</div>
          <div style={{ fontSize: 8, color: '#6b7280' }}>TV</div>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({
  data,
  isSelected,
  onSelect,
}: {
  data: PipelineData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const tierInfo = PIPELINE_DISPLAY[data.tier];
  const valueColor =
    data.totalValue >= 450 ? '#22c55e' :
    data.totalValue >= 340 ? '#3b82f6' :
    data.totalValue >= 220 ? '#eab308' :
    data.totalValue >= 120 ? '#f97316' : '#ef4444';

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#111827' : 'transparent',
      }}
    >
      <td style={{ padding: '8px 10px', color: '#6b7280', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
        {data.pipelineRank}
      </td>
      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>
        {data.teamName}
        <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{data.teamId}</span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <span style={{
          padding: '2px 8px',
          fontSize: 9,
          fontWeight: 700,
          background: tierInfo.color + '22',
          color: tierInfo.color,
          border: `1px solid ${tierInfo.color}44`,
          fontFamily: 'monospace',
        }}>
          {tierInfo.label}
        </span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: valueColor, fontWeight: 700, fontSize: 14 }}>
        {data.totalValue}
      </td>
      <td style={{ padding: '8px 10px' }}>
        <DepthBar score={data.depthScore} />
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: data.recentGrads >= 4 ? '#22c55e' : data.recentGrads >= 2 ? '#eab308' : '#6b7280', fontSize: 12, fontWeight: 600 }}>
        {data.recentGrads}
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
        {data.avgAge.toFixed(1)}
      </td>
    </tr>
  );
}

export default function PipelineValueView() {
  const pipelines = useMemo(() => generateDemoPipelineValue(), []);
  const summary = useMemo(() => getPipelineSummary(pipelines), [pipelines]);
  const [selected, setSelected] = useState<PipelineData | null>(null);

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        MINOR LEAGUE PIPELINE VALUE
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>FARM SYSTEM RANKINGS</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'AVG VALUE', value: String(summary.avgValue), color: '#f59e0b' },
          { label: 'ELITE SYSTEMS', value: String(summary.eliteCount), color: '#22c55e' },
          { label: 'BARREN SYSTEMS', value: String(summary.barrenCount), color: '#ef4444' },
          { label: 'AVG DEPTH', value: summary.avgDepth.toFixed(1), color: '#3b82f6' },
          { label: 'TOTAL GRADS', value: String(summary.totalGrads), color: '#eab308' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Table */}
        <div style={{ flex: '1 1 620px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280' }}>
                <th style={{ textAlign: 'center', padding: '6px 10px', width: 30 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Organization</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Tier</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Value</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Depth</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Grads</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Avg Age</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map(p => (
                <PipelineRow
                  key={p.teamId}
                  data={p}
                  isSelected={selected?.teamId === p.teamId}
                  onSelect={() => setSelected(p)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 320px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15 }}>{selected.teamName}</div>
                  <div style={{ color: '#6b7280', fontSize: 10 }}>
                    Rank #{selected.pipelineRank} | Avg Age: {selected.avgAge.toFixed(1)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: PIPELINE_DISPLAY[selected.tier].color,
                  }}>
                    {selected.totalValue}
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>PIPELINE VALUE</div>
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div className="bloomberg-border" style={{ flex: 1, padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>DEPTH SCORE</div>
                  <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18 }}>{selected.depthScore}</div>
                </div>
                <div className="bloomberg-border" style={{ flex: 1, padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>RECENT GRADS</div>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18 }}>{selected.recentGrads}</div>
                </div>
                <div className="bloomberg-border" style={{ flex: 1, padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: 9 }}>TIER</div>
                  <div style={{ color: PIPELINE_DISPLAY[selected.tier].color, fontWeight: 700, fontSize: 12, marginTop: 3 }}>
                    {PIPELINE_DISPLAY[selected.tier].label}
                  </div>
                </div>
              </div>

              {/* Top Prospects */}
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>TOP PROSPECTS</div>
              {selected.topProspects.map(p => (
                <ProspectMiniCard key={p.name} prospect={p} />
              ))}
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a team to view pipeline details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
