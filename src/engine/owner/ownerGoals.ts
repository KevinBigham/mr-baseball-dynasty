/**
 * Owner & GM Goals System — Mr. Baseball Dynasty
 *
 * Models front office expectations and job security:
 *   - Owner archetypes with different priorities
 *   - Seasonal goals (win total, playoff appearance, budget compliance)
 *   - GM job security score (0-100, fired at 0)
 *   - Organizational mandate (win now, competitive, rebuild)
 *   - Budget allocation preferences
 *   - End-of-season evaluation with consequences
 *
 * Inspired by OOTP's owner goals / job security system.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type OwnerArchetype = 'win_now' | 'patient_builder' | 'penny_pincher' | 'big_spender' | 'balanced';
export type Mandate = 'championship' | 'playoff_contender' | 'competitive' | 'rebuild' | 'full_rebuild';

export interface OwnerProfile {
  archetype:        OwnerArchetype;
  name:             string;
  patience:         number;   // 0-100 (how long they'll wait for results)
  spendingWilling:  number;   // 0-100 (willingness to spend on payroll)
  devFocus:         number;   // 0-100 (preference for homegrown talent)
  fanRelations:     number;   // 0-100 (importance of fan satisfaction)
}

export interface SeasonGoal {
  type:       'wins' | 'playoffs' | 'championship' | 'budget' | 'prospects' | 'attendance';
  target:     string;     // Human-readable target
  threshold:  number;     // Numeric threshold
  weight:     number;     // Importance (0-1)
  met:        boolean;
  actual?:    number;     // Actual result
}

export interface GMEvaluation {
  season:           number;
  overallGrade:     string;    // A+ through F
  jobSecurity:      number;    // 0-100 (updated)
  goalsResult:      SeasonGoal[];
  ownerStatement:   string;    // Owner's public statement
  mandateChange?:   Mandate;   // If mandate changed
  fired:            boolean;
  bonusEarned:      number;    // $ bonus for exceeding expectations
}

export interface OwnerGoalsState {
  owner:          OwnerProfile;
  mandate:        Mandate;
  jobSecurity:    number;     // 0-100
  yearsAsGM:      number;
  seasonGoals:    SeasonGoal[];
  evaluations:    GMEvaluation[];
}

// ─── Owner archetypes ───────────────────────────────────────────────────────────

const ARCHETYPES: Record<OwnerArchetype, Omit<OwnerProfile, 'name'>> = {
  win_now: {
    archetype: 'win_now',
    patience: 25,
    spendingWilling: 85,
    devFocus: 30,
    fanRelations: 70,
  },
  patient_builder: {
    archetype: 'patient_builder',
    patience: 80,
    spendingWilling: 55,
    devFocus: 85,
    fanRelations: 50,
  },
  penny_pincher: {
    archetype: 'penny_pincher',
    patience: 60,
    spendingWilling: 20,
    devFocus: 70,
    fanRelations: 40,
  },
  big_spender: {
    archetype: 'big_spender',
    patience: 35,
    spendingWilling: 95,
    devFocus: 25,
    fanRelations: 80,
  },
  balanced: {
    archetype: 'balanced',
    patience: 55,
    spendingWilling: 60,
    devFocus: 55,
    fanRelations: 60,
  },
};

const OWNER_NAMES = [
  'Harold Sterling', 'James Whitfield', 'Richard Harmon', 'Charles Pemberton',
  'Edward Blackwell', 'William Thornton', 'George Ashford', 'Robert Kingsley',
  'Frederick Crane', 'Thomas Wexford', 'Arthur Prescott', 'Victor DuPont',
];

// ─── Generate owner profile ────────────────────────────────────────────────────

export function generateOwner(archetype: OwnerArchetype, rand: () => number): OwnerProfile {
  const base = ARCHETYPES[archetype];
  return {
    ...base,
    name: OWNER_NAMES[Math.floor(rand() * OWNER_NAMES.length)],
    // Add some randomness to base values
    patience: clamp(base.patience + Math.round((rand() - 0.5) * 20), 10, 95),
    spendingWilling: clamp(base.spendingWilling + Math.round((rand() - 0.5) * 20), 10, 95),
  };
}

// ─── Generate seasonal goals based on mandate ───────────────────────────────────

export function generateSeasonGoals(
  mandate: Mandate,
  _owner: OwnerProfile,
  previousWins: number,
): SeasonGoal[] {
  const goals: SeasonGoal[] = [];

  switch (mandate) {
    case 'championship':
      goals.push(
        { type: 'wins', target: '90+ wins', threshold: 90, weight: 0.3, met: false },
        { type: 'playoffs', target: 'Make playoffs', threshold: 1, weight: 0.3, met: false },
        { type: 'championship', target: 'Win World Series', threshold: 1, weight: 0.3, met: false },
        { type: 'budget', target: 'Stay under luxury tax', threshold: 1, weight: 0.1, met: false },
      );
      break;
    case 'playoff_contender':
      goals.push(
        { type: 'wins', target: '85+ wins', threshold: 85, weight: 0.35, met: false },
        { type: 'playoffs', target: 'Make playoffs', threshold: 1, weight: 0.35, met: false },
        { type: 'budget', target: 'Stay under budget', threshold: 1, weight: 0.15, met: false },
        { type: 'prospects', target: 'Develop 2+ prospects', threshold: 2, weight: 0.15, met: false },
      );
      break;
    case 'competitive':
      goals.push(
        { type: 'wins', target: `${Math.max(75, previousWins - 2)}+ wins`, threshold: Math.max(75, previousWins - 2), weight: 0.35, met: false },
        { type: 'budget', target: 'Stay under budget', threshold: 1, weight: 0.25, met: false },
        { type: 'prospects', target: 'Develop 3+ prospects', threshold: 3, weight: 0.25, met: false },
        { type: 'attendance', target: 'Maintain fan interest', threshold: 1, weight: 0.15, met: false },
      );
      break;
    case 'rebuild':
      goals.push(
        { type: 'prospects', target: 'Develop 4+ prospects', threshold: 4, weight: 0.35, met: false },
        { type: 'budget', target: 'Keep payroll low', threshold: 1, weight: 0.30, met: false },
        { type: 'wins', target: 'Show improvement', threshold: Math.max(60, previousWins + 3), weight: 0.20, met: false },
        { type: 'attendance', target: 'Maintain some fan interest', threshold: 1, weight: 0.15, met: false },
      );
      break;
    case 'full_rebuild':
      goals.push(
        { type: 'prospects', target: 'Stockpile 5+ prospects', threshold: 5, weight: 0.40, met: false },
        { type: 'budget', target: 'Slash payroll', threshold: 1, weight: 0.35, met: false },
        { type: 'wins', target: 'Any improvement', threshold: Math.max(55, previousWins), weight: 0.15, met: false },
        { type: 'attendance', target: 'Survive fan backlash', threshold: 1, weight: 0.10, met: false },
      );
      break;
  }

  return goals;
}

// ─── Evaluate season results ────────────────────────────────────────────────────

export function evaluateSeason(
  state: OwnerGoalsState,
  season: number,
  wins: number,
  _losses: number,
  madePlayoffs: boolean,
  wonChampionship: boolean,
  payroll: number,
  budget: number,
  prospectsPromoted: number,
): GMEvaluation {
  const goals = state.seasonGoals.map(g => {
    const goal = { ...g };
    switch (goal.type) {
      case 'wins':
        goal.actual = wins;
        goal.met = wins >= goal.threshold;
        break;
      case 'playoffs':
        goal.actual = madePlayoffs ? 1 : 0;
        goal.met = madePlayoffs;
        break;
      case 'championship':
        goal.actual = wonChampionship ? 1 : 0;
        goal.met = wonChampionship;
        break;
      case 'budget':
        goal.actual = payroll <= budget ? 1 : 0;
        goal.met = payroll <= budget;
        break;
      case 'prospects':
        goal.actual = prospectsPromoted;
        goal.met = prospectsPromoted >= goal.threshold;
        break;
      case 'attendance':
        goal.actual = wins >= 70 ? 1 : 0; // Simplified: winning enough = fan interest
        goal.met = wins >= 70;
        break;
    }
    return goal;
  });

  // Calculate weighted score
  const score = goals.reduce((sum, g) => {
    const contribution = g.met ? g.weight * 100 : 0;
    // Partial credit for near-misses on wins
    if (g.type === 'wins' && !g.met && g.actual !== undefined) {
      const pctMet = g.actual / g.threshold;
      return sum + g.weight * 100 * Math.min(1, pctMet * 0.8);
    }
    return sum + contribution;
  }, 0);

  // Bonus for exceeding expectations
  const overperformBonus = wonChampionship ? 20 : madePlayoffs && state.mandate !== 'championship' ? 10 : wins >= 95 ? 5 : 0;

  // Job security adjustment
  let securityDelta = (score - 60) / 3 + overperformBonus; // Score of 60 = neutral

  // Owner patience modifies how harsh they are
  securityDelta *= (50 + state.owner.patience) / 100;

  const newJobSecurity = clamp(Math.round(state.jobSecurity + securityDelta), 0, 100);

  // Grade
  const totalScore = score + overperformBonus;
  const grade = totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B+'
    : totalScore >= 60 ? 'B' : totalScore >= 50 ? 'C+' : totalScore >= 40 ? 'C'
    : totalScore >= 30 ? 'D' : 'F';

  // Owner statement
  const statement = generateOwnerStatement(grade, state.owner, wins, madePlayoffs, wonChampionship);

  // Mandate change based on results
  let mandateChange: Mandate | undefined;
  if (wonChampionship) mandateChange = 'championship'; // Keep winning
  else if (wins >= 90 && !madePlayoffs) mandateChange = 'playoff_contender';
  else if (wins < 65 && state.mandate === 'competitive') mandateChange = 'rebuild';
  else if (wins < 55 && state.mandate === 'rebuild') mandateChange = 'full_rebuild';
  else if (wins >= 80 && state.mandate === 'rebuild') mandateChange = 'competitive';
  else if (wins >= 85 && state.mandate === 'competitive') mandateChange = 'playoff_contender';

  const fired = newJobSecurity <= 0;
  const bonusEarned = totalScore >= 80 ? 500_000 : totalScore >= 90 ? 1_000_000 : 0;

  return {
    season,
    overallGrade: grade,
    jobSecurity: newJobSecurity,
    goalsResult: goals,
    ownerStatement: statement,
    mandateChange,
    fired,
    bonusEarned,
  };
}

// ─── Generate owner statement ───────────────────────────────────────────────────

function generateOwnerStatement(
  grade: string,
  owner: OwnerProfile,
  wins: number,
  madePlayoffs: boolean,
  wonChampionship: boolean,
): string {
  if (wonChampionship) {
    return `"${owner.name} says: 'This is what we've been building toward. Championship caliber from top to bottom.'"`;
  }
  if (madePlayoffs && grade >= 'B') {
    return `"${owner.name} says: 'A playoff berth shows we're heading in the right direction. Let's take the next step.'"`;
  }
  if (grade >= 'A') {
    return `"${owner.name} says: 'Outstanding season. The front office has my full confidence moving forward.'"`;
  }
  if (grade >= 'B') {
    return `"${owner.name} says: 'Solid progress this year. I expect continued improvement next season.'"`;
  }
  if (grade >= 'C') {
    return `"${owner.name} says: 'Acceptable results, but I need to see more. We'll be watching closely.'"`;
  }
  if (wins < 65) {
    return `"${owner.name} says: 'This is unacceptable. Major changes are needed, and soon.'"`;
  }
  return `"${owner.name} says: 'Disappointing season. The front office needs to do better, or we'll make changes.'"`;
}

// ─── Initialize owner goals state ───────────────────────────────────────────────

export function initializeOwnerGoals(
  archetype: OwnerArchetype,
  initialMandate: Mandate,
  rand: () => number,
): OwnerGoalsState {
  const owner = generateOwner(archetype, rand);
  return {
    owner,
    mandate: initialMandate,
    jobSecurity: 65, // Start with moderate security
    yearsAsGM: 0,
    seasonGoals: generateSeasonGoals(initialMandate, owner, 81),
    evaluations: [],
  };
}

// ─── Mandate labels ─────────────────────────────────────────────────────────────

export const MANDATE_LABELS: Record<Mandate, string> = {
  championship: 'Win Championship',
  playoff_contender: 'Playoff Contender',
  competitive: 'Stay Competitive',
  rebuild: 'Rebuild',
  full_rebuild: 'Full Rebuild',
};

export const ARCHETYPE_LABELS: Record<OwnerArchetype, string> = {
  win_now: 'Win Now',
  patient_builder: 'Patient Builder',
  penny_pincher: 'Penny Pincher',
  big_spender: 'Big Spender',
  balanced: 'Balanced',
};

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }
