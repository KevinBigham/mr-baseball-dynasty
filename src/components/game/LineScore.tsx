import type { BoxScore } from '../../types/game';

interface LineScoreProps {
  boxScore: BoxScore;
  homeTeamName: string;
  awayTeamName: string;
  compact?: boolean; // Compact mode for dashboard cards
}

export default function LineScore({
  boxScore,
  homeTeamName,
  awayTeamName,
  compact = false,
}: LineScoreProps) {
  const ls = boxScore.lineScore;
  if (!ls) {
    // Fallback: no line score data — show final score only
    return (
      <div className="text-xs font-mono">
        <div className="flex gap-4">
          <span className="text-gray-400 w-20">{awayTeamName}</span>
          <span className="text-gray-200 font-bold">{boxScore.awayScore}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-gray-400 w-20">{homeTeamName}</span>
          <span className="text-gray-200 font-bold">{boxScore.homeScore}</span>
        </div>
      </div>
    );
  }

  const totalInnings = Math.max(ls.away.length, ls.home.length);
  const awayHits = boxScore.awayBatting.reduce((s, b) => s + b.h, 0);
  const homeHits = boxScore.homeBatting.reduce((s, b) => s + b.h, 0);
  const awayErrors = boxScore.awayBatting.reduce(
    (s, b) => s + (b.pa - b.ab - b.bb - (b.hbp ?? 0) > 0 ? 0 : 0), 0,
  );
  const homeErrors = 0; // Simplified — error tracking is per-play, not per-team

  const cellClass = compact ? 'px-1 w-4 text-center' : 'px-2 w-6 text-center';
  const teamClass = compact ? 'pr-2 text-left w-16 truncate' : 'pr-4 text-left w-28';

  return (
    <div className="overflow-x-auto">
      <table className="text-xs font-mono min-w-max">
        <thead>
          <tr className="text-gray-500">
            <th className={teamClass}>{compact ? '' : 'TEAM'}</th>
            {Array.from({ length: totalInnings }, (_, i) => (
              <th key={i} className={cellClass}>{i + 1}</th>
            ))}
            <th className={`${cellClass} border-l border-gray-700 font-bold`}>R</th>
            <th className={cellClass}>H</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-gray-300">
            <td className={`${teamClass} font-bold text-gray-400`}>{awayTeamName}</td>
            {ls.away.map((r, i) => (
              <td key={i} className={`${cellClass} ${r > 0 ? 'text-green-400' : ''}`}>
                {r}
              </td>
            ))}
            {/* Pad if away has fewer entries (e.g., home walk-off) */}
            {ls.away.length < totalInnings && (
              <td className={cellClass}>-</td>
            )}
            <td className={`${cellClass} border-l border-gray-700 font-bold text-gray-100`}>
              {boxScore.awayScore}
            </td>
            <td className={cellClass}>{awayHits}</td>
          </tr>
          <tr className="text-gray-300">
            <td className={`${teamClass} font-bold text-gray-400`}>{homeTeamName}</td>
            {ls.home.map((r, i) => (
              <td key={i} className={`${cellClass} ${r > 0 ? 'text-green-400' : ''}`}>
                {r}
              </td>
            ))}
            {/* Pad if home has fewer entries (skipped bottom when leading) */}
            {ls.home.length < totalInnings && (
              <td className={cellClass}>X</td>
            )}
            <td className={`${cellClass} border-l border-gray-700 font-bold text-gray-100`}>
              {boxScore.homeScore}
            </td>
            <td className={cellClass}>{homeHits}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
