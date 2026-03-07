/**
 * OpenMysteryCard.tsx — Displays an open question / mystery for the franchise.
 * Purple-accented card that invites exploration.
 */

import type { StoryThread } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';

interface Props {
  thread: StoryThread;
  onNavigate: (tab: NavTab) => void;
}

export default function OpenMysteryCard({ thread, onNavigate }: Props) {
  return (
    <div
      className="bloomberg-border bg-gray-900"
      style={{ borderColor: thread.color + '30' }}
    >
      <div className="px-3 py-1.5 border-b border-gray-800 flex items-center gap-2">
        <span className="text-sm">{thread.icon}</span>
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: thread.color }}
        >
          OPEN QUESTION
        </span>
      </div>
      <div className="p-3">
        <div className="text-gray-200 text-sm font-bold mb-1">{thread.title}</div>
        <div className="text-gray-400 text-xs leading-relaxed mb-3">{thread.body}</div>
        {thread.actionLabel && thread.actionTab && (
          <button
            onClick={() => onNavigate(thread.actionTab as NavTab)}
            className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 text-[10px] px-3 py-1.5 uppercase tracking-wider transition-colors"
          >
            {thread.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
