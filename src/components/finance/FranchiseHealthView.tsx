import { useState, useMemo } from 'react';
import {
  generateDemoFranchiseHealth,
  HEALTH_GRADE_DISPLAY,
  type FranchiseHealthData,
  type HealthComponent,
  type HealthGrade,
} from '../../engine/finance/franchiseHealthScore';

const allTeams: FranchiseHealthData[] = generateDemoFranchiseHealth();

function formatMoney(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}B`;
  return `$${n}M`;
}

function getScoreColor(score: number): string {
  if (score >= 82) return '#22c55e';
  if (score >= 68) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  if (score >= 32) return '#f97316';
  return '#ef4444';
}

function getTrendArrow(trend: number): { symbol: string; color: string } {
  if (trend >= 0.2)  return { symbol: '\u25B2', color: '#22c55e' };
  if (trend > 0)     return { symbol: '\u25B3', color: '#4ade80' };
  if (trend >= -0.1) return { symbol: '\u25AC', color: '#6b7280' };
  if (trend >= -0.3) return { symbol: '\u25BD', color: '#f97316' };
  return { symbol: '\u25BC', color: '#ef4444' };
}

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const circumference = Math.PI * (size - 8);
  const filled = (score / 100) * circumference;

  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      <path
        d={`M 4 ${size / 2} A ${size / 2 - 4} ${size / 2 - 4} 0 0 1 ${size - 4} ${size / 2}`}
        fill="none" stroke="#1f2937" strokeWidth={6} strokeLinecap="round"
      />
      <path
        d={`M 4 ${size / 2} A ${size / 2 - 4} ${size / 2 - 4} 0 0 1 ${size - 4} ${size / 2}`}
        fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill={color} fontSize={size / 4} fontWeight={700} fontFamily="monospace">
        {score}
      </text>
    </svg>
  );
}

function ComponentBar({ comp }: { comp: HealthComponent }) {
  const color = getScoreColor(comp.score);
  const trend = getTrendArrow(comp.trend);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          {comp.name}
          <span style={{ color: '#4b5563', marginLeft: 4 }}>({comp.weight}%)</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: trend.color }}>{trend.symbol}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{comp.score}</span>
        </div>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${comp.score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>{comp.description}</div>
    </div>
  );
}

function TeamDetailPanel({ team }: { team: FranchiseHealthData }) {
  const gradeInfo = HEALTH_GRADE_DISPLAY[team.healthGrade];

  return (
    <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
      {/* Team header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{team.teamName}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
            Rank #{team.leagueRank} League | #{team.divisionRank} Division | {team.wins}W
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ScoreGauge score={team.healthScore} size={90} />
          <div style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', marginTop: 4,
            background: `${gradeInfo.color}20`, color: gradeInfo.color,
            border: `1px solid ${gradeInfo.color}44`,
          }}>
            {gradeInfo.label}
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'REVENUE', value: formatMoney(team.totalRevenue), color: '#22c55e' },
          { label: 'PAYROLL', value: formatMoney(team.totalPayroll), color: '#f97316' },
          { label: 'LUX BUFFER', value: `${team.luxuryTaxBuffer >= 0 ? '+' : ''}$${team.luxuryTaxBuffer}M`, color: team.luxuryTaxBuffer >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'FRANCHISE VAL', value: formatMoney(team.franchiseValue), color: '#a78bfa' },
        ].map(m => (
          <div key={m.label} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Components breakdown */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 8 }}>HEALTH COMPONENTS</div>
        {team.components.map(comp => (
          <ComponentBar key={comp.key} comp={comp} />
        ))}
      </div>

      {/* Historical trend */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, marginBottom: 8 }}>HISTORICAL TREND</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
          {team.history.map(pt => {
            const h = (pt.healthScore / 100) * 55;
            const isCurrent = pt.season === 2026;
            return (
              <div key={pt.season} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: getScoreColor(pt.healthScore), fontWeight: 700, fontFamily: 'monospace', marginBottom: 2 }}>
                  {pt.healthScore}
                </div>
                <div style={{
                  height: Math.max(4, h), background: isCurrent ? '#f59e0b' : getScoreColor(pt.healthScore),
                  borderRadius: '2px 2px 0 0', opacity: isCurrent ? 1 : 0.5,
                }} />
                <div style={{ fontSize: 8, color: '#4b5563', marginTop: 2 }}>{String(pt.season).slice(2)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
          {team.history.map(pt => (
            <div key={pt.season} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#4b5563' }}>{pt.wins}W</div>
              <div style={{ fontSize: 8, color: '#4b5563' }}>${pt.payroll}M</div>
            </div>
          ))}
        </div>
      </div>

      {/* Outlook */}
      <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10 }}>
        <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginBottom: 4 }}>OUTLOOK</div>
        <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{team.outlook}</div>
      </div>
    </div>
  );
}

export default function FranchiseHealthView() {
  const [selectedTeamId, setSelectedTeamId] = useState(allTeams[0].teamId);
  const [sortBy, setSortBy] = useState<'rank' | 'payroll' | 'revenue' | 'farm'>('rank');

  const selectedTeam = useMemo(() => allTeams.find(t => t.teamId === selectedTeamId)!, [selectedTeamId]);

  const sortedTeams = useMemo(() => {
    const copy = [...allTeams];
    switch (sortBy) {
      case 'rank':    copy.sort((a, b) => a.leagueRank - b.leagueRank); break;
      case 'payroll': copy.sort((a, b) => b.totalPayroll - a.totalPayroll); break;
      case 'revenue': copy.sort((a, b) => b.totalRevenue - a.totalRevenue); break;
      case 'farm':    copy.sort((a, b) => b.farmSystemValue - a.farmSystemValue); break;
    }
    return copy;
  }, [sortBy]);

  const maxScore = 100;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>FRANCHISE FINANCIAL HEALTH</h2>
          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>
            Composite health scores across all 30 franchises
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Object.entries(HEALTH_GRADE_DISPLAY).map(([grade, info]) => (
            <span key={grade} style={{
              fontSize: 8, padding: '2px 6px', fontWeight: 700, fontFamily: 'monospace',
              color: info.color, border: `1px solid ${info.color}44`, background: `${info.color}11`,
            }}>
              {info.label}
            </span>
          ))}
        </div>
      </div>

      {/* League-wide summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {(['elite', 'strong', 'healthy', 'concerning', 'critical'] as HealthGrade[]).map(grade => {
          const count = allTeams.filter(t => t.healthGrade === grade).length;
          const info = HEALTH_GRADE_DISPLAY[grade];
          return (
            <div key={grade} style={{ background: '#111827', border: `1px solid ${info.color}33`, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: info.color, fontFamily: 'monospace' }}>{count}</div>
              <div style={{ fontSize: 9, color: info.color, letterSpacing: 1 }}>{info.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: League rankings table */}
        <div style={{ border: '1px solid #374151', background: '#111827' }}>
          {/* Sort controls */}
          <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0 8px' }}>
            {([
              { key: 'rank', label: 'SCORE' },
              { key: 'payroll', label: 'PAYROLL' },
              { key: 'revenue', label: 'REVENUE' },
              { key: 'farm', label: 'FARM' },
            ] as const).map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                padding: '3px 8px', fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                border: '1px solid', cursor: 'pointer', letterSpacing: 1,
                borderColor: sortBy === s.key ? '#f59e0b' : '#374151',
                background: sortBy === s.key ? '#78350f' : 'transparent',
                color: sortBy === s.key ? '#f59e0b' : '#6b7280',
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ overflow: 'auto', maxHeight: 620 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  {['#', 'TEAM', 'SCORE', 'GRADE', 'REV', 'PAY', 'FARM', 'W'].map(h => (
                    <th key={h} style={{
                      padding: '6px 6px', color: '#6b7280', fontWeight: 700, fontSize: 9,
                      textAlign: h === '#' ? 'center' : h === 'TEAM' ? 'left' : 'right',
                      letterSpacing: 1, position: 'sticky', top: 0, background: '#111827', zIndex: 1,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, idx) => {
                  const gradeInfo = HEALTH_GRADE_DISPLAY[team.healthGrade];
                  const isSelected = team.teamId === selectedTeamId;
                  return (
                    <tr key={team.teamId} onClick={() => setSelectedTeamId(team.teamId)} style={{
                      cursor: 'pointer', background: isSelected ? '#1e3a5f' : 'transparent',
                      borderBottom: '1px solid #1f293744',
                    }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#6b7280', fontSize: 10 }}>{idx + 1}</td>
                      <td style={{ padding: '5px 6px', fontWeight: 700, color: isSelected ? '#f59e0b' : '#e5e7eb' }}>{team.abbreviation}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 40, height: 5, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${team.healthScore}%`, height: '100%', background: getScoreColor(team.healthScore), borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: getScoreColor(team.healthScore), width: 24, textAlign: 'right' }}>{team.healthScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: gradeInfo.color }}>{gradeInfo.label}</span>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: '#22c55e' }}>${team.totalRevenue}M</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: '#f97316' }}>${team.totalPayroll}M</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: '#60a5fa' }}>${team.farmSystemValue}M</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: '#9ca3af' }}>{team.wins}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detail panel */}
        <div>
          <TeamDetailPanel team={selectedTeam} />
        </div>
      </div>
    </div>
  );
}
