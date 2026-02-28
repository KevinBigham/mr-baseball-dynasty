import { useState } from 'react';
import type {
  PlayoffBracket as PlayoffBracketData,
  SeriesResult,
  PlayoffSeed,
} from '../../engine/sim/playoffs';
import { useGameStore } from '../../store/gameStore';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function roundLabel(round: string): string {
  switch (round) {
    case 'WC': return 'WILD CARD';
    case 'DS': return 'DIVISION SERIES';
    case 'CS': return 'CHAMPIONSHIP';
    case 'WS': return 'WORLD SERIES';
    default:   return round;
  }
}

function bestOfLabel(bestOf: number): string {
  return `Best of ${bestOf}`;
}

// ─── Series Card ────────────────────────────────────────────────────────────────

function SeriesCard({ series, userTeamId }: { series: SeriesResult; userTeamId: number }) {
  const [expanded, setExpanded] = useState(false);
  const isUserInvolved = series.higherSeed.teamId === userTeamId || series.lowerSeed.teamId === userTeamId;
  const userWon = series.winner.teamId === userTeamId;

  return (
    <div
      className="rounded transition-all duration-150 cursor-pointer"
      style={{
        background: isUserInvolved
          ? userWon ? 'rgba(234,88,12,0.10)' : 'rgba(239,68,68,0.08)'
          : 'rgba(255,255,255,0.03)',
        border: isUserInvolved
          ? userWon ? '1px solid rgba(234,88,12,0.4)' : '1px solid rgba(239,68,68,0.3)'
          : '1px solid rgba(255,255,255,0.08)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-2.5">
        {/* Matchup header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-600 text-xs uppercase tracking-wider font-bold">
            {roundLabel(series.round)}
          </span>
          <span className="text-gray-700 text-xs">{bestOfLabel(series.bestOf)}</span>
        </div>

        {/* Team 1 (higher seed) */}
        <TeamLine
          seed={series.higherSeed}
          wins={series.homeWins}
          isWinner={series.winner.teamId === series.higherSeed.teamId}
          isUser={series.higherSeed.teamId === userTeamId}
        />
        {/* Team 2 (lower seed) */}
        <TeamLine
          seed={series.lowerSeed}
          wins={series.awayWins}
          isWinner={series.winner.teamId === series.lowerSeed.teamId}
          isUser={series.lowerSeed.teamId === userTeamId}
        />
      </div>

      {/* Expanded game-by-game scores */}
      {expanded && series.gameScores.length > 0 && (
        <div className="border-t border-gray-800 px-2.5 py-2">
          <div className="text-gray-600 text-xs font-bold mb-1.5 tracking-wider">GAME LOG</div>
          {series.gameScores.map((g, i) => {
            const homeTeam = g.homeTeamId === series.higherSeed.teamId
              ? series.higherSeed : series.lowerSeed;
            const awayTeam = g.homeTeamId === series.higherSeed.teamId
              ? series.lowerSeed : series.higherSeed;
            const homeWon = g.homeScore > g.awayScore;
            return (
              <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                <span className="text-gray-600 w-8">G{i + 1}</span>
                <span className={`w-8 text-center font-mono tabular-nums ${!homeWon ? 'text-gray-400' : 'text-orange-400 font-bold'}`}>
                  {awayTeam.abbreviation}
                </span>
                <span className="text-gray-500 font-mono tabular-nums w-4 text-right">{g.awayScore}</span>
                <span className="text-gray-700">@</span>
                <span className={`w-8 text-center font-mono tabular-nums ${homeWon ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
                  {homeTeam.abbreviation}
                </span>
                <span className="text-gray-500 font-mono tabular-nums w-4 text-right">{g.homeScore}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamLine({ seed, wins, isWinner, isUser }: {
  seed: PlayoffSeed;
  wins: number;
  isWinner: boolean;
  isUser: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${isWinner ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs w-4 text-right tabular-nums">{seed.seed}</span>
        <span className={`font-mono text-sm font-bold ${
          isUser ? (isWinner ? 'text-orange-400' : 'text-red-400') : (isWinner ? 'text-gray-200' : 'text-gray-500')
        }`}>
          {seed.abbreviation}
        </span>
        {seed.isDivWinner && (
          <span className="text-gray-700 text-xs">DIV</span>
        )}
        <span className="text-gray-600 text-xs tabular-nums">({seed.wins}-{seed.losses})</span>
        {isUser && <span className="text-orange-500 text-xs">★</span>}
      </div>
      <div className={`font-mono text-sm font-black tabular-nums ${
        isWinner ? 'text-green-400' : 'text-gray-600'
      }`}>
        {wins}
      </div>
    </div>
  );
}

// ─── Bracket Column (one round) ──────────────────────────────────────────────

function BracketColumn({ title, series, userTeamId }: {
  title: string;
  series: SeriesResult[];
  userTeamId: number;
}) {
  if (series.length === 0) return null;
  return (
    <div className="flex-1 min-w-[200px] space-y-2">
      <div className="text-center text-gray-600 text-xs font-bold tracking-wider uppercase mb-2">
        {title}
      </div>
      {series.map((s, i) => (
        <SeriesCard key={`${s.round}-${i}`} series={s} userTeamId={userTeamId} />
      ))}
    </div>
  );
}

// ─── Main Playoff Bracket Component ──────────────────────────────────────────

export default function PlayoffBracketView({ bracket }: { bracket: PlayoffBracketData }) {
  const { userTeamId } = useGameStore();
  const [viewMode, setViewMode] = useState<'bracket' | 'seeds'>('bracket');

  const userInPlayoffs = [...bracket.alSeeds, ...bracket.nlSeeds].some(s => s.teamId === userTeamId);
  const userIsChamp = bracket.champion?.teamId === userTeamId;

  // Split series by league for bracket view
  const alWC = bracket.wildCard.filter((_, i) => i < 2);
  const nlWC = bracket.wildCard.filter((_, i) => i >= 2);
  const alDS = bracket.divSeries.filter((_, i) => i < 2);
  const nlDS = bracket.divSeries.filter((_, i) => i >= 2);
  const alCS = bracket.champSeries.filter((_, i) => i === 0);
  const nlCS = bracket.champSeries.filter((_, i) => i === 1);

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>{bracket.season} POSTSEASON</span>
          {bracket.champion && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              userIsChamp ? 'bg-orange-600/20 text-orange-400 border border-orange-600/40' : 'bg-green-900/30 text-green-400 border border-green-700/30'
            }`}>
              {userIsChamp ? '🏆 YOUR TEAM WON THE WORLD SERIES!' : `🏆 ${bracket.champion.abbreviation} WORLD CHAMPIONS`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('bracket')}
            className={`text-xs px-2 py-0.5 ${viewMode === 'bracket' ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            BRACKET
          </button>
          <button
            onClick={() => setViewMode('seeds')}
            className={`text-xs px-2 py-0.5 ${viewMode === 'seeds' ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            SEEDS
          </button>
        </div>
      </div>

      {!userInPlayoffs && (
        <div className="px-4 py-2 border-b border-gray-800 text-gray-500 text-xs">
          Your team did not qualify for the postseason.
        </div>
      )}

      {viewMode === 'seeds' ? (
        <SeedsView bracket={bracket} userTeamId={userTeamId} />
      ) : (
        <div className="p-4 space-y-4">
          {/* AL Bracket */}
          <div>
            <div className="text-gray-500 text-xs font-bold tracking-wider mb-2">AMERICAN LEAGUE</div>
            <div className="flex gap-3 overflow-x-auto">
              <BracketColumn title="WILD CARD" series={alWC} userTeamId={userTeamId} />
              <BracketColumn title="DIV SERIES" series={alDS} userTeamId={userTeamId} />
              <BracketColumn title="ALCS" series={alCS} userTeamId={userTeamId} />
            </div>
          </div>

          {/* NL Bracket */}
          <div>
            <div className="text-gray-500 text-xs font-bold tracking-wider mb-2">NATIONAL LEAGUE</div>
            <div className="flex gap-3 overflow-x-auto">
              <BracketColumn title="WILD CARD" series={nlWC} userTeamId={userTeamId} />
              <BracketColumn title="DIV SERIES" series={nlDS} userTeamId={userTeamId} />
              <BracketColumn title="NLCS" series={nlCS} userTeamId={userTeamId} />
            </div>
          </div>

          {/* World Series */}
          {bracket.worldSeries && (
            <div>
              <div className="text-orange-500 text-xs font-bold tracking-wider mb-2">WORLD SERIES</div>
              <div className="max-w-xs">
                <SeriesCard series={bracket.worldSeries} userTeamId={userTeamId} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seeds View ──────────────────────────────────────────────────────────────

function SeedsView({ bracket, userTeamId }: { bracket: PlayoffBracketData; userTeamId: number }) {
  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      <SeedList title="AL PLAYOFF SEEDS" seeds={bracket.alSeeds} userTeamId={userTeamId} />
      <SeedList title="NL PLAYOFF SEEDS" seeds={bracket.nlSeeds} userTeamId={userTeamId} />
    </div>
  );
}

function SeedList({ title, seeds, userTeamId }: {
  title: string;
  seeds: PlayoffSeed[];
  userTeamId: number;
}) {
  return (
    <div>
      <div className="text-gray-500 text-xs font-bold tracking-wider mb-2">{title}</div>
      <div className="space-y-1">
        {seeds.map(s => {
          const isUser = s.teamId === userTeamId;
          return (
            <div
              key={s.teamId}
              className="flex items-center justify-between py-1 px-2 rounded"
              style={{
                background: isUser ? 'rgba(234,88,12,0.10)' : 'transparent',
                border: isUser ? '1px solid rgba(234,88,12,0.3)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-4 text-right tabular-nums font-bold">#{s.seed}</span>
                <span className={`font-mono text-xs font-bold ${isUser ? 'text-orange-400' : 'text-gray-300'}`}>
                  {s.abbreviation}
                </span>
                <span className="text-gray-500 text-xs">{s.name}</span>
                {s.isDivWinner && (
                  <span className="text-xs px-1 py-0.5 rounded text-blue-400 bg-blue-900/20 border border-blue-800/30">
                    DIV
                  </span>
                )}
                {!s.isDivWinner && (
                  <span className="text-xs px-1 py-0.5 rounded text-gray-500 bg-gray-800/40 border border-gray-700/30">
                    WC
                  </span>
                )}
                {isUser && <span className="text-orange-500 text-xs">★</span>}
              </div>
              <span className="font-mono text-xs tabular-nums text-gray-400">
                {s.wins}-{s.losses}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
