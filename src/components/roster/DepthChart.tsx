import type { RosterPlayer } from '../../types/league';

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
      <div className="flex flex-col items-center w-[90px]">
        <div className="text-gray-600 text-[10px] font-bold tracking-wider mb-1">{position}</div>
        <div className="border border-gray-800 bg-gray-900/50 rounded px-2 py-1.5 w-full text-center">
          <div className="text-gray-700 text-xs">EMPTY</div>
        </div>
      </div>
    );
  }

  const g = ovrGrade(starter.overall);

  return (
    <div className="flex flex-col items-center w-[90px]">
      <div className="text-gray-600 text-[10px] font-bold tracking-wider mb-1">{position}</div>
      {/* Starter */}
      <div
        className={`border ${g.bg} rounded px-2 py-1.5 w-full text-center ${onClickPlayer ? 'cursor-pointer hover:brightness-125' : ''}`}
        onClick={() => onClickPlayer?.(starter.playerId)}
      >
        <div className="text-gray-200 text-xs font-bold truncate">{starter.name.split(' ').pop()}</div>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span className={`text-xs font-bold tabular-nums ${g.color}`}>{g.grade}</span>
          <span className="text-gray-600 text-[10px]">Age {starter.age}</span>
        </div>
      </div>
      {/* Backup */}
      {backup && (
        <div
          className="mt-0.5 px-1.5 py-0.5 w-full text-center cursor-pointer hover:bg-gray-800/50 rounded"
          onClick={() => onClickPlayer?.(backup.playerId)}
        >
          <div className="text-gray-600 text-[10px] truncate">{backup.name.split(' ').pop()}</div>
          <div className={`text-[10px] tabular-nums ${ovrGrade(backup.overall).color}`}>
            {ovrGrade(backup.overall).grade}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pitching card ────────────────────────────────────────────────────────────
function PitcherCard({ player, role, onClickPlayer }: {
  player: RosterPlayer;
  role: string;
  onClickPlayer?: (id: number) => void;
}) {
  const g = ovrGrade(player.overall);
  return (
    <div
      className={`border ${g.bg} rounded px-3 py-1.5 flex items-center justify-between gap-2 ${onClickPlayer ? 'cursor-pointer hover:brightness-125' : ''}`}
      onClick={() => onClickPlayer?.(player.playerId)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs font-bold tabular-nums w-5 text-right ${g.color}`}>{g.grade}</span>
        <span className="text-gray-200 text-xs font-bold truncate">{player.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-gray-500 text-[10px] tabular-nums">
          {player.isPitcher
            ? `${player.stats.era?.toFixed(2) ?? '—'} ERA`
            : ''}
        </span>
        <span className="text-gray-600 text-[10px] uppercase font-bold">{role}</span>
      </div>
    </div>
  );
}

// ─── Main Depth Chart ─────────────────────────────────────────────────────────
export default function DepthChart({ players, onClickPlayer }: {
  players: RosterPlayer[];
  onClickPlayer?: (id: number) => void;
}) {
  // Group by position, sorted by OVR
  const byPos = (pos: string) =>
    players.filter(p => p.position === pos).sort((a, b) => b.overall - a.overall);

  const pitchers = players.filter(p => p.isPitcher).sort((a, b) => b.overall - a.overall);
  const sps = pitchers.filter(p => p.position === 'SP').slice(0, 5);
  const rps = pitchers.filter(p => p.position === 'RP' || p.position === 'CL');
  const closer = rps.find(p => (p.stats.sv ?? 0) > 0) ?? rps[0];
  const bullpen = rps.filter(p => p !== closer).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Diamond visual */}
      <div className="bloomberg-border bg-gray-900 p-4">
        <div className="text-gray-500 text-xs font-bold tracking-widest mb-4">DEFENSIVE ALIGNMENT</div>

        <div className="relative mx-auto" style={{ maxWidth: 420, minHeight: 300 }}>
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
            {sps.length === 0 ? (
              <div className="text-gray-700 text-xs text-center py-2">No starting pitchers</div>
            ) : sps.map((p, i) => (
              <PitcherCard
                key={p.playerId}
                player={p}
                role={`SP${i + 1}`}
                onClickPlayer={onClickPlayer}
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
