/**
 * FirstWeekCoach.tsx — "Coach me through week one" onboarding layer.
 * Teaches through real baseball decisions that are actually possible right now.
 * Only shows for first-season players. Dismissable.
 * Steps target only actions available on the current branch.
 */

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { buildCoachSteps } from '../../utils/briefingAdapter';
import NextBestActionPanel from './NextBestActionPanel';
import GlossaryInlineTip from '../shared/GlossaryInlineTip';
import { GLOSSARY } from '../../utils/briefingAdapter';

export default function FirstWeekCoach() {
  const { gamePhase, seasonsManaged } = useGameStore();
  const { roster, standings } = useLeagueStore();
  const { setActiveTab } = useUIStore();
  const [dismissed, setDismissed] = useState(false);

  const steps = useMemo(() => buildCoachSteps({
    gamePhase,
    seasonsManaged,
    roster,
    standings: standings?.standings ?? null,
  }), [gamePhase, seasonsManaged, roster, standings]);

  // Don't show for experienced players or if dismissed
  if (seasonsManaged > 0 || dismissed || steps.length === 0) return null;

  const completedCount = steps.filter(s => s.completed).length;
  const nextStep = steps.find(s => !s.completed) ?? null;

  const handleNavigate = (tab: NavTab) => setActiveTab(tab);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>WEEK ONE — FRONT OFFICE ORIENTATION</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-400 text-[10px] transition-colors"
        >
          DISMISS
        </button>
      </div>
      <div className="p-3 space-y-3">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-[10px] tabular-nums shrink-0">
            {completedCount}/{steps.length}
          </span>
        </div>

        {/* Step checklist */}
        <div className="space-y-1">
          {steps.map(step => (
            <div
              key={step.id}
              className="flex items-center gap-2 text-xs"
            >
              <span className={step.completed ? 'text-green-500' : 'text-gray-700'}>
                {step.completed ? '●' : '○'}
              </span>
              <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Key terms for new GMs */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">KEY TERMS</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <GlossaryInlineTip term="40-Man" definition={GLOSSARY['40-man']} />
            <GlossaryInlineTip term="DFA" definition={GLOSSARY['dfa']} />
            <GlossaryInlineTip term="Option" definition={GLOSSARY['option']} />
            <GlossaryInlineTip term="Owner Patience" definition={GLOSSARY['owner patience']} />
          </div>
        </div>

        {/* Next best action */}
        <NextBestActionPanel step={nextStep} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
