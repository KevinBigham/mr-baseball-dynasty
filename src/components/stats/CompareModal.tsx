/**
 * CompareModal.tsx — Side-by-side player comparison
 *
 * Fetches two player profiles and displays grades, stats, contract info,
 * and traits in a mirror layout with advantage highlighting.
 */

import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { assignTraits, type PlayerTrait } from '../../engine/playerTraits';
import type { PlayerProfileData, RosterPlayer } from '../../types/league';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toScout(ovr: number): number {
  return Math.round(20 + (ovr / 550) * 60);
}

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

function makeRosterPlayer(p: PlayerProfileData['player']): RosterPlayer {
  return {
    playerId: p.playerId,
    name: p.name,
    position: p.position,
    age: p.age,
    bats: p.bats,
    throws: p.throws,
    isPitcher: p.isPitcher,
    overall: p.overall,
    potential: p.potential,
    rosterStatus: p.rosterStatus,
    isOn40Man: true,
    optionYearsRemaining: p.optionYearsRemaining,
    serviceTimeDays: p.serviceTimeDays,
    salary: p.salary,
    contractYearsRemaining: p.contractYearsRemaining,
    stats: {},
  };
}

// ─── Compare row ────────────────────────────────────────────────────────────

type Better = 'left' | 'right' | 'tie';

function CompareRow({
  label,
  leftVal,
  rightVal,
  leftFmt,
  rightFmt,
  better,
}: {
  label: string;
  leftVal: number;
  rightVal: number;
  leftFmt: string;
  rightFmt: string;
  better: Better;
}) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-gray-800/50 text-xs">
      <div className="w-20 text-right tabular-nums font-bold" style={{ color: better === 'left' ? '#4ade80' : '#9ca3af' }}>
        {leftFmt}
      </div>
      {/* Mirror bars */}
      <div className="flex-1 flex items-center gap-0.5">
        <div className="flex-1 flex justify-end">
          <div
            className="h-1.5 rounded-l"
            style={{
              width: `${Math.min(100, (leftVal / Math.max(leftVal, rightVal, 1)) * 100)}%`,
              background: better === 'left' ? '#4ade80' : '#374151',
            }}
          />
        </div>
        <div className="text-gray-600 text-[10px] w-12 text-center shrink-0">{label}</div>
        <div className="flex-1">
          <div
            className="h-1.5 rounded-r"
            style={{
              width: `${Math.min(100, (rightVal / Math.max(leftVal, rightVal, 1)) * 100)}%`,
              background: better === 'right' ? '#4ade80' : '#374151',
            }}
          />
        </div>
      </div>
      <div className="w-20 tabular-nums font-bold" style={{ color: better === 'right' ? '#4ade80' : '#9ca3af' }}>
        {rightFmt}
      </div>
    </div>
  );
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
    >
      {trait.emoji} {trait.label}
    </span>
  );
}

// ─── Player search dropdown ─────────────────────────────────────────────────

