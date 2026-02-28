/**
 * Season Simulation Forecast Engine — Mr. Baseball Dynasty (Wave 78)
 *
 * Monte Carlo-style season outcome projections:
 *   - Win probability distributions (bell curve of possible win totals)
 *   - Playoff probability percentage
 *   - Division/WC/pennant/WS probability breakdown
 *   - Key swing factors that could change outcomes
 *   - Scenario analysis (best case, worst case, most likely)
 *   - Percentile-based win total distribution
 *
 * Enhanced from the original seasonSimForecast with richer data model,
 * swing factor analysis, scenario planning, and strength/weakness profiling.
 */

// ─── Legacy types (preserved for backward compat) ───────────────────────────

export interface SimOutcome {
  wins: number;
  frequency: number;        // % of simulations
}

export interface DivisionOdds {
  team: string;
  abbr: string;
  winDiv: number;
  winWC: number;
  makePlayoffs: number;
  miss: number;
  projWins: number;
  projLosses: number;
}

export interface SeasonSimData {
  teamAbbr: string;
  currentRecord: { wins: number; losses: number };
  gamesRemaining: number;
  simCount: number;
  projectedWins: number;
  projectedLosses: number;
  winDistribution: SimOutcome[];
  playoffOdds: number;
  divisionOdds: number;
  wildCardOdds: number;
  worldSeriesOdds: number;
  division: DivisionOdds[];
  bestCase: number;
  worstCase: number;
  monthlyPace: Array<{ month: string; wins: number; losses: number; pace: number }>;
}

// ─── Enhanced Wave 78 types ─────────────────────────────────────────────────

export interface WinDistributionBucket {
  wins: number;
  frequency: number;    // 0-100 (percentage of simulations)
  cumulative: number;   // cumulative probability
}

export interface ProbabilityBreakdown {
  division: number;
  wildCard: number;
  anyPlayoff: number;
  pennant: number;
  worldSeries: number;
  firstPick: number;
  subEighty: number;
  ninetyPlus: number;
  hundredPlus: number;
}

export interface SeasonScenario {
  id: string;
  label: string;
  description: string;
  wins: number;
  losses: number;
  outcome: string;
  probability: number;
  color: string;
  keyAssumptions: string[];
}

export interface SwingFactor {
  id: number;
  factor: string;
  upside: string;
  downside: string;
  warSwing: number;
  likelihood: number;
  category: 'PITCHING' | 'OFFENSE' | 'HEALTH' | 'EXTERNAL' | 'DEVELOPMENT';
}

export interface ProjectionSummary {
  medianWins: number;
  meanWins: number;
  p10Wins: number;
  p25Wins: number;
  p75Wins: number;
  p90Wins: number;
  floorWins: number;
  ceilingWins: number;
  standardDev: number;
  simCount: number;
}

export interface StrengthWeakness {
  area: string;
  rating: number;
  leagueRank: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  impact: string;
}

export interface SeasonForecastData {
  teamName: string;
  teamAbbr: string;
  season: number;
  currentRecord: string;
  gamesPlayed: number;
  projections: ProjectionSummary;
  distribution: WinDistributionBucket[];
  probabilities: ProbabilityBreakdown;
  scenarios: SeasonScenario[];
  swingFactors: SwingFactor[];
  strengths: StrengthWeakness[];
  divisionRivals: { team: string; projWins: number; playoffPct: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getOddsColor(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#3b82f6';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
}

export function buildDistribution(mean: number, stdDev: number): WinDistributionBucket[] {
  const buckets: WinDistributionBucket[] = [];
  let cumulative = 0;

  for (let w = Math.max(50, mean - 25); w <= Math.min(115, mean + 25); w++) {
    const z = (w - mean) / stdDev;
    const freq = Math.round(100 * Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI)));
    cumulative += freq;
    buckets.push({ wins: w, frequency: Math.max(0, freq), cumulative: Math.min(100, cumulative) });
  }

  const total = buckets.reduce((s, b) => s + b.frequency, 0);
  if (total > 0) {
    let runningCum = 0;
    for (const b of buckets) {
      b.frequency = Math.round((b.frequency / total) * 100);
      runningCum += b.frequency;
      b.cumulative = runningCum;
    }
  }

  return buckets;
}

export const SCENARIO_COLORS = {
  best:      '#22c55e',
  optimist:  '#34d399',
  likely:    '#f59e0b',
  pessimist: '#f97316',
  worst:     '#ef4444',
};

export const CATEGORY_COLORS: Record<SwingFactor['category'], string> = {
  PITCHING:    '#3b82f6',
  OFFENSE:     '#f59e0b',
  HEALTH:      '#ef4444',
  EXTERNAL:    '#8b5cf6',
  DEVELOPMENT: '#22c55e',
};

// ─── Legacy demo (preserved) ────────────────────────────────────────────────

