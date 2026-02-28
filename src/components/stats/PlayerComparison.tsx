import { useState, useMemo } from 'react';
import { toScoutingScale } from '../../engine/player/attributes';
import type { Player } from '../../types/player';

// ─── Stat bar for visual comparison ──────────────────────────────────────────

function StatBar({ label, val1, val2, max = 80, min = 20 }: {
  label: string;
  val1: number;
  val2: number;
  max?: number;
  min?: number;
}) {
  const range = max - min;
  const pct1 = Math.max(0, Math.min(100, ((val1 - min) / range) * 100));
  const pct2 = Math.max(0, Math.min(100, ((val2 - min) / range) * 100));
  const better1 = val1 > val2;
  const better2 = val2 > val1;

  return (
    <div className="grid grid-cols-[1fr_80px_1fr] items-center gap-2 py-1">
      {/* Player 1 bar (right-aligned) */}
      <div className="flex items-center gap-2 justify-end">
        <span className={`text-xs font-mono ${better1 ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
          {val1}
        </span>
        <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full rounded float-right ${better1 ? 'bg-green-500' : 'bg-gray-600'}`}
            style={{ width: `${pct1}%` }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="text-center text-xs text-gray-500 font-bold uppercase">{label}</div>

      {/* Player 2 bar (left-aligned) */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full rounded ${better2 ? 'bg-green-500' : 'bg-gray-600'}`}
            style={{ width: `${pct2}%` }}
          />
        </div>
        <span className={`text-xs font-mono ${better2 ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
          {val2}
        </span>
      </div>
    </div>
  );
}

// ─── Player card header ──────────────────────────────────────────────────────

function PlayerHeader({ player }: { player: Player }) {
  return (
    <div className="text-center py-2">
      <div className="text-sm font-bold text-gray-200">{player.name}</div>
      <div className="text-xs text-gray-500">
        {player.position} | Age {player.age} | {player.bats}/{player.throws}
      </div>
      <div className="text-xs mt-1">
        <span className="text-orange-400 font-bold">{toScoutingScale(player.overall)}</span>
        <span className="text-gray-600"> OVR</span>
        <span className="text-gray-600 mx-2">|</span>
        <span className="text-cyan-400 font-bold">{toScoutingScale(player.potential)}</span>
        <span className="text-gray-600"> POT</span>
      </div>
    </div>
  );
}

// ─── Main comparison component ───────────────────────────────────────────────

interface PlayerComparisonProps {
  allPlayers: Player[];
}

export default function PlayerComparison({ allPlayers }: PlayerComparisonProps) {
  const [player1Id, setPlayer1Id] = useState<number | null>(null);
  const [player2Id, setPlayer2Id] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectingSlot, setSelectingSlot] = useState<1 | 2 | null>(null);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return allPlayers.slice(0, 50);
    const term = searchTerm.toLowerCase();
    return allPlayers
      .filter(p => p.name.toLowerCase().includes(term) || p.position.toLowerCase().includes(term))
      .slice(0, 30);
  }, [allPlayers, searchTerm]);

  const player1 = useMemo(() => allPlayers.find(p => p.playerId === player1Id), [allPlayers, player1Id]);
  const player2 = useMemo(() => allPlayers.find(p => p.playerId === player2Id), [allPlayers, player2Id]);

  const selectPlayer = (id: number) => {
    if (selectingSlot === 1) setPlayer1Id(id);
    else if (selectingSlot === 2) setPlayer2Id(id);
    setSelectingSlot(null);
    setSearchTerm('');
  };

  return (
    <div className="p-4">
      <h2 className="text-sm font-bold text-orange-400 tracking-wider mb-4">PLAYER COMPARISON</h2>

      {/* ── Player selection slots ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          className={`p-3 rounded border text-xs text-center ${
            selectingSlot === 1
              ? 'border-orange-500 bg-orange-900/30'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}
          onClick={() => setSelectingSlot(selectingSlot === 1 ? null : 1)}
        >
          {player1 ? (
            <>
              <div className="font-bold text-gray-200">{player1.name}</div>
              <div className="text-gray-500">{player1.position} | OVR {toScoutingScale(player1.overall)}</div>
            </>
          ) : (
            <span className="text-gray-500">Select Player 1</span>
          )}
        </button>
        <button
          className={`p-3 rounded border text-xs text-center ${
            selectingSlot === 2
              ? 'border-orange-500 bg-orange-900/30'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}
          onClick={() => setSelectingSlot(selectingSlot === 2 ? null : 2)}
        >
          {player2 ? (
            <>
              <div className="font-bold text-gray-200">{player2.name}</div>
              <div className="text-gray-500">{player2.position} | OVR {toScoutingScale(player2.overall)}</div>
            </>
          ) : (
            <span className="text-gray-500">Select Player 2</span>
          )}
        </button>
      </div>

      {/* ── Player search dropdown ────────────────────────────────── */}
      {selectingSlot !== null && (
        <div className="mb-4 border border-gray-700 rounded bg-gray-900 p-2">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full bg-gray-800 text-gray-200 text-xs px-3 py-2 rounded border border-gray-700 focus:border-orange-500 outline-none mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredPlayers.map(p => (
              <button
                key={p.playerId}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded text-xs hover:bg-gray-800 text-left"
                onClick={() => selectPlayer(p.playerId)}
              >
                <span className="text-orange-400 font-bold w-6">{toScoutingScale(p.overall)}</span>
                <span className="text-gray-200 flex-1 truncate">{p.name}</span>
                <span className="text-gray-500">{p.position}</span>
                <span className="text-gray-600">Age {p.age}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Comparison display ─────────────────────────────────────── */}
      {player1 && player2 && (
        <div className="border border-gray-800 rounded bg-gray-900/50">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_80px_1fr] border-b border-gray-800">
            <PlayerHeader player={player1} />
            <div className="flex items-center justify-center text-gray-600 text-sm font-bold">VS</div>
            <PlayerHeader player={player2} />
          </div>

          {/* Attribute comparison */}
          <div className="p-3">
            {/* Both hitters */}
            {player1.hitterAttributes && player2.hitterAttributes && (
              <>
                <div className="text-xs text-gray-600 font-bold uppercase mb-2 text-center">Hitting</div>
                <StatBar label="CON" val1={toScoutingScale(player1.hitterAttributes.contact)} val2={toScoutingScale(player2.hitterAttributes.contact)} />
                <StatBar label="POW" val1={toScoutingScale(player1.hitterAttributes.power)} val2={toScoutingScale(player2.hitterAttributes.power)} />
                <StatBar label="EYE" val1={toScoutingScale(player1.hitterAttributes.eye)} val2={toScoutingScale(player2.hitterAttributes.eye)} />
                <StatBar label="SPD" val1={toScoutingScale(player1.hitterAttributes.speed)} val2={toScoutingScale(player2.hitterAttributes.speed)} />
                <StatBar label="FLD" val1={toScoutingScale(player1.hitterAttributes.fielding)} val2={toScoutingScale(player2.hitterAttributes.fielding)} />
                <StatBar label="ARM" val1={toScoutingScale(player1.hitterAttributes.armStrength)} val2={toScoutingScale(player2.hitterAttributes.armStrength)} />
                <StatBar label="DUR" val1={toScoutingScale(player1.hitterAttributes.durability)} val2={toScoutingScale(player2.hitterAttributes.durability)} />
              </>
            )}

            {/* Both pitchers */}
            {player1.pitcherAttributes && player2.pitcherAttributes && (
              <>
                <div className="text-xs text-gray-600 font-bold uppercase mb-2 text-center">Pitching</div>
                <StatBar label="STF" val1={toScoutingScale(player1.pitcherAttributes.stuff)} val2={toScoutingScale(player2.pitcherAttributes.stuff)} />
                <StatBar label="MOV" val1={toScoutingScale(player1.pitcherAttributes.movement)} val2={toScoutingScale(player2.pitcherAttributes.movement)} />
                <StatBar label="CMD" val1={toScoutingScale(player1.pitcherAttributes.command)} val2={toScoutingScale(player2.pitcherAttributes.command)} />
                <StatBar label="STA" val1={toScoutingScale(player1.pitcherAttributes.stamina)} val2={toScoutingScale(player2.pitcherAttributes.stamina)} />
                <StatBar label="DUR" val1={toScoutingScale(player1.pitcherAttributes.durability)} val2={toScoutingScale(player2.pitcherAttributes.durability)} />
                <StatBar label="HLD" val1={toScoutingScale(player1.pitcherAttributes.holdRunners)} val2={toScoutingScale(player2.pitcherAttributes.holdRunners)} />
              </>
            )}

            {/* Mixed: one hitter, one pitcher */}
            {((player1.hitterAttributes && player2.pitcherAttributes) || (player1.pitcherAttributes && player2.hitterAttributes)) && (
              <div className="text-center text-xs text-gray-500 py-4">
                Comparing a hitter and pitcher — attribute bars show overall ratings only.
                <div className="mt-2">
                  <StatBar label="OVR" val1={toScoutingScale(player1.overall)} val2={toScoutingScale(player2.overall)} />
                  <StatBar label="POT" val1={toScoutingScale(player1.potential)} val2={toScoutingScale(player2.potential)} />
                </div>
              </div>
            )}

            {/* Contract info */}
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-600 font-bold uppercase mb-2 text-center">Contract</div>
              <div className="grid grid-cols-[1fr_80px_1fr] text-xs">
                <div className="text-right text-gray-300">
                  ${(player1.rosterData.salary / 1_000_000).toFixed(1)}M
                  <span className="text-gray-600"> / {player1.rosterData.contractYearsRemaining}yr</span>
                </div>
                <div className="text-center text-gray-600">SAL</div>
                <div className="text-left text-gray-300">
                  ${(player2.rosterData.salary / 1_000_000).toFixed(1)}M
                  <span className="text-gray-600"> / {player2.rosterData.contractYearsRemaining}yr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
