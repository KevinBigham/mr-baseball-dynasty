/**
 * ActionQueuePanel.tsx — Lightweight task queue surface.
 * Shows prioritized action items the player should address.
 */

import type { ActionQueueTask } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';
import ActionQueueItem from './ActionQueueItem';

interface Props {
  tasks: ActionQueueTask[];
  onNavigate: (tab: NavTab) => void;
}

export default function ActionQueuePanel({ tasks, onNavigate }: Props) {
  if (tasks.length === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>ACTION QUEUE</span>
        <span className="text-gray-500 font-normal text-[10px]">
          {tasks.length} ITEM{tasks.length !== 1 ? 'S' : ''}
        </span>
      </div>
      <div className="divide-y divide-gray-800">
        {tasks.slice(0, 6).map(task => (
          <ActionQueueItem
            key={task.id}
            task={task}
            onAction={() => task.actionTab ? onNavigate(task.actionTab as NavTab) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
