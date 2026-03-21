/**
 * DecisionSpotlight — Focused modal surfacing 1-3 key decisions after each advance.
 * Presents each decision with context, options, and a "delegate to AI" escape hatch.
 * Bloomberg Terminal aesthetic.
 */

import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';

export type DecisionType = 'injury' | 'callup' | 'trade' | 'rotation' | 'deadline' | 'general';

export interface SpotlightDecision {
  id: string;
  type: DecisionType;
  headline: string;
  context: string;              // What happened
  options: SpotlightOption[];
  delegateLabel?: string;       // "Let AI handle this" text
}

export interface SpotlightOption {
  label: string;
  description: string;          // Projected impact
  actionTab?: string;           // Nav destination (e.g., 'roster')
  actionSub?: string;           // Sub-view
}

const TYPE_ICONS: Record<DecisionType, string> = {
  injury:   '🏥',
  callup:   '📞',
  trade:    '🔄',
  rotation: '⚾',
  deadline: '⏰',
  general:  '📋',
};

const TYPE_COLORS: Record<DecisionType, { border: string; text: string; tag: string }> = {
  injury:   { border: 'border-red-800/60', text: 'text-red-400', tag: 'bg-red-950/30 text-red-400' },
  callup:   { border: 'border-blue-800/60', text: 'text-blue-400', tag: 'bg-blue-950/30 text-blue-400' },
  trade:    { border: 'border-yellow-800/60', text: 'text-yellow-400', tag: 'bg-yellow-950/30 text-yellow-400' },
  rotation: { border: 'border-green-800/60', text: 'text-green-400', tag: 'bg-green-950/30 text-green-400' },
  deadline: { border: 'border-orange-800/60', text: 'text-orange-400', tag: 'bg-orange-950/30 text-orange-400' },
  general:  { border: 'border-gray-700', text: 'text-gray-400', tag: 'bg-gray-800 text-gray-400' },
};

interface Props {
  decisions: SpotlightDecision[];
  onDismiss: () => void;
  onDelegate?: (decisionId: string) => void;
}

export default function DecisionSpotlight({ decisions, onDismiss, onDelegate }: Props) {
  const { navigate } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (decisions.length === 0) return null;

  const decision = decisions[currentIndex];
  const colors = TYPE_COLORS[decision.type] ?? TYPE_COLORS.general;
  const isLast = currentIndex >= decisions.length - 1;
  const total = decisions.length;

  const handleOption = (opt: SpotlightOption) => {
    if (opt.actionTab) {
      navigate(opt.actionTab as any, opt.actionSub);
    }
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleDelegate = () => {
    onDelegate?.(decision.id);
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  return (
    <div className={`bloomberg-border bg-gray-900 ${colors.border}`}>
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>DECISION SPOTLIGHT</span>
          {total > 1 && (
            <span className="text-gray-500 font-normal text-[10px]">
              {currentIndex + 1} of {total}
            </span>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wider ${colors.tag}`}>
          {decision.type.toUpperCase()}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Headline */}
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">{TYPE_ICONS[decision.type]}</span>
          <div>
            <div className={`text-sm font-bold ${colors.text}`}>{decision.headline}</div>
            <div className="text-gray-500 text-xs mt-1">{decision.context}</div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          {decision.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOption(opt)}
              className={`w-full text-left px-3 py-2.5 border ${colors.border} hover:border-orange-500 transition-colors rounded group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-200 text-xs font-bold group-hover:text-orange-400 transition-colors">
                  {opt.label}
                </span>
                {opt.actionTab && (
                  <span className="text-gray-500 text-[9px] tracking-wider">→ {opt.actionTab.toUpperCase()}</span>
                )}
              </div>
              <div className="text-gray-500 text-[10px] mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1E2A4A50]">
          {onDelegate ? (
            <button
              onClick={handleDelegate}
              className="text-gray-500 hover:text-gray-400 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              {decision.delegateLabel ?? 'LET AI HANDLE'}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-400 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            {isLast ? 'DISMISS' : 'SKIP →'}
          </button>
        </div>
      </div>
    </div>
  );
}
