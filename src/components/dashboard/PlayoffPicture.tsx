import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { StandingsData, StandingsRow } from '../../types/league';

interface DivisionRace {
  division: string;
  league: string;
  teams: StandingsRow[];
}

function RecordCell({ row, userTeamId }: { row: StandingsRow; userTeamId: number | null }) {
  const isUser = row.teamId === userTeamId;
  return (
    <div className={`flex items-center gap-2 px-2 py-1 text-xs ${isUser ? 'bg-orange-900/10' : ''}`}>
      <span className={`font-bold w-6 ${isUser ? 'text-orange-400' : 'text-gray-300'}`}>
        {row.abbreviation}
      </span>
      <span className="text-gray-400 tabular-nums w-12">{row.wins}-{row.losses}</span>
      <span className="text-gray-600 tabular-nums w-10 text-right">{row.pct.toFixed(3)}</span>
      <span className="text-gray-600 tabular-nums w-8 text-right">
        {row.gb === 0 ? '—' : row.gb.toFixed(1)}
      </span>
      {/* Run diff */}
      <span className={`tabular-nums text-[10px] w-10 text-right ${
        row.runsScored - row.runsAllowed > 0 ? 'text-green-400' : row.runsScored - row.runsAllowed < 0 ? 'text-red-400' : 'text-gray-500'
      }`}>
        {row.runsScored - row.runsAllowed > 0 ? '+' : ''}{row.runsScored - row.runsAllowed}
      </span>
      {/* Pythag */}
      <span className="text-gray-600 tabular-nums text-[10px] w-8 text-right">{row.pythagWins}W</span>
    </div>
  );
}

