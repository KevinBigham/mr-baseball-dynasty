/**
 * pressConference.ts — Post-season press conference question pools
 *
 * Adapted from Mr. Football Dynasty's presser system.
 * Questions are generated contextually from the season result.
 * Each answer has tone + effects on owner patience & team morale.
 */

import type { OwnerArchetype } from '../engine/narrative';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PressTone = 'confident' | 'humble' | 'deflect' | 'bold' | 'honest';

export interface PressAnswer {
  text:  string;
  tone:  PressTone;
  effects: {
    ownerPatience?: number;
    teamMorale?:    number;
    newsHeadline?:  string;
  };
}

export interface PressQuestion {
  id:        string;
  reporter:  string;   // media outlet
  question:  string;
  answers:   PressAnswer[];
}

export interface PressContext {
  wins:             number;
  losses:           number;
  isPlayoff:        boolean;
  isChampion:       boolean;
  ownerArchetype:   OwnerArchetype;
  breakoutHits:     number;    // how many breakout watch candidates hit
  breakoutBusts:    number;
  season:           number;
  seasonsManaged:   number;
  rivalryName?:     string;    // top rival team name, if applicable
  awardWinnerName?: string;    // if user team had an award winner
}

// ─── Question Pools ───────────────────────────────────────────────────────────
// Each question has a condition function — only asked if context matches.

export interface ContextualQuestion {
  id:        string;
  reporter:  string;
  question:  (ctx: PressContext) => string;
  condition: (ctx: PressContext) => boolean;
  answers:   (ctx: PressContext) => PressAnswer[];
}

