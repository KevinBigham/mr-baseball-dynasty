/**
 * PressConference.tsx — Post-season press conference modal
 *
 * Adapted from Mr. Football Dynasty v98's presser system.
 * 3 questions drawn from contextual pool → pick an answer → effects applied.
 */

import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import {
  selectPressQuestions,
  type PressQuestion,
  type PressAnswer,
  type PressContext,
} from '../../data/pressConference';
import { getTopRival } from '../../engine/rivalry';
import type { ArcType } from '../../engine/storyboard';

// ─── Arc-aware intro flavor text ──────────────────────────────────────────────
const ARC_FLAVOR: Partial<Record<ArcType, string>> = {
  dynasty_peak:    'Your dynasty is the talk of baseball. The reporters lean in.',
  dynasty_defense: 'As defending champions, every question carries extra weight.',
  dynasty_rising:  'The franchise trajectory has caught the attention of the national media.',
  contender:       'Expectations were high going in. The press wants accountability.',
  window_closing:  'With the core aging, the questions carry urgency this year.',
  last_stand:      'The hot seat narrative dominates the room before you even sit down.',
  rebuild_begins:  'Fans are wondering about the direction. The press reflects that.',
  rebuild_progress:'The rebuild story is evolving. Progress is being tracked.',
  bounce_back:     'After last year\'s disappointment, the room is watching for signals.',
  dark_horse:      'Nobody expected this team here. The press is intrigued.',
  underdog:        'The underdog label follows this franchise into every press room.',
  transition:      'A franchise in transition. The media wants to know what comes next.',
  year_one:        'Your first press conference. The blank slate works in your favor.',
};

// ─── Tone badge ───────────────────────────────────────────────────────────────

