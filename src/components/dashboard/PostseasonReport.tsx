/**
 * PostseasonReport — season results, awards, bracket, development events
 */

import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { SeasonResult, AwardCandidate } from '../../types/league';
import type { AwardWinner, DivisionChampion } from '../../engine/player/awards';
import type { PlayoffBracket } from '../../engine/sim/playoffSimulator';
import SeasonHighlights from './SeasonHighlights';
import AwardRacePanel from './AwardRacePanel';
import PlayoffBracketView from './PlayoffBracket';
import DevGradeCard from './DevGradeCard';

// ─── Sub-components ──────────────────────────────────────────────────────────

function AwardRow({ label, winner }: { label: string; winner: AwardWinner | null }) {
  if (!winner) return null;
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-800 last:border-0">
      <div className="text-gray-500 text-xs w-28 shrink-0 pt-0.5">{label}</div>
      <div className="flex-1">
        <span className="text-orange-400 font-mono text-xs font-bold">{winner.name}</span>
        <span className="text-gray-500 text-xs ml-2">{winner.teamAbbr} · {winner.position} · Age {winner.age}</span>
        <div className="text-gray-400 font-mono text-xs mt-0.5">{winner.statLine}</div>
      </div>
    </div>
  );
}

function DivChamp({ champ }: { champ: DivisionChampion }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
      <div className="text-gray-500 text-xs w-24 shrink-0">{champ.league} {champ.division.toUpperCase()}</div>
      <div className="text-gray-200 text-xs font-mono font-bold flex-1 mx-2">{champ.abbreviation}</div>
      <div className="text-orange-400 font-mono text-xs tabular-nums">{champ.wins}–{champ.losses}</div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  lastResult: SeasonResult;
  lastBreakouts: number;
  lastBusts: number;
  playoffBracket: PlayoffBracket | null;
  awardRaceData: {
    mvp:     { al: AwardCandidate[]; nl: AwardCandidate[] };
    cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
    roy:     { al: AwardCandidate[]; nl: AwardCandidate[] };
  } | null;
  onEnterOffseason: () => void;
}

