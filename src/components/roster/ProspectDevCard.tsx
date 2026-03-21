/**
 * ProspectDevCard.tsx — Rich development card for a single prospect.
 * Shows current vs ceiling progress bars for each tool, dev velocity,
 * assigned program, traits, and ETA. XP-style visualization.
 */

import { useMemo } from 'react';
import type { RosterPlayer } from '../../types/league';
import { assignTraits } from '../../engine/playerTraits';
import AnimatedBar from '../shared/AnimatedBar';

// ─── Helpers ──────────────────────────────────────────────────────────────

function toScout(raw: number): number {
  return Math.round(20 + (Math.max(0, Math.min(550, raw)) / 550) * 60);
}

function levelLabel(status: string): string {
  if (status.includes('AAA')) return 'AAA';
  if (status.includes('AA') && !status.includes('AAA')) return 'AA';
  if (status.includes('APLUS') || status.includes('HIGH')) return 'A+';
  if (status.includes('AMINUS') || status.includes('LOW')) return 'A';
  if (status.includes('ROOKIE')) return 'Rk';
  if (status.includes('INTL')) return 'Intl';
  return 'MLB';
}

function devVelocity(ovr: number, potential: number, age: number): { label: string; color: string } {
  const gap = potential - ovr;
  const gapPct = potential > 0 ? gap / potential : 0;

  if (age <= 22 && gapPct > 0.3) return { label: 'FAST LEARNER', color: '#4ade80' };
  if (age <= 25 && gapPct > 0.15) return { label: 'ON TRACK', color: '#60a5fa' };
  if (gapPct <= 0.05) return { label: 'NEAR CEILING', color: '#fbbf24' };
  if (age > 25 && gapPct > 0.2) return { label: 'SLOW DEV', color: '#f97316' };
  if (age > 27 && gapPct > 0.25) return { label: 'STALLED', color: '#ef4444' };
  return { label: 'ON TRACK', color: '#60a5fa' };
}

function estimateETA(ovr: number, potential: number): string {
  if (ovr >= 350) return 'MLB Ready';
  const gap = 350 - ovr;
  const rate = potential >= 450 ? 40 : potential >= 350 ? 30 : 20;
  const years = Math.max(1, Math.ceil(gap / rate));
  return years >= 5 ? '4+ years' : `${years} year${years > 1 ? 's' : ''}`;
}

// Simulated attribute-level data from overall/potential
// (Real attribute data would come from the engine; this is a display approximation)
function getToolGrades(
  ovr: number,
  potential: number,
  isPitcher: boolean,
): Array<{ name: string; current: number; ceiling: number }> {
  const pct = ovr / Math.max(1, potential);

  if (isPitcher) {
    return [
      { name: 'STF', current: toScout(ovr * 1.05), ceiling: toScout(potential * 1.05) },
      { name: 'MOV', current: toScout(ovr * 0.95), ceiling: toScout(potential * 0.95) },
      { name: 'CMD', current: toScout(ovr * 0.90), ceiling: toScout(potential * 0.95) },
      { name: 'STA', current: toScout(ovr * 0.85), ceiling: toScout(potential * 0.90) },
      { name: 'CTL', current: toScout(ovr * pct * 1.0), ceiling: toScout(potential * 0.92) },
    ];
  }

  return [
    { name: 'CON', current: toScout(ovr * 1.0), ceiling: toScout(potential * 1.0) },
    { name: 'POW', current: toScout(ovr * 0.95), ceiling: toScout(potential * 0.98) },
    { name: 'EYE', current: toScout(ovr * 0.88), ceiling: toScout(potential * 0.92) },
    { name: 'SPD', current: toScout(ovr * 0.90), ceiling: toScout(potential * 0.85) },
    { name: 'FLD', current: toScout(ovr * 0.85), ceiling: toScout(potential * 0.90) },
  ];
}

function gradeColor(grade: number): string {
  if (grade >= 70) return '#f97316';
  if (grade >= 60) return '#fbbf24';
  if (grade >= 50) return '#4ade80';
  if (grade >= 40) return '#60a5fa';
  if (grade >= 30) return '#94a3b8';
  return '#ef4444';
}

