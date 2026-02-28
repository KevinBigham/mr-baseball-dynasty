import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  BUCKET_DISPLAY,
  getEVTier,
  getEVLeaderboardSummary,
  generateDemoExitVeloLeaders,
  type EVLeader,
  type HitDistribution,
} from '../../engine/analytics/exitVeloLeaderboard';

/* ── Inline helpers ─────────────────────────────────────────────── */

function BarCell({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#d1d5db', width: 38, textAlign: 'right' }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function DistributionRow({ dist }: { dist: HitDistribution }) {
  const info = BUCKET_DISPLAY[dist.bucket];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'monospace' }}>
      <span style={{ width: 48, color: info.color, fontWeight: 700 }}>{info.label}</span>
      <div style={{ flex: 1, height: 5, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${dist.pct}%`, height: '100%', backgroundColor: info.color, borderRadius: 2, opacity: 0.8 }} />
      </div>
      <span style={{ color: '#9ca3af', width: 32, textAlign: 'right' }}>{dist.pct}%</span>
      <span style={{ color: '#6b7280', width: 42, textAlign: 'right' }}>{dist.avgEV} mph</span>
    </div>
  );
}

function LeaderRow({ leader, expanded, onToggle }: { leader: EVLeader; expanded: boolean; onToggle: () => void }) {
  const tier = getEVTier(leader.avgExitVelo);

  return (
    <div style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}>
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 60px 60px 100px 100px 42px 60px',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          backgroundColor: expanded ? 'rgba(245,158,11,0.04)' : 'transparent',
        }}
      >
        {/* Rank */}
        <span style={{ color: '#6b7280', fontWeight: 700 }}>{leader.rank}</span>
        {/* Name + Pos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#fdba74', fontWeight: 700 }}>{leader.name}</span>
          <span style={{ color: '#4b5563', fontSize: 9 }}>{leader.position}</span>
        </div>
        {/* Avg EV */}
        <span style={{ color: tier.color, fontWeight: 700, textAlign: 'right' }}>
          {leader.avgExitVelo}
        </span>
        {/* Max EV */}
        <span style={{ color: '#d1d5db', textAlign: 'right' }}>{leader.maxExitVelo}</span>
        {/* Barrel % bar */}
        <BarCell value={leader.barrelPct} max={25} color="#22c55e" />
        {/* Hard Hit % bar */}
        <BarCell value={leader.hardHitPct} max={65} color="#f97316" />
        {/* Sweet Spot */}
        <span style={{ color: '#9ca3af', textAlign: 'right' }}>{leader.sweetSpotPct}%</span>
        {/* xSLG */}
        <span style={{ color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}>
          {leader.xSLG.toFixed(3).replace(/^0(?=\.)/, '')}
        </span>
      </div>

      {/* Expanded distribution */}
      {expanded && (
        <div style={{ padding: '4px 12px 10px 40px', backgroundColor: 'rgba(17,24,39,0.5)' }}>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4, fontFamily: 'monospace' }}>
            HIT QUALITY DISTRIBUTION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 340 }}>
            {leader.distribution.map(d => (
              <DistributionRow key={d.bucket} dist={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function ExitVeloView() {
  const { gameStarted } = useGameStore();
  const [leaders] = useState<EVLeader[]>(() => generateDemoExitVeloLeaders());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getEVLeaderboardSummary(leaders);

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', color: '#e5e7eb', backgroundColor: '#030712' }}>
      {/* Header */}
      <div
        style={{
          margin: '-16px -16px 16px -16px',
          padding: '8px 32px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
          EXIT VELOCITY LEADERBOARD
        </span>
        <span style={{ color: '#4b5563', fontSize: 10 }}>STATCAST EV DATA</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TEAM AVG EV', value: `${summary.avgTeamEV}`, unit: 'mph', color: '#f59e0b' },
          { label: 'AVG BARREL%', value: `${summary.avgBarrelPct}%`, unit: '', color: '#22c55e' },
          { label: 'AVG HARD HIT%', value: `${summary.avgHardHitPct}%`, unit: '', color: '#f97316' },
          { label: 'AVG xSLG', value: summary.avgXSLG.toFixed(3).replace(/^0(?=\.)/, ''), unit: '', color: '#f59e0b' },
          { label: 'ELITE HITTERS', value: `${summary.eliteCount}`, unit: '', color: '#22c55e' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              border: '1px solid #1f2937',
              padding: '8px 12px',
              textAlign: 'center',
              backgroundColor: '#111827',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{card.label}</div>
            <div style={{ color: card.color, fontWeight: 700, fontSize: 18 }}>
              {card.value}
              {card.unit && <span style={{ fontSize: 9, color: '#6b7280', marginLeft: 2 }}>{card.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #1f2937', backgroundColor: '#111827' }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 60px 60px 100px 100px 42px 60px',
            padding: '6px 12px',
            borderBottom: '1px solid #1f2937',
            fontSize: 9,
            fontWeight: 700,
            color: '#6b7280',
            backgroundColor: '#0a0f1a',
          }}
        >
          <span>#</span>
          <span>PLAYER</span>
          <span style={{ textAlign: 'right' }}>AVG EV</span>
          <span style={{ textAlign: 'right' }}>MAX EV</span>
          <span>BBL%</span>
          <span>HH%</span>
          <span style={{ textAlign: 'right' }}>SS%</span>
          <span style={{ textAlign: 'right' }}>xSLG</span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '32rem', overflowY: 'auto' }}>
          {leaders.map(l => (
            <LeaderRow
              key={l.playerId}
              leader={l}
              expanded={expandedId === l.playerId}
              onToggle={() => setExpandedId(expandedId === l.playerId ? null : l.playerId)}
            />
          ))}
        </div>
      </div>

      {/* xSLG comparison strip */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>
          xSLG COMPARISON (TOP 10)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {leaders.slice(0, 10).map(l => {
            const barW = Math.min(100, (l.xSLG / 0.650) * 100);
            return (
              <div key={l.playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontFamily: 'monospace' }}>
                <span style={{ width: 130, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name}
                </span>
                <div style={{ flex: 1, height: 8, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barW}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                    }}
                  />
                </div>
                <span style={{ width: 42, textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>
                  {l.xSLG.toFixed(3).replace(/^0(?=\.)/, '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
