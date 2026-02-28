import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoCoachingRatings,
  ratingColor,
  PERF_DISPLAY,
  TREND_DISPLAY,
  type CoachingStaffData,
  type StaffCoach,
  type CoachImpact,
} from '../../engine/management/coachingStaffRatings';

// ── Impact Row ──────────────────────────────────────────────────────────────

function ImpactRow({ impact }: { impact: CoachImpact }) {
  const trendInfo = TREND_DISPLAY[impact.trend];
  const barWidth = `${Math.min(100, impact.rating)}%`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '3px 0',
      fontSize: '10px',
      fontFamily: 'monospace',
    }}>
      <span style={{ color: '#9ca3af', width: '120px', flexShrink: 0 }}>{impact.area}</span>
      <div style={{
        flex: 1,
        height: '10px',
        backgroundColor: '#1f2937',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: barWidth,
          height: '100%',
          backgroundColor: ratingColor(impact.rating),
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        color: ratingColor(impact.rating),
        fontWeight: 'bold',
        width: '24px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {impact.rating}
      </span>
      <span style={{
        color: trendInfo.color,
        fontWeight: 'bold',
        width: '12px',
        textAlign: 'center',
      }}>
        {trendInfo.symbol}
      </span>
      <span style={{
        color: impact.leagueRank <= 5 ? '#f59e0b' : impact.leagueRank <= 10 ? '#9ca3af' : '#6b7280',
        width: '30px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        fontSize: '9px',
      }}>
        #{impact.leagueRank}
      </span>
    </div>
  );
}

// ── Coach Card ──────────────────────────────────────────────────────────────

