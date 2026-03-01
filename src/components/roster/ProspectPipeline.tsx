/**
 * ProspectPipeline.tsx — Farm system overview board
 *
 * Shows all minor league players ranked by potential with upside bars,
 * development phases, traits, and ETA estimates.
 */

import { useState, useMemo } from 'react';
import type { RosterPlayer } from '../../types/league';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type PosGroup = 'ALL' | 'IF' | 'OF' | 'SP' | 'RP';
type SortMode = 'pot' | 'ovr' | 'age' | 'gap';

const IF_POS = new Set(['C', '1B', '2B', '3B', 'SS', 'DH']);
const OF_POS = new Set(['LF', 'CF', 'RF']);

function matchesPosGroup(p: RosterPlayer, group: PosGroup): boolean {
  if (group === 'ALL') return true;
  if (group === 'IF') return !p.isPitcher && IF_POS.has(p.position);
  if (group === 'OF') return !p.isPitcher && OF_POS.has(p.position);
  if (group === 'SP') return p.isPitcher && (p.position === 'SP' || p.position === 'P');
  if (group === 'RP') return p.isPitcher && (p.position === 'RP' || p.position === 'CL');
  return true;
}

function levelLabel(status: string): string {
  if (status.includes('AAA')) return 'AAA';
  if (status.includes('AA') && !status.includes('AAA')) return 'AA';
  if (status.includes('APLUS') || status.includes('HIGH')) return 'A+';
  if (status.includes('AMINUS') || status.includes('LOW')) return 'A';
  if (status.includes('ROOKIE')) return 'Rk';
  if (status.includes('INTL')) return 'Intl';
  if (status.includes('MLB') || status.includes('ACTIVE')) return 'MLB';
  return '—';
}

function levelColor(level: string): string {
  if (level === 'MLB') return '#f97316';
  if (level === 'AAA') return '#fbbf24';
  if (level === 'AA') return '#a3e635';
  return '#94a3b8';
}

function devPhase(age: number, ovr: number): { label: string; color: string } {
  if (age <= 22) return { label: 'PROSPECT', color: '#60a5fa' };
  if (age <= 26 && ovr < 400) return { label: 'ASCENDING', color: '#4ade80' };
  if (age <= 31) return { label: 'PRIME', color: '#fbbf24' };
  if (age <= 35) return { label: 'VETERAN', color: '#f97316' };
  return { label: 'DECLINING', color: '#ef4444' };
}

// ETA: rough estimate of years until MLB-ready (OVR ~350+ on 0-550 scale)
function estimateETA(ovr: number, potential: number): string {
  if (ovr >= 350) return 'Ready';
  const gapToMLB = 350 - ovr;
  // ~20-40 OVR growth per year for prospects
  const growthRate = potential >= 450 ? 40 : potential >= 350 ? 30 : 20;
  const years = Math.max(1, Math.ceil(gapToMLB / growthRate));
  if (years >= 5) return '4+ yr';
  return `${years} yr`;
}

function pipelineGrade(avgPot: number, count: number): { grade: string; color: string } {
  const score = avgPot * Math.min(1, count / 10);
  if (score >= 420) return { grade: 'S', color: '#fbbf24' };
  if (score >= 360) return { grade: 'A', color: '#4ade80' };
  if (score >= 300) return { grade: 'B', color: '#60a5fa' };
  if (score >= 240) return { grade: 'C', color: '#f97316' };
  if (score >= 180) return { grade: 'D', color: '#ef4444' };
  return { grade: 'F', color: '#6b7280' };
}

// Convert raw OVR (0-550) to scouting scale (20-80)
function toScout(ovr: number): number {
  return Math.round(20 + (ovr / 550) * 60);
}

// ─── Trait chip ──────────────────────────────────────────────────────────────

function TraitChip({ trait }: { trait: PlayerTrait }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
      style={{
        background: `${trait.color}15`,
        border: `1px solid ${trait.color}40`,
        color: trait.color,
        fontSize: '0.6rem',
      }}
      title={trait.desc}
    >
      {trait.emoji} {trait.label}
    </span>
  );
}

// ─── Prospect card ───────────────────────────────────────────────────────────

