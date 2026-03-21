/**
 * ActionQueueItem.tsx — Single item in the action queue.
 * Color-coded by priority with inline action button.
 */

import type { ActionQueueTask } from '../../types/briefing';

const PRIORITY_COLORS: Record<string, { border: string; text: string; bg: string; indicator: string }> = {
  critical: { border: 'border-red-800', text: 'text-red-400', bg: 'bg-red-950/20', indicator: 'bg-red-500' },
  high:     { border: 'border-yellow-800', text: 'text-yellow-400', bg: 'bg-yellow-950/10', indicator: 'bg-yellow-500' },
  medium:   { border: 'border-blue-800', text: 'text-blue-300', bg: 'bg-blue-950/10', indicator: 'bg-blue-500' },
  low:      { border: 'border-gray-800', text: 'text-gray-400', bg: '', indicator: 'bg-gray-600' },
};

interface Props {
  task: ActionQueueTask;
  onAction: () => void;
}

export default function ActionQueueItem({ task, onAction }: Props) {
  const colors = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;

  return (
    <div className={`px-3 py-2 flex items-center gap-3 ${colors.bg} ${task.priority === 'critical' ? 'mbd-attention-pulse' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.indicator}`} />
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
