import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROUND_DISPLAY,
  generateDemoBracket,
  getSeriesStatus,
  isSeriesOver,
  type BracketTree,
  type BracketMatchup,
  type PlayoffRound,
} from '../../engine/playoffs/bracketTree';

function MatchupCard({ matchup }: { matchup: BracketMatchup }) {
  const roundInfo = ROUND_DISPLAY[matchup.round];
  const over = isSeriesOver(matchup);
  const status = getSeriesStatus(matchup);
  const homeWon = matchup.winnerId === matchup.homeTeam.id;
  const awayWon = matchup.winnerId === matchup.awayTeam.id;

  return (
    <div className={`bloomberg-border ${!matchup.played ? 'opacity-60' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-3 py-2">
        {/* Teams */}
        <div className="space-y-1 mb-2">
          <div className={`flex items-center justify-between text-xs ${homeWon ? 'text-orange-300 font-bold' : awayWon ? 'text-gray-600' : 'text-gray-300'}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 tabular-nums w-3 text-right text-[10px]">{matchup.homeTeam.seed}</span>
              <span>{matchup.homeTeam.abbr}</span>
              <span className="text-gray-700 text-[10px]">({matchup.homeTeam.wins}-{matchup.homeTeam.losses})</span>
            </div>
            <span className="font-bold tabular-nums">{matchup.homeWins}</span>
          </div>
          <div className={`flex items-center justify-between text-xs ${awayWon ? 'text-orange-300 font-bold' : homeWon ? 'text-gray-600' : 'text-gray-300'}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 tabular-nums w-3 text-right text-[10px]">{matchup.awayTeam.seed}</span>
              <span>{matchup.awayTeam.abbr}</span>
              <span className="text-gray-700 text-[10px]">({matchup.awayTeam.wins}-{matchup.awayTeam.losses})</span>
            </div>
            <span className="font-bold tabular-nums">{matchup.awayWins}</span>
          </div>
        </div>

        {/* Status */}
        <div className="text-[10px] text-center" style={{ color: over ? roundInfo.color : '#6b7280' }}>
          {matchup.played ? status : 'TBD'}
        </div>
      </div>
    </div>
  );
}

function RoundColumn({ round, matchups }: { round: PlayoffRound; matchups: BracketMatchup[] }) {
  const info = ROUND_DISPLAY[round];
  return (
    <div className="flex-1">
      <div className="text-center mb-2">
        <div className="text-xs font-bold" style={{ color: info.color }}>{info.label.toUpperCase()}</div>
        <div className="text-gray-700 text-[10px]">Best of {info.seriesLength}</div>
      </div>
      <div className="space-y-2">
        {matchups.length > 0 ? (
          matchups.map((m, i) => <MatchupCard key={i} matchup={m} />)
        ) : (
          <div className="bloomberg-border opacity-30 px-3 py-4 text-center text-gray-600 text-[10px]">TBD</div>
        )}
      </div>
    </div>
  );
}

export default function BracketView() {
  const { gameStarted } = useGameStore();
  const [bracket] = useState<BracketTree>(() => generateDemoBracket());
  const [conf, setConf] = useState<'all' | 'AL' | 'NL'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filterByConf = (matchups: BracketMatchup[]) =>
    conf === 'all' ? matchups : matchups.filter(m => m.conference === conf);

  const totalGames = [...bracket.wildcard, ...bracket.division, ...bracket.championship, ...bracket.worldseries];
  const playedGames = totalGames.filter(g => g.played);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLAYOFF BRACKET</span>
        <span className="text-gray-600 text-[10px]">{playedGames.length}/{totalGames.length} SERIES PLAYED</span>
      </div>

      {/* Conference filter */}
      <div className="flex items-center gap-1">
        {(['all', 'AL', 'NL'] as const).map(c => (
          <button key={c} onClick={() => setConf(c)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              conf === c ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{c === 'all' ? 'ALL' : c}</button>
        ))}
      </div>

      {/* Bracket grid */}
      <div className="flex gap-3">
        <RoundColumn round="wildcard" matchups={filterByConf(bracket.wildcard)} />
        <RoundColumn round="division" matchups={filterByConf(bracket.division)} />
        <RoundColumn round="championship" matchups={filterByConf(bracket.championship)} />
        <RoundColumn round="worldseries" matchups={bracket.worldseries} />
      </div>
    </div>
  );
}