export const PRESS_QUESTIONS: ContextualQuestion[] = [

  // ── Championship questions ──────────────────────────────────────────────────

  {
    id: 'ws_win',
    reporter: 'MRBD Sports Network',
    question: () => 'You just won the World Series. What does this mean for this franchise and its fans?',
    condition: ctx => ctx.isChampion,
    answers: () => [
      {
        text: '"Every person in that clubhouse believed from day one. We didn\'t just win tonight — we built something."',
        tone: 'confident',
        effects: { ownerPatience: +3, teamMorale: +8, newsHeadline: 'Manager credits the process in Championship speech' },
      },
      {
        text: '"I\'m just grateful. The players did it. All I did was stay out of their way."',
        tone: 'humble',
        effects: { ownerPatience: +2, teamMorale: +6, newsHeadline: 'Manager deflects credit to players after World Series win' },
      },
      {
        text: '"This is a dynasty now. We\'re coming back to defend this thing every single year."',
        tone: 'bold',
        effects: { ownerPatience: +4, teamMorale: +5, newsHeadline: 'Franchise declares dynasty after World Series championship' },
      },
    ],
  },

  {
    id: 'ws_win_run_back',
    reporter: 'The Diamond Report',
    question: ctx => `With a championship in ${ctx.season}, what\'s the plan for next year — defend or rebuild?`,
    condition: ctx => ctx.isChampion,
    answers: () => [
      {
        text: '"We run it back. Same core, same culture. You don\'t break up a championship team."',
        tone: 'confident',
        effects: { ownerPatience: +3, teamMorale: +4 },
      },
      {
        text: '"We evaluate everything in the offseason. Complacency is the enemy of excellence."',
        tone: 'honest',
        effects: { ownerPatience: +2, teamMorale: +2 },
      },
      {
        text: '"Our analytics team is already running models. We\'ll make the best decision for long-term winning."',
        tone: 'deflect',
        effects: { ownerPatience: +1, teamMorale: +1 },
      },
    ],
  },

  // ── Playoff exit questions ──────────────────────────────────────────────────

  {
    id: 'playoff_exit',
    reporter: 'Baseballology Today',
    question: _ctx => `You made the playoffs but got eliminated early. What went wrong, and how do you close the gap?`,
    condition: ctx => ctx.isPlayoff && !ctx.isChampion,
    answers: () => [
      {
        text: '"Postseason is a different animal. We\'ll study what the winning teams did and get there."',
        tone: 'humble',
        effects: { ownerPatience: +1, teamMorale: +2, newsHeadline: 'Manager vows playoff improvement after early exit' },
      },
      {
        text: '"One hot week in October is luck. Over 162 games we proved we\'re elite. We\'ll be back."',
        tone: 'confident',
        effects: { ownerPatience: -1, teamMorale: +3, newsHeadline: 'Controversial take: Manager blames luck for playoff exit' },
      },
      {
        text: '"We had pieces that didn\'t perform when it mattered. That\'s something we\'ll address aggressively."',
        tone: 'honest',
        effects: { ownerPatience: +2, teamMorale: -1, newsHeadline: 'Manager hints at roster shakeup after playoff disappointment' },
      },
    ],
  },

  // ── Missed playoffs questions ───────────────────────────────────────────────

  {
    id: 'missed_playoffs_bad',
    reporter: 'The Hardball Digest',
    question: ctx => `${ctx.wins}-${ctx.losses} and no playoff berth. What\'s your message to the fanbase?`,
    condition: ctx => !ctx.isPlayoff && ctx.wins < 75,
    answers: ctx => [
      {
        text: '"We owe them better. That\'s on me. The accountability starts in this chair."',
        tone: 'honest',
        effects: { ownerPatience: +2, teamMorale: +1, newsHeadline: `Manager takes full responsibility for ${ctx.wins}-win season` },
      },
      {
        text: '"Our young players are developing on schedule. Next year you\'ll see a different team."',
        tone: 'deflect',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'patient_builder' ? +2 : -2,
          teamMorale: +2,
          newsHeadline: 'Manager points to youth movement after disappointing season',
        },
      },
      {
        text: '"The league is tough. Several teams ahead of us had payrolls twice what we\'re working with."',
        tone: 'deflect',
        effects: { ownerPatience: -3, teamMorale: -1, newsHeadline: 'Manager publicly complains about payroll disparity' },
      },
    ],
  },

  {
    id: 'missed_playoffs_fringe',
    reporter: 'MRBD Sports Network',
    question: ctx => `You finished ${ctx.wins}-${ctx.losses}. A few breaks either way and you\'re in. How do you close that gap?`,
    condition: ctx => !ctx.isPlayoff && ctx.wins >= 75 && ctx.wins < 85,
    answers: ctx => [
      {
        text: '"We were right there. Two or three targeted pickups this winter and we\'re a playoff team."',
        tone: 'confident',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'win_now' ? +2 : 0,
          teamMorale: +3,
          newsHeadline: 'Manager eyes aggressive offseason moves to reach playoffs',
        },
      },
      {
        text: '"Health. That\'s it. When our core was healthy we played with anyone. Stay healthy, we\'re in."',
        tone: 'honest',
        effects: { ownerPatience: 0, teamMorale: +2 },
      },
      {
        text: '"Our analytics show we were 3rd in expected wins. The results will catch up to the process."',
        tone: 'deflect',
        effects: { ownerPatience: -1, teamMorale: +1, newsHeadline: 'Manager leans on analytics to explain near-miss season' },
      },
    ],
  },

  // ── Season record questions ─────────────────────────────────────────────────

  {
    id: 'dominant_season',
    reporter: 'Diamond Analytics Weekly',
    question: ctx => `${ctx.wins} wins is an elite season. What clicked this year that hadn\'t before?`,
    condition: ctx => ctx.wins >= 95,
    answers: () => [
      {
        text: '"Depth. Top to bottom, everyone had a role and embraced it. The bench won us 15 games."',
        tone: 'confident',
        effects: { ownerPatience: +2, teamMorale: +5, newsHeadline: 'Manager credits depth for historic season' },
      },
      {
        text: '"Pitching. When you can hold teams under 3 runs, you\'ll win 95 games every year."',
        tone: 'bold',
        effects: { ownerPatience: +2, teamMorale: +4 },
      },
      {
        text: '"Culture. We stopped playing for individual stats and started playing for wins. It shows."',
        tone: 'humble',
        effects: { ownerPatience: +3, teamMorale: +6, newsHeadline: 'Manager attributes dominant season to culture shift' },
      },
    ],
  },

  // ── Prospect / development questions ────────────────────────────────────────

  {
    id: 'prospect_hit',
    reporter: 'The Pipeline Report',
    question: () => 'Several of your prospects made serious jumps this offseason. What\'s driving the development success?',
    condition: ctx => ctx.breakoutHits >= 2,
    answers: () => [
      {
        text: '"Our player development staff is the best in the business. We invest heavily in that pipeline."',
        tone: 'confident',
        effects: { ownerPatience: +3, teamMorale: +3, newsHeadline: 'Franchise lauds development staff after prospect breakouts' },
      },
      {
        text: '"The kids put in the work. We just try not to mess them up. They\'re doing this on their own."',
        tone: 'humble',
        effects: { ownerPatience: +2, teamMorale: +4 },
      },
      {
        text: '"We identified specific mechanical adjustments early. Our analytics track 47 development metrics."',
        tone: 'deflect',
        effects: { ownerPatience: +1, teamMorale: +1, newsHeadline: 'Manager credits data-driven approach for prospect development' },
      },
    ],
  },

  {
    id: 'prospect_bust',
    reporter: 'Prospects International',
    question: () => 'Some highly-touted prospects regressed this offseason. Is there a development program issue?',
    condition: ctx => ctx.breakoutBusts >= 2,
    answers: () => [
      {
        text: '"Player development isn\'t linear. We still believe in these guys. Setbacks are part of the journey."',
        tone: 'humble',
        effects: { ownerPatience: 0, teamMorale: +1 },
      },
      {
        text: '"We\'re evaluating our entire development infrastructure. Changes are coming."',
        tone: 'honest',
        effects: { ownerPatience: +1, teamMorale: -1, newsHeadline: 'Franchise announces development staff shakeup' },
      },
      {
        text: '"Prospect evaluations are long-term by nature. We\'re not panicking over one offseason."',
        tone: 'deflect',
        effects: { ownerPatience: -1, teamMorale: 0 },
      },
    ],
  },

  // ── Owner mandate questions ─────────────────────────────────────────────────

  {
    id: 'owner_win_now',
    reporter: 'Front Office Insider',
    question: () => 'Ownership has made it clear they want to compete now. Do you feel the pressure?',
    condition: ctx => ctx.ownerArchetype === 'win_now' && !ctx.isChampion,
    answers: () => [
      {
        text: '"I embrace it. Pressure is a privilege. We\'re here to win, and I wouldn\'t have it any other way."',
        tone: 'bold',
        effects: { ownerPatience: +3, teamMorale: +2, newsHeadline: 'Manager embraces win-now mandate' },
      },
      {
        text: '"Every manager feels pressure. Mine comes from wanting to win, not from ownership."',
        tone: 'confident',
        effects: { ownerPatience: +1, teamMorale: +1 },
      },
      {
        text: '"Winning sustainably requires some patience. I\'m communicating that message upstairs."',
        tone: 'honest',
        effects: { ownerPatience: -2, teamMorale: +1, newsHeadline: 'Manager pushes back on ownership\'s win-now timeline' },
      },
    ],
  },

  {
    id: 'owner_patience',
    reporter: 'The Farm Report',
    question: ctx => `You\'re in year ${ctx.seasonsManaged} of this rebuild. When does the patience run out?`,
    condition: ctx => ctx.ownerArchetype === 'patient_builder' && !ctx.isPlayoff && ctx.seasonsManaged >= 2,
    answers: () => [
      {
        text: '"The prospects graduating to our big league club this year — that\'s when you\'ll see it turn."',
        tone: 'honest',
        effects: { ownerPatience: +2, teamMorale: +2 },
      },
      {
        text: '"Good teams are built slowly and last a decade. Bad ones are patched quickly and fall apart faster."',
        tone: 'confident',
        effects: { ownerPatience: +3, teamMorale: +1, newsHeadline: 'Manager defends long-term approach over quick fixes' },
      },
      {
        text: '"I understand the question. I\'d be asking it too. We need to see results. Full stop."',
        tone: 'humble',
        effects: { ownerPatience: +1, teamMorale: -1, newsHeadline: 'Manager acknowledges rebuild urgency' },
      },
    ],
  },

  // ── Rivalry question ────────────────────────────────────────────────────────

  {
    id: 'rivalry',
    reporter: 'Division Beat Reporter',
    question: ctx => `The ${ctx.rivalryName ?? 'division'} rivalry is heating up. How do you view that matchup heading into next year?`,
    condition: ctx => !!ctx.rivalryName,
    answers: ctx => [
      {
        text: `"They\'re a good team. But we\'re better. We\'ll prove it over 162 games."`,
        tone: 'bold',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'win_now' ? +2 : 0,
          teamMorale: +3,
          newsHeadline: `Manager sends message directly to ${ctx.rivalryName ?? 'division rival'}`,
        },
      },
      {
        text: '"Every game against them feels like the playoffs. That\'s what makes this division great."',
        tone: 'confident',
        effects: { ownerPatience: +1, teamMorale: +2 },
      },
      {
        text: '"We respect everyone in this division. We focus on ourselves and let the record speak."',
        tone: 'deflect',
        effects: { ownerPatience: 0, teamMorale: +1 },
      },
    ],
  },

  // ── First-year manager ──────────────────────────────────────────────────────

  {
    id: 'first_year',
    reporter: 'MRBD Sports Network',
    question: () => 'Your first season at the helm is complete. What surprised you most about this level?',
    condition: ctx => ctx.seasonsManaged <= 1,
    answers: () => [
      {
        text: '"The depth requirement. You need 13 pitchers capable of performing at any moment. That\'s hard to build."',
        tone: 'honest',
        effects: { ownerPatience: +1, teamMorale: +2 },
      },
      {
        text: '"Nothing surprised me. I\'ve been preparing for this my whole career. We\'re just getting started."',
        tone: 'bold',
        effects: { ownerPatience: +2, teamMorale: +3, newsHeadline: 'New manager declares immediate championship aspirations' },
      },
      {
        text: '"The caliber of the opposing pitching. The margin for error at this level is razor thin."',
        tone: 'humble',
        effects: { ownerPatience: +1, teamMorale: +1 },
      },
    ],
  },

  // ── Legacy / long tenure question ───────────────────────────────────────────

  {
    id: 'legacy',
    reporter: 'Diamond Legacy Network',
    question: ctx => `After ${ctx.seasonsManaged} seasons, what legacy are you trying to build here?`,
    condition: ctx => ctx.seasonsManaged >= 4,
    answers: ctx => [
      {
        text: '"A culture of excellence that outlasts all of us. Players should want to come here and grow."',
        tone: 'humble',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'patient_builder' ? +3 : +1,
          teamMorale: +4,
          newsHeadline: 'Manager focused on building lasting franchise culture',
        },
      },
      {
        text: '"Championships. Banners. That\'s what fans remember 50 years from now."',
        tone: 'bold',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'win_now' ? +3 : +1,
          teamMorale: +2,
        },
      },
      {
        text: '"Developing the next generation of stars. If our guys go on and have great careers, we did our job."',
        tone: 'confident',
        effects: {
          ownerPatience: ctx.ownerArchetype === 'patient_builder' ? +4 : 0,
          teamMorale: +3,
          newsHeadline: 'Manager prioritizes player development as lasting legacy',
        },
      },
    ],
  },

  // ── Hot seat question ───────────────────────────────────────────────────────

  {
    id: 'hot_seat',
    reporter: 'Front Office Insider',
    question: () => 'There are reports of ownership frustration. Is your job safe?',
    condition: ctx => !ctx.isPlayoff && ctx.wins < 78 && ctx.seasonsManaged >= 2,
    answers: () => [
      {
        text: '"I\'m not worried about my seat. I\'m worried about getting better. That\'s all I can control."',
        tone: 'confident',
        effects: { ownerPatience: +2, teamMorale: +2 },
      },
      {
        text: '"That\'s a fair question. I need to produce results. I own that."',
        tone: 'honest',
        effects: { ownerPatience: +3, teamMorale: 0, newsHeadline: 'Manager acknowledges job insecurity after disappointing season' },
      },
      {
        text: '"I have full support from ownership. Those reports are inaccurate."',
        tone: 'deflect',
        effects: { ownerPatience: -1, teamMorale: +1 },
      },
    ],
  },
];

// ─── Question selector ─────────────────────────────────────────────────────────
// Picks 3 questions from the eligible pool, with variety across categories.

export function selectPressQuestions(ctx: PressContext): PressQuestion[] {
  const eligible = PRESS_QUESTIONS.filter(q => q.condition(ctx));

  // Shuffle deterministically based on season + wins
  const seed = ctx.season * 137 + ctx.wins * 13;
  const shuffled = [...eligible].sort((a, b) => {
    const ha = ((seed ^ a.id.charCodeAt(0) * 31) >>> 0) % 1000;
    const hb = ((seed ^ b.id.charCodeAt(0) * 31) >>> 0) % 1000;
    return ha - hb;
  });

  // Take first 3 unique
  const picked = shuffled.slice(0, 3);

  return picked.map(q => ({
    id:       q.id,
    reporter: q.reporter,
    question: q.question(ctx),
    answers:  q.answers(ctx),
  }));
}
