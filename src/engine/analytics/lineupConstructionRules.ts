/**
 * Lineup Construction Rules Engine
 *
 * Defines optimal lineup construction based on sabermetric principles.
 * Evaluates current lineup against multiple construction theories
 * (The Book, traditional, platoon-optimized) and scores each slot.
 * Provides swap recommendations and theory comparisons.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LineupRulesPlayer {
  id: number;
  name: string;
  pos: string;
  hand: 'L' | 'R' | 'S';
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  iso: number;         // isolated power (SLG - AVG)
  wOBA: number;
  wRCPlus: number;
  speed: number;       // 20-80 scale
  power: number;       // 20-80 scale
  contact: number;     // 20-80 scale
  eye: number;         // 20-80 scale (plate discipline)
  kPct: number;        // strikeout rate
  bbPct: number;       // walk rate
}

export interface LineupSlotRule {
  slot: number;
  slotName: string;
  primaryAttribute: string;
  description: string;
  idealProfile: string;
  weight: Record<string, number>;  // attribute -> weight for scoring
}

export interface LineupAssignment {
  slot: number;
  player: LineupRulesPlayer;
  fitScore: number;        // 0-100 how well the player fits this slot
  fitGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  violations: string[];    // rules violated
  strengths: string[];     // rules well-met
}

export interface SwapRecommendation {
  fromSlot: number;
  toSlot: number;
  playerA: string;
  playerB: string;
  expectedGain: number;     // runs per season gained
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TheoryComparison {
  theoryName: string;
  description: string;
  score: number;            // 0-100 how well current lineup matches
  keyDifferences: string[];
  proponent: string;
}

export interface LineupRulesData {
  currentLineup: LineupAssignment[];
  optimalLineup: LineupAssignment[];
  rules: LineupSlotRule[];
  swapRecommendations: SwapRecommendation[];
  theoryComparisons: TheoryComparison[];
  score: number;
  grade: string;
  runsVsOptimal: number;
  lrBalance: { left: number; right: number; switch: number };
  consecutiveSameHand: number;
  alternatingBonus: boolean;
}

// ─── Rules ──────────────────────────────────────────────────────────────────

export const LINEUP_SLOT_RULES: LineupSlotRule[] = [
  {
    slot: 1,
    slotName: 'Leadoff',
    primaryAttribute: 'OBP',
    description: 'Highest OBP hitter. Gets the most plate appearances. Speed is a bonus, not a requirement.',
    idealProfile: 'OBP .370+, BB% 12+, good baserunner',
    weight: { obp: 0.40, bbPct: 0.20, speed: 0.15, wOBA: 0.15, contact: 0.10 },
  },
  {
    slot: 2,
    slotName: 'Two-Hole',
    primaryAttribute: 'wOBA',
    description: 'Best overall hitter. Modern analytics place the best bat here for max PA with runners on.',
    idealProfile: 'Highest wOBA, elite OBP+SLG combo',
    weight: { wOBA: 0.35, obp: 0.25, slg: 0.20, contact: 0.10, eye: 0.10 },
  },
  {
    slot: 3,
    slotName: 'Three-Hole',
    primaryAttribute: 'wRC+',
    description: 'Second-best hitter. Traditionally the best overall bat, still a premium run producer.',
    idealProfile: 'wRC+ 130+, high OPS, power+contact blend',
    weight: { wOBA: 0.30, slg: 0.25, obp: 0.20, power: 0.15, contact: 0.10 },
  },
  {
    slot: 4,
    slotName: 'Cleanup',
    primaryAttribute: 'ISO / SLG',
    description: 'Best power hitter. Drives in runs. ISO and SLG matter most here.',
    idealProfile: 'ISO .250+, SLG .550+, elite raw power',
    weight: { slg: 0.30, power: 0.30, iso: 0.20, wOBA: 0.15, obp: 0.05 },
  },
  {
    slot: 5,
    slotName: 'Fifth',
    primaryAttribute: 'Power / Contact',
    description: 'Secondary power bat. Provides lineup protection for cleanup hitter.',
    idealProfile: 'Good power (60+), solid contact, OPS .780+',
    weight: { power: 0.25, slg: 0.25, contact: 0.20, obp: 0.15, wOBA: 0.15 },
  },
  {
    slot: 6,
    slotName: 'Sixth',
    primaryAttribute: 'Contact / Speed',
    description: 'Contact-oriented hitter with some speed. Can turn over the lineup.',
    idealProfile: 'AVG .270+, speed 55+, low K%',
    weight: { contact: 0.30, speed: 0.25, obp: 0.20, eye: 0.15, kPct: 0.10 },
  },
  {
    slot: 7,
    slotName: 'Seventh',
    primaryAttribute: 'Balanced',
    description: 'Solid utility bat. Often a defensive specialist who can contribute offensively.',
    idealProfile: 'Steady bat, low K%, can handle the bat',
    weight: { contact: 0.30, obp: 0.25, eye: 0.20, wOBA: 0.15, speed: 0.10 },
  },
  {
    slot: 8,
    slotName: 'Eighth',
    primaryAttribute: 'OBP / Speed',
    description: 'Second leadoff option or weakest bat. Some managers use a speed guy to set the table.',
    idealProfile: 'OBP .310+, speed 50+, can bunt',
    weight: { obp: 0.30, speed: 0.30, contact: 0.20, bbPct: 0.10, eye: 0.10 },
  },
  {
    slot: 9,
    slotName: 'Ninth',
    primaryAttribute: 'Speed / OBP',
    description: 'Weakest bat or table-setter for top of lineup. Speed and OBP valued over power.',
    idealProfile: 'Speed 60+, can get on for top of order',
    weight: { speed: 0.35, obp: 0.25, contact: 0.20, eye: 0.10, bbPct: 0.10 },
  },
];

// ─── Scoring Logic ──────────────────────────────────────────────────────────

function normalizeAttribute(attr: string, value: number): number {
  // Normalize to 0-100 scale based on attribute type
  switch (attr) {
    case 'obp': return Math.min(100, Math.max(0, (value - 0.250) / 0.200 * 100));
    case 'slg': return Math.min(100, Math.max(0, (value - 0.300) / 0.350 * 100));
    case 'wOBA': return Math.min(100, Math.max(0, (value - 0.280) / 0.200 * 100));
    case 'iso': return Math.min(100, Math.max(0, (value - 0.100) / 0.250 * 100));
    case 'bbPct': return Math.min(100, Math.max(0, (value - 4) / 14 * 100));
    case 'kPct': return Math.min(100, Math.max(0, (30 - value) / 20 * 100)); // lower K% is better
    case 'speed':
    case 'power':
    case 'contact':
    case 'eye':
      return Math.min(100, Math.max(0, (value - 20) / 60 * 100));
    default: return 50;
  }
}

function computeFitScore(player: LineupRulesPlayer, rule: LineupSlotRule): number {
  let score = 0;
  const attrs: Record<string, number> = {
    obp: player.obp,
    slg: player.slg,
    wOBA: player.wOBA,
    iso: player.iso,
    bbPct: player.bbPct,
    kPct: player.kPct,
    speed: player.speed,
    power: player.power,
    contact: player.contact,
    eye: player.eye,
  };

  for (const [attr, weight] of Object.entries(rule.weight)) {
    const val = attrs[attr] ?? 50;
    score += normalizeAttribute(attr, val) * weight;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

function fitGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
  if (score >= 92) return 'A+';
  if (score >= 83) return 'A';
  if (score >= 74) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C+';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'A+': return '#22c55e';
    case 'A': return '#4ade80';
    case 'B+': return '#3b82f6';
    case 'B': return '#60a5fa';
    case 'C+': return '#eab308';
    case 'C': return '#f59e0b';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#94a3b8';
  }
}

function identifyViolations(player: LineupRulesPlayer, slot: number): string[] {
  const violations: string[] = [];
  if (slot <= 2 && player.obp < 0.330) violations.push(`Low OBP (${player.obp.toFixed(3)}) for top of lineup`);
  if (slot <= 2 && player.kPct > 25) violations.push(`High K% (${player.kPct.toFixed(1)}%) for leadoff/two-hole`);
  if (slot === 4 && player.power < 55) violations.push(`Below-average power for cleanup spot`);
  if (slot === 4 && player.iso < 0.180) violations.push(`Low ISO (${player.iso.toFixed(3)}) for cleanup`);
  if (slot >= 6 && player.wOBA > 0.380) violations.push(`Elite bat wasted in bottom third of lineup`);
  if (slot === 1 && player.speed < 40) violations.push(`Slow runner in leadoff spot`);
  return violations;
}

function identifyStrengths(player: LineupRulesPlayer, slot: number): string[] {
  const strengths: string[] = [];
  if (slot <= 2 && player.obp >= 0.370) strengths.push('Elite OBP for top of order');
  if (slot <= 2 && player.bbPct >= 12) strengths.push('Excellent walk rate');
  if (slot === 2 && player.wOBA >= 0.380) strengths.push('Best bat in optimal two-hole');
  if ((slot === 3 || slot === 4) && player.iso >= 0.250) strengths.push('Premium power in middle of lineup');
  if ((slot === 3 || slot === 4) && player.slg >= 0.520) strengths.push('Elite SLG for run production');
  if (slot >= 6 && slot <= 7 && player.contact >= 65) strengths.push('Good contact skills in bottom half');
  if (slot === 1 && player.speed >= 65) strengths.push('Excellent speed for leadoff');
  if (slot >= 8 && player.speed >= 60) strengths.push('Speed at bottom to set up top of order');
  return strengths;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PLAYERS: LineupRulesPlayer[] = [
  {
    id: 0, name: 'Marcus Webb', pos: 'CF', hand: 'L',
    avg: .298, obp: .388, slg: .445, ops: .833, iso: .147, wOBA: .372,
    wRCPlus: 132, speed: 72, power: 48, contact: 74, eye: 70, kPct: 14.2, bbPct: 12.8,
  },
  {
    id: 1, name: 'Carlos Delgado Jr.', pos: 'DH', hand: 'R',
    avg: .312, obp: .402, slg: .598, ops: 1.000, iso: .286, wOBA: .412,
    wRCPlus: 162, speed: 35, power: 78, contact: 72, eye: 75, kPct: 18.5, bbPct: 14.1,
  },
  {
    id: 2, name: 'Jaylen Torres', pos: 'SS', hand: 'R',
    avg: .285, obp: .365, slg: .510, ops: .875, iso: .225, wOBA: .378,
    wRCPlus: 138, speed: 68, power: 62, contact: 68, eye: 60, kPct: 19.8, bbPct: 10.2,
  },
  {
    id: 3, name: 'Victor Robles III', pos: 'RF', hand: 'L',
    avg: .275, obp: .342, slg: .565, ops: .907, iso: .290, wOBA: .374,
    wRCPlus: 136, speed: 42, power: 80, contact: 55, eye: 52, kPct: 26.1, bbPct: 8.9,
  },
  {
    id: 4, name: 'Dimitri Kazakov', pos: '1B', hand: 'L',
    avg: .262, obp: .355, slg: .490, ops: .845, iso: .228, wOBA: .358,
    wRCPlus: 124, speed: 30, power: 70, contact: 58, eye: 68, kPct: 22.4, bbPct: 12.0,
  },
  {
    id: 5, name: 'Ricky Sandoval', pos: '2B', hand: 'S',
    avg: .290, obp: .348, slg: .420, ops: .768, iso: .130, wOBA: .340,
    wRCPlus: 110, speed: 65, power: 42, contact: 75, eye: 58, kPct: 12.8, bbPct: 8.5,
  },
  {
    id: 6, name: 'Tomas Herrera', pos: '3B', hand: 'R',
    avg: .252, obp: .328, slg: .435, ops: .763, iso: .183, wOBA: .332,
    wRCPlus: 105, speed: 45, power: 58, contact: 60, eye: 55, kPct: 20.5, bbPct: 9.1,
  },
  {
    id: 7, name: 'Aiden Park', pos: 'LF', hand: 'L',
    avg: .268, obp: .338, slg: .395, ops: .733, iso: .127, wOBA: .322,
    wRCPlus: 98, speed: 58, power: 40, contact: 68, eye: 62, kPct: 16.3, bbPct: 9.8,
  },
  {
    id: 8, name: 'Jackson Whitfield', pos: 'C', hand: 'R',
    avg: .238, obp: .312, slg: .382, ops: .694, iso: .144, wOBA: .306,
    wRCPlus: 88, speed: 32, power: 48, contact: 52, eye: 50, kPct: 24.5, bbPct: 8.2,
  },
];

export function generateDemoLineupRules(): LineupRulesData {
  const rules = LINEUP_SLOT_RULES;

  // Current lineup (as manager set it - not optimal)
  const currentOrder = [0, 2, 3, 1, 4, 5, 6, 8, 7]; // indices into DEMO_PLAYERS
  // Optimal lineup (engine-recommended)
  const optimalOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // best fit per slot

  const currentLineup: LineupAssignment[] = currentOrder.map((playerIdx, slot) => {
    const player = DEMO_PLAYERS[playerIdx];
    const rule = rules[slot];
    const score = computeFitScore(player, rule);
    return {
      slot: slot + 1,
      player,
      fitScore: score,
      fitGrade: fitGrade(score),
      violations: identifyViolations(player, slot + 1),
      strengths: identifyStrengths(player, slot + 1),
    };
  });

  const optimalLineup: LineupAssignment[] = optimalOrder.map((playerIdx, slot) => {
    const player = DEMO_PLAYERS[playerIdx];
    const rule = rules[slot];
    const score = computeFitScore(player, rule);
    return {
      slot: slot + 1,
      player,
      fitScore: score,
      fitGrade: fitGrade(score),
      violations: identifyViolations(player, slot + 1),
      strengths: identifyStrengths(player, slot + 1),
    };
  });

  const swapRecommendations: SwapRecommendation[] = [
    {
      fromSlot: 2, toSlot: 4, playerA: 'Jaylen Torres', playerB: 'Carlos Delgado Jr.',
      expectedGain: 8.2, reason: 'Delgado has the highest wOBA (.412) and belongs in the two-hole per The Book. Torres has good power but Delgado is the superior overall bat.',
      priority: 'high',
    },
    {
      fromSlot: 3, toSlot: 4, playerA: 'Victor Robles III', playerB: 'Carlos Delgado Jr.',
      expectedGain: 3.5, reason: 'Robles is a pure power bat (.290 ISO) ideal for cleanup. Currently batting 3rd where OBP matters more.',
      priority: 'medium',
    },
    {
      fromSlot: 8, toSlot: 9, playerA: 'Jackson Whitfield', playerB: 'Aiden Park',
      expectedGain: 1.8, reason: 'Park has better speed (58 vs 32) and OBP (.338 vs .312) to set the table for the top of the lineup.',
      priority: 'low',
    },
  ];

  const theoryComparisons: TheoryComparison[] = [
    {
      theoryName: 'The Book (Tango et al.)',
      description: 'Best hitter bats 2nd. OBP leadoff. Best power 4th. Worst hitter 8th or 9th.',
      score: 68,
      keyDifferences: [
        'Current lineup bats best hitter (Delgado, .412 wOBA) 4th instead of 2nd',
        'K%-prone hitter (Robles, 26.1%) batting 3rd instead of cleanup',
        'Bottom of order properly uses weaker bats',
      ],
      proponent: 'Tom Tango, Mitchel Lichtman, Andrew Dolphin',
    },
    {
      theoryName: 'Traditional Construction',
      description: 'Speed leadoff. Contact 2nd. Best hitter 3rd. Power cleanup. Speed 9th.',
      score: 74,
      keyDifferences: [
        'Lineup follows traditional principles more closely',
        'Speed at leadoff (Webb, 72 SPD) matches traditional model',
        'Missing traditional speed element at 9th slot',
      ],
      proponent: 'Earl Weaver, Tony La Russa',
    },
    {
      theoryName: 'Alternating L/R Platoon',
      description: 'Alternate left and right-handed batters to neutralize specialist relievers and force pitching changes.',
      score: 52,
      keyDifferences: [
        'Current lineup has consecutive LHB in slots 1-2 violation',
        'Back-to-back RHB in slots 6-7',
        'Switch hitter (Sandoval) not placed to break up same-hand streaks',
      ],
      proponent: 'Platoon advantage theory',
    },
    {
      theoryName: 'Run Expectancy Optimization',
      description: 'Place highest wOBA hitters where they get the most PA with runners on base (slots 2-4).',
      score: 61,
      keyDifferences: [
        'Delgado (.412 wOBA) batting 4th instead of 2nd wastes 18 PA/season with RISP',
        'Torres (.378 wOBA) in 2-hole is good but not the best available option',
        'Bottom third construction is efficient',
      ],
      proponent: 'FanGraphs, Baseball Prospectus',
    },
  ];

  // Calculate overall score
  const avgFit = Math.round(currentLineup.reduce((s, a) => s + a.fitScore, 0) / currentLineup.length);
  const overallGrade = avgFit >= 85 ? 'A' : avgFit >= 75 ? 'B+' : avgFit >= 65 ? 'B' : avgFit >= 55 ? 'C+' : avgFit >= 45 ? 'C' : 'D';

  // L/R balance
  const leftCount = DEMO_PLAYERS.filter(p => p.hand === 'L').length;
  const rightCount = DEMO_PLAYERS.filter(p => p.hand === 'R').length;
  const switchCount = DEMO_PLAYERS.filter(p => p.hand === 'S').length;

  // Check consecutive same-hand
  let maxConsecutive = 1;
  let currentStreak = 1;
  for (let i = 1; i < currentOrder.length; i++) {
    const prevHand = DEMO_PLAYERS[currentOrder[i - 1]].hand;
    const curHand = DEMO_PLAYERS[currentOrder[i]].hand;
    if (curHand === prevHand && curHand !== 'S') {
      currentStreak++;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return {
    currentLineup,
    optimalLineup,
    rules,
    swapRecommendations,
    theoryComparisons,
    score: avgFit,
    grade: overallGrade,
    runsVsOptimal: 12.4,
    lrBalance: { left: leftCount, right: rightCount, switch: switchCount },
    consecutiveSameHand: maxConsecutive,
    alternatingBonus: maxConsecutive <= 2,
  };
}