function WildCardLine({ row, rank, userTeamId }: { row: StandingsRow; rank: number; userTeamId: number | null }) {
  const isUser = row.teamId === userTeamId;
  const total = row.wins + row.losses;
  const pct = total > 0 ? row.wins / total : 0;
  const barW = Math.round(pct * 100);

  return (
    <div className={`flex items-center gap-2 px-2 py-1 text-xs ${isUser ? 'bg-orange-900/10' : ''} ${rank <= 3 ? '' : 'opacity-50'}`}>
      <span className={`w-4 text-right tabular-nums ${rank <= 3 ? 'text-green-400' : 'text-gray-600'}`}>{rank}</span>
      <span className={`font-bold w-8 ${isUser ? 'text-orange-400' : rank <= 3 ? 'text-gray-200' : 'text-gray-500'}`}>
        {row.abbreviation}
      </span>
      <span className="text-gray-500 tabular-nums w-12">{row.wins}-{row.losses}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${rank <= 3 ? 'bg-green-600' : 'bg-gray-700'}`}
          style={{ width: `${barW}%` }} />
      </div>
      <span className="text-gray-500 tabular-nums text-[10px] w-10 text-right">.{pct.toFixed(3).slice(2)}</span>
      {rank === 3 && <span className="text-yellow-600 text-[10px]">CUT</span>}
    </div>
  );
}

export default function PlayoffPicture() {
  const { gameStarted, userTeamId } = useGameStore();
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getStandings()
      .then(setStandings)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading playoff picture...</div>;
  if (!standings) return null;

  const teams = standings.standings;

  // Compute GB within each division
  const divisions = ['East', 'Central', 'West'];
  const leagues = ['AL', 'NL'];

  const divisionRaces: DivisionRace[] = [];
  for (const lg of leagues) {
    for (const div of divisions) {
      const divTeams = teams
        .filter(t => t.league === lg && t.division === div)
        .sort((a, b) => b.pct - a.pct);
      // Compute GB from leader
      if (divTeams.length > 0) {
        const leader = divTeams[0];
        for (const t of divTeams) {
          t.gb = ((leader.wins - t.wins) + (t.losses - leader.losses)) / 2;
        }
      }
      divisionRaces.push({ division: `${lg} ${div}`, league: lg, teams: divTeams });
    }
  }

  // Wild card: non-division winners sorted by record
  const computeWildCard = (league: string) => {
    const leagueRaces = divisionRaces.filter(r => r.league === league);
    const divWinners = new Set(leagueRaces.map(r => r.teams[0]?.teamId));
    const nonWinners = teams
      .filter(t => t.league === league && !divWinners.has(t.teamId))
      .sort((a, b) => b.pct - a.pct);
    return nonWinners;
  };

  const alWC = computeWildCard('AL');
  const nlWC = computeWildCard('NL');

  // User's team status
  const userRow = teams.find(t => t.teamId === userTeamId);
  const userDiv = divisionRaces.find(r => r.teams.some(t => t.teamId === userTeamId));
  const isUserDivLeader = userDiv?.teams[0]?.teamId === userTeamId;
  const userWCRank = userRow
    ? (userRow.league === 'AL' ? alWC : nlWC).findIndex(t => t.teamId === userTeamId) + 1
    : 0;
  const isUserInPlayoffs = isUserDivLeader || (userWCRank >= 1 && userWCRank <= 3);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLAYOFF PICTURE</span>
        {userRow && (
          <span className={`text-xs font-bold ${isUserInPlayoffs ? 'text-green-400' : 'text-red-400'}`}>
            {isUserInPlayoffs
              ? (isUserDivLeader ? 'DIVISION LEADER' : `WILD CARD #${userWCRank}`)
              : 'OUT OF PLAYOFF PICTURE'}
          </span>
        )}
      </div>

      {/* Your team status */}
      {userRow && (
        <div className={`bloomberg-border px-4 py-3 ${isUserInPlayoffs ? 'border-green-800' : 'border-red-800/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-orange-400 font-bold">{userRow.abbreviation}</span>
              <span className="text-gray-400 text-xs ml-2">{userRow.wins}-{userRow.losses}</span>
              <span className="text-gray-600 text-xs ml-2">({userRow.pct.toFixed(3)})</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {userDiv && (
                <span className="text-gray-500">
                  {userDiv.division}: {userDiv.teams[0].teamId === userTeamId ? 'LEADING' : `${userRow.gb} GB`}
                </span>
              )}
              {!isUserDivLeader && userWCRank > 0 && (
                <span className={userWCRank <= 3 ? 'text-green-400' : 'text-gray-500'}>
                  WC #{userWCRank}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Division races */}
      <div className="grid grid-cols-2 gap-4">
        {leagues.map(lg => (
          <div key={lg} className="space-y-3">
            <div className="text-gray-500 text-xs font-bold text-center">{lg === 'AL' ? 'AMERICAN LEAGUE' : 'NATIONAL LEAGUE'}</div>
            {divisionRaces.filter(r => r.league === lg).map(race => (
              <div key={race.division} className="bloomberg-border">
                <div className="bloomberg-header text-[10px]">{race.division.toUpperCase()}</div>
                <div className="divide-y divide-gray-800/30">
                  {race.teams.map(t => (
                    <RecordCell key={t.teamId} row={t} userTeamId={userTeamId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Wild Card races */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bloomberg-border">
          <div className="bloomberg-header">AL WILD CARD</div>
          <div className="divide-y divide-gray-800/30">
            {alWC.slice(0, 6).map((t, i) => (
              <WildCardLine key={t.teamId} row={t} rank={i + 1} userTeamId={userTeamId} />
            ))}
          </div>
          <div className="px-2 py-1 text-gray-700 text-[10px]">Top 3 qualify as Wild Card teams</div>
        </div>
        <div className="bloomberg-border">
          <div className="bloomberg-header">NL WILD CARD</div>
          <div className="divide-y divide-gray-800/30">
            {nlWC.slice(0, 6).map((t, i) => (
              <WildCardLine key={t.teamId} row={t} rank={i + 1} userTeamId={userTeamId} />
            ))}
          </div>
          <div className="px-2 py-1 text-gray-700 text-[10px]">Top 3 qualify as Wild Card teams</div>
        </div>
      </div>

      {/* Playoff seeding preview */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">PROJECTED PLAYOFF BRACKET (12 TEAMS)</div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
          {leagues.map(lg => {
            const lgRaces = divisionRaces.filter(r => r.league === lg);
            const divWinners = lgRaces.map(r => r.teams[0]).filter(Boolean).sort((a, b) => b.pct - a.pct);
            const wc = lg === 'AL' ? alWC.slice(0, 3) : nlWC.slice(0, 3);
            const seeds = [...divWinners, ...wc].slice(0, 6);

            return (
              <div key={lg} className="p-2">
                <div className="text-gray-500 text-[10px] font-bold text-center mb-1">{lg}</div>
                {seeds.map((t, i) => (
                  <div key={t.teamId}
                    className={`flex items-center gap-2 px-2 py-0.5 text-xs ${t.teamId === userTeamId ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
                    <span className="text-gray-600 w-4 text-right tabular-nums">{i + 1}.</span>
                    <span className={t.teamId === userTeamId ? 'text-orange-400' : 'text-gray-300'}>{t.abbreviation}</span>
                    <span className="text-gray-600 tabular-nums">{t.wins}-{t.losses}</span>
                    {i < 3 && <span className="text-yellow-600 text-[10px]">DIV</span>}
                    {i >= 3 && <span className="text-blue-600 text-[10px]">WC</span>}
                    {i === 0 && <span className="text-green-600 text-[10px] ml-auto">BYE</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