export default function PostseasonReport({
  lastResult, lastBreakouts, lastBusts,
  playoffBracket, awardRaceData, onEnterOffseason,
}: Props) {
  const { userTeamId, gamePhase } = useGameStore();
  const { setActiveTab } = useUIStore();

  const completedSeason = lastResult.season;

  return (
    <div className="space-y-4">
      <DevGradeCard lastSeasonBreakouts={lastBreakouts} lastSeasonBusts={lastBusts} />

      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="text-orange-500 font-bold text-xs tracking-widest">
          {completedSeason} SEASON COMPLETE — OFFSEASON REPORT
        </div>
      </div>

      <SeasonHighlights result={lastResult} userTeamId={userTeamId} />

      {awardRaceData && (
        <AwardRacePanel
          data={awardRaceData}
          userTeamId={userTeamId}
          userLeague={userTeamId <= 15 ? 'AL' : 'NL'}
        />
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'LEAGUE BA',  value: lastResult.leagueBA.toFixed(3),  sub: 'Batting average' },
          { label: 'LEAGUE ERA', value: lastResult.leagueERA.toFixed(2), sub: 'Earned run avg' },
          { label: 'RUNS/GAME',  value: lastResult.leagueRPG.toFixed(2), sub: 'Per team' },
          { label: 'WINS SD',    value: lastResult.teamWinsSD.toFixed(1), sub: 'Parity' },
        ].map(stat => (
          <div key={stat.label} className="bloomberg-border bg-gray-900 px-4 py-3">
            <div className="text-gray-500 text-xs">{stat.label}</div>
            <div className="text-orange-400 font-bold text-lg tabular-nums">{stat.value}</div>
            <div className="text-gray-600 text-xs">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {lastResult.divisionChampions && lastResult.divisionChampions.length > 0 && (
          <div className="bloomberg-border bg-gray-900">
            <div className="bloomberg-header px-4">DIVISION CHAMPIONS</div>
            <div className="px-4 py-2">
              {lastResult.divisionChampions.map(champ => (
                <DivChamp key={`${champ.league}-${champ.division}`} champ={champ} />
              ))}
            </div>
          </div>
        )}
        {lastResult.awards && (
          <div className="bloomberg-border bg-gray-900">
            <div className="bloomberg-header px-4">AWARDS</div>
            <div className="px-4 py-2">
              <AwardRow label="AL MVP"      winner={lastResult.awards.mvpAL} />
              <AwardRow label="NL MVP"      winner={lastResult.awards.mvpNL} />
              <AwardRow label="AL CY YOUNG" winner={lastResult.awards.cyYoungAL} />
              <AwardRow label="NL CY YOUNG" winner={lastResult.awards.cyYoungNL} />
              <AwardRow label="AL ROY"      winner={lastResult.awards.royAL} />
              <AwardRow label="NL ROY"      winner={lastResult.awards.royNL} />
            </div>
          </div>
        )}
      </div>

      {playoffBracket && <PlayoffBracketView bracket={playoffBracket} />}

      {lastResult.developmentEvents && lastResult.developmentEvents.length > 0 && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4">OFFSEASON DEVELOPMENT</div>
          <div className="px-4 py-3 grid grid-cols-2 gap-x-8">
            <div>
              <div className="text-green-500 text-xs font-bold mb-1.5">▲ BREAKOUTS</div>
              {lastResult.developmentEvents.filter(e => e.type === 'breakout').slice(0, 8).map(e => (
                <div key={e.playerId} className="flex justify-between py-0.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-300 font-mono text-xs">{e.playerName}</span>
                  <span className="text-green-400 font-mono text-xs tabular-nums">+{e.overallDelta}</span>
                </div>
              ))}
              {lastResult.developmentEvents.filter(e => e.type === 'breakout').length === 0 && (
                <div className="text-gray-600 text-xs">No major breakouts</div>
              )}
            </div>
            <div>
              {lastResult.developmentEvents.filter(e => e.type === 'bust').length > 0 && (<>
                <div className="text-red-500 text-xs font-bold mb-1.5">▼ DECLINES</div>
                {lastResult.developmentEvents.filter(e => e.type === 'bust').slice(0, 5).map(e => (
                  <div key={e.playerId} className="flex justify-between py-0.5 border-b border-gray-800 last:border-0">
                    <span className="text-gray-300 font-mono text-xs">{e.playerName}</span>
                    <span className="text-red-400 font-mono text-xs tabular-nums">{e.overallDelta}</span>
                  </div>
                ))}
              </>)}
              {lastResult.developmentEvents.filter(e => e.type === 'retirement').length > 0 && (<>
                <div className="text-gray-500 text-xs font-bold mb-1 mt-3">◼ RETIREMENTS</div>
                {lastResult.developmentEvents.filter(e => e.type === 'retirement').slice(0, 6).map(e => (
                  <div key={e.playerId} className="py-0.5 border-b border-gray-800 last:border-0">
                    <span className="text-gray-500 font-mono text-xs">{e.playerName}</span>
                  </div>
                ))}
              </>)}
            </div>
          </div>
          <div className="px-4 py-2 border-t border-gray-800 flex gap-6 text-xs text-gray-500">
            <span><span className="text-green-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'breakout').length}</span> breakouts</span>
            <span><span className="text-red-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'bust').length}</span> declines</span>
            <span><span className="text-gray-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'retirement').length}</span> retirements</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setActiveTab('standings')}
          className="border border-orange-700 hover:border-orange-500 text-orange-600 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
          FINAL STANDINGS →
        </button>
        <button onClick={() => setActiveTab('stats')}
          className="border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
          LEADERBOARDS →
        </button>
        <button onClick={() => setActiveTab('roster')}
          className="border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
          YOUR ROSTER →
        </button>
        {gamePhase === 'postseason' && (
          <button onClick={onEnterOffseason}
            className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-6 py-1.5 uppercase tracking-wider transition-colors">
            ENTER OFFSEASON →
          </button>
        )}
      </div>
    </div>
  );
}
