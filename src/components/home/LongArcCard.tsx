/**
 * LongArcCard.tsx — Displays the franchise's long-term narrative arc.
 * Subtle card with strategic framing.
 */

import type { StoryThread } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';

interface Props {
  thread: StoryThread;
  onNavigate: (tab: NavTab) => void;
}

export default function LongArcCard({ thread, onNavigate }: Props) {
  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="px-3 py-1.5 border-b border-gray-800 flex items-center gap-2">
        <span className="text-sm">{thread.icon}</span>
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: thread.color }}
        >
          THE LONG GAME
        </span>
      </div>
      <div className="p-3">
        <div className="text-gray-200 text-sm font-bold mb-1">{thread.title}</div>
        <div className="text-gray-400 text-xs leading-relaxed mb-3">{thread.body}</div>
        {thread.actionLabel && thread.actionTab && (
          <button
            onClick={() => onNavigate(thread.actionTab as NavTab)}
            className="border border-gray-800 hover:border-gray-600 text-gray-500 hover:text-gray-300 text-[10px] px-3 py-1.5 uppercase tracking-wider transition-colors"
          >
            {thread.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