function CoachCard({ coach, isExpanded, onToggle }: {
  coach: StaffCoach;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const perfInfo = PERF_DISPLAY[coach.recentPerf];
  const ovrColor = ratingColor(coach.overallRating);
  const barWidth = `${Math.min(100, coach.overallRating)}%`;

  return (
    <div style={{
      border: '1px solid #1f2937',
      backgroundColor: '#0a0f1a',
      fontFamily: 'monospace',
      marginBottom: '4px',
    }}>
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Rating circle */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: `2px solid ${ovrColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
          color: ovrColor,
          flexShrink: 0,
        }}>
          {coach.overallRating}
        </div>

        {/* Name, role, specialty */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
              {coach.name}
            </span>
            <span style={{
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '3px',
              backgroundColor: '#f59e0b22',
              color: '#f59e0b',
            }}>
              {coach.role}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Specialty: <span style={{ color: '#a78bfa' }}>{coach.specialty}</span>
          </div>
        </div>

        {/* Rating bar */}
        <div style={{ width: '120px', flexShrink: 0 }}>
          <div style={{
            height: '8px',
            backgroundColor: '#1f2937',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '2px',
          }}>
            <div style={{
              width: barWidth,
              height: '100%',
              backgroundColor: ovrColor,
              borderRadius: '2px',
            }} />
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280', textAlign: 'center' }}>OVR</div>
        </div>

        {/* Experience */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#d1d5db',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {coach.yearsExperience}
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>YRS EXP</div>
        </div>

        {/* Contract */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: coach.contractYearsLeft <= 1 ? '#ef4444' : '#d1d5db',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {coach.contractYearsLeft}
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>YRS LEFT</div>
        </div>

        {/* Performance badge */}
        <div style={{
          padding: '3px 8px',
          fontSize: '9px',
          fontWeight: 'bold',
          borderRadius: '3px',
          backgroundColor: perfInfo.color + '22',
          color: perfInfo.color,
          flexShrink: 0,
        }}>
          {perfInfo.label}
        </div>

        {/* Expand indicator */}
        <div style={{ color: '#4b5563', fontSize: '10px', flexShrink: 0 }}>
          {isExpanded ? '[-]' : '[+]'}
        </div>
      </div>

      {/* Expanded impact breakdown */}
      {isExpanded && (
        <div style={{
          padding: '8px 14px 12px 62px',
          borderTop: '1px solid #1f2937',
        }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 'bold',
            color: '#6b7280',
            marginBottom: '6px',
            letterSpacing: '0.05em',
          }}>
            IMPACT AREAS
          </div>
          {coach.impacts.map(imp => (
            <ImpactRow key={imp.area} impact={imp} />
          ))}
          <div style={{
            marginTop: '6px',
            display: 'flex',
            gap: '16px',
            fontSize: '9px',
            color: '#4b5563',
          }}>
            <span>
              Avg Impact: <span style={{ color: '#d1d5db', fontWeight: 'bold' }}>
                {Math.round(coach.impacts.reduce((s, i) => s + i.rating, 0) / coach.impacts.length)}
              </span>
            </span>
            <span>
              Best Rank: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                #{Math.min(...coach.impacts.map(i => i.leagueRank))}
              </span>
            </span>
            <span>
              Trending Up: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
                {coach.impacts.filter(i => i.trend === 'improving').length}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Box ────────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      border: '1px solid #1f2937',
      padding: '8px 14px',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CoachRatingsView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<CoachingStaffData>(() => generateDemoCoachingRatings());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!gameStarted) {
    return (
      <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>
        Start a game first.
      </div>
    );
  }

  const avgRating = Math.round(data.staff.reduce((s, c) => s + c.overallRating, 0) / data.staff.length);
  const topCoach = [...data.staff].sort((a, b) => b.overallRating - a.overallRating)[0];
  const expiring = data.staff.filter(c => c.contractYearsLeft <= 1).length;

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px',
        padding: '8px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #f59e0b',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f59e0b',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>COACHING STAFF RATINGS</span>
        <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: 'normal', letterSpacing: '0' }}>
          {data.teamName.toUpperCase()}
        </span>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <StatBox label="Overall Grade" value={data.overallGrade} color="#f59e0b" />
        <StatBox label="Staff Size" value={data.staff.length} color="#d1d5db" />
        <StatBox label="Avg Rating" value={avgRating} color={ratingColor(avgRating)} />
        <StatBox label="Top Coach" value={topCoach.overallRating} color="#22c55e" />
        <StatBox label="Expiring" value={expiring} color={expiring > 0 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* Strength / weakness */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div style={{
          border: '1px solid #1f2937',
          backgroundColor: '#0a0f1a',
          padding: '8px 12px',
          fontSize: '11px',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#6b7280', fontSize: '9px' }}>STRENGTH: </span>
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{data.strengthArea}</span>
        </div>
        <div style={{
          border: '1px solid #1f2937',
          backgroundColor: '#0a0f1a',
          padding: '8px 12px',
          fontSize: '11px',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#6b7280', fontSize: '9px' }}>WEAKNESS: </span>
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{data.weaknessArea}</span>
        </div>
      </div>

      {/* Staff list */}
      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#030712',
        padding: '8px',
        maxHeight: '550px',
        overflowY: 'auto',
      }}>
        <div style={{
          padding: '4px 8px',
          marginBottom: '6px',
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#6b7280',
          borderBottom: '1px solid #1f2937',
          letterSpacing: '0.05em',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>COACHING STAFF ({data.staff.length})</span>
          <span style={{ color: '#4b5563' }}>Click to expand impact areas</span>
        </div>
        {data.staff.map(coach => (
          <CoachCard
            key={coach.coachId}
            coach={coach}
            isExpanded={expandedIds.has(coach.coachId)}
            onToggle={() => toggleExpand(coach.coachId)}
          />
        ))}
      </div>

      {/* Trend legend */}
      <div style={{
        marginTop: '8px',
        display: 'flex',
        gap: '16px',
        fontSize: '9px',
        fontFamily: 'monospace',
      }}>
        <span style={{ color: '#6b7280', fontWeight: 'bold' }}>TRENDS:</span>
        {Object.values(TREND_DISPLAY).map(t => (
          <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: t.color, fontWeight: 'bold' }}>{t.symbol}</span>
            <span style={{ color: '#9ca3af' }}>{t.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
