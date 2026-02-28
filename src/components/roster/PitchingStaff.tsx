import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer } from '../../types/league';

function formatERA(era?: number): string {
  if (era == null || !isFinite(era)) return '-.--';
  return era.toFixed(2);
}

function formatIP(outs?: number): string {
  if (outs == null) return '0.0';
  const full = Math.floor(outs / 3);
  const frac = outs % 3;
  return `${full}.${frac}`;
}

function PitcherCard({ player, onClick }: { player: RosterPlayer; onClick: () => void }) {
  const s = player.stats;
  const era = formatERA(s.era);
  const ip = s.outs != null ? formatIP(s.outs) : '—';
  const whip = s.whip != null ? s.whip.toFixed(2) : '—';

  const ovrColor = player.overall >= 70 ? 'text-green-400' :
    player.overall >= 60 ? 'text-blue-400' :
    player.overall >= 50 ? 'text-orange-400' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/30"
      onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-orange-300 font-bold truncate">{player.name}</span>
          {player.contractYearsRemaining <= 1 && (
            <span className="text-red-400 text-[10px] font-bold">EXP</span>
          )}
        </div>
        <div className="text-gray-600 text-[10px]">
          Age {player.age} · ${(player.salary / 1_000_000).toFixed(1)}M
        </div>
      </div>
      <span className={`font-bold tabular-nums ${ovrColor}`}>{player.overall}</span>
      <div className="text-right tabular-nums">
        <div className="text-gray-300 font-bold text-[11px]">{era} ERA</div>
        <div className="text-gray-600 text-[10px]">{s.w ?? 0}-{s.l ?? 0} · {ip} IP</div>
      </div>
      <div className="text-right tabular-nums text-[10px] text-gray-500 w-12">
        <div>{s.ka ?? 0} K</div>
        <div>{whip} WHIP</div>
      </div>
    </div>
  );
}

function StaffSection({ title, titleColor, players, onClickPlayer }: {
  title: string;
  titleColor: string;
  players: RosterPlayer[];
  onClickPlayer: (id: number) => void;
}) {
  if (players.length === 0) return null;

  const avgOvr = players.length > 0
    ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length)
    : 0;
  const avgAge = players.length > 0
    ? (players.reduce((s, p) => s + p.age, 0) / players.length).toFixed(1)
    : '—';

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <span className={titleColor}>{title} ({players.length})</span>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>AVG OVR: <span className="text-gray-300 font-bold">{avgOvr}</span></span>
          <span>AVG AGE: <span className="text-gray-300">{avgAge}</span></span>
        </div>
      </div>
      <div className="max-h-[20rem] overflow-y-auto">
        {players.map((p, i) => (
          <PitcherCard key={p.playerId} player={p} onClick={() => onClickPlayer(p.playerId)} />
        ))}
      </div>
    </div>
  );
}

export default function PitchingStaff() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    getEngine().getRoster(userTeamId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading pitching staff...</div>;
  if (!roster) return null;

  const allPitchers = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa]
    .filter(p => p.isPitcher);

  const starters = allPitchers.filter(p =>
    p.position === 'SP' && ['ACTIVE', 'IL_10', 'IL_60'].includes(p.rosterStatus)
  ).sort((a, b) => b.overall - a.overall);

  const closers = allPitchers.filter(p =>
    p.position === 'CL' && ['ACTIVE', 'IL_10', 'IL_60'].includes(p.rosterStatus)
  ).sort((a, b) => b.overall - a.overall);

  const relievers = allPitchers.filter(p =>
    p.position === 'RP' && ['ACTIVE', 'IL_10', 'IL_60'].includes(p.rosterStatus)
  ).sort((a, b) => b.overall - a.overall);

  const minorPitchers = allPitchers.filter(p =>
    p.rosterStatus.startsWith('MINORS')
  ).sort((a, b) => b.overall - a.overall);

  const ilPitchers = allPitchers.filter(p =>
    p.rosterStatus === 'IL_10' || p.rosterStatus === 'IL_60'
  );

  // Staff stats
  const activePitchers = [...starters, ...closers, ...relievers].filter(p =>
    p.rosterStatus === 'ACTIVE'
  );
  const totalK = activePitchers.reduce((s, p) => s + (p.stats.ka ?? 0), 0);
  const totalW = activePitchers.reduce((s, p) => s + (p.stats.w ?? 0), 0);
  const totalL = activePitchers.reduce((s, p) => s + (p.stats.l ?? 0), 0);
  const totalSV = activePitchers.reduce((s, p) => s + (p.stats.sv ?? 0), 0);
  const totalPayroll = allPitchers
    .filter(p => !p.rosterStatus.startsWith('MINORS'))
    .reduce((s, p) => s + p.salary, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">PITCHING STAFF</div>

      {/* Summary */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ROTATION</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{starters.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BULLPEN</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{relievers.length + closers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STAFF W-L</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">{totalW}-{totalL}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL K</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{totalK}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SAVES</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{totalSV}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PAYROLL</div>
          <div className="text-gray-300 font-bold text-lg tabular-nums">
            ${(totalPayroll / 1_000_000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* IL alert */}
      {ilPitchers.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-xs text-red-300">
          {ilPitchers.length} pitcher{ilPitchers.length > 1 ? 's' : ''} on IL: {ilPitchers.map(p => p.name).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Rotation */}
        <StaffSection title="STARTING ROTATION" titleColor="text-blue-400"
          players={starters} onClickPlayer={goToPlayer} />

        {/* Bullpen */}
        <div className="space-y-4">
          <StaffSection title="CLOSER" titleColor="text-yellow-400"
            players={closers} onClickPlayer={goToPlayer} />
          <StaffSection title="RELIEF CORPS" titleColor="text-orange-400"
            players={relievers} onClickPlayer={goToPlayer} />
        </div>
      </div>

      {/* Minor league arms */}
      {minorPitchers.length > 0 && (
        <StaffSection title="MINOR LEAGUE ARMS" titleColor="text-gray-400"
          players={minorPitchers.slice(0, 15)} onClickPlayer={goToPlayer} />
      )}
    </div>
  );
}
