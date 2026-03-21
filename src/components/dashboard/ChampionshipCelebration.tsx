/**
 * ChampionshipCelebration.tsx — Multi-step World Series championship sequence.
 * Triggered when the user's team wins the World Series.
 * Steps: darken → banner drop → confetti → sound → MVP → summary → trophy case.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSound } from '../../hooks/useSound';
import { usePreferencesStore } from '../../store/preferencesStore';
import Confetti from './Confetti';

interface ChampionshipProps {
  season: number;
  teamName: string;
  wins: number;
  losses: number;
  mvpName: string | null;
  mvpPosition: string | null;
  mvpStatLine: string | null;
  playoffPath: string;  // e.g., "WC → DS → CS → WS"
  onDismiss: () => void;
}

type CelebrationStep = 'darken' | 'banner' | 'confetti' | 'mvp' | 'summary' | 'done';

export default function ChampionshipCelebration({
  season, teamName, wins, losses,
  mvpName, mvpPosition, mvpStatLine, playoffPath,
  onDismiss,
}: ChampionshipProps) {
  const [step, setStep] = useState<CelebrationStep>('darken');
  const { play } = useSound();
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      // Skip animation sequence — go straight to summary
      setStep('summary');
      void play('playChime');
      return;
    }

    // Step 1: darken (1s)
    const t1 = setTimeout(() => setStep('banner'), 1000);
    // Step 2: banner drop + sound (after 1s)
    const t2 = setTimeout(() => {
      setStep('confetti');
      void play('playChime');
    }, 2000);
    // Step 3: confetti + MVP (after 3s)
    const t3 = setTimeout(() => setStep('mvp'), 3500);
    // Step 4: summary (after 5s)
    const t4 = setTimeout(() => setStep('summary'), 5500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [play, reduceMotion]);

  const handleDismiss = useCallback(() => {
    setStep('done');
    onDismiss();
  }, [onDismiss]);

  if (step === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="World Series Championship Celebration"
    >
      {/* Overlay darken */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-1000"
        style={{ opacity: step === 'darken' ? 0.3 : 0.85 }}
      />

      {/* Confetti */}
      {(step === 'confetti' || step === 'mvp' || step === 'summary') && <Confetti />}

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto px-6">
        {/* Banner */}
        {step !== 'darken' && (
          <div className={`${reduceMotion ? '' : 'mbd-scale-pop'}`}>
            <div className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] mb-2">
              {season} WORLD SERIES
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight"
              style={{ fontFamily: 'Inter, system-ui, sans-serif', textShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}
            >
              CHAMPIONS
            </div>
            <div className="text-orange-400 text-lg font-bold tracking-wider mt-2">
              {teamName}
            </div>
            <div className="text-gray-400 text-sm tabular-nums mt-1">
              {wins}–{losses}
            </div>
          </div>
        )}

        {/* MVP */}
        {(step === 'mvp' || step === 'summary') && mvpName && (
          <div className={`mt-8 ${reduceMotion ? '' : 'mbd-slide-up'}`}>
            <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] mb-1">
              WORLD SERIES MVP
            </div>
            <div className="bloomberg-border bg-[#0F1930] p-4 inline-block">
              <div className="text-orange-400 text-sm font-bold">{mvpName}</div>
              <div className="text-gray-500 text-xs">{mvpPosition}</div>
              {mvpStatLine && (
                <div className="text-gray-400 text-xs tabular-nums mt-1">{mvpStatLine}</div>
              )}
            </div>
          </div>
        )}

        {/* Summary + dismiss */}
        {step === 'summary' && (
          <div className={`mt-8 space-y-4 ${reduceMotion ? '' : 'mbd-fade-in'}`}>
            <div className="text-gray-500 text-xs">
              {playoffPath}
            </div>
            <button
              onClick={handleDismiss}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-8 py-3 uppercase tracking-widest rounded transition-colors"
            >
              ADD TO TROPHY CASE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