function PlayerSearch({
  onSelect,
  excludeId,
}: {
  onSelect: (id: number) => void;
  excludeId?: number;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ playerId: number; name: string; teamAbbr: string; position: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const engine = getEngine();
        const entries = await engine.getLeaderboardFull({
          category: 'hitting',
          sortBy: 'hr',
          limit: 50,
          minPA: 1,
        });
        const pitchers = await engine.getLeaderboardFull({
          category: 'pitching',
          sortBy: 'era',
          limit: 50,
          minIP: 1,
        });
        const all = [...entries, ...pitchers];
        const q = query.toLowerCase();
        const matches = all
          .filter(e => e.name.toLowerCase().includes(q) && e.playerId !== excludeId)
          .slice(0, 8)
          .map(e => ({ playerId: e.playerId, name: e.name, teamAbbr: e.teamAbbr, position: e.position }));
        setResults(matches);
      } catch { /* silent */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, excludeId]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search player name..."
        className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs px-3 py-2 focus:border-orange-500 focus:outline-none"
      />
      {searching && <div className="text-orange-400 text-xs mt-1 animate-pulse">Searching...</div>}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 bg-gray-900 border border-gray-700 shadow-lg max-h-48 overflow-auto">
          {results.map(r => (
            <button
              key={r.playerId}
              onClick={() => { onSelect(r.playerId); setQuery(''); setResults([]); }}
              className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-800 transition-colors"
            >
              <span className="text-orange-400 font-bold">{r.name}</span>
              <span className="text-gray-500 ml-2">{r.teamAbbr} · {r.position}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Player column ──────────────────────────────────────────────────────────

function PlayerColumn({ data, traits }: { data: PlayerProfileData; traits: PlayerTrait[] }) {
  const { player } = data;
  const ovrScout = toScout(player.overall);
  const potScout = toScout(player.potential);

  return (
    <div className="text-center space-y-2">
      <div className="text-orange-400 font-bold text-sm">{player.name}</div>
      <div className="text-gray-500 text-xs">
        {player.position} · Age {player.age} · {player.teamAbbr}
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-orange-400 font-black text-xl tabular-nums">{ovrScout}</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 font-bold text-lg tabular-nums">{potScout}</span>
      </div>
      <div className="text-gray-600 text-xs">
        {formatSalary(player.salary)}/yr · {player.contractYearsRemaining}yr
      </div>
      {traits.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center">
          {traits.map(t => <TraitChip key={t.id} trait={t} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main modal ─────────────────────────────────────────────────────────────

export default function CompareModal() {
  const { comparePlayerIds, setComparePlayerIds } = useUIStore();
  const [left, setLeft] = useState<PlayerProfileData | null>(null);
  const [right, setRight] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [leftId, setLeftId] = useState<number | null>(comparePlayerIds?.[0] ?? null);
  const [rightId, setRightId] = useState<number | null>(comparePlayerIds?.[1] ?? null);

  // Sync from store
  useEffect(() => {
    if (comparePlayerIds) {
      setLeftId(comparePlayerIds[0]);
      setRightId(comparePlayerIds[1]);
    }
  }, [comparePlayerIds]);

  // Fetch profiles when ids change
  useEffect(() => {
    if (!leftId && !rightId) return;
    setLoading(true);
    const promises: Promise<void>[] = [];
    if (leftId) {
      promises.push(getEngine().getPlayerProfile(leftId).then(setLeft));
    }
    if (rightId) {
      promises.push(getEngine().getPlayerProfile(rightId).then(setRight));
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [leftId, rightId]);

  if (!comparePlayerIds) return null;

  const onClose = () => setComparePlayerIds(null);

  const leftTraits = left ? assignTraits(makeRosterPlayer(left.player)) : [];
  const rightTraits = right ? assignTraits(makeRosterPlayer(right.player)) : [];

  // Grade comparisons
  const gradeKeys = left && right
    ? [...new Set([...Object.keys(left.player.grades), ...Object.keys(right.player.grades)])]
    : [];

  // Stat comparisons — pick relevant keys based on player type
  type StatRow = { label: string; key: string; format: (v: number) => string; higherBetter: boolean };

  const hitterStats: StatRow[] = [
    { label: 'AVG', key: 'avg', format: v => v.toFixed(3), higherBetter: true },
    { label: 'OBP', key: 'obp', format: v => v.toFixed(3), higherBetter: true },
    { label: 'HR', key: 'hr', format: v => String(Math.round(v)), higherBetter: true },
    { label: 'RBI', key: 'rbi', format: v => String(Math.round(v)), higherBetter: true },
    { label: 'SB', key: 'sb', format: v => String(Math.round(v)), higherBetter: true },
    { label: 'PA', key: 'pa', format: v => String(Math.round(v)), higherBetter: true },
  ];

  const pitcherStats: StatRow[] = [
    { label: 'ERA', key: 'era', format: v => v.toFixed(2), higherBetter: false },
    { label: 'WHIP', key: 'whip', format: v => v.toFixed(2), higherBetter: false },
    { label: 'W', key: 'w', format: v => String(Math.round(v)), higherBetter: true },
    { label: 'K/9', key: 'k9', format: v => v.toFixed(1), higherBetter: true },
    { label: 'IP', key: 'ip', format: v => v.toFixed(1), higherBetter: true },
    { label: 'SV', key: 'sv', format: v => String(Math.round(v)), higherBetter: true },
  ];

  // Determine which stat rows to show
  const bothPitchers = left?.player.isPitcher && right?.player.isPitcher;
  const bothHitters = left && right && !left.player.isPitcher && !right.player.isPitcher;
  const statRows = bothPitchers ? pitcherStats : bothHitters ? hitterStats : [];

  // Count advantages
  let leftAdvantages = 0;
  let rightAdvantages = 0;

  function getBetter(lv: number, rv: number, higherBetter = true): Better {
    if (Math.abs(lv - rv) < 0.001) return 'tie';
    if (higherBetter) return lv > rv ? 'left' : 'right';
    return lv < rv ? 'left' : 'right';
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bloomberg-border bg-gray-900 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="text-orange-500 font-bold text-xs tracking-widest">PLAYER COMPARISON</div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
          {loading && (
            <div className="text-orange-400 text-xs animate-pulse text-center py-8">Loading...</div>
          )}

          {/* Player selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-600 text-xs mb-1">PLAYER 1</div>
              <PlayerSearch onSelect={id => setLeftId(id)} excludeId={rightId ?? undefined} />
            </div>
            <div>
              <div className="text-gray-600 text-xs mb-1">PLAYER 2</div>
              <PlayerSearch onSelect={id => setRightId(id)} excludeId={leftId ?? undefined} />
            </div>
          </div>

          {/* Player headers */}
          {(left || right) && (
            <div className="grid grid-cols-2 gap-4">
              <div>{left && <PlayerColumn data={left} traits={leftTraits} />}</div>
              <div>{right && <PlayerColumn data={right} traits={rightTraits} />}</div>
            </div>
          )}

          {/* Grade comparison */}
          {left && right && gradeKeys.length > 0 && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">SCOUTING GRADES</div>
              <div className="px-4 py-2">
                {gradeKeys.map(key => {
                  const lv = left.player.grades[key] ?? 0;
                  const rv = right.player.grades[key] ?? 0;
                  const better = getBetter(lv, rv);
                  if (better === 'left') leftAdvantages++;
                  else if (better === 'right') rightAdvantages++;
                  return (
                    <CompareRow
                      key={key}
                      label={key.toUpperCase()}
                      leftVal={lv}
                      rightVal={rv}
                      leftFmt={String(lv)}
                      rightFmt={String(rv)}
                      better={better}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Stat comparison */}
          {left && right && statRows.length > 0 && left.seasonStats && right.seasonStats && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">SEASON STATS</div>
              <div className="px-4 py-2">
                {statRows.map(row => {
                  const lv = (left.seasonStats as Record<string, number>)?.[row.key] ?? 0;
                  const rv = (right.seasonStats as Record<string, number>)?.[row.key] ?? 0;
                  const better = getBetter(lv, rv, row.higherBetter);
                  if (better === 'left') leftAdvantages++;
                  else if (better === 'right') rightAdvantages++;
                  return (
                    <CompareRow
                      key={row.key}
                      label={row.label}
                      leftVal={lv}
                      rightVal={rv}
                      leftFmt={row.format(lv)}
                      rightFmt={row.format(rv)}
                      better={better}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Overall comparison (OVR, POT, trade value, age) */}
          {left && right && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">OVERALL</div>
              <div className="px-4 py-2">
                {[
                  { label: 'OVR', lv: toScout(left.player.overall), rv: toScout(right.player.overall), hb: true },
                  { label: 'POT', lv: toScout(left.player.potential), rv: toScout(right.player.potential), hb: true },
                  { label: 'TRADE', lv: left.player.tradeValue, rv: right.player.tradeValue, hb: true },
                  { label: 'AGE', lv: left.player.age, rv: right.player.age, hb: false },
                ].map(row => {
                  const better = getBetter(row.lv, row.rv, row.hb);
                  return (
                    <CompareRow
                      key={row.label}
                      label={row.label}
                      leftVal={row.lv}
                      rightVal={row.rv}
                      leftFmt={String(row.lv)}
                      rightFmt={String(row.rv)}
                      better={better}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Advantage summary */}
          {left && right && (leftAdvantages > 0 || rightAdvantages > 0) && (
            <div className="flex items-center justify-center gap-6 text-xs py-2">
              <div className="text-center">
                <div className="font-black text-lg" style={{ color: leftAdvantages >= rightAdvantages ? '#4ade80' : '#6b7280' }}>
                  {leftAdvantages}
                </div>
                <div className="text-gray-600">advantages</div>
              </div>
              <div className="text-gray-700">vs</div>
              <div className="text-center">
                <div className="font-black text-lg" style={{ color: rightAdvantages >= leftAdvantages ? '#4ade80' : '#6b7280' }}>
                  {rightAdvantages}
                </div>
                <div className="text-gray-600">advantages</div>
              </div>
            </div>
          )}

          {/* Mixed type warning */}
          {left && right && !bothPitchers && !bothHitters && (
            <div className="text-gray-600 text-xs text-center py-2">
              Comparing a pitcher and a position player — stat comparison not applicable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
