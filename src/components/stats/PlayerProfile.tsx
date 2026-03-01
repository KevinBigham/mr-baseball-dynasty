import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import type { PlayerProfileData } from '../../types/league';

// ─── Scouting grade box ───────────────────────────────────────────────────────

function GradeBox({ label, value }: { label: string; value: number }) {
  const { cls, bg } =
    value >= 70 ? { cls: 'grade-80', bg: 'bg-green-900/30 border-green-700' } :
    value >= 60 ? { cls: 'grade-70', bg: 'bg-green-900/20 border-green-800' } :
    value >= 50 ? { cls: 'grade-60', bg: 'bg-blue-900/20 border-blue-800' } :
    value >= 40 ? { cls: 'grade-50', bg: 'bg-gray-800 border-gray-700' } :
    value >= 30 ? { cls: 'grade-40', bg: 'bg-orange-900/20 border-orange-900' } :
                  { cls: 'grade-30', bg: 'bg-red-900/20 border-red-900' };

  return (
    <div className={`flex flex-col items-center border px-3 py-2 ${bg}`}>
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

// ─── Attribute bar (20-80 scale) ─────────────────────────────────────────────

function AttrBar({ label, value, max = 80 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= 70 ? 'bg-green-500' : value >= 55 ? 'bg-blue-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-600';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-8 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
        <div className={`h-full rounded transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-6 tabular-nums font-bold ${value >= 70 ? 'text-green-400' : value >= 55 ? 'text-blue-400' : value >= 40 ? 'text-orange-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Service time progress bar ────────────────────────────────────────────────

function ServiceBar({ days }: { days: number }) {
  const years = Math.floor(days / 172);
  const rem   = days % 172;
  const arbEligDay = 3 * 172;
  const faEligDay  = 6 * 172;

  const arbPct = Math.min(100, (days / arbEligDay) * 100);
  const faPct  = Math.min(100, (days / faEligDay) * 100);

  let status = 'PRE-ARB';
  let statusColor = 'text-green-400';
  if (years >= 6) { status = 'FA ELIGIBLE'; statusColor = 'text-red-400'; }
  else if (years >= 3) { status = `ARB YEAR ${Math.min(years - 2, 3)}`; statusColor = 'text-yellow-400'; }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-500 text-xs">SERVICE TIME</span>
        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
      </div>
      <div className="relative w-full h-3 bg-gray-800 rounded overflow-hidden mb-1">
        {/* FA eligibility track */}
        <div className="absolute h-full bg-gray-700 w-full" />
        <div className="absolute h-full bg-orange-600 transition-all" style={{ width: `${faPct}%` }} />
        {/* Arb line at 50% */}
        <div className="absolute top-0 h-full w-px bg-yellow-400/50" style={{ left: '50%' }} />
      </div>
      <div className="flex justify-between text-gray-700 text-xs">
        <span>0Y</span>
        <span className="text-yellow-600">ARB 3Y</span>
        <span>FA 6Y</span>
      </div>
      <div className="text-gray-500 text-xs mt-1">{years}Y {rem}D · {arbPct < 100 ? `${(100 - arbPct).toFixed(0)}% to arb` : faPct < 100 ? `${(100 - faPct).toFixed(0)}% to FA` : 'FA eligible'}</div>
    </div>
  );
}

// ─── Stat display helpers ─────────────────────────────────────────────────────

function StatGrid({ stats }: { stats: Array<{ label: string; value: string | number | undefined; highlight?: boolean }> }) {
  return (
    <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800">
      {stats.filter(s => s.value !== undefined && s.value !== null).map(s => (
        <div key={s.label} className="px-3 py-2 text-center">
          <div className="text-gray-500 text-xs">{s.label}</div>
          <div className={`font-bold tabular-nums ${s.highlight ? 'text-orange-400 text-lg' : 'text-gray-200'}`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Development phase badge ──────────────────────────────────────────────────

function PhaseBadge({ age, overall, potential }: { age: number; overall: number; potential: number }) {
  let phase: string;
  let color: string;

  const gap = potential - overall;
  if (age <= 22)        { phase = 'PROSPECT';  color = 'text-purple-400 border-purple-700'; }
  else if (age <= 26 && gap > 30) { phase = 'ASCENDING'; color = 'text-blue-400 border-blue-700'; }
  else if (age <= 30)  { phase = 'PRIME';     color = 'text-green-400 border-green-700'; }
  else if (age <= 34)  { phase = 'VETERAN';   color = 'text-yellow-400 border-yellow-700'; }
  else                 { phase = 'DECLINING'; color = 'text-gray-500 border-gray-700'; }

  return (
    <span className={`border text-xs px-2 py-0.5 font-bold tracking-widest ${color}`}>
      {phase}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PlayerProfile() {
  const { selectedPlayerId, setActiveTab } = useUIStore();
  const { gameStarted } = useGameStore();
  const [data, setData] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayerId || !gameStarted) return;
    setLoading(true);
    setError(null);
    getEngine().getPlayerProfile(selectedPlayerId)
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [selectedPlayerId, gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (!selectedPlayerId) return (
    <div className="p-4 text-center">
      <div className="text-gray-600 text-xs mt-16">Select a player from the roster or leaderboard to view their profile.</div>
    </div>
  );
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading player data…</div>;
  if (error)   return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (!data)   return null;

  const { player, seasonStats } = data;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);
  const s = seasonStats as Record<string, number> | null;

  // Compute derived stats
  const slg = s && s.ab > 0
    ? ((s.h - (s.doubles ?? 0) - (s.triples ?? 0) - s.hr) + (s.doubles ?? 0) * 2 + (s.triples ?? 0) * 3 + s.hr * 4) / s.ab
    : null;
  const ops  = s && slg !== null ? (s.obp ?? 0) + slg : null;
  const k9   = s && s.ip > 0 ? (s.ka / s.ip) * 9 : null;
  const bb9  = s && s.ip > 0 ? (s.bba / s.ip) * 9 : null;
  const kpct = s && s.pa > 0 ? (s.k / s.pa) * 100 : null;

  // OVR/Potential on 20-80 scale
  const ovrScale = Math.round(20 + (player.overall / 550) * 60);
  const potScale = Math.round(20 + (player.potential / 550) * 60);

  const contractStatus = (() => {
    const yr = Math.floor(player.serviceTimeDays / 172);
    if (yr < 3) return { label: 'Pre-Arb', color: 'text-green-400' };
    if (yr < 6) return { label: `Arb Year ${Math.min(yr - 2, 3)}`, color: 'text-yellow-400' };
    return { label: 'FA Eligible', color: 'text-red-400' };
  })();

  return (
    <div className="p-4 max-w-4xl space-y-4">
      <button
        onClick={() => setActiveTab('roster')}
        className="text-gray-500 hover:text-orange-400 text-xs transition-colors"
      >
        ← BACK TO ROSTER
      </button>

      {/* ── Identity header ──────────────────────────────────────────────── */}
      <div className="bloomberg-border">
        <div className="bloomberg-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{player.name}</span>
            <PhaseBadge age={player.age} overall={player.overall} potential={player.potential} />
          </div>
          <span className="text-gray-500 font-normal text-xs">
            {player.position} · {player.bats}/{player.throws} · AGE {player.age}
          </span>
        </div>

        {/* Key stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-800">
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">OVR / POT (20–80)</div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-bold text-2xl tabular-nums">{ovrScale}</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 font-bold text-xl tabular-nums">{potScale}</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">CONTRACT</div>
            <div className="text-gray-200 font-bold">
              {player.contractYearsRemaining}Y · ${(player.salary / 1_000_000).toFixed(1)}M/yr
            </div>
            <div className={`text-xs ${contractStatus.color}`}>{contractStatus.label}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">STATUS</div>
            <div className="text-orange-400 font-bold text-sm">
              {player.rosterStatus.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="px-4 py-3">
            <ServiceBar days={player.serviceTimeDays} />
          </div>
        </div>
      </div>

      {/* ── Scouting grades + attribute bars ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bloomberg-border">
          <div className="bloomberg-header">SCOUTING GRADES (20–80)</div>
          <div className="flex gap-2 flex-wrap p-3">
            {Object.entries(player.grades).map(([label, val]) => (
              <GradeBox key={label} label={label} value={val} />
            ))}
          </div>
        </div>

        <div className="bloomberg-border">
          <div className="bloomberg-header">ATTRIBUTE BREAKDOWN</div>
          <div className="p-3 space-y-1.5">
            {Object.entries(player.grades).map(([label, val]) => (
              <AttrBar key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Season stats ─────────────────────────────────────────────────── */}
      {s && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON {s.season} STATISTICS</div>

          {isPitcher ? (
            <>
              <StatGrid stats={[
                { label: 'W', value: s.w },
                { label: 'L', value: s.l },
                { label: 'SV', value: s.sv },
                { label: 'IP', value: s.ip?.toFixed(1) },
              ]} />
              <div className="border-t border-gray-800">
                <StatGrid stats={[
                  { label: 'ERA', value: s.era?.toFixed(2), highlight: true },
                  { label: 'WHIP', value: s.whip?.toFixed(2) },
                  { label: 'K/9', value: k9?.toFixed(1) },
                  { label: 'BB/9', value: bb9?.toFixed(1) },
                ]} />
              </div>
              <div className="border-t border-gray-800">
                <StatGrid stats={[
                  { label: 'K', value: s.ka },
                  { label: 'BB', value: s.bba },
                  { label: 'HR', value: s.hra },
                  { label: 'GS', value: s.gs },
                ]} />
              </div>
            </>
          ) : (
            <>
              <StatGrid stats={[
                { label: 'AVG', value: s.avg?.toFixed(3), highlight: true },
                { label: 'OBP', value: s.obp?.toFixed(3) },
                { label: 'SLG', value: slg?.toFixed(3) },
                { label: 'OPS', value: ops?.toFixed(3) },
              ]} />
              <div className="border-t border-gray-800">
                <StatGrid stats={[
                  { label: 'PA', value: s.pa },
                  { label: 'HR', value: s.hr },
                  { label: 'RBI', value: s.rbi },
                  { label: 'SB', value: s.sb },
                ]} />
              </div>
              <div className="border-t border-gray-800">
                <StatGrid stats={[
                  { label: 'H', value: s.h },
                  { label: 'BB', value: s.bb },
                  { label: 'K', value: s.k },
                  { label: 'K%', value: kpct !== null ? `${kpct.toFixed(1)}%` : undefined },
                ]} />
              </div>
            </>
          )}
        </div>
      )}

      {!s && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">STATISTICS</div>
          <div className="p-6 text-gray-500 text-xs text-center">
            Simulate a season to see statistics.
          </div>
        </div>
      )}
    </div>
  );
}
