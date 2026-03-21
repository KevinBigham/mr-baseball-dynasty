/**
 * decisionEngine.ts — Generates 0-3 spotlight decisions based on current game state.
 * Called after each sim advance to surface decisions that need the player's attention.
 * Pure function — no side effects.
 */

import type { SpotlightDecision } from '../components/dashboard/DecisionSpotlight';
import type { InSeasonEvent } from '../hooks/useInSeasonFlow';

interface DecisionContext {
  userTeamId: number;
  injuries: number;          // Players currently on IL
  rosterSpace40Man: number;  // Current 40-man count
  winsAboveFive: number;     // wins - losses (positive = winning, negative = losing)
  pendingEvent: InSeasonEvent | null;
  currentSegment: number;    // -1 to 4
  interrupts: Array<{ type: string; headline: string; detail: string }>;
}

/**
 * Generate spotlight decisions from current game state.
 * Returns 0-3 decisions, prioritized by urgency.
 */
export function generateSpotlightDecisions(ctx: DecisionContext): SpotlightDecision[] {
  const decisions: SpotlightDecision[] = [];

  // ── Injury decisions (always high priority) ──
  if (ctx.injuries >= 2) {
    decisions.push({
      id: 'injury-roster',
      type: 'injury',
      headline: `${ctx.injuries} PLAYERS ON INJURED LIST`,
      context: 'You have roster spots to fill. Call up replacements from the minors or sign a free agent.',
      options: [
        {
          label: 'Review roster & make call-ups',
          description: 'Navigate to the roster screen to promote minor leaguers or DFA to clear space.',
          actionTab: 'team',
          actionSub: 'roster',
        },
        {
          label: 'Check free agent market',
          description: 'Browse available free agents to fill gaps immediately.',
          actionTab: 'frontoffice',
          actionSub: 'freeagency',
        },
      ],
      delegateLabel: 'LET AI FILL SPOTS',
    });
  }

  // ── 40-man roster crunch ──
  if (ctx.rosterSpace40Man >= 39) {
    decisions.push({
      id: 'roster-crunch',
      type: 'callup',
      headline: `40-MAN ROSTER: ${ctx.rosterSpace40Man}/40`,
      context: ctx.rosterSpace40Man >= 40
        ? 'Your 40-man roster is FULL. You must DFA or release a player before making any moves.'
        : 'Nearly full — one move from a roster crunch. Consider clearing space proactively.',
      options: [
        {
          label: 'Manage 40-man roster',
          description: 'Review your roster and designate players for assignment.',
          actionTab: 'team',
          actionSub: 'roster',
        },
        {
          label: 'Explore trades to shed roster spots',
          description: 'Package fringe players in a trade to free space.',
          actionTab: 'frontoffice',
          actionSub: 'trades',
        },
      ],
    });
  }

  // ── Trade deadline approaching (segment 2 = July) ──
  if (ctx.pendingEvent === 'deadline' || ctx.currentSegment === 2) {
    const isBuyer = ctx.winsAboveFive > 5;
    decisions.push({
      id: 'trade-deadline',
      type: 'deadline',
      headline: 'TRADE DEADLINE APPROACHING',
      context: isBuyer
        ? 'You\'re in contention. This is your chance to add a key piece for the playoff push.'
        : 'The season hasn\'t gone as planned. Consider selling veterans for prospects.',
      options: isBuyer ? [
        {
          label: 'Shop for an impact bat or arm',
          description: 'Navigate to the trade center to find a difference-maker.',
          actionTab: 'frontoffice',
          actionSub: 'trades',
        },
        {
          label: 'Stand pat — ride with this roster',
          description: 'Trust your current core and save trade capital for the offseason.',
        },
      ] : [
        {
          label: 'Sell veterans for prospects',
          description: 'Move expensive vets to playoff contenders and stockpile for the future.',
          actionTab: 'frontoffice',
          actionSub: 'trades',
        },
        {
          label: 'Hold — evaluate the stretch run',
          description: 'Keep the roster intact and see if a late-season surge is possible.',
        },
      ],
    });
  }

  // ── September callups ──
  if (ctx.pendingEvent === 'callups') {
    decisions.push({
      id: 'september-callups',
      type: 'callup',
      headline: 'SEPTEMBER ROSTER EXPANSION',
      context: 'Rosters expand in September. Call up your top prospects to audition for next year or add depth for the stretch run.',
      options: [
        {
          label: 'Review minor league roster for callups',
          description: 'Promote your best minor leaguers for a September audition.',
          actionTab: 'team',
          actionSub: 'roster',
        },
        {
          label: 'Focus on pitching reinforcements',
          description: 'Your bullpen has been taxed. Call up fresh arms.',
          actionTab: 'team',
          actionSub: 'roster',
        },
      ],
      delegateLabel: 'LET AI CHOOSE CALLUPS',
    });
  }

  // ── Streak-based rotation decisions ──
  const coldStreak = ctx.interrupts.find(i => i.type === 'cold_streak');
  if (coldStreak && decisions.length < 3) {
    decisions.push({
      id: 'cold-streak-adjust',
      type: 'rotation',
      headline: 'TEAM IN A SLUMP',
      context: coldStreak.detail || 'Your team has been underperforming. Consider lineup or rotation changes.',
      options: [
        {
          label: 'Shake up the lineup',
          description: 'Adjust the batting order to spark the offense.',
          actionTab: 'team',
          actionSub: 'roster',
        },
        {
          label: 'Stay the course',
          description: 'Slumps happen. Trust the talent to bounce back.',
        },
      ],
    });
  }

  // Return at most 3 decisions, sorted by urgency
  return decisions.slice(0, 3);
}
