import type { PlayoffBracket, PlayoffSeries } from '../../engine/sim/playoffSimulator';
import { useGameStore } from '../../store/gameStore';

// ─── Series card ──────────────────────────────────────────────────────────────

function SeriesCard({ series, userTeamId }: { series: PlayoffSeries; userTeamId: number }) {
  const isUserInSeries = series.higherSeed.teamId === userTeamId || series.lowerSeed.teamId === userTeamId;
  const winnerId = series.winnerId;
  const totalGames = series.higherSeedWins + series.lowerSeedWins;
  const seriesScore = `${Math.max(series.higherSeedWins, series.lowerSeedWins)}-${Math.min(series.higherSeedWins, series.lowerSeedWins)}`;

  return (
    <div className={`border ${isUserInSeries ? 'border-orange-700' : 'border-gray-800'} bg-gray-900 min-w-[140px] relative`}>
      <TeamRow
        abbr={series.higherSeed.abbreviation}
        seed={series.higherSeed.seed}
        wins={series.higherSeedWins}
        isWinner={winnerId === series.higherSeed.teamId}
        isUser={series.higherSeed.teamId === userTeamId}
      />
      <div className="border-t border-gray-800" />
      <TeamRow
        abbr={series.lowerSeed.abbreviation}
        seed={series.lowerSeed.seed}
        wins={series.lowerSeedWins}
        isWinner={winnerId === series.lowerSeed.teamId}
        isUser={series.lowerSeed.teamId === userTeamId}
      />
      {totalGames > 0 && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-[10px] tabular-nums whitespace-nowrap">
          {seriesScore}
        </div>
      )}
    </div>
  );
}

function TeamRow({ abbr, seed, wins, isWinner, isUser }: {
  abbr: string; seed: number; wins: number; isWinner: boolean; isUser: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-2.5 ${
      isWinner ? 'bg-orange-900/20' : ''
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-[10px] w-3 text-right tabular-nums">{seed}</span>
        <span className={`font-bold text-xs ${
          isUser ? 'text-orange-400' : isWinner ? 'text-gray-200' : 'text-gray-500'
        }`}>
          {abbr}
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

// ─── Round column with vertical connector ─────────────────────────────────────

function RoundColumn({ title, series, userTeamId }: {
  title: string; series: PlayoffSeries[]; userTeamId: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-gray-600 text-[10px] font-bold tracking-widest text-center uppercase mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-6 justify-center flex-1">
        {series.map((s, i) => (
          <SeriesCard key={i} series={s} userTeamId={userTeamId} />
        ))}
      </div>
    </div>
  );
}

// ─── Bracket connector (CSS lines) ────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex items-center px-1">
      <div className="w-4 border-t border-gray-700" />
      <div className="text-gray-700 text-xs">&#x25B8;</div>
    </div>
  );
}

// ─── Main bracket ─────────────────────────────────────────────────────────────

export default function PlayoffBracketView({ bracket }: { bracket: PlayoffBracket }) {
  const { userTeamId } = useGameStore();

  const allPlayoffTeamIds = new Set([
    ...bracket.alTeams.map(t => t.teamId),
    ...bracket.nlTeams.map(t => t.teamId),
  ]);
  const userMadePlayoffs = allPlayoffTeamIds.has(userTeamId);

  const alWC = bracket.wildCardRound.filter((_, i) => i < 2);
  const nlWC = bracket.wildCardRound.filter((_, i) => i >= 2);
  const alDS = bracket.divisionSeries.filter((_, i) => i < 2);
  const nlDS = bracket.divisionSeries.filter((_, i) => i >= 2);
  const alCS = bracket.championshipSeries.filter((_, i) => i === 0);
  const nlCS = bracket.championshipSeries.filter((_, i) => i === 1);

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Champion banner */}
      {bracket.championId && (
        <div className={`border-b px-4 py-4 text-center ${
          bracket.championId === userTeamId
            ? 'bg-yellow-900/30 border-yellow-700'
            : 'bg-orange-900/20 border-orange-800'
        }`}>
          <div className="text-yellow-500 text-lg mb-1">&#x1F3C6;</div>
          <div className="text-orange-500 font-bold text-[10px] tracking-[0.2em]">WORLD SERIES CHAMPION</div>
          <div className={`font-black text-xl tracking-wider mt-1 ${
            bracket.championId === userTeamId ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            {bracket.championName}
          </div>
          {bracket.championId === userTeamId && (
            <div className="text-yellow-300 text-xs mt-1 font-bold">YOUR FRANCHISE WINS IT ALL!</div>
          )}
          {bracket.worldSeries && (
            <div className="text-gray-500 text-xs mt-2 tabular-nums">
              World Series: {bracket.worldSeries.higherSeedWins}-{bracket.worldSeries.lowerSeedWins}
            </div>
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
        <div className="mb-6">
          <div className="text-gray-500 text-[10px] font-bold tracking-[0.15em] mb-3 border-b border-gray-800 pb-1">
            AMERICAN LEAGUE
          </div>
          <div className="flex items-center gap-1">
            <RoundColumn title="WILD CARD" series={alWC} userTeamId={userTeamId} />
            <Connector />
            <RoundColumn title="DIV SERIES" series={alDS} userTeamId={userTeamId} />
            <Connector />
            <RoundColumn title="ALCS" series={alCS} userTeamId={userTeamId} />
          </div>
        </div>

        {/* World Series */}
        {bracket.worldSeries && (
          <div className="mb-6 flex flex-col items-center">
            <div className="text-orange-500 text-[10px] font-bold tracking-[0.15em] mb-3 border-b border-orange-800 pb-1 px-8">
              WORLD SERIES
            </div>
            <SeriesCard series={bracket.worldSeries} userTeamId={userTeamId} />
            {bracket.worldSeries.games.length > 0 && (
              <div className="mt-3 space-y-0.5">
                {bracket.worldSeries.games.map(g => {
                  const findAbbr = (id: number) =>
                    bracket.alTeams.find(t => t.teamId === id)?.abbreviation ??
                    bracket.nlTeams.find(t => t.teamId === id)?.abbreviation ?? '???';
                  return (
                    <div key={g.gameNumber} className="text-gray-600 text-[10px] flex items-center gap-2 justify-center tabular-nums">
                      <span className="text-gray-500 w-5">G{g.gameNumber}</span>
                      <span className={g.homeScore > g.awayScore ? 'text-gray-300 font-bold' : ''}>
                        {findAbbr(g.homeTeamId)} {g.homeScore}
                      </span>
                      <span className="text-gray-700">-</span>
                      <span className={g.awayScore > g.homeScore ? 'text-gray-300 font-bold' : ''}>
                        {g.awayScore} {findAbbr(g.awayTeamId)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NL Bracket */}
        <div>
          <div className="text-gray-500 text-[10px] font-bold tracking-[0.15em] mb-3 border-b border-gray-800 pb-1">
            NATIONAL LEAGUE
          </div>
          <div className="flex items-center gap-1">
            <RoundColumn title="WILD CARD" series={nlWC} userTeamId={userTeamId} />
            <Connector />
            <RoundColumn title="DIV SERIES" series={nlDS} userTeamId={userTeamId} />
            <Connector />
            <RoundColumn title="NLCS" series={nlCS} userTeamId={userTeamId} />
          </div>
        </div>
      </div>
    </div>
  );
}
