/**
 * RelieverFatigueModelView – Reliever Fatigue Impact Dashboard
 *
 * Bloomberg-terminal style dashboard showing per-reliever fatigue curves,
 * velocity loss, K-rate decline, HR-rate increase by consecutive days,
 * rest recommendations, and appearance history.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoRelieverFatigue,
  getStatusColor,
  getStatusLabel,
  getRiskColor,
  getDurabilityColor,
  type RelieverFatigueData,
  type RelieverFatigueEntry,
  type FatigueDataPoint,
} from '../../engine/pitching/relieverFatigueModel';

const PANEL: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 4,
  padding: 14,
};

const HEADER: React.CSSProperties = {
  background: '#030712',
  borderBottom: '1px solid #374151',
  padding: '8px 20px',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: 1.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

function StatBox({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ ...PANEL, textAlign: 'center', minWidth: 90, flex: '1 1 0' }}>
      <div style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{label}</div>
      <div style={{ color: color ?? '#f59e0b', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ color: '#4b5563', fontSize: 9, fontFamily: 'monospace', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FatigueCurveChart({ points, currentDay }: { points: FatigueDataPoint[]; currentDay: number }) {
  const barWidth = 100 / points.length;
  return (
    <div style={{ ...PANEL, padding: 12, marginBottom: 14 }}>
      <div style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginBottom: 10 }}>
        FATIGUE CURVE — EFFECTIVENESS BY CONSECUTIVE DAYS
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
        {points.map((p, i) => {
          const isActive = i === currentDay;
          const barColor = p.effectiveness >= 80 ? '#22c55e'
            : p.effectiveness >= 60 ? '#f59e0b'
            : p.effectiveness >= 40 ? '#f97316'
            : '#ef4444';
          return (
            <div key={i} style={{ flex: `0 0 ${barWidth}%`, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: isActive ? '#f59e0b' : '#9ca3af', marginBottom: 4, fontWeight: isActive ? 700 : 400 }}>
                {p.effectiveness}%
              </div>
              <div style={{
                height: p.effectiveness,
                background: isActive ? '#f59e0b' : barColor,
                borderRadius: 2,
                border: isActive ? '1px solid #fbbf24' : 'none',
                opacity: isActive ? 1 : 0.7,
                transition: 'all 0.2s',
              }} />
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: isActive ? '#f59e0b' : '#4b5563', marginTop: 4 }}>
                {i === 0 ? 'REST' : `${i}D`}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, borderTop: '1px solid #1f2937', paddingTop: 8 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10 }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#6b7280' }}>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>Day</th>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>Velo Loss</th>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>K% Delta</th>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>HR/9 Delta</th>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>ERA Delta</th>
                <th style={{ padding: '2px 8px', textAlign: 'center', fontSize: 9 }}>Blowup %</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => {
                const isActive = i === currentDay;
                return (
                  <tr key={i} style={{ background: isActive ? '#1e293b' : 'transparent' }}>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: isActive ? '#f59e0b' : '#d1d5db', fontWeight: isActive ? 700 : 400 }}>
                      {i === 0 ? 'Rested' : `${i} consec`}
                    </td>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: p.velocityLoss > 0 ? '#ef4444' : '#22c55e' }}>
                      {p.velocityLoss > 0 ? `-${p.velocityLoss}` : '0.0'} mph
                    </td>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: p.kRateDelta < 0 ? '#ef4444' : '#22c55e' }}>
                      {p.kRateDelta < 0 ? p.kRateDelta.toFixed(1) : '+0.0'}%
                    </td>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: p.hrRateDelta > 0 ? '#ef4444' : '#22c55e' }}>
                      +{p.hrRateDelta.toFixed(2)}
                    </td>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: p.eraDelta > 0 ? '#ef4444' : '#22c55e' }}>
                      +{p.eraDelta.toFixed(2)}
                    </td>
                    <td style={{ padding: '2px 8px', textAlign: 'center', color: p.blowupRisk > 20 ? '#ef4444' : p.blowupRisk > 10 ? '#f59e0b' : '#22c55e' }}>
                      {p.blowupRisk}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RelieverRow({ reliever, isSelected, onClick }: { reliever: RelieverFatigueEntry; isSelected: boolean; onClick: () => void }) {
  const statusColor = getStatusColor(reliever.restRecommendation.status);
  const veloLoss = Math.round((reliever.baseVelocity - reliever.currentVelocity) * 10) / 10;
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#1e293b' : 'transparent',
        fontFamily: 'monospace',
        fontSize: 11,
        transition: 'background 0.15s',
      }}
    >
      <td style={{ padding: '7px 8px' }}>
        <span style={{ color: isSelected ? '#f59e0b' : '#e5e7eb', fontWeight: 600 }}>{reliever.name}</span>
        <span style={{ color: '#6b7280', marginLeft: 6, fontSize: 9 }}>{reliever.throws}HP</span>
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9ca3af' }}>{reliever.role}</td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#d1d5db' }}>{reliever.age}</td>
      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
        <span style={{ color: '#d1d5db' }}>{reliever.currentVelocity}</span>
        {veloLoss > 0 && (
          <span style={{ color: '#ef4444', fontSize: 9, marginLeft: 4 }}>(-{veloLoss})</span>
        )}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: reliever.consecutiveDays >= 3 ? '#ef4444' : reliever.consecutiveDays >= 2 ? '#f59e0b' : '#9ca3af' }}>
        {reliever.consecutiveDays}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center', color: reliever.pitchesLast3Days >= 40 ? '#ef4444' : '#9ca3af' }}>
        {reliever.pitchesLast3Days}
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 5, background: '#030712', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${reliever.restRecommendation.projectedEffectiveness}%`,
              height: '100%',
              background: reliever.restRecommendation.projectedEffectiveness >= 70 ? '#22c55e' : reliever.restRecommendation.projectedEffectiveness >= 50 ? '#f59e0b' : '#ef4444',
              borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: 9, color: '#9ca3af' }}>{reliever.restRecommendation.projectedEffectiveness}</span>
        </div>
      </td>
      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 3,
          background: statusColor + '18',
          color: statusColor,
        }}>
          {getStatusLabel(reliever.restRecommendation.status)}
        </span>
      </td>
    </tr>
  );
}

export default function RelieverFatigueModelView() {
  const data = useMemo<RelieverFatigueData>(() => generateDemoRelieverFatigue(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? data.relievers.find(r => r.id === selectedId) ?? null : null;

  const healthColor = data.bullpenHealth >= 70 ? '#22c55e' : data.bullpenHealth >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: 18, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100vh' }}>
      {/* Header */}
      <div style={HEADER}>
        <span>RELIEVER FATIGUE IMPACT MODEL</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>CONSECUTIVE APPEARANCE ANALYSIS</span>
      </div>

      {/* Alert */}
      {data.fatigueAlert && (
        <div style={{
          marginTop: 12,
          padding: '10px 16px',
          background: '#7f1d1d22',
          border: '1px solid #ef444444',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#fca5a5',
        }}>
          {data.fatigueAlert}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatBox label="BULLPEN HEALTH" value={`${data.bullpenHealth}%`} color={healthColor} />
        <StatBox label="AVAILABLE" value={data.availableCount} color="#22c55e" />
        <StatBox label="USE SPARINGLY" value={data.sparinglyCount} color="#f59e0b" />
        <StatBox label="SKIP TODAY" value={data.skipCount} color="#f97316" />
        <StatBox label="MUST REST" value={data.mustRestCount} color="#ef4444" />
        <StatBox label="AVG EFFECTIVENESS" value={`${data.projectedEffectiveness}%`} color={data.projectedEffectiveness >= 70 ? '#22c55e' : '#f59e0b'} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Reliever Table */}
        <div style={{ flex: '1 1 620px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280', fontFamily: 'monospace', fontSize: 10 }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>PITCHER</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>ROLE</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>AGE</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>VELO</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>CONSEC</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>3D P</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>EFF</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.relievers.map(r => (
                <RelieverRow
                  key={r.id}
                  reliever={r}
                  isSelected={selectedId === r.id}
                  onClick={() => setSelectedId(r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 380px', minWidth: 340 }}>
          {selected ? (
            <div style={PANEL}>
              {/* Name + Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>
                    {selected.name}
                    <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                      {selected.role} | {selected.throws}HP | Age {selected.age}
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 3,
                  background: getStatusColor(selected.restRecommendation.status) + '22',
                  color: getStatusColor(selected.restRecommendation.status),
                }}>
                  {getStatusLabel(selected.restRecommendation.status)}
                </span>
              </div>

              {/* Rest Recommendation */}
              <div style={{
                padding: 10,
                background: '#030712',
                border: '1px solid #374151',
                borderRadius: 4,
                marginBottom: 14,
              }}>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>REST RECOMMENDATION</div>
                <div style={{ color: '#d1d5db', fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                  {selected.restRecommendation.reason}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
                  <span>
                    Risk: <span style={{ color: getRiskColor(selected.restRecommendation.riskLevel), fontWeight: 700 }}>
                      {selected.restRecommendation.riskLevel.toUpperCase()}
                    </span>
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    Days until fresh: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{selected.restRecommendation.daysUntilFresh}</span>
                  </span>
                </div>
              </div>

              {/* Profile Stats */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'BASE VELO', value: `${selected.baseVelocity}`, color: '#d1d5db' },
                  { label: 'CURR VELO', value: `${selected.currentVelocity}`, color: selected.currentVelocity < selected.baseVelocity - 1 ? '#ef4444' : '#22c55e' },
                  { label: 'BASE ERA', value: selected.baseERA.toFixed(2), color: '#22c55e' },
                  { label: 'K/9', value: selected.baseKPer9.toFixed(1), color: '#3b82f6' },
                  { label: 'HR/9', value: selected.baseHRPer9.toFixed(2), color: '#9ca3af' },
                  { label: 'WHIP', value: selected.baseWHIP.toFixed(2), color: '#9ca3af' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 55 }}>
                    <div style={{ color: s.color, fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ color: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Durability Profile */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'FATIGUE RES', value: selected.fatigueProfile.fatigueResistance },
                  { label: 'RECOVERY SPD', value: selected.fatigueProfile.recoverySpeed },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 6, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                    <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.value >= 65 ? '#22c55e' : s.value >= 50 ? '#f59e0b' : '#ef4444' }}>{s.value}</div>
                  </div>
                ))}
                <div style={{ flex: 1, textAlign: 'center', padding: 6, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 4 }}>DURABILITY</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: getDurabilityColor(selected.fatigueProfile.durabilityGrade) }}>{selected.fatigueProfile.durabilityGrade}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 6, background: '#030712', border: '1px solid #1f2937', borderRadius: 4 }}>
                  <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 4 }}>MAX CONSEC</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{selected.fatigueProfile.maxConsecutive}D</div>
                </div>
              </div>

              {/* Workload */}
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>WORKLOAD</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[
                  { label: '3D Pitches', value: selected.pitchesLast3Days, warn: selected.pitchesLast3Days >= 40 },
                  { label: '7D Pitches', value: selected.pitchesLast7Days, warn: selected.pitchesLast7Days >= 70 },
                  { label: '14D Pitches', value: selected.pitchesLast14Days, warn: selected.pitchesLast14Days >= 120 },
                  { label: 'SZN Apps', value: selected.seasonWorkload.appearances, warn: false },
                  { label: 'SZN IP', value: selected.seasonWorkload.inningsPitched, warn: false },
                  { label: 'SV+HLD', value: selected.seasonWorkload.savesHolds, warn: false },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 48 }}>
                    <div style={{ color: s.warn ? '#ef4444' : '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#4b5563', fontSize: 8 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Fatigue Curve */}
              <FatigueCurveChart
                points={selected.fatigueProfile.fatigueDataPoints}
                currentDay={selected.consecutiveDays}
              />

              {/* Recent Appearances */}
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>RECENT APPEARANCES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151', color: '#4b5563' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Day</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>P</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>IP</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Velo</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>K</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>BB</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>HR</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>ER</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.recentAppearances.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 6px', color: '#9ca3af' }}>{a.date}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.consecutiveDay >= 3 ? '#ef4444' : '#9ca3af' }}>{a.consecutiveDay}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.pitches >= 20 ? '#f59e0b' : '#d1d5db' }}>{a.pitches}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: '#d1d5db' }}>{a.innings}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.velocity < selected.baseVelocity - 1.5 ? '#ef4444' : '#d1d5db' }}>{a.velocity}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: '#3b82f6' }}>{a.kCount}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.bbCount > 1 ? '#f59e0b' : '#9ca3af' }}>{a.bbCount}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.hrAllowed > 0 ? '#ef4444' : '#9ca3af' }}>{a.hrAllowed}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: a.earnedRuns > 0 ? '#ef4444' : '#22c55e' }}>{a.earnedRuns}</td>
                      <td style={{ padding: '4px 6px', color: a.result === 'BS' || a.result === 'Loss' ? '#ef4444' : a.result === 'Save' ? '#22c55e' : '#9ca3af' }}>{a.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ ...PANEL, textAlign: 'center', color: '#4b5563', padding: 50 }}>
              Select a reliever to view fatigue impact analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
