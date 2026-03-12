/**
 * SeasonProgressBar — Bloomberg-style visual progress bar showing season segments.
 * Completed months are filled, current is highlighted, upcoming are grayed.
 * Optionally shows fine-grained game-level progress within the current segment.
 */

const SEGMENT_LABELS = ['APR–MAY', 'JUNE', 'JULY', 'AUG', 'SEP'];

interface Props {
  /** Index of the most recently completed segment (-1 = none, 0-4) */
  completedSegment: number;
  /** Whether we're currently simulating */
  isSimulating?: boolean;
  /** Total schedule entries completed (for fine-grained progress) */
  gamesCompleted?: number;
  /** Total schedule entries in the season */
  totalGames?: number;
}

export default function SeasonProgressBar({ completedSegment, isSimulating, gamesCompleted, totalGames }: Props) {
  const hasGameProgress = gamesCompleted !== undefined && totalGames !== undefined && totalGames > 0;
  const progressPct = hasGameProgress ? Math.round((gamesCompleted / totalGames) * 100) : 0;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>SEASON PROGRESS</span>
        <span className="text-gray-500 font-normal text-xs tabular-nums">
          {hasGameProgress
            ? `${gamesCompleted} / ${totalGames} games (${progressPct}%)`
            : completedSegment < 0 ? 'Ready to play' :
              completedSegment >= 4 ? 'Season Complete' :
              `${SEGMENT_LABELS[completedSegment]} complete`}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {/* Continuous progress bar */}
        {hasGameProgress && gamesCompleted > 0 && (
          <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Segment blocks */}
        <div className="flex gap-1">
          {SEGMENT_LABELS.map((label, idx) => {
            const isCompleted = idx <= completedSegment;
            const isCurrent = idx === completedSegment + 1 && !isSimulating;
            const isSimming = idx === completedSegment + 1 && isSimulating;

            // Special markers
            const isAllStar = idx === 1; // After June = All-Star
            const isDeadline = idx === 2; // After July = Deadline

            return (
              <div
                key={idx}
                className={`flex-1 relative ${
                  isCompleted
                    ? 'bg-green-900/40 border border-green-700'
                    : isCurrent
                    ? 'bg-orange-900/30 border border-orange-600'
                    : isSimming
                    ? 'bg-orange-900/30 border border-orange-600 animate-pulse'
                    : 'bg-gray-800/50 border border-gray-700'
                }`}
              >
                <div className="px-2 py-2 text-center">
                  <div className={`text-[10px] font-bold tracking-widest ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-orange-400' :
                    isSimming ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    {isCompleted && '\u2713 '}{label}
                  </div>
                  {/* Event markers */}
                  {isAllStar && (
                    <div className={`text-[8px] mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-500'}`}>
                      ALL-STAR
                    </div>
                  )}
                  {isDeadline && (
                    <div className={`text-[8px] mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-500'}`}>
                      DEADLINE
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
