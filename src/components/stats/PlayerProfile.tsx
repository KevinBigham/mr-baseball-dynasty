import { useEffect, useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';
import type { PlayerProfileData, RosterPlayer } from '../../types/league';
import CareerStatsTable from './CareerStatsTable';

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
        <div className="absolute h-full bg-gray-700 w-full" />
        <div className="absolute h-full bg-orange-600 transition-all" style={{ width: `${faPct}%` }} />
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

// ─── Development Phase Timeline ──────────────────────────────────────────────

const PHASES = [
  { id: 'prospect',  label: 'PROSPECT',  color: '#a78bfa', ages: '≤22' },
  { id: 'ascending', label: 'ASCENDING', color: '#60a5fa', ages: '23-26' },
  { id: 'prime',     label: 'PRIME',     color: '#4ade80', ages: '27-30' },
  { id: 'veteran',   label: 'VETERAN',   color: '#fbbf24', ages: '31-34' },
  { id: 'declining', label: 'DECLINING', color: '#6b7280', ages: '35+' },
];

function detectPhase(age: number, overall: number, potential: number): string {
  const gap = potential - overall;
  if (age <= 22)       return 'prospect';
  if (age <= 26 && gap > 30) return 'ascending';
  if (age <= 30)       return 'prime';
  if (age <= 34)       return 'veteran';
  return 'declining';
}

function PhaseTimeline({ age, overall, potential }: { age: number; overall: number; potential: number }) {
  const current = detectPhase(age, overall, potential);
  const currentIdx = PHASES.findIndex(p => p.id === current);

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">DEVELOPMENT ARC</div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-1">
          {PHASES.map((phase, i) => {
            const isActive = phase.id === current;
            const isPast = i < currentIdx;
            return (
              <div key={phase.id} className="flex-1 flex flex-col items-center">
                {/* Dot */}
                <div className="flex items-center w-full">
                  {i > 0 && (
                    <div
                      className="flex-1 h-0.5"
                      style={{ background: isPast || isActive ? phase.color : '#374151' }}
                    />
                  )}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 transition-all"
                    style={{
                      background: isActive ? phase.color : isPast ? phase.color : '#1f2937',
                      border: `2px solid ${isActive || isPast ? phase.color : '#374151'}`,
                      boxShadow: isActive ? `0 0 8px ${phase.color}60` : undefined,
                    }}
                  />
                  {i < PHASES.length - 1 && (
                    <div
                      className="flex-1 h-0.5"
                      style={{ background: isPast ? PHASES[i + 1].color : '#374151' }}
                    />
                  )}
                </div>
                {/* Label */}
                <div
                  className="text-center mt-1.5"
                  style={{ opacity: isActive ? 1 : isPast ? 0.5 : 0.3 }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: isActive ? phase.color : '#9ca3af', fontSize: isActive ? 11 : 9 }}
                  >
                    {phase.label}
                  </div>
                  <div className="text-gray-700" style={{ fontSize: 9 }}>{phase.ages}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Trade Value Meter ──────────────────────────────────────────────────────

function TradeValueMeter({ value }: { value: number }) {
  const { label, color } =
    value >= 80 ? { label: 'ELITE ASSET',     color: '#fbbf24' } :
    value >= 60 ? { label: 'PREMIUM',          color: '#4ade80' } :
    value >= 40 ? { label: 'SOLID VALUE',      color: '#60a5fa' } :
    value >= 20 ? { label: 'ROLE PLAYER',      color: '#fb923c' } :
                  { label: 'MINIMAL',          color: '#6b7280' };

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">TRADE VALUE</div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color }}>{label}</span>
          <span className="font-black text-lg tabular-nums" style={{ color }}>
            {value}<span className="text-gray-600 font-normal text-xs">/100</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${value}%`, background: color }}
          />
        </div>
        <div className="text-gray-700 text-xs">
          Based on overall, potential, age, and contract value
        </div>
      </div>
    </div>
  );
}

// ─── Trait Badges ────────────────────────────────────────────────────────────

function TraitBadges({ traits }: { traits: PlayerTrait[] }) {
  if (traits.length === 0) return null;
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">DEVELOPMENT TRAITS</div>
      <div className="px-4 py-3 space-y-2">
        {traits.map(t => (
          <div
            key={t.id}
            className="rounded-lg px-3 py-2"
            style={{
              background: `${t.color}08`,
              border: `1px solid ${t.color}30`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{t.emoji}</span>
              <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
            </div>
            <div className="text-gray-500 text-xs mt-1 leading-relaxed">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contract Extension Panel ────────────────────────────────────────────────

function ExtensionPanel({ player, onExtended }: {
  player: PlayerProfileData['player'];
  onExtended: () => void;
}) {
  const serviceYears = Math.floor(player.serviceTimeDays / 172);

  const [years, setYears] = useState(3);
  const [salary, setSalary] = useState(player.salary);
  const [result, setResult] = useState<{ accepted: boolean; counterYears?: number; counterSalary?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const minSalary = Math.round(player.salary * 0.5);
  const maxSalary = Math.round(player.salary * 3);
  const maxYears = Math.min(8, Math.max(1, 42 - player.age));
  const totalValue = years * salary;

  // Acceptance estimate (mirrors the engine formula but is just a UI hint)
  const estimatedProb = (() => {
    let prob = serviceYears < 3 ? 70 : 55;
    if (salary >= player.salary * 1.2) prob += 15;
    if (years > 2) prob += Math.min(20, (years - 2) * 10);
    if (salary < player.salary) prob -= 20;
    if (player.age <= 25) prob -= 10;
    return Math.max(5, Math.min(95, prob));
  })();

  const probColor = estimatedProb >= 70 ? '#4ade80' : estimatedProb >= 40 ? '#fbbf24' : '#ef4444';

  const handleOffer = useCallback(async () => {
    setSubmitting(true);
    try {
      const engine = getEngine();
      const res = await engine.offerExtension(player.playerId, years, salary);
      setResult(res);
      if (res.accepted) onExtended();
    } catch { /* silent */ }
    setSubmitting(false);
  }, [player.playerId, years, salary, onExtended]);

  const handleAcceptCounter = useCallback(async () => {
    if (!result?.counterYears || !result?.counterSalary) return;
    setSubmitting(true);
    try {
      const engine = getEngine();
      const res = await engine.acceptCounterOffer(player.playerId, result.counterYears, result.counterSalary);
      if (res.ok) {
        setResult({ accepted: true });
        onExtended();
      }
    } catch { /* silent */ }
    setSubmitting(false);
  }, [player.playerId, result, onExtended]);

  // Not eligible for extension
  if (serviceYears >= 6) return null;

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">CONTRACT EXTENSION</div>
      <div className="px-4 py-3 space-y-3">
        {!result && (
          <>
            <div className="text-gray-500 text-xs">
              {serviceYears < 3 ? 'Pre-arbitration' : `Arbitration year ${Math.min(serviceYears - 2, 3)}`} — eligible for extension
            </div>

            {/* Years slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">YEARS</span>
                <span className="text-orange-400 font-bold">{years}</span>
              </div>
              <input
                type="range"
                min={1}
                max={maxYears}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-gray-700 text-xs">
                <span>1</span>
                <span>{maxYears}</span>
              </div>
            </div>

            {/* Salary slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">ANNUAL SALARY</span>
                <span className="text-orange-400 font-bold">${(salary / 1_000_000).toFixed(1)}M</span>
              </div>
              <input
                type="range"
                min={minSalary}
                max={maxSalary}
                step={100000}
                value={salary}
                onChange={e => setSalary(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-gray-700 text-xs">
                <span>${(minSalary / 1_000_000).toFixed(1)}M</span>
                <span>${(maxSalary / 1_000_000).toFixed(1)}M</span>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total value</span>
                <span className="text-gray-200 font-bold">${(totalValue / 1_000_000).toFixed(1)}M / {years}yr</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Current salary</span>
                <span className="text-gray-400">${(player.salary / 1_000_000).toFixed(1)}M/yr</span>
              </div>
            </div>

            {/* Acceptance probability */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">ACCEPTANCE PROBABILITY</span>
                <span className="font-bold" style={{ color: probColor }}>{estimatedProb}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${estimatedProb}%`, background: probColor }}
                />
              </div>
            </div>

            <button
              onClick={handleOffer}
              disabled={submitting}
              className="w-full bg-orange-700 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
            >
              {submitting ? 'OFFERING…' : 'OFFER EXTENSION'}
            </button>
          </>
        )}

        {/* Result */}
        {result?.accepted && (
          <div className="text-center py-4">
            <div className="text-green-400 text-2xl mb-1">✓</div>
            <div className="text-green-400 font-bold text-sm">EXTENSION ACCEPTED!</div>
            <div className="text-gray-500 text-xs mt-1">
              {years}yr / ${(salary / 1_000_000).toFixed(1)}M per year
            </div>
          </div>
        )}

        {result && !result.accepted && result.counterYears && result.counterSalary && (
          <div className="space-y-3">
            <div className="text-center py-2">
              <div className="text-red-400 font-bold text-sm mb-1">EXTENSION REJECTED</div>
              <div className="text-gray-500 text-xs">But a counter-offer was received:</div>
            </div>
            <div className="rounded px-3 py-2" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div className="text-yellow-400 font-bold text-xs mb-1">COUNTER-OFFER</div>
              <div className="text-gray-200 text-sm font-bold">
                {result.counterYears}yr / ${(result.counterSalary / 1_000_000).toFixed(1)}M per year
              </div>
              <div className="text-gray-500 text-xs">
                Total: ${(result.counterYears * result.counterSalary / 1_000_000).toFixed(1)}M
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptCounter}
                disabled={submitting}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-bold text-xs py-2 uppercase tracking-widest"
              >
                ACCEPT
              </button>
              <button
                onClick={() => setResult(null)}
                className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-2 uppercase tracking-widest"
              >
                DECLINE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PlayerProfile() {
  const { selectedPlayerId, setActiveTab, setComparePlayerIds } = useUIStore();
  const { gameStarted, userTeamId } = useGameStore();
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
  const isPitcher = player.isPitcher;
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

  // Compute traits client-side using RosterPlayer shape
  const fakeRosterPlayer: RosterPlayer = {
    playerId: player.playerId,
    name: player.name,
    position: player.position,
    age: player.age,
    bats: player.bats,
    throws: player.throws,
    isPitcher,
    overall: player.overall,
    potential: player.potential,
    rosterStatus: player.rosterStatus,
    isOn40Man: true,
    optionYearsRemaining: player.optionYearsRemaining,
    serviceTimeDays: player.serviceTimeDays,
    salary: player.salary,
    contractYearsRemaining: player.contractYearsRemaining,
    stats: {},
  };
  const traits = assignTraits(fakeRosterPlayer);

  const isUserTeam = player.teamId === userTeamId;

  return (
    <div className="p-4 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('roster')}
          className="text-gray-500 hover:text-orange-400 text-xs transition-colors"
        >
          ← BACK TO ROSTER
        </button>
        <button
          onClick={() => setComparePlayerIds([player.playerId, 0])}
          className="text-gray-600 hover:text-orange-400 text-xs transition-colors border border-gray-800 hover:border-orange-700 px-2 py-0.5"
        >
          COMPARE
        </button>
      </div>

      {/* ── Identity header ──────────────────────────────────────────────── */}
      <div className="bloomberg-border">
        <div className="bloomberg-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{player.name}</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              {player.teamAbbr}
            </span>
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

      {/* ── Development Arc + Trade Value ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhaseTimeline age={player.age} overall={player.overall} potential={player.potential} />
        {isUserTeam && <TradeValueMeter value={player.tradeValue} />}
        {!isUserTeam && (
          <div className="bloomberg-border">
            <div className="bloomberg-header">TEAM</div>
            <div className="px-4 py-3">
              <div className="text-orange-400 font-bold">{player.teamAbbr}</div>
              <div className="text-gray-600 text-xs mt-1">
                This player is not on your team
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Traits ─────────────────────────────────────────────────────────── */}
      <TraitBadges traits={traits} />

      {/* ── Contract Extension ────────────────────────────────────────────── */}
      {isUserTeam && (
        <ExtensionPanel
          player={player}
          onExtended={() => {
            // Reload player profile to reflect updated contract
            if (selectedPlayerId) {
              getEngine().getPlayerProfile(selectedPlayerId)
                .then(setData)
                .catch(() => {});
            }
          }}
        />
      )}

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

      {/* ── Career Stats Table ────────────────────────────────────────────── */}
      <CareerStatsTable seasons={data.careerStats} isPitcher={isPitcher} />
    </div>
  );
}
