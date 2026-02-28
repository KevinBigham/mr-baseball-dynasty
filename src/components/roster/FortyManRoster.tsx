import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer, RosterData } from '../../types/league';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    'MLB_ACTIVE': { label: 'MLB', color: 'bg-green-900/40 text-green-400' },
    'MLB_IL_10': { label: '10-IL', color: 'bg-red-900/40 text-red-400' },
    'MLB_IL_60': { label: '60-IL', color: 'bg-red-900/40 text-red-400' },
    'MINORS_AAA': { label: 'AAA', color: 'bg-blue-900/40 text-blue-400' },
    'MINORS_AA': { label: 'AA', color: 'bg-blue-900/40 text-blue-300' },
    'MINORS_APLUS': { label: 'A+', color: 'bg-purple-900/40 text-purple-400' },
    'MINORS_AMINUS': { label: 'A-', color: 'bg-purple-900/40 text-purple-300' },
    'MINORS_ROOKIE': { label: 'RK', color: 'bg-gray-800 text-gray-400' },
    'DFA': { label: 'DFA', color: 'bg-orange-900/40 text-orange-400' },
  };
  const { label, color } = map[status] ?? { label: status.replace('MINORS_', ''), color: 'bg-gray-800 text-gray-500' };
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>{label}</span>;
}

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function OptionsBadge({ options }: { options: number }) {
  if (options <= 0) return <span className="text-red-400 text-[10px]">NONE</span>;
  return <span className="text-green-400 text-[10px] tabular-nums">{options}</span>;
}