const TONE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  confident: { label: 'CONFIDENT', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
  humble:    { label: 'HUMBLE',    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  deflect:   { label: 'DEFLECT',   color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  bold:      { label: 'BOLD',      color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  honest:    { label: 'HONEST',    color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
};

function ToneBadge({ tone }: { tone: string }) {
  const s = TONE_STYLE[tone] ?? TONE_STYLE.deflect;
  return (
    <span
      className="text-xs font-bold px-1.5 py-0.5 rounded tracking-wider"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}
    >
      {s.label}
    </span>
  );
}

// ─── Effect preview ───────────────────────────────────────────────────────────

function EffectBadge({ label, value }: { label: string; value: number }) {
  const positive = value > 0;
  const color = positive ? '#4ade80' : '#ef4444';
  return (
    <span className="text-xs font-mono tabular-nums" style={{ color }}>
      {label} {positive ? '+' : ''}{value}
    </span>
  );
}

// ─── Single question card ─────────────────────────────────────────────────────

function QuestionCard({
  q, qIndex, total, chosen, onChoose, revealed,
}: {
  q:         PressQuestion;
  qIndex:    number;
  total:     number;
  chosen:    PressAnswer | null;
  onChoose:  (a: PressAnswer) => void;
  revealed:  boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
            {qIndex + 1}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-gray-500 text-xs mb-1 tracking-wider">{q.reporter.toUpperCase()}</div>
          <div className="text-gray-200 text-sm font-bold leading-snug">"{q.question}"</div>
        </div>
        <div className="text-gray-700 text-xs shrink-0">{qIndex + 1}/{total}</div>
      </div>

      {/* Answer options */}
      <div className="space-y-2 pl-9">
        {q.answers.map((a, i) => {
          const isChosen   = chosen?.text === a.text;
          const isRevealed = revealed && isChosen;

          return (
            <div
              key={i}
              onClick={() => !chosen && onChoose(a)}
              className="rounded-lg p-3 transition-all duration-150"
              style={{
                cursor:     chosen ? 'default' : 'pointer',
                background: isChosen
                  ? 'rgba(249,115,22,0.10)'
                  : chosen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                border: isChosen
                  ? '1px solid rgba(249,115,22,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                opacity: chosen && !isChosen ? 0.45 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-gray-200 text-xs leading-relaxed">{a.text}</div>
                  {isRevealed && a.effects.newsHeadline && (
                    <div className="mt-2 text-xs text-orange-400 italic">
                      📰 "{a.effects.newsHeadline}"
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <ToneBadge tone={a.tone} />
                  {isRevealed && (
                    <div className="flex gap-2 flex-wrap justify-end mt-1">
                      {a.effects.ownerPatience != null && a.effects.ownerPatience !== 0 && (
                        <EffectBadge label="Owner" value={a.effects.ownerPatience} />
                      )}
                      {a.effects.teamMorale != null && a.effects.teamMorale !== 0 && (
                        <EffectBadge label="Morale" value={a.effects.teamMorale} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Press Conference component ─────────────────────────────────────────

export default function PressConference({
  context,
  onClose,
  arcType,
}: {
  context: PressContext;
  onClose: () => void;
  arcType?: ArcType;
}) {
  const { adjustOwnerPatience, adjustTeamMorale } = useGameStore();
  const { addNewsItems, setPresserDone }           = useLeagueStore();
  const topRival = getTopRival(useLeagueStore(s => s.rivals));

  const contextWithRival: PressContext = {
    ...context,
    rivalryName: topRival ? topRival.rivalName : undefined,
  };

  const [questions]      = useState(() => selectPressQuestions(contextWithRival));
  const [answers, setAnswers] = useState<(PressAnswer | null)[]>(
    () => new Array(questions.length).fill(null)
  );
  const [step,    setStep]    = useState(0);  // which question we're on
  const [done,    setDone]    = useState(false);
  const [summary, setSummary] = useState<{ ownerDelta: number; moraleDelta: number; headlines: string[] } | null>(null);

  const chooseAnswer = useCallback((a: PressAnswer) => {
    const newAnswers = [...answers];
    newAnswers[step] = a;
    setAnswers(newAnswers);
  }, [answers, step]);

  const nextQuestion = useCallback(() => {
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Calculate totals and apply effects
      let ownerDelta  = 0;
      let moraleDelta = 0;
      const headlines: string[] = [];

      for (const a of answers) {
        if (!a) continue;
        ownerDelta  += a.effects.ownerPatience ?? 0;
        moraleDelta += a.effects.teamMorale    ?? 0;
        if (a.effects.newsHeadline) headlines.push(a.effects.newsHeadline);
      }

      adjustOwnerPatience(ownerDelta);
      adjustTeamMorale(moraleDelta);

      if (headlines.length > 0) {
        addNewsItems(headlines.map((h, i) => ({
          id:       `presser-${context.season}-${i}`,
          headline: h,
          body:     `From the post-season press conference. Season ${context.season}.`,
          type:     'milestone' as const,
          icon:     '🎤',
          priority: 2,
          season:   context.season,
        })));
      }

      setSummary({ ownerDelta, moraleDelta, headlines });
      setDone(true);
    }
  }, [step, questions.length, answers, adjustOwnerPatience, adjustTeamMorale, addNewsItems, context.season]);

  const handleClose = useCallback(() => {
    setPresserDone(true);
    onClose();
  }, [setPresserDone, onClose]);

  const currentAnswer = answers[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
        style={{ background: '#0a0a0f', border: '1px solid rgba(249,115,22,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between"
          style={{ background: 'rgba(249,115,22,0.06)' }}>
          <div>
            <div className="text-orange-500 font-black text-sm tracking-widest uppercase">
              🎤 POST-SEASON PRESS CONFERENCE
            </div>
            <div className="text-gray-500 text-xs mt-0.5">Season {context.season} · {context.wins}–{context.losses}</div>
          </div>
          <div className="text-gray-700 text-xs">
            {done ? 'Complete' : `Question ${step + 1} of ${questions.length}`}
          </div>
        </div>

        {/* Arc-aware flavor intro */}
        {arcType && ARC_FLAVOR[arcType] && step === 0 && !done && (
          <div className="px-6 py-2 border-b border-gray-800/50">
            <div className="text-gray-500 text-xs italic leading-relaxed">{ARC_FLAVOR[arcType]}</div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">
          {!done ? (
            <div className="space-y-5">
              <QuestionCard
                q={questions[step]}
                qIndex={step}
                total={questions.length}
                chosen={currentAnswer}
                onChoose={chooseAnswer}
                revealed={!!currentAnswer}
              />

              {currentAnswer && (
                <div className="flex justify-end">
                  <button
                    onClick={nextQuestion}
                    className="font-black text-sm px-6 py-2.5 uppercase tracking-widest transition-colors"
                    style={{ background: '#f97316', color: '#000', borderRadius: 6 }}
                  >
                    {step < questions.length - 1 ? 'NEXT QUESTION →' : 'WRAP IT UP ✓'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ── Summary screen ────────────────────────────────────────────────
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="text-2xl">🎤</div>
                <div className="text-orange-400 font-black text-lg">PRESSER COMPLETE</div>
                <div className="text-gray-500 text-xs">The media cycle has spoken</div>
              </div>

              {/* Effects summary */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${summary!.ownerDelta >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  <div className="text-gray-500 text-xs mb-1">OWNER PATIENCE</div>
                  <div
                    className="font-black text-2xl tabular-nums"
                    style={{ color: summary!.ownerDelta >= 0 ? '#4ade80' : '#ef4444' }}
                  >
                    {summary!.ownerDelta >= 0 ? '+' : ''}{summary!.ownerDelta}
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${summary!.moraleDelta >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  <div className="text-gray-500 text-xs mb-1">TEAM MORALE</div>
                  <div
                    className="font-black text-2xl tabular-nums"
                    style={{ color: summary!.moraleDelta >= 0 ? '#4ade80' : '#ef4444' }}
                  >
                    {summary!.moraleDelta >= 0 ? '+' : ''}{summary!.moraleDelta}
                  </div>
                </div>
              </div>

              {/* Generated headlines */}
              {summary!.headlines.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-gray-600 text-xs uppercase tracking-widest">Media Coverage</div>
                  {summary!.headlines.map((h, i) => (
                    <div key={i} className="text-xs text-orange-400 flex gap-2 items-start">
                      <span className="shrink-0">📰</span>
                      <span className="italic">"{h}"</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-3 font-black text-sm uppercase tracking-widest transition-colors"
                style={{ background: '#f97316', color: '#000', borderRadius: 6 }}
              >
                HEAD TO THE OFFSEASON →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