function progressColor(current: number, ceiling: number): string {
  const pct = ceiling > 20 ? (current - 20) / (ceiling - 20) : 0;
  if (pct >= 0.9) return '#fbbf24';  // near ceiling
  if (pct >= 0.6) return '#4ade80';  // growing
  if (pct >= 0.3) return '#60a5fa';  // developing
  return '#94a3b8';                  // early
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  player: RosterPlayer;
  devProgram?: string | null;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function ProspectDevCard({ player, devProgram, expanded = false, onToggle }: Props) {
  const ovrScout = toScout(player.overall);
  const potScout = toScout(player.potential);
  const velocity = devVelocity(player.overall, player.potential, player.age);
  const eta = estimateETA(player.overall, player.potential);
  const tools = useMemo(() => getToolGrades(player.overall, player.potential, player.isPitcher), [player.overall, player.potential, player.isPitcher]);
  const traits = useMemo(() => assignTraits(player), [player]);

  return (
    <div
      className="bloomberg-border bg-[#0F1930] overflow-hidden cursor-pointer transition-all duration-200 hover:border-orange-800/50"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onToggle) { e.preventDefault(); onToggle(); } }}
      aria-expanded={expanded}
    >
      {/* Header row */}
      <div className="px-3 py-2 flex items-center gap-3">
        {/* Level badge */}
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 shrink-0">
          {levelLabel(player.rosterStatus)}
        </span>

        {/* Name + position */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-200 truncate">{player.name}</div>
          <div className="text-[10px] text-gray-500">{player.position} · Age {player.age}</div>
        </div>

        {/* OVR / POT */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold tabular-nums" style={{ color: gradeColor(ovrScout) }}>
              {ovrScout}
            </span>
            <span className="text-gray-500 text-[9px]">/</span>
            <span className="text-sm font-bold tabular-nums text-gray-400">{potScout}</span>
          </div>
          <div className="text-[8px] text-gray-500">OVR / POT</div>
        </div>

        {/* Velocity badge */}
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ color: velocity.color, border: `1px solid ${velocity.color}40` }}
        >
          {velocity.label}
        </span>
      </div>

      {/* XP Progress bar (overall → potential) */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-gray-500 w-6 tabular-nums">{ovrScout}</span>
          <div className="flex-1">
            <AnimatedBar
              value={(player.overall / Math.max(1, player.potential)) * 100}
              color={progressColor(ovrScout, potScout)}
              height="h-1.5"
              label={`${player.name} development progress`}
            />
          </div>
          <span className="text-[8px] text-gray-500 w-6 tabular-nums text-right">{potScout}</span>
        </div>
      </div>

      {/* Expanded: tool grades + traits + ETA */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1E2A4A] space-y-2 mbd-fade-in">
          {/* Individual tool bars */}
          <div className="space-y-1">
            {tools.map(tool => (
              <div key={tool.name} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-7 font-bold">{tool.name}</span>
                <span className="text-[9px] tabular-nums w-4" style={{ color: gradeColor(tool.current) }}>
                  {tool.current}
                </span>
                <div className="flex-1">
                  <div className="relative h-1 bg-gray-800 rounded overflow-hidden">
                    {/* Ceiling marker */}
                    <div
                      className="absolute top-0 h-full bg-gray-700 rounded"
                      style={{ width: `${((tool.ceiling - 20) / 60) * 100}%` }}
                    />
                    {/* Current fill */}
                    <div
                      className="absolute top-0 h-full rounded transition-all duration-500"
                      style={{
                        width: `${((tool.current - 20) / 60) * 100}%`,
                        backgroundColor: progressColor(tool.current, tool.ceiling),
                      }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 tabular-nums w-4 text-right">{tool.ceiling}</span>
              </div>
            ))}
          </div>

          {/* Traits */}
          {traits.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {traits.map(t => (
                <span
                  key={t.id}
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ color: t.color, border: `1px solid ${t.color}40`, background: `${t.color}10` }}
                  title={t.desc}
                >
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>
          )}

          {/* Footer: ETA + program */}
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-gray-500">
              ETA: <span className="text-gray-300 font-bold">{eta}</span>
            </span>
            {devProgram && (
              <span className="text-orange-400 font-bold uppercase tracking-wider">
                {devProgram.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
