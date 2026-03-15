import { useState, useEffect } from 'react';
import type { RosterPlayer } from '../../types/league';
import { getEngine } from '../../engine/engineClient';
import AgingBadge from '../shared/AgingBadge';

// ─── OVR grade helper ─────────────────────────────────────────────────────────
function ovrGrade(ovr: number): { grade: string; color: string; bg: string } {
  const g = Math.round(20 + (ovr / 550) * 60);
  if (g >= 70) return { grade: String(g), color: 'text-green-400', bg: 'bg-green-900/30 border-green-800' };
  if (g >= 60) return { grade: String(g), color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' };
  if (g >= 50) return { grade: String(g), color: 'text-gray-300', bg: 'bg-gray-800/50 border-gray-700' };
  if (g >= 40) return { grade: String(g), color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800' };
  return { grade: String(g), color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' };
}

// ─── Position slot on the diamond ─────────────────────────────────────────────
function PositionSlot({ position, players, onClickPlayer }: {
  position: string;
  players: RosterPlayer[];
  onClickPlayer?: (id: number) => void;
}) {
  const starter = players[0];
  const backup = players[1];

  if (!starter) {
    return (
      <div className="flex flex-col items-center w-[60px] sm:w-[90px]">
        <div className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">{position}</div>
        <div className="border border-gray-800 bg-gray-900/50 rounded px-2 py-1.5 w-full text-center">
          <div className="text-gray-700 text-xs">EMPTY</div>
        </div>
      </div>
    );
  }

  const g = ovrGrade(starter.overall);

  return (
    <div className="flex flex-col items-center w-[60px] sm:w-[90px]">
      <div className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">{position}</div>
      {/* Starter */}
      <div
        className={`border ${g.bg} rounded px-2 py-1.5 w-full text-center ${onClickPlayer ? 'cursor-pointer hover:brightness-125' : ''}`}
        onClick={() => onClickPlayer?.(starter.playerId)}
      >
        <div className="text-gray-200 text-xs font-bold truncate">{starter.name.split(' ').pop()}</div>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span className={`text-xs font-bold tabular-nums ${g.color}`}>{g.grade}</span>
          <span className="text-gray-500 text-[10px]">Age {starter.age}</span>
          <AgingBadge age={starter.age} position={starter.position} compact />
        </div>
      </div>
      {/* Backup */}
      {backup && (
        <div
          className="mt-0.5 px-1.5 py-0.5 w-full text-center cursor-pointer hover:bg-gray-800/50 rounded"
          onClick={() => onClickPlayer?.(backup.playerId)}
        >
          <div className="text-gray-500 text-[10px] truncate">{backup.name.split(' ').pop()}</div>
          <div className={`text-[10px] tabular-nums ${ovrGrade(backup.overall).color}`}>
            {ovrGrade(backup.overall).grade}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pitching card ────────────────────────────────────────────────────────────
function PitcherCard({ player, role, onClickPlayer, selected, onSelect }: {
  player: RosterPlayer;
  role: string;
  onClickPlayer?: (id: number) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const g = ovrGrade(player.overall);
  return (
    <div
      className={[
        `border ${g.bg} rounded px-3 py-1.5 flex items-center justify-between gap-2`,
        onClickPlayer || onSelect ? 'cursor-pointer hover:brightness-125' : '',
        selected ? 'ring-2 ring-orange-500' : '',
      ].join(' ')}
      onClick={() => onSelect ? onSelect() : onClickPlayer?.(player.playerId)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs font-bold tabular-nums w-5 text-right ${g.color}`}>{g.grade}</span>
        <span className="text-gray-200 text-xs font-bold truncate">{player.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-gray-500 text-[10px] tabular-nums">
          {player.isPitcher
            ? `${typeof player.stats.era === 'number' ? player.stats.era.toFixed(2) : (player.stats.era ?? '—')} ERA`
            : ''}
        </span>
        <span className="text-gray-500 text-[10px] uppercase font-bold">{role}</span>
      </div>
    </div>
  );
}

// ─── Lineup editor row ───────────────────────────────────────────────────────
function LineupRow({ player, slot, selected, onSelect }: {
  player: RosterPlayer;
  slot: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const g = ovrGrade(player.overall);
  const avg = typeof player.stats.avg === 'number' ? player.stats.avg.toFixed(3).replace('0.', '.') : (player.stats.avg ?? '—');
  return (
    <div
      className={[
        'flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-800/40 transition-colors',
        selected ? 'ring-2 ring-orange-500 bg-orange-950/20' : '',
      ].join(' ')}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <span className="text-orange-500 font-bold text-xs tabular-nums w-4 text-right">{slot}</span>
        <span className={`text-xs font-bold ${g.color}`}>{player.name}</span>
        <span className="text-gray-500 text-[10px]">{player.position}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] tabular-nums">
        <span className={`font-bold ${g.color}`}>{g.grade}</span>
        <span className="text-gray-500">{avg}</span>
        <span className="text-gray-500">{player.stats.hr ?? 0} HR</span>
      </div>
    </div>
  );
}

// ─── Main Depth Chart ─────────────────────────────────────────────────────────
export default function DepthChart({ players, onClickPlayer, editable }: {
  players: RosterPlayer[];
  onClickPlayer?: (id: number) => void;
  editable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [lineupIds, setLineupIds] = useState<number[]>([]);
  const [rotationIds, setRotationIds] = useState<number[]>([]);
  const [selectedLineupIdx, setSelectedLineupIdx] = useState<number | null>(null);
  const [selectedRotationIdx, setSelectedRotationIdx] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Load current lineup/rotation order from engine
  useEffect(() => {
    if (!editable) return;
    (async () => {
      const tid = await getEngine().getUserTeamId();
      const [lineup, rotation] = await Promise.all([
        getEngine().getLineupOrder(tid),
        getEngine().getRotationOrder(tid),
      ]);
      if (lineup.length > 0) setLineupIds(lineup);
      if (rotation.length > 0) setRotationIds(rotation);
    });
  }, [editable]);

  // Auto-populate lineup from active position players sorted by OVR
  const activePlayers = players.filter(p => p.rosterStatus === 'MLB_ACTIVE');
  const positionPlayers = activePlayers.filter(p => !p.isPitcher);
  const starters = positionPlayers.sort((a, b) => b.overall - a.overall);

  // Build the lineup display
  const effectiveLineup: RosterPlayer[] = [];
  if (lineupIds.length === 9) {
    for (const id of lineupIds) {
      const p = players.find(pl => pl.playerId === id);
      if (p) effectiveLineup.push(p);
    }
  }
  // Fall back to top 9 by OVR
  if (effectiveLineup.length < 9) {
    effectiveLineup.length = 0;
    effectiveLineup.push(...starters.slice(0, 9));
  }

  // Build the rotation display
  const pitchers = players.filter(p => p.isPitcher && p.rosterStatus === 'MLB_ACTIVE').sort((a, b) => b.overall - a.overall);
  const sps = pitchers.filter(p => p.position === 'SP');
  const effectiveRotation: RosterPlayer[] = [];
  if (rotationIds.length > 0) {
    for (const id of rotationIds) {
      const p = players.find(pl => pl.playerId === id);
      if (p) effectiveRotation.push(p);
    }
  }
  if (effectiveRotation.length === 0) {
    effectiveRotation.push(...sps.slice(0, 5));
  }

  const rps = pitchers.filter(p => p.position === 'RP' || p.position === 'CL');
  const closer = rps.find(p => (p.stats.sv ?? 0) > 0) ?? rps[0];
  const bullpen = rps.filter(p => p !== closer).slice(0, 5);

  // Group by position for diamond display
  const byPos = (pos: string) =>
    players.filter(p => p.position === pos).sort((a, b) => b.overall - a.overall);

  // Swap handler for lineup
  const handleLineupClick = (idx: number) => {
    if (!editing) return;
    if (selectedLineupIdx === null) {
      setSelectedLineupIdx(idx);
    } else {
      // Swap
      const newIds = [...(lineupIds.length === 9 ? lineupIds : effectiveLineup.map(p => p.playerId))];
      const temp = newIds[selectedLineupIdx];
      newIds[selectedLineupIdx] = newIds[idx];
      newIds[idx] = temp;
      setLineupIds(newIds);
      setSelectedLineupIdx(null);
    }
  };

  // Swap handler for rotation
  const handleRotationClick = (idx: number) => {
    if (!editing) return;
    if (selectedRotationIdx === null) {
      setSelectedRotationIdx(idx);
    } else {
      const newIds = [...(rotationIds.length > 0 ? rotationIds : effectiveRotation.map(p => p.playerId))];
      const temp = newIds[selectedRotationIdx];
      newIds[selectedRotationIdx] = newIds[idx];
      newIds[idx] = temp;
      setRotationIds(newIds);
      setSelectedRotationIdx(null);
    }
  };

  const handleSave = async () => {
    const finalLineup = lineupIds.length === 9 ? lineupIds : effectiveLineup.map(p => p.playerId);
    const finalRotation = rotationIds.length > 0 ? rotationIds : effectiveRotation.map(p => p.playerId);

    const tid = await getEngine().getUserTeamId();
    const [lineupRes, rotationRes] = await Promise.all([
      getEngine().setLineupOrder(tid, finalLineup),
      getEngine().setRotationOrder(tid, finalRotation),
    ]);

    if (!lineupRes.ok) {
      setSaveMsg('Failed to save lineup.');
      return;
    }
    if (!rotationRes.ok) {
      setSaveMsg('Failed to save rotation.');
      return;
    }

    setLineupIds(finalLineup);
    setRotationIds(finalRotation);
    setSaveMsg('Lineup & rotation saved!');
    setEditing(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Edit controls */}
      {editable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (editing) {
                  // Cancel edits
                  setSelectedLineupIdx(null);
                  setSelectedRotationIdx(null);
                }
                setEditing(!editing);
              }}
              className={[
                'text-xs px-4 py-1.5 border font-bold uppercase tracking-wider transition-colors min-h-[44px]',
                editing
                  ? 'border-red-600 text-red-400 hover:bg-red-950/30'
                  : 'border-orange-600 text-orange-400 hover:bg-orange-950/30',
              ].join(' ')}
            >
              {editing ? 'CANCEL' : 'EDIT LINEUP'}
            </button>
            {editing && (
              <button
                onClick={handleSave}
                className="text-xs px-4 py-1.5 border border-green-600 text-green-400 hover:bg-green-950/30 font-bold uppercase tracking-wider transition-colors min-h-[44px]"
              >
                SAVE
              </button>
            )}
          </div>
          {saveMsg && (
            <span className={`text-xs ${saveMsg.includes('saved') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </span>
          )}
          {editing && (
            <span className="text-gray-500 text-xs">Click two players to swap their order</span>
          )}
        </div>
      )}

      {/* Batting Order (shown when editing or lineup exists) */}
      {(editing || lineupIds.length === 9) && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header text-xs">BATTING ORDER</div>
          <div className="divide-y divide-gray-800/50">
            {effectiveLineup.map((p, i) => (
              <LineupRow
                key={p.playerId}
                player={p}
                slot={i + 1}
                selected={editing && selectedLineupIdx === i}
                onSelect={() => editing ? handleLineupClick(i) : onClickPlayer?.(p.playerId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Diamond visual */}
      <div className="bloomberg-border bg-gray-900 p-4">
        <div className="text-gray-500 text-xs font-bold tracking-widest mb-4">DEFENSIVE ALIGNMENT</div>

        <div className="relative mx-auto w-full max-w-[420px]" style={{ minHeight: 300 }}>
          {/* Outfield row */}
          <div className="flex justify-around mb-6">
            <PositionSlot position="LF" players={byPos('LF')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="CF" players={byPos('CF')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="RF" players={byPos('RF')} onClickPlayer={onClickPlayer} />
          </div>

          {/* Infield row */}
          <div className="flex justify-around mb-6">
            <PositionSlot position="3B" players={byPos('3B')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="SS" players={byPos('SS')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="2B" players={byPos('2B')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="1B" players={byPos('1B')} onClickPlayer={onClickPlayer} />
          </div>

          {/* Battery row */}
          <div className="flex justify-center gap-12">
            <PositionSlot position="SP" players={byPos('SP')} onClickPlayer={onClickPlayer} />
            <PositionSlot position="C" players={byPos('C')} onClickPlayer={onClickPlayer} />
          </div>

          {/* DH below */}
          <div className="flex justify-center mt-4">
            <PositionSlot position="DH" players={byPos('DH')} onClickPlayer={onClickPlayer} />
          </div>
        </div>
      </div>

      {/* Rotation + Bullpen */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rotation */}
        <div className="bloomberg-border bg-gray-900 p-4">
          <div className="text-gray-500 text-xs font-bold tracking-widest mb-3">ROTATION</div>
          <div className="space-y-1.5">
            {effectiveRotation.length === 0 ? (
              <div className="text-gray-700 text-xs text-center py-2">No starting pitchers</div>
            ) : effectiveRotation.map((p, i) => (
              <PitcherCard
                key={p.playerId}
                player={p}
                role={`SP${i + 1}`}
                onClickPlayer={editing ? undefined : onClickPlayer}
                selected={editing && selectedRotationIdx === i}
                onSelect={editing ? () => handleRotationClick(i) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Bullpen */}
        <div className="bloomberg-border bg-gray-900 p-4">
          <div className="text-gray-500 text-xs font-bold tracking-widest mb-3">BULLPEN</div>
          <div className="space-y-1.5">
            {closer && (
              <PitcherCard
                player={closer}
                role="CL"
                onClickPlayer={onClickPlayer}
              />
            )}
            {bullpen.map(p => (
              <PitcherCard
                key={p.playerId}
                player={p}
                role={p.position === 'CL' ? 'SU' : 'MR'}
                onClickPlayer={onClickPlayer}
              />
            ))}
            {!closer && bullpen.length === 0 && (
              <div className="text-gray-700 text-xs text-center py-2">No relievers</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
