/**
 * ActionQueuePanel.tsx — Lightweight task queue surface.
 * Shows prioritized action items the player should address.
 * Degrades gracefully: shows honest empty state when no actions pending.
 */

import type { ActionQueueTask } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';
import ActionQueueItem from './ActionQueueItem';

interface Props {
  tasks: ActionQueueTask[];
  onNavigate: (tab: NavTab) => void;
}

export default function ActionQueuePanel({ tasks, onNavigate }: Props) {
  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>ACTION QUEUE</span>
        <span className="text-gray-500 font-normal text-[10px]">
          {tasks.length > 0
            ? `${tasks.length} ITEM${tasks.length !== 1 ? 'S' : ''}`
            : 'CLEAR'}
        </span>
      </div>
      {tasks.length > 0 ? (
        <div className="divide-y divide-gray-800">
          {tasks.slice(0, 6).map(task => (
            <ActionQueueItem
              key={task.id}
              task={task}
              onAction={() => task.actionTab ? onNavigate(task.actionTab as NavTab) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-center">
          <div className="text-gray-500 text-xs mb-1">No pending actions.</div>
          <div className="text-gray-700 text-[10px]">
            Your roster is legal and no urgent decisions are needed right now. Simulate games or explore strategy.
          </div>
        </div>
      )}
    </div>
  );
}
