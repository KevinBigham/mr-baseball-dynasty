import React, { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import type { PlayerProfileData } from '../../types/league';

function GradeBox({ label, value }: { label: string; value: number }) {
  const cls =
    value >= 70 ? 'grade-80' :
    value >= 60 ? 'grade-70' :
    value >= 50 ? 'grade-60' :
    value >= 40 ? 'grade-50' :
    value >= 30 ? 'grade-40' :
    'grade-30';

  return (
    <div className="flex flex-col items-center bloomberg-border px-3 py-2 bg-gray-900">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function statRow(label: string, value: number | undefined, decimals = 0): React.ReactNode {
  if (value === undefined || value === null) return null;
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);
  return (
    <tr key={label} className="bloomberg-row text-xs">
      <td className="px-2 py-1 text-gray-500">{label}</td>
      <td className="text-right px-2 py-1 tabular-nums font-bold text-gray-200">{display}</td>
    </tr>
  );
}

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
  if (!selectedPlayerId) return <div className="p-4 text-gray-500 text-xs">Select a player from the roster or leaderboard.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading player data…</div>;
  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (!data) return null;

  const { player, seasonStats } = data;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

  const serviceYears = Math.floor(player.serviceTimeDays / 172);
  const serviceRem   = player.serviceTimeDays % 172;

  return (
    <div className="p-4 max-w-3xl">
      <button
        onClick={() => setActiveTab('roster')}
        className="text-gray-500 hover:text-orange-400 text-xs mb-4 transition-colors"
      >
        ← BACK TO ROSTER
      </button>

      {/* Header */}
      <div className="bloomberg-border mb-4">
        <div className="bloomberg-header flex justify-between items-center">
          <span>{player.name}</span>
          <span className="text-gray-500 font-normal">
            {player.position} · AGE {player.age} · {player.bats}/{player.throws}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800">
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">STATUS</div>
            <div className="text-orange-400 font-bold">{player.rosterStatus.replace(/_/g, ' ')}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">CONTRACT</div>
            <div className="text-gray-200 font-bold">
              {player.contractYearsRemaining}Y / ${(player.salary / 1_000_000).toFixed(1)}M
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">SERVICE TIME</div>
            <div className="text-gray-200 font-bold">{serviceYears}Y {serviceRem}D</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">OVR / POT</div>
            <div className="text-orange-400 font-bold">{player.overall} / {player.potential}</div>
          </div>
        </div>
      </div>

      {/* Scouting grades */}
      <div className="bloomberg-border mb-4">
        <div className="bloomberg-header">SCOUTING GRADES (20–80)</div>
        <div className="flex gap-2 flex-wrap p-3">
          {Object.entries(player.grades).map(([label, val]) => (
            <GradeBox key={label} label={label} value={val} />
          ))}
        </div>
      </div>

      {/* Season stats */}
      {seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON {(seasonStats as Record<string, number>).season ?? '—'} STATISTICS</div>
          <div className="grid grid-cols-2 gap-4 p-0">
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('W',    (seasonStats as Record<string, number>).w)}
                    {statRow('L',    (seasonStats as Record<string, number>).l)}
                    {statRow('SV',   (seasonStats as Record<string, number>).sv)}
                    {statRow('IP',   (seasonStats as Record<string, number>).ip, 1)}
                    {statRow('ERA',  (seasonStats as Record<string, number>).era, 2)}
                    {statRow('WHIP', (seasonStats as Record<string, number>).whip, 2)}
                  </>
                ) : (
                  <>
                    {statRow('PA',  (seasonStats as Record<string, number>).pa)}
                    {statRow('AB',  (seasonStats as Record<string, number>).ab)}
                    {statRow('H',   (seasonStats as Record<string, number>).h)}
                    {statRow('HR',  (seasonStats as Record<string, number>).hr)}
                    {statRow('RBI', (seasonStats as Record<string, number>).rbi)}
                    {statRow('SB',  (seasonStats as Record<string, number>).sb)}
                  </>
                )}
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('K',   (seasonStats as Record<string, number>).ka)}
                    {statRow('BB',  (seasonStats as Record<string, number>).bba)}
                    {statRow('HR',  (seasonStats as Record<string, number>).hra)}
                  </>
                ) : (
                  <>
                    {statRow('AVG', (seasonStats as Record<string, number>).avg, 3)}
                    {statRow('OBP', (seasonStats as Record<string, number>).obp, 3)}
                    {statRow('BB',  (seasonStats as Record<string, number>).bb)}
                    {statRow('K',   (seasonStats as Record<string, number>).k)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">STATISTICS</div>
          <div className="p-4 text-gray-500 text-xs">Simulate a season to see stats.</div>
        </div>
      )}
    </div>
  );
}
