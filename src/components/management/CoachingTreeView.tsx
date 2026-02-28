import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoCoachingTree,
  ratingToScouting,
  COACH_ROLE_LABELS,
  COACH_ROLE_COLORS,
  type CoachNode,
  type CoachingTreeData,
} from '../../engine/management/coachingTree';

// ── Rating Color ───────────────────────────────────────────────────────────

function ratingColor(scoutGrade: number): string {
  if (scoutGrade >= 70) return '#22c55e';
  if (scoutGrade >= 60) return '#4ade80';
  if (scoutGrade >= 50) return '#f59e0b';
  if (scoutGrade >= 40) return '#f97316';
  return '#ef4444';
}

// ── Coach Card ─────────────────────────────────────────────────────────────

function CoachCard({ coach, depth }: { coach: CoachNode; depth: number }) {
  const scoutGrade = ratingToScouting(coach.rating);
  const winPct = coach.wins + coach.losses > 0
    ? ((coach.wins / (coach.wins + coach.losses)) * 100).toFixed(1)
    : '0.0';
  const roleColor = COACH_ROLE_COLORS[coach.role];

  return (
    <div style={{
      marginLeft: `${depth * 28}px`,
      borderLeft: depth > 0 ? '2px solid #374151' : 'none',
      paddingLeft: depth > 0 ? '12px' : '0',
      marginBottom: '4px',
    }}>
      {/* Connector line indicator */}
      {depth > 0 && (
        <div style={{
          fontSize: '9px',
          color: '#4b5563',
          marginBottom: '2px',
          fontFamily: 'monospace',
        }}>
          {'|-- '}protege
        </div>
      )}

      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#0a0f1a',
        padding: '10px 14px',
        fontFamily: 'monospace',
      }}>
        {/* Name and Role */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
              {coach.name}
            </span>
            <span style={{
              padding: '2px 6px',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '3px',
              backgroundColor: roleColor + '22',
              color: roleColor,
            }}>
              {COACH_ROLE_LABELS[coach.role]}
            </span>
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `2px solid ${ratingColor(scoutGrade)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: ratingColor(scoutGrade),
          }}>
            {scoutGrade}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '10px' }}>
          <div>
            <span style={{ color: '#6b7280' }}>Record: </span>
            <span style={{ color: '#d1d5db', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
              {coach.wins}-{coach.losses}
            </span>
            <span style={{ color: '#6b7280' }}> ({winPct}%)</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Years: </span>
            <span style={{ color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>{coach.yearsInOrg}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Specialty: </span>
            <span style={{ color: '#a78bfa' }}>{coach.specialty}</span>
          </div>
        </div>

        {/* Proteges count */}
        {coach.proteges.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '9px', color: '#4b5563' }}>
            {coach.proteges.length} protege{coach.proteges.length > 1 ? 's' : ''} in tree
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recursive Tree Node ────────────────────────────────────────────────────

function TreeBranch({
  coach,
  allCoaches,
  depth,
  expandedIds,
  toggleExpand,
}: {
  coach: CoachNode;
  allCoaches: CoachNode[];
  depth: number;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
}) {
  const proteges = allCoaches.filter(c => c.mentorId === coach.coachId);
  const isExpanded = expandedIds.has(coach.coachId);
  const hasChildren = proteges.length > 0;

  return (
    <div>
      <div
        onClick={() => hasChildren && toggleExpand(coach.coachId)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        <CoachCard coach={coach} depth={depth} />
        {hasChildren && (
          <div style={{
            marginLeft: `${depth * 28 + 14}px`,
            fontSize: '9px',
            color: '#f59e0b',
            marginTop: '-2px',
            marginBottom: '4px',
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}>
            {isExpanded ? '[-] collapse' : `[+] expand (${proteges.length})`}
          </div>
        )}
      </div>
      {isExpanded && proteges.map(p => (
        <TreeBranch
          key={p.coachId}
          coach={p}
          allCoaches={allCoaches}
          depth={depth + 1}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}

// ── Stat Box ───────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      border: '1px solid #1f2937',
      padding: '8px 14px',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoCoachingTree();

export default function CoachingTreeView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<CoachingTreeData>(DEMO_DATA);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Start with root coaches expanded
    return new Set(data.treeRoots.map(r => r.coachId));
  });

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(data.allCoaches.filter(c => c.proteges.length > 0).map(c => c.coachId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const totalWinPct = data.totalWins + data.totalLosses > 0
    ? ((data.totalWins / (data.totalWins + data.totalLosses)) * 100).toFixed(1)
    : '0.0';

  const avgRating = useMemo(() => {
    if (data.allCoaches.length === 0) return 0;
    const sum = data.allCoaches.reduce((s, c) => s + ratingToScouting(c.rating), 0);
    return Math.round(sum / data.allCoaches.length);
  }, [data]);

  if (!gameStarted) {
    return <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>Start a game first.</div>;
  }

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
      }}>
        COACHING TREE
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <StatBox label="Total Coaches" value={data.allCoaches.length} color="#f59e0b" />
        <StatBox label="Tree Roots" value={data.treeRoots.length} color="#a855f7" />
        <StatBox label="Org Record" value={`${data.totalWins}-${data.totalLosses}`} color="#d1d5db" />
        <StatBox label="Win %" value={`${totalWinPct}%`} color={Number(totalWinPct) > 50 ? '#22c55e' : '#ef4444'} />
        <StatBox label="Avg Rating" value={avgRating} color={ratingColor(avgRating)} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={expandAll}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            borderRadius: '3px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#1f2937',
            color: '#9ca3af',
          }}
        >
          EXPAND ALL
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            borderRadius: '3px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#1f2937',
            color: '#9ca3af',
          }}
        >
          COLLAPSE ALL
        </button>
      </div>

      {/* Tree */}
      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#030712',
        padding: '12px',
        maxHeight: '600px',
        overflowY: 'auto',
      }}>
        <div style={{
          padding: '6px 12px',
          marginBottom: '8px',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#9ca3af',
          borderBottom: '1px solid #1f2937',
          letterSpacing: '0.05em',
        }}>
          {data.orgName.toUpperCase()} ({data.allCoaches.length} coaches)
        </div>
        {data.treeRoots.map(root => (
          <TreeBranch
            key={root.coachId}
            coach={root}
            allCoaches={data.allCoaches}
            depth={0}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>

      {/* Role Legend */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '9px',
        fontFamily: 'monospace',
      }}>
        {(Object.keys(COACH_ROLE_LABELS) as Array<keyof typeof COACH_ROLE_LABELS>).map(role => (
          <span key={role} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: COACH_ROLE_COLORS[role],
            }} />
            <span style={{ color: '#6b7280' }}>{COACH_ROLE_LABELS[role]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