function ProspectCard({ p, rank }: { p: RosterPlayer; rank: number }) {
  const traits = assignTraits(p);
  const level = levelLabel(p.rosterStatus);
  const lvlColor = levelColor(level);
  const phase = devPhase(p.age, p.overall);
  const eta = estimateETA(p.overall, p.potential);
  const ovrScout = toScout(p.overall);
  const potScout = toScout(p.potential);
  const gap = p.potential - p.overall;
  const gapPct = Math.min(100, Math.round((p.overall / p.potential) * 100));

  const isTopTen = rank <= 10;
  const potColor = potScout >= 65 ? '#4ade80' : potScout >= 55 ? '#fbbf24' : '#94a3b8';

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        background: isTopTen ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.02)',
        border: isTopTen ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Rank */}
      <div className="w-8 text-right shrink-0">
        <div
          className="font-black text-sm tabular-nums"
          style={{ color: isTopTen ? '#f97316' : '#6b7280' }}
        >
          {rank}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-gray-200 truncate">{p.name}</span>
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${lvlColor}22`, color: lvlColor, border: `1px solid ${lvlColor}44` }}
          >
            {level}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: `${phase.color}15`, color: phase.color, border: `1px solid ${phase.color}30` }}
          >
            {phase.label}
          </span>
        </div>
        <div className="text-gray-500 text-xs">
          {p.position} · Age {p.age} · {p.isPitcher ? p.throws : p.bats}
          <span className="ml-2 font-bold" style={{ color: potColor }}>
            POT {potScout}
          </span>
        </div>
        {/* Traits */}
        {traits.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {traits.map(t => <TraitChip key={t.id} trait={t} />)}
          </div>
        )}
      </div>

      {/* OVR → POT bar + ETA */}
      <div className="text-right min-w-[90px] shrink-0">
        <div className="text-xs text-gray-500 mb-0.5">OVR → POT</div>
        <div className="font-black text-sm tabular-nums text-orange-400">
          {ovrScout} → {potScout}
        </div>
        <div className="h-1.5 bg-gray-800 rounded mt-1 overflow-hidden">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${gapPct}%`,
              background: gap > 100 ? '#f97316' : gap > 50 ? '#fbbf24' : '#4ade80',
            }}
          />
        </div>
        <div className="text-xs mt-0.5" style={{ color: eta === 'Ready' ? '#4ade80' : '#6b7280' }}>
          ETA: {eta}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProspectPipeline({ players }: { players: RosterPlayer[] }) {
  const [posGroup, setPosGroup] = useState<PosGroup>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('pot');

  // Only minor league + young MLB players (age <= 28, below prime OVR)
  const prospects = useMemo(() => {
    let list = players.filter(p => {
      const isMinors = !p.rosterStatus.includes('MLB') && !p.rosterStatus.includes('ACTIVE');
      const isYoungMLB = p.age <= 25 && (p.potential - p.overall) >= 30;
      return isMinors || isYoungMLB;
    });

    // Position filter
    list = list.filter(p => matchesPosGroup(p, posGroup));

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortMode) {
        case 'pot': return b.potential - a.potential;
        case 'ovr': return b.overall - a.overall;
        case 'age': return a.age - b.age;
        case 'gap': return (b.potential - b.overall) - (a.potential - a.overall);
        default: return 0;
      }
    });

    return list;
  }, [players, posGroup, sortMode]);

  // Summary stats
  const totalCount = prospects.length;
  const avgPot = totalCount > 0 ? Math.round(prospects.reduce((s, p) => s + p.potential, 0) / totalCount) : 0;
  const eliteCount = prospects.filter(p => p.potential >= 330).length; // ~56+ on 20-80 scale
  const avgAge = totalCount > 0 ? (prospects.reduce((s, p) => s + p.age, 0) / totalCount).toFixed(1) : '—';
  const grade = pipelineGrade(avgPot, totalCount);

  if (totalCount === 0) {
    return (
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4">PROSPECT PIPELINE</div>
        <div className="px-4 py-8 text-center text-gray-500 text-xs">
          No prospects in the farm system.
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>PROSPECT PIPELINE</span>
        <div className="flex items-center gap-3 normal-case font-normal">
          <span className="text-gray-500 text-xs">{totalCount} prospects</span>
          <span className="font-black text-lg" style={{ color: grade.color }}>{grade.grade}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-6 flex-wrap">
        {[
          { label: 'TOTAL', value: String(totalCount), color: '#f97316' },
          { label: 'AVG POT', value: String(toScout(avgPot)), color: '#fbbf24' },
          { label: 'POT 56+', value: String(eliteCount), color: '#4ade80' },
          { label: 'AVG AGE', value: String(avgAge), color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-gray-600 text-[10px] uppercase">{s.label}</div>
            <div className="font-bold text-sm tabular-nums" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['ALL', 'IF', 'OF', 'SP', 'RP'] as PosGroup[]).map(g => (
            <button
              key={g}
              onClick={() => setPosGroup(g)}
              className={[
                'text-xs px-2 py-0.5 rounded transition-colors',
                posGroup === g
                  ? 'bg-orange-900/40 text-orange-400'
                  : 'text-gray-600 hover:text-gray-400',
              ].join(' ')}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-gray-600 text-xs">SORT:</span>
          {([
            { key: 'pot', label: 'POT' },
            { key: 'ovr', label: 'OVR' },
            { key: 'age', label: 'AGE' },
            { key: 'gap', label: 'GAP' },
          ] as { key: SortMode; label: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortMode(s.key)}
              className={[
                'text-xs px-2 py-0.5 rounded transition-colors',
                sortMode === s.key
                  ? 'bg-orange-900/40 text-orange-400 font-bold'
                  : 'text-gray-600 hover:text-gray-400',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prospect cards */}
      <div className="px-4 py-3 space-y-2">
        {prospects.map((p, i) => (
          <ProspectCard key={p.playerId} p={p} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
