/**
 * AchievementsPanel.tsx — Achievement gallery with progress tracking.
 */

import { useMemo } from 'react';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { evaluateAchievements, type Achievement } from '../../engine/legacyEngine';

function AchievementCard({ ach }: { ach: Achievement }) {
  return (
    <div
      className={`px-3 py-2 flex items-center gap-3 ${ach.earned ? '' : 'opacity-40'}`}
      title={ach.description}
    >
      <span className="text-lg shrink-0">{ach.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold ${ach.earned ? 'text-gray-200' : 'text-gray-500'}`}>
          {ach.name}
        </div>
        <div className="text-[10px] text-gray-500 truncate">{ach.description}</div>
        {!ach.earned && ach.progress !== undefined && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded transition-all duration-500"
                style={{ width: `${Math.round(ach.progress * 100)}%` }}
              />
            </div>
            {ach.progressLabel && (
              <span className="text-[8px] text-gray-500 tabular-nums shrink-0">{ach.progressLabel}</span>
            )}
          </div>
        )}
      </div>
      {ach.earned && <span className="text-green-400 text-[10px] font-bold shrink-0">EARNED</span>}
    </div>
  );
}

export default function AchievementsPanel() {
  const { franchiseHistory } = useLeagueStore();
  const { seasonsManaged, ownerPatience } = useGameStore();

  const achievements = useMemo(
    () => evaluateAchievements(franchiseHistory, seasonsManaged, 0, 0, ownerPatience),
    [franchiseHistory, seasonsManaged, ownerPatience],
  );

  const earned = achievements.filter(a => a.earned);
  const inProgress = achievements.filter(a => !a.earned);

  if (franchiseHistory.length === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>ACHIEVEMENTS</span>
        <span className="text-gray-500 font-normal text-[10px]">
          {earned.length}/{achievements.length} earned
        </span>
      </div>
      <div className="divide-y divide-[#1E2A4A]">
        {earned.map(a => <AchievementCard key={a.id} ach={a} />)}
        {inProgress.slice(0, 5).map(a => <AchievementCard key={a.id} ach={a} />)}
      </div>
    </div>
  );
}
