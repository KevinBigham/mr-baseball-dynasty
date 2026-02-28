/**
 * Weather Impact Analysis Engine — Mr. Baseball Dynasty (Wave 71)
 *
 * Analyzes how weather conditions affect game outcomes:
 *   - Wind speed/direction vs HR rate
 *   - Temperature vs scoring (runs per game)
 *   - Humidity vs ball flight distance
 *   - Altitude/pressure effects
 *   - Park-by-park weather tendencies
 *   - Historical weather-adjusted stats for key players
 *
 * All data self-contained with rich demo generation.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type WindDirection = 'IN' | 'OUT' | 'L-R' | 'R-L' | 'CALM';

export type WeatherType = 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Light Rain' | 'Hot & Humid' | 'Cold' | 'Dome';

export interface WeatherConditionImpact {
  conditionType: string;       // e.g. "Wind Out 15+ mph", "Temp > 90F"
  category: 'wind' | 'temperature' | 'humidity' | 'altitude' | 'precipitation';
  sampleSize: number;          // games analyzed
  hrRateAdj: number;           // multiplier vs baseline (1.0 = no change, 1.15 = +15%)
  runsPerGameAdj: number;      // delta from league average RPG
  avgDistAdj: number;          // feet of fly ball distance change
  kRateAdj: number;            // K rate multiplier
  bbRateAdj: number;           // BB rate multiplier
  avgAdj: number;              // batting avg multiplier
  description: string;         // explanation
  severity: 'high' | 'moderate' | 'low';
}

export interface ParkWeatherProfile {
  parkId: number;
  parkName: string;
  city: string;
  team: string;
  isDome: boolean;
  elevation: number;           // feet above sea level
  avgTemp: number;             // average game-time temp (F)
  avgHumidity: number;         // average game-time humidity %
  avgWindSpeed: number;        // mph
  prevailingWind: WindDirection;
  hrParkFactor: number;        // 0.80 - 1.20 (1.0 = neutral)
  runParkFactor: number;       // 0.85 - 1.15
  weatherVariability: number;  // 0-100, how much weather varies game-to-game
  topWeatherTypes: WeatherType[];
  monthlyTemps: MonthlyTemp[];
  notes: string;
}

export interface MonthlyTemp {
  month: string;
  avgHigh: number;
  avgLow: number;
  rainDays: number;
  windAvg: number;
}

export interface WeatherAdjustedStat {
  playerId: number;
  name: string;
  team: string;
  position: string;
  rawStat: number;             // unadjusted stat (e.g. HR total, AVG)
  weatherAdjStat: number;      // weather-normalized stat
  delta: number;               // difference (adj - raw)
  deltaPercent: number;        // % change
  statType: string;            // "HR" | "AVG" | "ERA" | "OPS" | "SLG"
  explanation: string;
  benefitedFromWeather: boolean;
}

export interface WeatherGameLog {
  date: string;
  opponent: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  windDir: WindDirection;
  weather: WeatherType;
  runsScored: number;
  runsAllowed: number;
  hrsHit: number;
  hrsAllowed: number;
}

export interface WeatherImpactData {
  conditions: WeatherConditionImpact[];
  parkWeather: ParkWeatherProfile[];
  adjustedStats: WeatherAdjustedStat[];
  recentGames: WeatherGameLog[];
  leagueAvgRPG: number;
  leagueAvgHRRate: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const CONDITION_CATEGORIES = ['wind', 'temperature', 'humidity', 'altitude', 'precipitation'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  wind: '#3b82f6',
  temperature: '#ef4444',
  humidity: '#06b6d4',
  altitude: '#a855f7',
  precipitation: '#6b7280',
};

export const CATEGORY_LABELS: Record<string, string> = {
  wind: 'Wind',
  temperature: 'Temperature',
  humidity: 'Humidity',
  altitude: 'Altitude',
  precipitation: 'Precipitation',
};

export const WIND_DIR_LABELS: Record<WindDirection, string> = {
  'IN': 'Blowing In',
  'OUT': 'Blowing Out',
  'L-R': 'Left to Right',
  'R-L': 'Right to Left',
  'CALM': 'Calm',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function r(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function ri(lo: number, hi: number): number {
  return Math.round(r(lo, hi));
}

function rd(lo: number, hi: number, decimals: number): number {
  return Math.round(r(lo, hi) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Condition impact generation ──────────────────────────────────────────────

function generateConditions(): WeatherConditionImpact[] {
  return [
    // Wind conditions
    {
      conditionType: 'Wind Out 15+ mph',
      category: 'wind',
      sampleSize: ri(180, 240),
      hrRateAdj: rd(1.18, 1.35, 2),
      runsPerGameAdj: rd(0.8, 1.5, 1),
      avgDistAdj: rd(8, 18, 1),
      kRateAdj: rd(0.96, 1.02, 2),
      bbRateAdj: rd(0.98, 1.02, 2),
      avgAdj: rd(1.01, 1.06, 3),
      description: 'Strong winds blowing out to center carry fly balls further, boosting HR and scoring significantly.',
      severity: 'high',
    },
    {
      conditionType: 'Wind In 15+ mph',
      category: 'wind',
      sampleSize: ri(160, 220),
      hrRateAdj: rd(0.68, 0.82, 2),
      runsPerGameAdj: rd(-1.2, -0.5, 1),
      avgDistAdj: rd(-15, -8, 1),
      kRateAdj: rd(1.01, 1.05, 2),
      bbRateAdj: rd(0.97, 1.01, 2),
      avgAdj: rd(0.96, 0.99, 3),
      description: 'Headwinds knock down fly balls, suppressing home runs and extra-base hits. Pitchers\' park effect.',
      severity: 'high',
    },
    {
      conditionType: 'Wind 5-10 mph Crosswind',
      category: 'wind',
      sampleSize: ri(400, 550),
      hrRateAdj: rd(0.95, 1.05, 2),
      runsPerGameAdj: rd(-0.2, 0.3, 1),
      avgDistAdj: rd(-3, 3, 1),
      kRateAdj: rd(0.99, 1.01, 2),
      bbRateAdj: rd(0.99, 1.01, 2),
      avgAdj: rd(0.99, 1.01, 3),
      description: 'Moderate crosswinds have minimal overall impact but can push fly balls foul or fair at the margins.',
      severity: 'low',
    },
    {
      conditionType: 'Calm/No Wind',
      category: 'wind',
      sampleSize: ri(300, 400),
      hrRateAdj: rd(0.98, 1.02, 2),
      runsPerGameAdj: rd(-0.1, 0.1, 1),
      avgDistAdj: rd(-1, 1, 1),
      kRateAdj: rd(0.99, 1.01, 2),
      bbRateAdj: rd(0.99, 1.01, 2),
      avgAdj: rd(0.99, 1.01, 3),
      description: 'Neutral conditions. Ball flight is true to the swing with no wind-aided carries or knockdowns.',
      severity: 'low',
    },

    // Temperature
    {
      conditionType: 'Temp > 90F (Hot)',
      category: 'temperature',
      sampleSize: ri(200, 300),
      hrRateAdj: rd(1.08, 1.18, 2),
      runsPerGameAdj: rd(0.4, 1.0, 1),
      avgDistAdj: rd(4, 10, 1),
      kRateAdj: rd(0.97, 1.01, 2),
      bbRateAdj: rd(0.99, 1.03, 2),
      avgAdj: rd(1.01, 1.04, 3),
      description: 'Hot air is less dense, reducing drag on the baseball. Balls carry further and scoring increases.',
      severity: 'moderate',
    },
    {
      conditionType: 'Temp 70-85F (Mild)',
      category: 'temperature',
      sampleSize: ri(600, 800),
      hrRateAdj: rd(0.99, 1.02, 2),
      runsPerGameAdj: rd(-0.1, 0.2, 1),
      avgDistAdj: rd(-1, 2, 1),
      kRateAdj: rd(0.99, 1.01, 2),
      bbRateAdj: rd(0.99, 1.01, 2),
      avgAdj: rd(0.99, 1.01, 3),
      description: 'Comfortable temperatures have near-neutral impact on ball flight and game outcomes.',
      severity: 'low',
    },
    {
      conditionType: 'Temp < 50F (Cold)',
      category: 'temperature',
      sampleSize: ri(120, 180),
      hrRateAdj: rd(0.82, 0.92, 2),
      runsPerGameAdj: rd(-0.8, -0.3, 1),
      avgDistAdj: rd(-10, -5, 1),
      kRateAdj: rd(1.02, 1.06, 2),
      bbRateAdj: rd(0.97, 1.01, 2),
      avgAdj: rd(0.96, 0.99, 3),
      description: 'Cold, dense air increases drag. Batters feel sting on mis-hits. Scoring drops significantly.',
      severity: 'moderate',
    },

    // Humidity
    {
      conditionType: 'Humidity > 80%',
      category: 'humidity',
      sampleSize: ri(200, 280),
      hrRateAdj: rd(1.02, 1.08, 2),
      runsPerGameAdj: rd(0.1, 0.5, 1),
      avgDistAdj: rd(1, 5, 1),
      kRateAdj: rd(0.98, 1.02, 2),
      bbRateAdj: rd(0.98, 1.02, 2),
      avgAdj: rd(1.00, 1.02, 3),
      description: 'Contrary to myth, humid air is actually LESS dense than dry air (water vapor is lighter than N2/O2). Balls carry slightly further.',
      severity: 'low',
    },
    {
      conditionType: 'Humidity < 30% (Dry)',
      category: 'humidity',
      sampleSize: ri(150, 220),
      hrRateAdj: rd(0.97, 1.01, 2),
      runsPerGameAdj: rd(-0.2, 0.1, 1),
      avgDistAdj: rd(-2, 1, 1),
      kRateAdj: rd(0.99, 1.02, 2),
      bbRateAdj: rd(0.99, 1.01, 2),
      avgAdj: rd(0.99, 1.01, 3),
      description: 'Dry air slightly denser, marginal drag increase. Pitchers may get better grip on the ball.',
      severity: 'low',
    },

    // Altitude
    {
      conditionType: 'High Altitude (5000+ ft)',
      category: 'altitude',
      sampleSize: ri(80, 120),
      hrRateAdj: rd(1.25, 1.40, 2),
      runsPerGameAdj: rd(1.0, 2.2, 1),
      avgDistAdj: rd(12, 22, 1),
      kRateAdj: rd(0.90, 0.96, 2),
      bbRateAdj: rd(0.97, 1.02, 2),
      avgAdj: rd(1.06, 1.12, 3),
      description: 'Thin air at altitude dramatically reduces drag. Fly balls carry much further. Breaking balls break less. Coors Field effect.',
      severity: 'high',
    },
    {
      conditionType: 'Sea Level',
      category: 'altitude',
      sampleSize: ri(500, 700),
      hrRateAdj: rd(0.98, 1.02, 2),
      runsPerGameAdj: rd(-0.1, 0.1, 1),
      avgDistAdj: rd(-1, 1, 1),
      kRateAdj: rd(0.99, 1.01, 2),
      bbRateAdj: rd(0.99, 1.01, 2),
      avgAdj: rd(0.99, 1.01, 3),
      description: 'Standard air density at sea level. Baseline conditions for most metrics.',
      severity: 'low',
    },

    // Precipitation
    {
      conditionType: 'Light Rain / Mist',
      category: 'precipitation',
      sampleSize: ri(100, 150),
      hrRateAdj: rd(0.90, 0.97, 2),
      runsPerGameAdj: rd(-0.4, -0.1, 1),
      avgDistAdj: rd(-6, -2, 1),
      kRateAdj: rd(1.01, 1.05, 2),
      bbRateAdj: rd(1.02, 1.08, 2),
      avgAdj: rd(0.96, 0.99, 3),
      description: 'Wet balls are harder to grip. Pitchers lose command (more walks), batters struggle with slick bats. Scoring dips.',
      severity: 'moderate',
    },
    {
      conditionType: 'Overcast / Low Visibility',
      category: 'precipitation',
      sampleSize: ri(250, 350),
      hrRateAdj: rd(0.95, 1.02, 2),
      runsPerGameAdj: rd(-0.2, 0.1, 1),
      avgDistAdj: rd(-2, 1, 1),
      kRateAdj: rd(1.01, 1.04, 2),
      bbRateAdj: rd(0.99, 1.02, 2),
      avgAdj: rd(0.98, 1.01, 3),
      description: 'Reduced visibility may affect hitter tracking. Marginal increase in strikeouts and slight scoring dip.',
      severity: 'low',
    },
  ];
}

// ── Park weather profiles ────────────────────────────────────────────────────

interface ParkSeed {
  name: string;
  city: string;
  team: string;
  isDome: boolean;
  elevation: number;
  avgTemp: number;
  avgHumidity: number;
  avgWind: number;
  prevWind: WindDirection;
  weatherTypes: WeatherType[];
  notes: string;
}

const PARK_SEEDS: ParkSeed[] = [
  { name: 'Wrigley Field', city: 'Chicago, IL', team: 'CHC', isDome: false, elevation: 595, avgTemp: 72, avgHumidity: 62, avgWind: 12, prevWind: 'OUT', weatherTypes: ['Clear', 'Partly Cloudy', 'Overcast'], notes: 'Wind off Lake Michigan is the defining factor. Wind out = HR bonanza, wind in = pitcher\'s duel.' },
  { name: 'Coors Field', city: 'Denver, CO', team: 'COL', isDome: false, elevation: 5200, avgTemp: 76, avgHumidity: 35, avgWind: 8, prevWind: 'OUT', weatherTypes: ['Clear', 'Partly Cloudy'], notes: 'Mile High altitude makes this the most extreme hitter\'s park. Balls carry 9-10% further than sea level.' },
  { name: 'Oracle Park', city: 'San Francisco, CA', team: 'SF', isDome: false, elevation: 4, avgTemp: 62, avgHumidity: 72, avgWind: 14, prevWind: 'IN', weatherTypes: ['Overcast', 'Cold', 'Partly Cloudy'], notes: 'Bay winds blow in relentlessly. Cold foggy nights suppress offense dramatically. Famous for killing fly balls.' },
  { name: 'Globe Life Field', city: 'Arlington, TX', team: 'TEX', isDome: true, elevation: 548, avgTemp: 72, avgHumidity: 50, avgWind: 0, prevWind: 'CALM', weatherTypes: ['Dome'], notes: 'Retractable roof almost always closed. Controlled environment eliminates weather variability.' },
  { name: 'Fenway Park', city: 'Boston, MA', team: 'BOS', isDome: false, elevation: 20, avgTemp: 68, avgHumidity: 65, avgWind: 10, prevWind: 'OUT', weatherTypes: ['Clear', 'Partly Cloudy', 'Cold', 'Overcast'], notes: 'Wind can swirl unpredictably. Green Monster creates unique ball-off-wall dynamics regardless of weather.' },
  { name: 'Kauffman Stadium', city: 'Kansas City, MO', team: 'KC', isDome: false, elevation: 750, avgTemp: 78, avgHumidity: 58, avgWind: 11, prevWind: 'L-R', weatherTypes: ['Hot & Humid', 'Clear', 'Partly Cloudy'], notes: 'Midwestern heat and humidity in summer. Open design allows wind to sweep across the field.' },
  { name: 'Tropicana Field', city: 'St. Petersburg, FL', team: 'TB', isDome: true, elevation: 44, avgTemp: 72, avgHumidity: 50, avgWind: 0, prevWind: 'CALM', weatherTypes: ['Dome'], notes: 'Fully enclosed dome. Zero weather impact. Catwalks and ceiling can affect fly ball trajectories.' },
  { name: 'Target Field', city: 'Minneapolis, MN', team: 'MIN', isDome: false, elevation: 815, avgTemp: 66, avgHumidity: 55, avgWind: 9, prevWind: 'R-L', weatherTypes: ['Clear', 'Cold', 'Partly Cloudy', 'Overcast'], notes: 'Cold April/May games suppress scoring. Warms up in summer. One of the coldest outdoor parks early in the season.' },
  { name: 'Minute Maid Park', city: 'Houston, TX', team: 'HOU', isDome: true, elevation: 42, avgTemp: 73, avgHumidity: 50, avgWind: 0, prevWind: 'CALM', weatherTypes: ['Dome'], notes: 'Retractable roof keeps conditions stable. Short Crawford Boxes in left offset dome\'s neutral conditions.' },
  { name: 'Dodger Stadium', city: 'Los Angeles, CA', team: 'LAD', isDome: false, elevation: 515, avgTemp: 78, avgHumidity: 40, avgWind: 6, prevWind: 'CALM', weatherTypes: ['Clear', 'Partly Cloudy'], notes: 'Consistently warm and dry. Minimal weather variability. Evening games cool off. One of the most stable outdoor environments.' },
  { name: 'Nationals Park', city: 'Washington, DC', team: 'WSH', isDome: false, elevation: 25, avgTemp: 74, avgHumidity: 64, avgWind: 7, prevWind: 'OUT', weatherTypes: ['Hot & Humid', 'Partly Cloudy', 'Clear'], notes: 'DC summers are hot and humid. Ball carries well in July/August heat. Spring games can be cool and damp.' },
  { name: 'PNC Park', city: 'Pittsburgh, PA', team: 'PIT', isDome: false, elevation: 730, avgTemp: 70, avgHumidity: 60, avgWind: 7, prevWind: 'IN', weatherTypes: ['Partly Cloudy', 'Overcast', 'Light Rain'], notes: 'River winds generally blow in from center. Combined with moderate temps, this keeps scoring in check.' },
];

function generateParkWeatherProfiles(): ParkWeatherProfile[] {
  return PARK_SEEDS.map((seed, i) => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyTemps: MonthlyTemp[] = months.map((month, mi) => {
      const seasonalAdj = Math.sin((mi + 1) / 7 * Math.PI) * 15; // warmer mid-season
      return {
        month,
        avgHigh: Math.round(seed.avgTemp + seasonalAdj + r(-3, 3)),
        avgLow: Math.round(seed.avgTemp + seasonalAdj - 18 + r(-3, 3)),
        rainDays: seed.isDome ? 0 : ri(2, 8),
        windAvg: seed.isDome ? 0 : rd(seed.avgWind - 3, seed.avgWind + 3, 1),
      };
    });

    // Park factors influenced by elevation and wind
    const elevFactor = seed.elevation / 5280; // fraction of mile-high
    const windFactor = seed.prevWind === 'OUT' ? 0.04 : seed.prevWind === 'IN' ? -0.04 : 0;
    const hrPF = rd(0.92 + elevFactor * 0.35 + windFactor, 1.08 + elevFactor * 0.35 + windFactor, 2);
    const runPF = rd(0.94 + elevFactor * 0.20 + windFactor * 0.5, 1.06 + elevFactor * 0.20 + windFactor * 0.5, 2);

    return {
      parkId: i + 1,
      parkName: seed.name,
      city: seed.city,
      team: seed.team,
      isDome: seed.isDome,
      elevation: seed.elevation,
      avgTemp: seed.avgTemp,
      avgHumidity: seed.avgHumidity,
      avgWindSpeed: seed.avgWind,
      prevailingWind: seed.prevWind,
      hrParkFactor: clamp(hrPF, 0.75, 1.45),
      runParkFactor: clamp(runPF, 0.82, 1.25),
      weatherVariability: seed.isDome ? ri(2, 8) : ri(35, 85),
      topWeatherTypes: seed.weatherTypes,
      monthlyTemps,
      notes: seed.notes,
    };
  });
}

// ── Weather-adjusted stats generation ────────────────────────────────────────

const PLAYER_SEEDS = [
  { name: 'Aaron Judge', team: 'NYY', pos: 'RF', statType: 'HR', raw: 42, delta: -3.2 },
  { name: 'Mookie Betts', team: 'LAD', pos: 'RF', statType: 'AVG', raw: 0.307, delta: 0.008 },
  { name: 'Shohei Ohtani', team: 'LAD', pos: 'DH', statType: 'HR', raw: 48, delta: -5.1 },
  { name: 'Ronald Acuna Jr.', team: 'ATL', pos: 'CF', statType: 'OPS', raw: 0.958, delta: -0.022 },
  { name: 'Freddie Freeman', team: 'LAD', pos: '1B', statType: 'AVG', raw: 0.315, delta: 0.005 },
  { name: 'Marcus Semien', team: 'TEX', pos: '2B', statType: 'HR', raw: 28, delta: 1.8 },
  { name: 'Corey Seager', team: 'TEX', pos: 'SS', statType: 'SLG', raw: 0.542, delta: 0.015 },
  { name: 'C.J. Cron', team: 'COL', pos: '1B', statType: 'HR', raw: 35, delta: -8.4 },
  { name: 'Kris Bryant', team: 'COL', pos: 'LF', statType: 'OPS', raw: 0.845, delta: -0.068 },
  { name: 'Gerrit Cole', team: 'NYY', pos: 'SP', statType: 'ERA', raw: 2.88, delta: 0.15 },
  { name: 'Spencer Strider', team: 'ATL', pos: 'SP', statType: 'ERA', raw: 3.12, delta: -0.08 },
  { name: 'Logan Webb', team: 'SF', pos: 'SP', statType: 'ERA', raw: 2.95, delta: -0.32 },
];

function generateAdjustedStats(): WeatherAdjustedStat[] {
  return PLAYER_SEEDS.map((seed, i) => {
    const isERA = seed.statType === 'ERA';
    const isRate = ['AVG', 'OPS', 'SLG', 'ERA'].includes(seed.statType);
    const adjStat = isRate
      ? rd(seed.raw + seed.delta - 0.005, seed.raw + seed.delta + 0.005, 3)
      : Math.round(seed.raw + seed.delta + r(-0.5, 0.5));
    const actualDelta = isRate
      ? rd(adjStat - seed.raw, adjStat - seed.raw, 3)
      : Math.round(adjStat - seed.raw);
    const deltaPercent = rd((actualDelta / seed.raw) * 100, (actualDelta / seed.raw) * 100, 1);

    // For ERA, benefiting from weather means raw ERA is lower than adjusted (park helped them)
    const benefited = isERA ? actualDelta > 0 : actualDelta < 0;

    let explanation: string;
    if (seed.team === 'COL') {
      explanation = `Coors Field altitude inflates ${isERA ? 'run environment' : 'offensive numbers'}. Weather-adjusted numbers are ${Math.abs(deltaPercent).toFixed(1)}% ${benefited ? 'lower' : 'higher'}.`;
    } else if (seed.team === 'SF') {
      explanation = `Oracle Park\'s cold winds suppress ${isERA ? 'runs' : 'offense'}. True talent is ${Math.abs(deltaPercent).toFixed(1)}% ${benefited ? 'worse' : 'better'} than raw numbers suggest.`;
    } else if (seed.team === 'TEX') {
      explanation = `Globe Life dome neutralizes weather. Minimal adjustment — ${Math.abs(deltaPercent).toFixed(1)}% ${benefited ? 'down' : 'up'}.`;
    } else {
      explanation = `Home park and road weather splits account for a ${Math.abs(deltaPercent).toFixed(1)}% ${benefited ? 'deflation' : 'inflation'} in raw ${seed.statType}.`;
    }

    return {
      playerId: 5000 + i,
      name: seed.name,
      team: seed.team,
      position: seed.pos,
      rawStat: seed.raw,
      weatherAdjStat: adjStat,
      delta: actualDelta,
      deltaPercent,
      statType: seed.statType,
      explanation,
      benefitedFromWeather: !benefited,
    };
  });
}

// ── Recent game log generation ───────────────────────────────────────────────

function generateRecentGames(): WeatherGameLog[] {
  const opponents = ['BOS', 'NYY', 'TOR', 'TB', 'BAL', 'CLE', 'MIN', 'CHW', 'DET', 'KC'];
  const games: WeatherGameLog[] = [];

  for (let i = 0; i < 15; i++) {
    const dayOffset = i * 1 + ri(0, 1);
    const month = 8 - Math.floor(dayOffset / 30);
    const day = 28 - (dayOffset % 28);
    const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const temp = ri(58, 95);
    const humidity = ri(25, 85);
    const windSpeed = ri(0, 22);
    const windDir: WindDirection = windSpeed < 3 ? 'CALM' : pickRandom(['IN', 'OUT', 'L-R', 'R-L']);
    const weather: WeatherType = temp > 88 ? 'Hot & Humid' : temp < 55 ? 'Cold' :
      humidity > 75 ? (Math.random() < 0.3 ? 'Light Rain' : 'Overcast') :
      Math.random() < 0.5 ? 'Clear' : 'Partly Cloudy';

    // Wind + temp affect scoring
    const baseRuns = 4.3;
    const windMod = windDir === 'OUT' ? windSpeed * 0.06 : windDir === 'IN' ? -windSpeed * 0.05 : 0;
    const tempMod = (temp - 72) * 0.015;
    const adjRuns = baseRuns + windMod + tempMod;

    const runsScored = Math.max(0, ri(Math.round(adjRuns - 2.5), Math.round(adjRuns + 3)));
    const runsAllowed = Math.max(0, ri(Math.round(adjRuns - 2.5), Math.round(adjRuns + 2.5)));
    const hrChance = 0.08 + (windDir === 'OUT' ? 0.04 : windDir === 'IN' ? -0.03 : 0) + (temp - 72) * 0.001;
    const hrsHit = Math.max(0, ri(0, Math.round(hrChance * runsScored * 3)));
    const hrsAllowed = Math.max(0, ri(0, Math.round(hrChance * runsAllowed * 2.5)));

    games.push({
      date,
      opponent: pickRandom(opponents),
      temp,
      humidity,
      windSpeed,
      windDir,
      weather,
      runsScored,
      runsAllowed,
      hrsHit,
      hrsAllowed,
    });
  }

  return games;
}

// ── Main demo generation ─────────────────────────────────────────────────────

export function generateDemoWeatherImpact(): WeatherImpactData {
  return {
    conditions: generateConditions(),
    parkWeather: generateParkWeatherProfiles(),
    adjustedStats: generateAdjustedStats(),
    recentGames: generateRecentGames(),
    leagueAvgRPG: rd(4.20, 4.50, 2),
    leagueAvgHRRate: rd(0.033, 0.038, 3),
  };
}

// ── Utility exports for UI ───────────────────────────────────────────────────

export function formatParkFactor(pf: number): string {
  return pf.toFixed(2);
}

export function getSeverityColor(severity: 'high' | 'moderate' | 'low'): string {
  return severity === 'high' ? '#ef4444' : severity === 'moderate' ? '#f59e0b' : '#22c55e';
}

export function getAdjColor(value: number): string {
  if (value > 0.03 || value > 3) return '#22c55e';
  if (value < -0.03 || value < -3) return '#ef4444';
  return '#9ca3af';
}
