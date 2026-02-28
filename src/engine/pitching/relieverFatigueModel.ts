/**
 * Reliever Fatigue Impact Model
 *
 * Models how consecutive appearances affect reliever performance.
 * Tracks velocity loss, K-rate decline, HR rate increase by number
 * of consecutive days pitched. Each reliever has a unique fatigue curve
 * based on age, arm type, conditioning, and pitch mix.
 *
 * Provides optimal rest patterns and skip recommendations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FatigueDataPoint {
  consecutiveDays: number;
  velocityLoss: number;       // mph lost vs fully rested
  kRateDelta: number;         // K% change (negative = decline)
  hrRateDelta: number;        // HR/9 change (positive = increase)
  whipDelta: number;          // WHIP change (positive = worse)
  eraDelta: number;           // ERA change (positive = worse)
  blowupRisk: number;         // % chance of 3+ ER outing
  effectiveness: number;      // 0-100 overall effectiveness rating
}

export interface FatigueProfile {
  fatigueResistance: number;  // 20-80 scale, how well they hold up
  recoverySpeed: number;      // 20-80 scale, how fast they bounce back
  durabilityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  optimalRestDays: number;    // ideal days between appearances
  maxConsecutive: number;     // max consecutive days before sharp dropoff
  fatigueDataPoints: FatigueDataPoint[];
}

export interface RelieverAppearance {
  date: string;
  pitches: number;
  innings: number;
  earnedRuns: number;
  velocity: number;           // avg fastball velo
  kCount: number;
  bbCount: number;
  hrAllowed: number;
  consecutiveDay: number;     // which consecutive day was this (1=fresh, 2=b2b, etc.)
  result: 'Save' | 'Hold' | 'Win' | 'Loss' | 'BS' | 'ND';
}

export interface RestRecommendation {
  status: 'available' | 'use-sparingly' | 'skip-today' | 'must-rest';
  reason: string;
  projectedEffectiveness: number;
  daysUntilFresh: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
}

export interface RelieverFatigueEntry {
  id: string;
  name: string;
  age: number;
  role: 'CL' | 'SU' | 'MID' | 'LONG' | 'LOGY';
  throws: 'R' | 'L';
  baseVelocity: number;      // fully rested avg fastball velo
  currentVelocity: number;   // today's projected velo
  baseERA: number;
  baseKPer9: number;
  baseHRPer9: number;
  baseWHIP: number;
  consecutiveDays: number;
  daysSinceRest: number;
  pitchesLast3Days: number;
  pitchesLast7Days: number;
  pitchesLast14Days: number;
  fatigueProfile: FatigueProfile;
  recentAppearances: RelieverAppearance[];
  restRecommendation: RestRecommendation;
  seasonWorkload: {
    appearances: number;
    inningsPitched: number;
    totalPitches: number;
    savesHolds: number;
  };
}

export interface RelieverFatigueData {
  relievers: RelieverFatigueEntry[];
  bullpenHealth: number;          // 0-100 overall bullpen freshness
  availableCount: number;
  sparinglyCount: number;
  skipCount: number;
  mustRestCount: number;
  projectedEffectiveness: number; // 0-100 aggregate effectiveness
  fatigueAlert: string | null;
}

// ─── Utility ────────────────────────────────────────────────────────────────

export function getStatusColor(status: RestRecommendation['status']): string {
  switch (status) {
    case 'available': return '#22c55e';
    case 'use-sparingly': return '#f59e0b';
    case 'skip-today': return '#f97316';
    case 'must-rest': return '#ef4444';
  }
}

export function getStatusLabel(status: RestRecommendation['status']): string {
  switch (status) {
    case 'available': return 'AVAILABLE';
    case 'use-sparingly': return 'USE SPARINGLY';
    case 'skip-today': return 'SKIP TODAY';
    case 'must-rest': return 'MUST REST';
  }
}

export function getRiskColor(risk: RestRecommendation['riskLevel']): string {
  switch (risk) {
    case 'low': return '#22c55e';
    case 'moderate': return '#f59e0b';
    case 'elevated': return '#f97316';
    case 'high': return '#ef4444';
  }
}

export function getDurabilityColor(grade: string): string {
  switch (grade) {
    case 'A': return '#22c55e';
    case 'B': return '#3b82f6';
    case 'C': return '#eab308';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#94a3b8';
  }
}

// ─── Fatigue Curve Logic ────────────────────────────────────────────────────

function buildFatigueCurve(resistance: number, recovery: number): FatigueDataPoint[] {
  // Higher resistance = less dropoff per consecutive day
  const resistFactor = 1.4 - ((resistance - 20) / 60) * 0.8;
  const points: FatigueDataPoint[] = [];

  for (let day = 0; day <= 5; day++) {
    const veloLoss = day === 0 ? 0 : Math.round((0.3 + day * 0.5 * resistFactor) * 10) / 10;
    const kDelta = day === 0 ? 0 : Math.round((-1.2 * day * resistFactor) * 10) / 10;
    const hrDelta = day === 0 ? 0 : Math.round((0.15 * day * resistFactor) * 100) / 100;
    const whipDelta = day === 0 ? 0 : Math.round((0.04 * day * resistFactor) * 100) / 100;
    const eraDelta = day === 0 ? 0 : Math.round((0.35 * day * resistFactor) * 100) / 100;
    const blowup = day === 0 ? 5 : Math.min(65, Math.round(5 + day * day * 3.5 * resistFactor));
    const effectiveness = day === 0 ? 100 : Math.max(10, Math.round(100 - day * 14 * resistFactor));

    points.push({
      consecutiveDays: day,
      velocityLoss: veloLoss,
      kRateDelta: kDelta,
      hrRateDelta: hrDelta,
      whipDelta: whipDelta,
      eraDelta: eraDelta,
      blowupRisk: blowup,
      effectiveness,
    });
  }

  return points;
}

function durabilityGrade(resistance: number, recovery: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  const avg = (resistance + recovery) / 2;
  if (avg >= 70) return 'A';
  if (avg >= 58) return 'B';
  if (avg >= 46) return 'C';
  if (avg >= 34) return 'D';
  return 'F';
}

function computeRestRecommendation(
  consecutiveDays: number,
  pitchesLast3: number,
  maxConsec: number,
  _fatigueResistance: number,
  curve: FatigueDataPoint[],
): RestRecommendation {
  const currentPoint = curve[Math.min(consecutiveDays, curve.length - 1)];
  const nextPoint = curve[Math.min(consecutiveDays + 1, curve.length - 1)];

  if (consecutiveDays >= maxConsec + 1 || pitchesLast3 >= 55) {
    return {
      status: 'must-rest',
      reason: consecutiveDays >= maxConsec + 1
        ? `${consecutiveDays} consecutive days exceeds max (${maxConsec}). Arm needs recovery.`
        : `${pitchesLast3} pitches in 3 days is excessive. Risk of injury increases sharply.`,
      projectedEffectiveness: Math.max(10, currentPoint.effectiveness - 15),
      daysUntilFresh: 2,
      riskLevel: 'high',
    };
  }

  if (consecutiveDays >= maxConsec || pitchesLast3 >= 42) {
    return {
      status: 'skip-today',
      reason: `At consecutive day limit. Effectiveness drops to ${nextPoint.effectiveness}% with ${nextPoint.blowupRisk}% blowup risk.`,
      projectedEffectiveness: nextPoint.effectiveness,
      daysUntilFresh: 1,
      riskLevel: 'elevated',
    };
  }

  if (consecutiveDays >= 2 || pitchesLast3 >= 30) {
    return {
      status: 'use-sparingly',
      reason: `Moderate fatigue. Velocity down ~${currentPoint.velocityLoss} mph. K-rate declining. High-leverage only.`,
      projectedEffectiveness: currentPoint.effectiveness,
      daysUntilFresh: 1,
      riskLevel: 'moderate',
    };
  }

  return {
    status: 'available',
    reason: 'Well rested. Full arsenal should be available at peak velocity.',
    projectedEffectiveness: currentPoint.effectiveness,
    daysUntilFresh: 0,
    riskLevel: 'low',
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

interface DemoRelieverSeed {
  name: string;
  age: number;
  role: 'CL' | 'SU' | 'MID' | 'LONG' | 'LOGY';
  throws: 'R' | 'L';
  baseVelo: number;
  baseERA: number;
  baseK9: number;
  baseHR9: number;
  baseWHIP: number;
  resistance: number;
  recovery: number;
  consecutive: number;
  pitches3d: number;
  pitches7d: number;
  pitches14d: number;
  daysSinceRest: number;
  apps: number;
  ip: number;
  totalP: number;
  svHld: number;
}

const DEMO_SEEDS: DemoRelieverSeed[] = [
  {
    name: 'Marcus Rivera', age: 29, role: 'CL', throws: 'R', baseVelo: 98.2,
    baseERA: 1.85, baseK9: 12.8, baseHR9: 0.62, baseWHIP: 0.88,
    resistance: 72, recovery: 68, consecutive: 3, pitches3d: 48,
    pitches7d: 78, pitches14d: 128, daysSinceRest: 3, apps: 28, ip: 30.1, totalP: 482, svHld: 22,
  },
  {
    name: 'Takeshi Yamamoto', age: 31, role: 'SU', throws: 'R', baseVelo: 96.5,
    baseERA: 2.45, baseK9: 11.2, baseHR9: 0.78, baseWHIP: 1.02,
    resistance: 65, recovery: 60, consecutive: 2, pitches3d: 35,
    pitches7d: 62, pitches14d: 110, daysSinceRest: 2, apps: 32, ip: 34.0, totalP: 520, svHld: 18,
  },
  {
    name: 'Devon Blackwell', age: 26, role: 'SU', throws: 'L', baseVelo: 95.8,
    baseERA: 2.92, baseK9: 10.5, baseHR9: 0.85, baseWHIP: 1.08,
    resistance: 70, recovery: 72, consecutive: 0, pitches3d: 0,
    pitches7d: 22, pitches14d: 68, daysSinceRest: 0, apps: 26, ip: 28.2, totalP: 425, svHld: 14,
  },
  {
    name: 'Javier Contreras', age: 33, role: 'MID', throws: 'R', baseVelo: 94.1,
    baseERA: 3.35, baseK9: 9.2, baseHR9: 0.95, baseWHIP: 1.18,
    resistance: 55, recovery: 50, consecutive: 1, pitches3d: 18,
    pitches7d: 45, pitches14d: 95, daysSinceRest: 1, apps: 35, ip: 40.2, totalP: 610, svHld: 10,
  },
  {
    name: 'Elijah Thompson', age: 24, role: 'MID', throws: 'R', baseVelo: 97.0,
    baseERA: 3.78, baseK9: 10.8, baseHR9: 1.10, baseWHIP: 1.22,
    resistance: 62, recovery: 75, consecutive: 4, pitches3d: 52,
    pitches7d: 85, pitches14d: 140, daysSinceRest: 4, apps: 38, ip: 42.0, totalP: 655, svHld: 8,
  },
  {
    name: 'Andre Baptiste', age: 28, role: 'LOGY', throws: 'L', baseVelo: 92.5,
    baseERA: 3.55, baseK9: 8.8, baseHR9: 0.88, baseWHIP: 1.15,
    resistance: 58, recovery: 55, consecutive: 0, pitches3d: 12,
    pitches7d: 38, pitches14d: 72, daysSinceRest: 0, apps: 40, ip: 32.1, totalP: 480, svHld: 6,
  },
  {
    name: 'Kyle Hendricks Jr.', age: 30, role: 'LONG', throws: 'R', baseVelo: 91.8,
    baseERA: 3.90, baseK9: 7.5, baseHR9: 1.05, baseWHIP: 1.28,
    resistance: 68, recovery: 65, consecutive: 0, pitches3d: 0,
    pitches7d: 55, pitches14d: 112, daysSinceRest: 0, apps: 22, ip: 52.0, totalP: 780, svHld: 4,
  },
  {
    name: 'Darius Washington', age: 27, role: 'SU', throws: 'R', baseVelo: 99.1,
    baseERA: 2.15, baseK9: 13.5, baseHR9: 0.70, baseWHIP: 0.92,
    resistance: 48, recovery: 45, consecutive: 2, pitches3d: 38,
    pitches7d: 58, pitches14d: 98, daysSinceRest: 2, apps: 30, ip: 32.2, totalP: 510, svHld: 16,
  },
];

const APPEARANCE_DATES = ['7/18', '7/17', '7/16', '7/15', '7/14', '7/12', '7/10'];
const RESULTS: RelieverAppearance['result'][] = ['Save', 'Hold', 'Win', 'ND', 'Hold', 'BS', 'Loss'];

function generateAppearances(seed: DemoRelieverSeed, curve: FatigueDataPoint[]): RelieverAppearance[] {
  const apps: RelieverAppearance[] = [];
  const count = Math.min(seed.consecutive + 2, 6);

  for (let i = 0; i < count; i++) {
    const consecDay = Math.max(0, seed.consecutive - i);
    const point = curve[Math.min(consecDay, curve.length - 1)];
    const veloJitter = ((seed.age * 7 + i * 13) % 10 - 5) * 0.1;
    const velo = Math.round((seed.baseVelo - point.velocityLoss + veloJitter) * 10) / 10;
    const pitches = 12 + ((seed.age + i * 7) % 16);

    apps.push({
      date: APPEARANCE_DATES[i % APPEARANCE_DATES.length],
      pitches,
      innings: i % 3 === 0 ? 1.0 : i % 3 === 1 ? 0.2 : 1.1,
      earnedRuns: consecDay >= 3 ? ((i + seed.age) % 3) : ((i + seed.age) % 4 === 0 ? 1 : 0),
      velocity: velo,
      kCount: Math.max(0, 2 + ((i * 3 + seed.age) % 3) - (consecDay >= 2 ? 1 : 0)),
      bbCount: ((i + seed.age) % 3 === 0 ? 1 : 0) + (consecDay >= 2 ? 1 : 0),
      hrAllowed: consecDay >= 3 && (i + seed.age) % 2 === 0 ? 1 : 0,
      consecutiveDay: consecDay + 1,
      result: RESULTS[(i + seed.age) % RESULTS.length],
    });
  }

  return apps;
}

export function generateDemoRelieverFatigue(): RelieverFatigueData {
  const relievers: RelieverFatigueEntry[] = DEMO_SEEDS.map((seed, idx) => {
    const curve = buildFatigueCurve(seed.resistance, seed.recovery);
    const maxConsec = seed.resistance >= 65 ? 3 : seed.resistance >= 50 ? 2 : 1;
    const optRest = seed.recovery >= 65 ? 1 : 2;
    const profile: FatigueProfile = {
      fatigueResistance: seed.resistance,
      recoverySpeed: seed.recovery,
      durabilityGrade: durabilityGrade(seed.resistance, seed.recovery),
      optimalRestDays: optRest,
      maxConsecutive: maxConsec,
      fatigueDataPoints: curve,
    };

    const currentPoint = curve[Math.min(seed.consecutive, curve.length - 1)];
    const currentVelo = Math.round((seed.baseVelo - currentPoint.velocityLoss) * 10) / 10;
    const restRec = computeRestRecommendation(
      seed.consecutive, seed.pitches3d, maxConsec, seed.resistance, curve,
    );
    const appearances = generateAppearances(seed, curve);

    return {
      id: `rfm-${idx}`,
      name: seed.name,
      age: seed.age,
      role: seed.role,
      throws: seed.throws,
      baseVelocity: seed.baseVelo,
      currentVelocity: currentVelo,
      baseERA: seed.baseERA,
      baseKPer9: seed.baseK9,
      baseHRPer9: seed.baseHR9,
      baseWHIP: seed.baseWHIP,
      consecutiveDays: seed.consecutive,
      daysSinceRest: seed.daysSinceRest,
      pitchesLast3Days: seed.pitches3d,
      pitchesLast7Days: seed.pitches7d,
      pitchesLast14Days: seed.pitches14d,
      fatigueProfile: profile,
      recentAppearances: appearances,
      restRecommendation: restRec,
      seasonWorkload: {
        appearances: seed.apps,
        inningsPitched: seed.ip,
        totalPitches: seed.totalP,
        savesHolds: seed.svHld,
      },
    };
  });

  const available = relievers.filter(r => r.restRecommendation.status === 'available').length;
  const sparingly = relievers.filter(r => r.restRecommendation.status === 'use-sparingly').length;
  const skip = relievers.filter(r => r.restRecommendation.status === 'skip-today').length;
  const mustRest = relievers.filter(r => r.restRecommendation.status === 'must-rest').length;
  const avgEff = Math.round(
    relievers.reduce((s, r) => s + r.restRecommendation.projectedEffectiveness, 0) / relievers.length
  );
  const bullpenHealth = Math.round(
    relievers.reduce((s, r) => {
      const statusScore = r.restRecommendation.status === 'available' ? 100
        : r.restRecommendation.status === 'use-sparingly' ? 65
        : r.restRecommendation.status === 'skip-today' ? 30
        : 10;
      return s + statusScore;
    }, 0) / relievers.length
  );

  const alert = mustRest >= 2
    ? `WARNING: ${mustRest} relievers must rest. Bullpen coverage is thin tonight.`
    : skip >= 3
    ? `CAUTION: ${skip} relievers should be skipped today. Manage leverage carefully.`
    : null;

  return {
    relievers,
    bullpenHealth,
    availableCount: available,
    sparinglyCount: sparingly,
    skipCount: skip,
    mustRestCount: mustRest,
    projectedEffectiveness: avgEff,
    fatigueAlert: alert,
  };
}
