import type { PlayoffBracket, PlayoffSeries } from '../../engine/sim/playoffSimulator';
import { useGameStore } from '../../store/gameStore';

// ─── Series display ──────────────────────────────────────────────────────────
function SeriesCard({ series, userTeamId }: { series: PlayoffSeries; userTeamId: number }) {
  const isUserInSeries = series.higherSeed.teamId === userTeamId || series.lowerSeed.teamId === userTeamId;
  const winnerId = series.winnerId;

  function TeamLine({ team, wins, isWinner }: { team: { abbreviation: string; teamId: number; seed: number }; wins: number; isWinner: boolean }) {
    const isUser = team.teamId === userTeamId;
    return (
      <div className={`flex items-center justify-between py-1 px-2 ${
        isWinner ? 'bg-orange-900/20' : ''
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs w-3">{team.seed}</span>
          <span className={`font-bold text-xs ${
            isUser ? 'text-orange-400' : isWinner ? 'text-gray-200' : 'text-gray-500'
          }`}>
            {team.abbreviation}
          </span>
        </div>
        <span className={`font-bold text-xs tabular-nums ${
          isWinner ? 'text-orange-400' : 'text-gray-600'
        }`}>
          {wins}
        </span>
      </div>
    );
  }

  return (
    <div className={`border ${isUserInSeries ? 'border-orange-700' : 'border-gray-800'} bg-gray-900 min-w-[120px]`}>
      <TeamLine
        team={series.higherSeed}
        wins={series.higherSeedWins}
        isWinner={winnerId === series.higherSeed.teamId}
      />
      <div className="border-t border-gray-800" />
      <TeamLine
        team={series.lowerSeed}
        wins={series.lowerSeedWins}
        isWinner={winnerId === series.lowerSeed.teamId}
      />
    </div>
  );
}

// ─── Round column ────────────────────────────────────────────────────────────
function RoundColumn({ title, series, userTeamId }: {
  title: string;
  series: PlayoffSeries[];
  userTeamId: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-gray-500 text-xs font-bold tracking-widest text-center uppercase">{title}</div>
      <div className="flex flex-col gap-3 justify-center flex-1">
        {series.map((s, i) => (
          <SeriesCard key={i} series={s} userTeamId={userTeamId} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Bracket Component ──────────────────────────────────────────────────
export default function PlayoffBracketView({ bracket }: { bracket: PlayoffBracket }) {
  const { userTeamId } = useGameStore();

  const allPlayoffTeamIds = new Set([
    ...bracket.alTeams.map(t => t.teamId),
    ...bracket.nlTeams.map(t => t.teamId),
  ]);
  const userMadePlayoffs = allPlayoffTeamIds.has(userTeamId);

  // Split series by league for display
  const alWC = bracket.wildCardRound.filter((_, i) => i < 2);
  const nlWC = bracket.wildCardRound.filter((_, i) => i >= 2);
  const alDS = bracket.divisionSeries.filter((_, i) => i < 2);
  const nlDS = bracket.divisionSeries.filter((_, i) => i >= 2);

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Champion banner */}
      {bracket.championId && (
        <div className="bg-orange-900/30 border-b border-orange-700 px-4 py-3 text-center">
          <div className="text-orange-500 font-bold text-xs tracking-widest">WORLD SERIES CHAMPION</div>
          <div className="text-orange-400 font-black text-lg tracking-wider mt-1">
            {bracket.championName}
          </div>
          {bracket.championId === userTeamId && (
            <div className="text-orange-300 text-xs mt-1">YOUR FRANCHISE WINS IT ALL!</div>
          )}
        </div>
      )}

      <div className="bloomberg-header px-4">
        OCTOBER — PLAYOFF BRACKET
        {!userMadePlayoffs && (
          <span className="text-gray-500 font-normal ml-2">Your team missed the postseason</span>
        )}
      </div>

      <div className="p-4 overflow-x-auto">
        {/* AL Bracket */}
        <div className="mb-4">
          <div className="text-gray-500 text-xs font-bold tracking-widest mb-2">AMERICAN LEAGUE</div>
          <div className="flex gap-4 items-stretch">
            <RoundColumn title="WILD CARD" series={alWC} userTeamId={userTeamId} />
            <div className="flex items-center text-gray-700">→</div>
            <RoundColumn title="ALDS" series={alDS} userTeamId={userTeamId} />
            <div className="flex items-center text-gray-700">→</div>
            <RoundColumn title="ALCS" series={bracket.championshipSeries.filter((_, i) => i === 0)} userTeamId={userTeamId} />
          </div>
        </div>

        {/* World Series */}
        {bracket.worldSeries && (
          <div className="mb-4 flex justify-center">
            <div>
              <div className="text-orange-500 text-xs font-bold tracking-widest mb-2 text-center">WORLD SERIES</div>
              <SeriesCard series={bracket.worldSeries} userTeamId={userTeamId} />
              {bracket.worldSeries.games.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {bracket.worldSeries.games.map(g => (
                    <div key={g.gameNumber} className="text-gray-600 text-xs flex items-center gap-2 justify-center">
                      <span>G{g.gameNumber}</span>
                      <span className="tabular-nums">
                        {bracket.alTeams.find(t => t.teamId === g.homeTeamId)?.abbreviation ??
                         bracket.nlTeams.find(t => t.teamId === g.homeTeamId)?.abbreviation ?? '???'} {g.homeScore}
                      </span>
                      <span>-</span>
                      <span className="tabular-nums">
                        {g.awayScore} {bracket.alTeams.find(t => t.teamId === g.awayTeamId)?.abbreviation ??
                         bracket.nlTeams.find(t => t.teamId === g.awayTeamId)?.abbreviation ?? '???'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NL Bracket */}
        <div>
          <div className="text-gray-500 text-xs font-bold tracking-widest mb-2">NATIONAL LEAGUE</div>
          <div className="flex gap-4 items-stretch">
            <RoundColumn title="WILD CARD" series={nlWC} userTeamId={userTeamId} />
            <div className="flex items-center text-gray-700">→</div>
            <RoundColumn title="NLDS" series={nlDS} userTeamId={userTeamId} />
            <div className="flex items-center text-gray-700">→</div>
            <RoundColumn title="NLCS" series={bracket.championshipSeries.filter((_, i) => i === 1)} userTeamId={userTeamId} />
          </div>
        </div>
      </div>
    </div>
  );
}
