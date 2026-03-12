/**
 * UrgentProblemCard.tsx — Displays the most pressing franchise issue.
 * Red/orange alert card with action button.
 */

import type { StoryThread } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';

interface Props {
  thread: StoryThread;
  onNavigate: (tab: NavTab) => void;
}

export default function UrgentProblemCard({ thread, onNavigate }: Props) {
  return (
    <div
      className="bloomberg-border bg-gray-900"
      style={{ borderColor: thread.color + '40' }}
    >
      <div
        className="px-3 py-1.5 border-b border-gray-800 flex items-center gap-2"
        style={{ backgroundColor: thread.color + '10' }}
      >
        <span className="text-sm">{thread.icon}</span>
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: thread.color }}
        >
          URGENT
        </span>
      </div>
      <div className="p-3">
        <div className="text-gray-200 text-sm font-bold mb-1">{thread.title}</div>
        <div className="text-gray-400 text-xs leading-relaxed mb-3">{thread.body}</div>
        {thread.actionLabel && thread.actionTab && (
          <button
            onClick={() => onNavigate(thread.actionTab as NavTab)}
            className="bloomberg-btn text-[10px]"
          >
            {thread.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
