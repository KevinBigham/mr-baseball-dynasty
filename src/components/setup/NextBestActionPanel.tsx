/**
 * NextBestActionPanel.tsx — Shows the single most important next action.
 * Used during onboarding to guide the player to their next meaningful move.
 */

import type { CoachStep } from '../../types/briefing';
import type { NavTab } from '../../store/uiStore';

interface Props {
  step: CoachStep | null;
  onNavigate: (tab: NavTab) => void;
}

export default function NextBestActionPanel({ step, onNavigate }: Props) {
  if (!step) {
    return (
      <div className="bloomberg-border bg-gray-900 px-3 py-3">
        <div className="text-gray-500 text-xs">
          You've completed all the initial steps. You're running this franchise now.
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-border bg-orange-950/20 border-orange-900/40">
      <div className="px-3 py-1.5 border-b border-orange-900/30">
        <span className="text-orange-400 text-[10px] font-bold tracking-widest uppercase">
          NEXT BEST ACTION
        </span>
      </div>
      <div className="p-3">
        <div className="text-gray-200 text-sm font-bold mb-1">{step.title}</div>
        <div className="text-gray-400 text-xs leading-relaxed mb-3">{step.body}</div>
        {step.actionTab && (
          <button
            onClick={() => onNavigate(step.actionTab as NavTab)}
            className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-[10px] px-4 py-2 uppercase tracking-widest transition-colors"
          >
            {step.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
