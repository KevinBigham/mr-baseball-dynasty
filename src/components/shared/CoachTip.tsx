/**
 * CoachTip — Golden first-visit contextual tip banner.
 * Appears once per section, dismisses permanently via localStorage.
 * Ported from MFD's Coach Tips concept.
 */

import { useState } from 'react';
import { COACH_TIPS, isTipDismissed, dismissTip } from '../../data/coachTips';
import { useGameStore } from '../../store/gameStore';

interface CoachTipProps {
  section: string;
}

export default function CoachTip({ section }: CoachTipProps) {
  const [dismissed, setDismissed] = useState(() => isTipDismissed(section));
  const tutorialActive = useGameStore(s => s.tutorialActive);

  // Don't show during active tutorial or if already dismissed
  if (dismissed || tutorialActive) return null;

  const tip = COACH_TIPS[section];
  if (!tip) return null;

  const handleDismiss = () => {
    dismissTip(section);
    setDismissed(true);
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg mb-4 transition-all"
      style={{
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderLeft: '4px solid #fbbf24',
      }}
    >
      <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-yellow-500 text-[10px] font-black tracking-widest">COACH SAYS</span>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">{tip.tip}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-gray-500 hover:text-gray-400 transition-colors text-xs px-1"
        aria-label="Dismiss tip"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
