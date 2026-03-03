/**
 * SeasonProgressBar — Bloomberg-style visual progress bar showing season segments.
 * Completed months are filled, current is highlighted, upcoming are grayed.
 */

const SEGMENT_LABELS = ['APR–MAY', 'JUNE', 'JULY', 'AUG', 'SEP'];

interface Props {
  /** Index of the most recently completed segment (-1 = none, 0-4) */
  completedSegment: number;
  /** Whether we're currently simulating */
  isSimulating?: boolean;
}

export default function SeasonProgressBar({ completedSegment, isSimulating }: Props) {
  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>SEASON PROGRESS</span>
        <span className="text-gray-500 font-normal text-xs">
          {completedSegment < 0 ? 'Ready to play' :
           completedSegment >= 4 ? 'Season Complete' :
           `${SEGMENT_LABELS[completedSegment]} complete`}
        </span>
      </div>
      <div className="px-4 py-3">
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