export default function FortyManRoster() {
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
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading roster...</div>;
  if (!roster) return null;

  // Combine all and filter 40-man
  const allPlayers = [...roster.active, ...roster.il, ...roster.minors, ...roster.dfa];
  const onFortyMan = allPlayers.filter(p => p.isOn40Man);
  const nonFortyMan = allPlayers.filter(p => !p.isOn40Man);

  // Split 40-man by type
  const mlbPlayers = onFortyMan.filter(p => p.rosterStatus === 'MLB_ACTIVE');
  const ilPlayers = onFortyMan.filter(p => p.rosterStatus === 'MLB_IL_10' || p.rosterStatus === 'MLB_IL_60');
  const minorsOnForty = onFortyMan.filter(p =>
    !['MLB_ACTIVE', 'MLB_IL_10', 'MLB_IL_60', 'DFA'].includes(p.rosterStatus)
  );
  const dfaPlayers = onFortyMan.filter(p => p.rosterStatus === 'DFA');

  const totalPayroll = allPlayers.reduce((s, p) => s + p.salary, 0);
  const fortyManPayroll = onFortyMan.reduce((s, p) => s + p.salary, 0);

  const renderPlayerRow = (p: RosterPlayer, showStatus = true) => (
    <tr key={p.playerId}
      className="text-xs hover:bg-gray-800/50 cursor-pointer"
      onClick={() => goToPlayer(p.playerId)}>
      <td className="px-2 py-1 font-bold text-orange-300 truncate max-w-[10rem]">{p.name}</td>
      <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
      <td className="px-2 py-1 text-center tabular-nums text-gray-500">{p.age}</td>
      <td className="px-2 py-1 text-center"><OvrBadge ovr={p.overall} /></td>
      <td className="px-2 py-1 text-center tabular-nums text-gray-600">{p.potential}</td>
      {showStatus && <td className="px-2 py-1 text-center"><StatusBadge status={p.rosterStatus} /></td>}
      <td className="px-2 py-1 text-right tabular-nums text-gray-400">
        ${(p.salary / 1_000_000).toFixed(1)}M
      </td>
      <td className="px-2 py-1 text-center tabular-nums text-gray-500">{p.contractYearsRemaining}</td>
      <td className="px-2 py-1 text-center"><OptionsBadge options={p.optionYearsRemaining} /></td>
      <td className="px-2 py-1 text-right tabular-nums text-gray-600">
        {Math.floor(p.serviceTimeDays / 172)}.{(p.serviceTimeDays % 172).toString().padStart(3, '0')}
      </td>
    </tr>
  );

  const tableHead = (showStatus = true) => (
    <thead>
      <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
        <th className="px-2 py-1 text-left">PLAYER</th>
        <th className="px-2 py-1">POS</th>
        <th className="px-2 py-1">AGE</th>
        <th className="px-2 py-1">OVR</th>
        <th className="px-2 py-1">POT</th>
        {showStatus && <th className="px-2 py-1">STATUS</th>}
        <th className="px-2 py-1 text-right">SALARY</th>
        <th className="px-2 py-1">YRS</th>
        <th className="px-2 py-1">OPT</th>
        <th className="px-2 py-1 text-right">SERVICE</th>
      </tr>
    </thead>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>40-MAN ROSTER</span>
        <span className="text-gray-500 text-xs">
          {onFortyMan.length}/40 spots used
          <span className={`ml-2 font-bold ${onFortyMan.length >= 38 ? 'text-red-400' : 'text-green-400'}`}>
            {40 - onFortyMan.length} open
          </span>
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">40-MAN</div>
          <div className={`font-bold text-xl tabular-nums ${onFortyMan.length >= 40 ? 'text-red-400' : 'text-orange-400'}`}>
            {onFortyMan.length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">26-MAN (MLB)</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{mlbPlayers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">IL</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{ilPlayers.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MINORS (40-MAN)</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{minorsOnForty.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">40-MAN PAYROLL</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">${(fortyManPayroll / 1_000_000).toFixed(1)}M</div>
        </div>
      </div>

      {/* 40-man roster table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">40-MAN ROSTER ({onFortyMan.length} players)</div>
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full">
            {tableHead()}
            <tbody>
              {/* MLB Active first */}
              {mlbPlayers.length > 0 && (
                <tr><td colSpan={10} className="px-2 py-1 text-green-500 text-[10px] font-bold bg-gray-900/30 border-b border-gray-800">
                  MLB ACTIVE ({mlbPlayers.length})
                </td></tr>
              )}
              {mlbPlayers.sort((a, b) => b.overall - a.overall).map(p => renderPlayerRow(p))}

              {/* IL */}
              {ilPlayers.length > 0 && (
                <tr><td colSpan={10} className="px-2 py-1 text-red-500 text-[10px] font-bold bg-gray-900/30 border-b border-gray-800">
                  INJURED LIST ({ilPlayers.length})
                </td></tr>
              )}
              {ilPlayers.sort((a, b) => b.overall - a.overall).map(p => renderPlayerRow(p))}

              {/* Minors on 40-man */}
              {minorsOnForty.length > 0 && (
                <tr><td colSpan={10} className="px-2 py-1 text-blue-500 text-[10px] font-bold bg-gray-900/30 border-b border-gray-800">
                  MINORS ON 40-MAN ({minorsOnForty.length})
                </td></tr>
              )}
              {minorsOnForty.sort((a, b) => b.overall - a.overall).map(p => renderPlayerRow(p))}

              {/* DFA */}
              {dfaPlayers.length > 0 && (
                <tr><td colSpan={10} className="px-2 py-1 text-orange-500 text-[10px] font-bold bg-gray-900/30 border-b border-gray-800">
                  DESIGNATED FOR ASSIGNMENT ({dfaPlayers.length})
                </td></tr>
              )}
              {dfaPlayers.sort((a, b) => b.overall - a.overall).map(p => renderPlayerRow(p))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-40-man players (minor league depth) */}
      {nonFortyMan.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">MINOR LEAGUE DEPTH (NOT ON 40-MAN) — {nonFortyMan.length} players</div>
          <div className="max-h-[20rem] overflow-y-auto">
            <table className="w-full">
              {tableHead()}
              <tbody>
                {nonFortyMan.sort((a, b) => b.potential - a.potential).map(p => renderPlayerRow(p))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service time notable thresholds */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">SERVICE TIME WATCH</div>
        <div className="p-2 grid grid-cols-3 gap-3">
          <div>
            <div className="text-gray-500 text-[10px] font-bold mb-1">APPROACHING SUPER TWO (2.130+)</div>
            {onFortyMan.filter(p => {
              const years = p.serviceTimeDays / 172;
              return years >= 2.0 && years < 2.76;
            }).sort((a, b) => b.serviceTimeDays - a.serviceTimeDays).slice(0, 5).map(p => (
              <div key={p.playerId} className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-gray-800/50"
                onClick={() => goToPlayer(p.playerId)}>
                <span className="text-orange-300 font-bold">{p.name}</span>
                <span className="text-yellow-400 tabular-nums">
                  {Math.floor(p.serviceTimeDays / 172)}.{(p.serviceTimeDays % 172).toString().padStart(3, '0')}
                </span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-500 text-[10px] font-bold mb-1">APPROACHING FA (6.000+)</div>
            {onFortyMan.filter(p => {
              const years = p.serviceTimeDays / 172;
              return years >= 4.0 && years < 6.0;
            }).sort((a, b) => b.serviceTimeDays - a.serviceTimeDays).slice(0, 5).map(p => (
              <div key={p.playerId} className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-gray-800/50"
                onClick={() => goToPlayer(p.playerId)}>
                <span className="text-orange-300 font-bold">{p.name}</span>
                <span className="text-red-400 tabular-nums">
                  {Math.floor(p.serviceTimeDays / 172)}.{(p.serviceTimeDays % 172).toString().padStart(3, '0')}
                </span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-500 text-[10px] font-bold mb-1">NO OPTIONS REMAINING</div>
            {onFortyMan.filter(p => p.optionYearsRemaining <= 0 && p.rosterStatus === 'MLB_ACTIVE')
              .sort((a, b) => b.overall - a.overall).slice(0, 5).map(p => (
              <div key={p.playerId} className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-gray-800/50"
                onClick={() => goToPlayer(p.playerId)}>
                <span className="text-orange-300 font-bold">{p.name}</span>
                <span className="text-red-400 text-[10px]">DFA/TRADE ONLY</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
