import { useState, useEffect, useCallback, useRef } from 'react';
import { TUTORIAL_STEPS, getNextTutorialStep, type TutorialStep } from '../../engine/tutorial';

const STORAGE_KEY = 'mrbd_tutorial_steps';

function loadCompletedSteps(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore corrupt data */ }
  return new Set();
}

function saveCompletedSteps(steps: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...steps]));
  } catch { /* quota exceeded — ignore */ }
}

interface Props {
  currentPhase: string;
  enabled: boolean;
  onDisable: () => void;
}

export default function TutorialOverlay({ currentPhase, enabled, onDisable }: Props) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(loadCompletedSteps);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [visible, setVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

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

  // Compute highlight rect when step has a highlight selector
  useEffect(() => {
    if (!currentStep?.highlight) {
      setHighlightRect(null);
      return;
    }
    // Delay a frame so DOM is ready
    rafRef.current = requestAnimationFrame(() => {
      const el = document.querySelector(currentStep.highlight!);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentStep]);

  const handleGotIt = useCallback(() => {
    if (!currentStep) return;
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(currentStep.id);
      saveCompletedSteps(next);
      return next;
    });
    setVisible(false);
    setHighlightRect(null);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    const all = new Set(TUTORIAL_STEPS.map(s => s.id));
    setCompletedSteps(all);
    saveCompletedSteps(all);
    setVisible(false);
    setHighlightRect(null);
    onDisable();
  }, [onDisable]);

  if (!visible || !currentStep) return null;

  // Position card relative to highlighted element or use default position
  let cardPositionClass: string;
  let cardStyle: React.CSSProperties = {};

  if (highlightRect) {
    // Position below highlighted element if it's in the top half, above if bottom half
    const belowTarget = highlightRect.bottom + 16;
    const isTopHalf = highlightRect.top < window.innerHeight / 2;
    cardPositionClass = 'absolute left-1/2 -translate-x-1/2';
    cardStyle = {
      top: isTopHalf ? `${belowTarget}px` : undefined,
      bottom: isTopHalf ? undefined : `${window.innerHeight - highlightRect.top + 16}px`,
    };
  } else {
    cardPositionClass = currentStep.position === 'top'
      ? 'absolute left-1/2 -translate-x-1/2 top-4'
      : currentStep.position === 'bottom'
      ? 'absolute left-1/2 -translate-x-1/2 bottom-4'
      : 'absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2';
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop — either spotlight cutout or plain overlay */}
      {highlightRect ? (
        <div
          className="absolute pointer-events-auto rounded"
          onClick={handleGotIt}
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            zIndex: 1,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleGotIt} />
      )}

      {/* Tutorial card */}
      <div
        className={`${cardPositionClass} w-full max-w-md pointer-events-auto`}
        style={{ ...cardStyle, zIndex: 2 }}
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
