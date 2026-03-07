/**
 * ActionQueueItem.tsx — Single item in the action queue.
 * Color-coded by priority with inline action button.
 */

import type { ActionQueueTask } from '../../types/briefing';

const PRIORITY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  critical: { border: 'border-red-800', text: 'text-red-400', bg: 'bg-red-950/20' },
  high:     { border: 'border-orange-800', text: 'text-orange-400', bg: 'bg-orange-950/10' },
  medium:   { border: 'border-gray-700', text: 'text-gray-300', bg: '' },
  low:      { border: 'border-gray-800', text: 'text-gray-400', bg: '' },
};

interface Props {
  task: ActionQueueTask;
  onAction: () => void;
}

export default function ActionQueueItem({ task, onAction }: Props) {
  const colors = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;

  return (
    <div className={`px-3 py-2 flex items-center gap-3 ${colors.bg}`}>
      <span className="text-sm shrink-0">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold ${colors.text}`}>{task.title}</div>
        <div className="text-gray-500 text-[10px] truncate">{task.subtitle}</div>
      </div>
      {task.deadline && (
        <span className="text-[10px] text-gray-500 shrink-0">{task.deadline}</span>
      )}
      <button
        onClick={onAction}
        className={`shrink-0 border ${colors.border} hover:border-orange-500 text-[10px] px-2 py-1 uppercase tracking-wider transition-colors ${colors.text} hover:text-orange-400`}
      >
        {task.actionLabel}
      </button>
    </div>
  );
}
