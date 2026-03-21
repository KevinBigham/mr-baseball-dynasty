/**
 * StreakBadge.tsx — Visual indicators for team and player streaks.
 * Purely decorative — does not affect simulation.
 */

import type { TeamStreak, PlayerStreakType } from '../../engine/streaks';

// ─── Team Streak Badge ────────────────────────────────────────────────────

interface TeamStreakProps {
  streak: TeamStreak;
  compact?: boolean;
}

export function TeamStreakBadge({ streak, compact = false }: TeamStreakProps) {
  if (streak.intensity === 0) return null;

  if (streak.type === 'win') {
    // Green flame, intensifying
    const flames = streak.intensity >= 4 ? '🔥🔥🔥'
      : streak.intensity >= 3 ? '🔥🔥'
      : streak.intensity >= 2 ? '🔥'
      : '▲';

    return (
      <span
        className="inline-flex items-center gap-0.5"
        title={`${streak.length}-game win streak`}
      >
        {compact ? (
          <span className="text-green-400 text-[10px] font-bold">W{streak.length}</span>
        ) : (
          <>
            <span className="text-[10px]">{flames}</span>
            <span className="text-green-400 text-[10px] font-bold tabular-nums">W{streak.length}</span>
          </>
        )}
      </span>
    );
  }

  // Loss streak — red down arrows
  const arrows = streak.intensity >= 4 ? '📉📉📉'
    : streak.intensity >= 3 ? '📉📉'
    : streak.intensity >= 2 ? '📉'
    : '▼';

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${streak.length}-game losing streak`}
    >
      {compact ? (
        <span className="text-red-400 text-[10px] font-bold">L{streak.length}</span>
      ) : (
        <>
          <span className="text-[10px]">{arrows}</span>
          <span className="text-red-400 text-[10px] font-bold tabular-nums">L{streak.length}</span>
        </>
      )}
    </span>
  );
}

// ─── Player Streak Badge ──────────────────────────────────────────────────

interface PlayerStreakProps {
  type: PlayerStreakType;
  compact?: boolean;
}

export function PlayerStreakBadge({ type, compact = false }: PlayerStreakProps) {
  if (type === 'none') return null;

  if (type === 'hot') {
    return (
      <span className="inline-flex items-center" title="Hot streak">
        <span className="text-[10px]">🔥</span>
        {!compact && <span className="text-orange-400 text-[9px] font-bold ml-0.5">HOT</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center" title="Cold streak">
      <span className="text-[10px]">❄️</span>
      {!compact && <span className="text-blue-400 text-[9px] font-bold ml-0.5">COLD</span>}
    </span>
  );
}
