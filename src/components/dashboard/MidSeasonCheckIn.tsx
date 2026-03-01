import type { SeasonResult } from '../../types/league';
import type { SeasonPhase } from '../../store/gameStore';

interface Props {
  result: SeasonResult;
  userTeamId: number;
  seasonPhase: SeasonPhase;
  ownerPatience: number;
  onContinue: () => void;
}

function getPhaseLabel(phase: SeasonPhase): string {
  switch (phase) {
    case 'early': return 'FIRST HALF UPDATE';
    case 'allstar': return 'ALL-STAR BREAK';
    case 'deadline': return 'TRADE DEADLINE APPROACHING';
    case 'stretch': return 'SEPTEMBER STRETCH';
    case 'complete': return 'SEASON COMPLETE';
  }
}

function getOwnerMood(ownerPatience: number, wins: number, losses: number): { text: string; color: string } {
  const pct = wins / Math.max(1, wins + losses);
  if (pct >= .580 && ownerPatience >= 60) return { text: '"The team is playing outstanding baseball. Keep it up."', color: 'text-green-400' };
  if (pct >= .520 && ownerPatience >= 40) return { text: '"Solid progress. I like the direction we\'re heading."', color: 'text-blue-400' };
  if (pct >= .480 && ownerPatience >= 30) return { text: '"We need to pick it up in the second half."', color: 'text-yellow-400' };
  if (ownerPatience < 20) return { text: '"I\'m running out of patience. Results. Now."', color: 'text-red-400' };
  return { text: '"We expected more from this roster."', color: 'text-orange-400' };
}

export default function MidSeasonCheckIn({ result, userTeamId, seasonPhase, ownerPatience, onContinue }: Props) {
  const userTeam = result.teamSeasons.find(ts => ts.teamId === userTeamId);
  const wins = userTeam?.record.wins ?? 0;
  const losses = userTeam?.record.losses ?? 0;
  const mood = getOwnerMood(ownerPatience, wins, losses);

  // Find user team's league-wide ranking
  const sortedTeams = [...result.teamSeasons]
    .sort((a, b) => (b.record.wins / Math.max(1, b.record.wins + b.record.losses))
                   - (a.record.wins / Math.max(1, a.record.wins + a.record.losses)));
  const leagueRank = sortedTeams.findIndex(ts => ts.teamId === userTeamId) + 1;

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <span>{getPhaseLabel(seasonPhase)}</span>
        <span className="text-gray-600 font-normal text-xs">Owner Check-In</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Record snapshot */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-gray-600 text-xs">RECORD</div>
            <div className="text-gray-200 font-bold tabular-nums">{wins}–{losses}</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">WIN PCT</div>
            <div className="text-orange-400 font-bold tabular-nums">
              {(wins / Math.max(1, wins + losses)).toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">MLB RANK</div>
            <div className={`font-bold ${leagueRank <= 5 ? 'text-green-400' : leagueRank <= 15 ? 'text-gray-300' : 'text-red-400'}`}>
              {leagueRank}{leagueRank === 1 ? 'st' : leagueRank === 2 ? 'nd' : leagueRank === 3 ? 'rd' : 'th'}
            </div>
          </div>
        </div>

        {/* Owner quote */}
        <div className="bloomberg-border bg-gray-900/50 px-4 py-3">
          <div className="text-gray-600 text-xs mb-1">OWNER'S OFFICE</div>
          <div className={`text-sm italic ${mood.color}`}>{mood.text}</div>
          <div className="text-gray-700 text-xs mt-2">
            Patience: <span className={ownerPatience <= 20 ? 'text-red-400 font-bold' : 'text-gray-400'}>{ownerPatience}%</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
        >
          {seasonPhase === 'allstar' ? 'CONTINUE TO TRADE DEADLINE' :
           seasonPhase === 'deadline' ? 'FINISH THE SEASON' : 'CONTINUE'}
        </button>
      </div>
    </div>
  );
}
