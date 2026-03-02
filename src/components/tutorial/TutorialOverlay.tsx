import { useState, useEffect, useCallback } from 'react';
import { TUTORIAL_STEPS, getNextTutorialStep, type TutorialStep } from '../../engine/tutorial';

interface Props {
  currentPhase: string;
  enabled: boolean;
  onDisable: () => void;
}

export default function TutorialOverlay({ currentPhase, enabled, onDisable }: Props) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [visible, setVisible] = useState(false);

  // Find the next relevant step when phase changes
  useEffect(() => {
    if (!enabled) {
      setCurrentStep(null);
      return;
    }
    const next = getNextTutorialStep(completedSteps, currentPhase);
    if (next) {
      setCurrentStep(next);
      setVisible(true);
    } else {
      setCurrentStep(null);
      setVisible(false);
    }
  }, [enabled, currentPhase, completedSteps]);

  const handleGotIt = useCallback(() => {
    if (!currentStep) return;
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(currentStep.id);
      return next;
    });
    setVisible(false);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    // Mark all steps as completed
    setCompletedSteps(new Set(TUTORIAL_STEPS.map(s => s.id)));
    setVisible(false);
    onDisable();
  }, [onDisable]);

  if (!visible || !currentStep) return null;

  const positionClass = currentStep.position === 'top'
    ? 'top-4' : currentStep.position === 'bottom'
    ? 'bottom-4' : 'top-1/2 -translate-y-1/2';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleGotIt} />

      {/* Tutorial card */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${positionClass} w-full max-w-md pointer-events-auto`}
      >
        <div
          className="mx-4 rounded-lg border shadow-2xl"
          style={{
            background: '#111827',
            borderColor: 'rgba(234,88,12,0.5)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <span className="text-orange-400 font-black text-xs tracking-widest">
              {currentStep.title.toUpperCase()}
            </span>
            <span className="text-gray-500 text-xs">
              {completedSteps.size + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentStep.message}
            </p>
          </div>

          {/* Actions */}
          <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-500 text-xs hover:text-gray-400 transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleGotIt}
              className="px-4 py-1 rounded font-bold text-xs tracking-widest"
              style={{ background: '#ea580c', color: '#fff' }}
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