export function generateDemoSeasonSim(): SeasonSimData {
  const dist: SimOutcome[] = [];
  for (let w = 72; w <= 100; w++) {
    const center = 88;
    const freq = Math.max(0.1, Math.round(Math.exp(-0.5 * ((w - center) / 4) ** 2) * 12 * 10) / 10);
    dist.push({ wins: w, frequency: freq });
  }

  return {
    teamAbbr: 'SF',
    currentRecord: { wins: 52, losses: 38 },
    gamesRemaining: 72,
    simCount: 10000,
    projectedWins: 88,
    projectedLosses: 74,
    winDistribution: dist,
    playoffOdds: 72.4,
    divisionOdds: 28.6,
    wildCardOdds: 43.8,
    worldSeriesOdds: 6.2,
    division: [
      { team: 'Los Angeles Dodgers', abbr: 'LAD', winDiv: 48.2, winWC: 32.1, makePlayoffs: 80.3, miss: 19.7, projWins: 92, projLosses: 70 },
      { team: 'San Francisco Giants', abbr: 'SF', winDiv: 28.6, winWC: 43.8, makePlayoffs: 72.4, miss: 27.6, projWins: 88, projLosses: 74 },
      { team: 'San Diego Padres', abbr: 'SD', winDiv: 18.4, winWC: 28.2, makePlayoffs: 46.6, miss: 53.4, projWins: 84, projLosses: 78 },
      { team: 'Arizona Diamondbacks', abbr: 'ARI', winDiv: 4.2, winWC: 12.8, makePlayoffs: 17.0, miss: 83.0, projWins: 78, projLosses: 84 },
      { team: 'Colorado Rockies', abbr: 'COL', winDiv: 0.6, winWC: 1.5, makePlayoffs: 2.1, miss: 97.9, projWins: 68, projLosses: 94 },
    ],
    bestCase: 98,
    worstCase: 76,
    monthlyPace: [
      { month: 'Apr', wins: 15, losses: 11, pace: 94 },
      { month: 'May', wins: 17, losses: 11, pace: 98 },
      { month: 'Jun', wins: 20, losses: 16, pace: 90 },
    ],
  };
}

// ─── Enhanced Wave 78 demo ──────────────────────────────────────────────────

export function generateDemoSeasonForecast(): SeasonForecastData {
  const mean = 92;
  const stdDev = 7.4;

  return {
    teamName: 'San Francisco Giants',
    teamAbbr: 'SF',
    season: 2026,
    currentRecord: '57-40',
    gamesPlayed: 97,
    projections: {
      medianWins: 92,
      meanWins: 91.8,
      p10Wins: 82,
      p25Wins: 87,
      p75Wins: 97,
      p90Wins: 101,
      floorWins: 73,
      ceilingWins: 108,
      standardDev: stdDev,
      simCount: 10000,
    },
    distribution: buildDistribution(mean, stdDev),
    probabilities: {
      division: 38.2,
      wildCard: 34.6,
      anyPlayoff: 72.8,
      pennant: 18.4,
      worldSeries: 8.7,
      firstPick: 0.0,
      subEighty: 4.2,
      ninetyPlus: 62.1,
      hundredPlus: 12.8,
    },
    scenarios: [
      {
        id: 'best',
        label: 'Best Case',
        description: 'Everything breaks right. Prospects hit immediately. Aces stay healthy.',
        wins: 104,
        losses: 58,
        outcome: 'Division title, deep playoff run',
        probability: 8,
        color: SCENARIO_COLORS.best,
        keyAssumptions: [
          'Castillo pitches like an ace from day one (3.2+ WAR)',
          'Delgado adjusts quickly at SS (.280+)',
          'Zero major injuries to rotation',
          'Bullpen addition of Helsley stabilizes late innings',
        ],
      },
      {
        id: 'optimistic',
        label: 'Optimistic',
        description: 'Prospects contribute, pitching holds up, favorable schedule pays off.',
        wins: 97,
        losses: 65,
        outcome: 'Wild card or division, competitive in playoffs',
        probability: 25,
        color: SCENARIO_COLORS.optimist,
        keyAssumptions: [
          'Prospect callups combine for 5+ WAR',
          'Rotation stays 80% healthy',
          'Favorable August schedule boosts record',
          'Trade deadline adds fill two biggest holes',
        ],
      },
      {
        id: 'likely',
        label: 'Most Likely',
        description: 'Solid season with typical injury luck and prospect adjustment periods.',
        wins: 92,
        losses: 70,
        outcome: 'Wild card berth, competitive but not dominant',
        probability: 38,
        color: SCENARIO_COLORS.likely,
        keyAssumptions: [
          'Prospect WAR meets 50th percentile projections',
          'One significant injury to a rotation arm (4-6 weeks)',
          'Lineup performs at projected level',
          'Bullpen is league average or slightly above',
        ],
      },
      {
        id: 'pessimistic',
        label: 'Pessimistic',
        description: 'Injuries mount, prospects struggle to adjust, tight race goes wrong.',
        wins: 85,
        losses: 77,
        outcome: 'On the bubble, likely miss playoffs',
        probability: 21,
        color: SCENARIO_COLORS.pessimist,
        keyAssumptions: [
          'Two rotation arms miss 6+ weeks',
          'Prospect callups have rough adjustment (sub-1.0 WAR combined)',
          'Bullpen issues persist; blown saves cost 4-5 games',
          'Division rivals outperform at deadline',
        ],
      },
      {
        id: 'worst',
        label: 'Worst Case',
        description: 'Catastrophic injuries, prospect busts, full second-half collapse.',
        wins: 78,
        losses: 84,
        outcome: 'Out of contention by September, looking ahead to next year',
        probability: 8,
        color: SCENARIO_COLORS.worst,
        keyAssumptions: [
          'Ace tears UCL, out for season',
          'Key offensive pieces suffer 3+ IL stints',
          'Prospects sent back to AAA after struggles',
          'Clubhouse chemistry unravels during losing streak',
        ],
      },
    ],
    swingFactors: [
      {
        id: 1,
        factor: 'Javier Castillo MLB debut performance',
        upside: 'Pitches like a front-line starter (3.0+ WAR)',
        downside: 'Struggles with command, gets sent back to AAA',
        warSwing: 3.5,
        likelihood: 65,
        category: 'DEVELOPMENT',
      },
      {
        id: 2,
        factor: 'Ace health (starting rotation durability)',
        upside: 'Full season from top 3 starters (10+ WAR combined)',
        downside: 'One major arm injury derails rotation depth',
        warSwing: 4.0,
        likelihood: 70,
        category: 'HEALTH',
      },
      {
        id: 3,
        factor: 'Trade deadline execution',
        upside: 'Land impact starter + closer without overpaying',
        downside: 'Market inflates, settle for marginal upgrades',
        warSwing: 2.5,
        likelihood: 55,
        category: 'EXTERNAL',
      },
      {
        id: 4,
        factor: 'Marcus Delgado offensive adjustment',
        upside: 'Hits .285+ with 20 HR pace, Gold Glove defense',
        downside: 'MLB pitching exposes holes, bats .230 first half',
        warSwing: 2.0,
        likelihood: 60,
        category: 'DEVELOPMENT',
      },
      {
        id: 5,
        factor: 'Bullpen stability and closer performance',
        upside: 'Braithwaite emerges as shutdown closer (1.5+ WAR)',
        downside: 'Closer by committee hemorrhages late leads',
        warSwing: 2.5,
        likelihood: 50,
        category: 'PITCHING',
      },
      {
        id: 6,
        factor: 'Ryan Castellanos second-half surge',
        upside: 'MVP-caliber finish (.300/35 HR/100 RBI)',
        downside: 'Nagging wrist issue limits power output',
        warSwing: 1.8,
        likelihood: 55,
        category: 'OFFENSE',
      },
      {
        id: 7,
        factor: 'Division rival LAD post-deadline strength',
        upside: 'LAD overpays and prospects underperform',
        downside: 'LAD adds 2 aces and runs away with division',
        warSwing: 0,
        likelihood: 40,
        category: 'EXTERNAL',
      },
    ],
    strengths: [
      { area: 'Run Production',      rating: 88, leagueRank: 4,  trend: 'STABLE', impact: 'Top 5 offense carries lineup through cold streaks' },
      { area: 'Starting Pitching',   rating: 76, leagueRank: 10, trend: 'UP',     impact: 'Castillo callup could push this to top 5' },
      { area: 'Bullpen',             rating: 62, leagueRank: 18, trend: 'DOWN',   impact: 'Biggest weakness; blown saves cost 4 wins already' },
      { area: 'Defense',             rating: 80, leagueRank: 7,  trend: 'UP',     impact: 'Delgado upgrade at SS improves IF range significantly' },
      { area: 'Baserunning',         rating: 71, leagueRank: 12, trend: 'STABLE', impact: 'Average speed but smart decisions on bases' },
      { area: 'Bench Depth',         rating: 58, leagueRank: 22, trend: 'DOWN',   impact: 'Thin bench could be exposed in doubleheaders and extras' },
    ],
    divisionRivals: [
      { team: 'LAD', projWins: 96, playoffPct: 88.4 },
      { team: 'SF',  projWins: 92, playoffPct: 72.8 },
      { team: 'SD',  projWins: 84, playoffPct: 38.2 },
      { team: 'ARI', projWins: 79, playoffPct: 18.6 },
      { team: 'COL', projWins: 65, playoffPct: 1.2 },
    ],
  };
}
