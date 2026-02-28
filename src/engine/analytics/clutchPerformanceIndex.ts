/**
 * clutchPerformanceIndex.ts – Clutch Performance Index Engine
 *
 * Tracks player performance in high-leverage situations and computes
 * a composite Clutch Rating from -5 (choke) to +5 (ice cold under pressure).
 *
 * Metrics tracked:
 *   - Close & Late BA (batting average in close-and-late situations)
 *   - RISP BA (runners in scoring position)
 *   - Go-ahead RBI rate (RBIs that give team the lead)
 *   - Save conversion rate (for pitchers)
 *   - Leverage-weighted WAR (WPA/LI-adjusted contribution)
 *   - Regular vs Clutch split comparison
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ClutchRating = 'ice-cold' | 'clutch' | 'steady' | 'shaky' | 'choke';

export interface RegularStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  wRC: number;       // wRC+
  war: number;
}

export interface ClutchStats {
  closeAndLateBA: number;
  closeAndLateOPS: number;
  rispBA: number;
  rispOPS: number;
  goAheadRBIs: number;
  goAheadRBIRate: number;    // per PA in go-ahead situations
  twoOutRISPBA: number;
  walkoffHits: number;
  leverageWAR: number;       // WPA/LI weighted
  saveConversion: number;    // for pitchers (% or 0 if hitter)
  highLevPA: number;         // plate appearances in high leverage
  highLevOPS: number;
}

export interface ClutchProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  overall: number;
  type: 'hitter' | 'pitcher';
  regular: RegularStats;
  clutch: ClutchStats;
  clutchRating: number;         // -5 to +5
  clutchLabel: ClutchRating;
  regularOPS: number;           // shorthand for comparison
  clutchOPS: number;            // shorthand for comparison
  opsDifferential: number;      // clutch - regular OPS
  compositeClutchScore: number; // 0-100
  seasonHighlights: string[];   // notable clutch moments
}

export interface ClutchSummary {
  totalPlayers: number;
  iceCount: number;
  clutchCount: number;
  steadyCount: number;
  shakyCount: number;
  chokeCount: number;
  teamClutchOPS: number;
  avgClutchRating: number;
  topClutchPlayer: string;
  worstClutchPlayer: string;
  teamWalkoffs: number;
}

// ── Display constants ──────────────────────────────────────────────────────

export const CLUTCH_LABEL_DISPLAY: Record<ClutchRating, { label: string; color: string; badge: string }> = {
  'ice-cold': { label: 'Ice Cold',  color: '#22c55e', badge: '+5' },
  'clutch':   { label: 'Clutch',    color: '#3b82f6', badge: '+' },
  'steady':   { label: 'Steady',    color: '#eab308', badge: '~' },
  'shaky':    { label: 'Shaky',     color: '#f97316', badge: '-' },
  'choke':    { label: 'Choke',     color: '#ef4444', badge: '!!' },
};

// ── Logic ──────────────────────────────────────────────────────────────────

function ratingToLabel(rating: number): ClutchRating {
  if (rating >= 3.5)  return 'ice-cold';
  if (rating >= 1.5)  return 'clutch';
  if (rating >= -1.0) return 'steady';
  if (rating >= -3.0) return 'shaky';
  return 'choke';
}

function computeClutchRating(profile: {
  opsDiff: number;
  goAheadRate: number;
  rispBA: number;
  walkoffs: number;
  leverageWAR: number;
  regularWAR: number;
}): number {
  // OPS differential: clutch OPS - regular OPS (weighted heavily)
  const opsDiffContrib = profile.opsDiff * 8; // .050 diff = +0.4

  // Go-ahead RBI rate premium
  const goAheadContrib = (profile.goAheadRate - 0.08) * 15;

  // RISP BA premium (above .260 baseline)
  const rispContrib = (profile.rispBA - 0.260) * 10;

  // Walk-off bonus
  const walkoffContrib = Math.min(1.5, profile.walkoffs * 0.5);

  // Leverage WAR vs regular WAR ratio
  const warRatio = profile.regularWAR > 0
    ? (profile.leverageWAR / profile.regularWAR) - 1
    : 0;
  const warContrib = warRatio * 3;

  const raw = opsDiffContrib + goAheadContrib + rispContrib + walkoffContrib + warContrib;
  return Math.max(-5, Math.min(5, Math.round(raw * 10) / 10));
}

function computeCompositeScore(rating: number): number {
  // Map -5..+5 to 0..100
  return Math.round(((rating + 5) / 10) * 100);
}

export function getClutchPerformanceSummary(profiles: ClutchProfile[]): ClutchSummary {
  const n = profiles.length;
  const sorted = [...profiles].sort((a, b) => b.clutchRating - a.clutchRating);

  return {
    totalPlayers: n,
    iceCount: profiles.filter(p => p.clutchLabel === 'ice-cold').length,
    clutchCount: profiles.filter(p => p.clutchLabel === 'clutch').length,
    steadyCount: profiles.filter(p => p.clutchLabel === 'steady').length,
    shakyCount: profiles.filter(p => p.clutchLabel === 'shaky').length,
    chokeCount: profiles.filter(p => p.clutchLabel === 'choke').length,
    teamClutchOPS: Math.round(
      (profiles.reduce((s, p) => s + p.clutchOPS, 0) / n) * 1000
    ) / 1000,
    avgClutchRating: Math.round(
      (profiles.reduce((s, p) => s + p.clutchRating, 0) / n) * 10
    ) / 10,
    topClutchPlayer: sorted[0]?.name ?? '',
    worstClutchPlayer: sorted[sorted.length - 1]?.name ?? '',
    teamWalkoffs: profiles.reduce((s, p) => s + p.clutch.walkoffHits, 0),
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface ProfileSeed {
  name: string;
  team: string;
  position: string;
  age: number;
  overall: number;
  type: 'hitter' | 'pitcher';
  regAvg: number;
  regOBP: number;
  regSLG: number;
  regWRC: number;
  regWAR: number;
  clBA: number;      // close&late BA
  clOPS: number;
  rispBA: number;
  rispOPS: number;
  goAheadRBIs: number;
  goAheadRate: number;
  twoOutRISP: number;
  walkoffs: number;
  levWAR: number;
  saveConv: number;
  highLevPA: number;
  highLevOPS: number;
  highlights: string[];
}

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    name: 'Aaron Judge', team: 'NYY', position: 'RF', age: 32, overall: 91, type: 'hitter',
    regAvg: .295, regOBP: .410, regSLG: .615, regWRC: 185, regWAR: 8.2,
    clBA: .335, clOPS: 1.105, rispBA: .320, rispOPS: 1.080, goAheadRBIs: 28, goAheadRate: .145,
    twoOutRISP: .310, walkoffs: 3, levWAR: 9.5, saveConv: 0, highLevPA: 95, highLevOPS: 1.120,
    highlights: ['Walk-off HR vs BOS in May', '3-run double in 9th to cap comeback vs TOR', 'Go-ahead 2-run HR in ALDS G4'],
  },
  {
    name: 'Freddie Freeman', team: 'LAD', position: '1B', age: 34, overall: 87, type: 'hitter',
    regAvg: .282, regOBP: .378, regSLG: .510, regWRC: 148, regWAR: 5.0,
    clBA: .340, clOPS: 1.020, rispBA: .345, rispOPS: 1.050, goAheadRBIs: 32, goAheadRate: .160,
    twoOutRISP: .330, walkoffs: 2, levWAR: 6.2, saveConv: 0, highLevPA: 88, highLevOPS: 1.040,
    highlights: ['Walk-off grand slam in WS G1', '4-for-5 with 5 RBI in elimination game', 'Go-ahead sac fly in 10th'],
  },
  {
    name: 'Mookie Betts', team: 'LAD', position: '2B', age: 31, overall: 88, type: 'hitter',
    regAvg: .278, regOBP: .372, regSLG: .520, regWRC: 152, regWAR: 5.5,
    clBA: .310, clOPS: .960, rispBA: .290, rispOPS: .920, goAheadRBIs: 22, goAheadRate: .120,
    twoOutRISP: .275, walkoffs: 1, levWAR: 5.8, saveConv: 0, highLevPA: 82, highLevOPS: .950,
    highlights: ['Clutch 2-run HR in NLCS G5', 'Walk-off single vs SD in June'],
  },
  {
    name: 'Francisco Lindor', team: 'NYM', position: 'SS', age: 30, overall: 85, type: 'hitter',
    regAvg: .268, regOBP: .342, regSLG: .480, regWRC: 130, regWAR: 5.8,
    clBA: .305, clOPS: .945, rispBA: .310, rispOPS: .960, goAheadRBIs: 25, goAheadRate: .135,
    twoOutRISP: .295, walkoffs: 2, levWAR: 6.5, saveConv: 0, highLevPA: 90, highLevOPS: .965,
    highlights: ['3-HR game in playoffs', 'Walk-off HR to clinch division', 'Clutch 2-RBI double in WC'],
  },
  {
    name: 'Juan Soto', team: 'NYM', position: 'RF', age: 26, overall: 92, type: 'hitter',
    regAvg: .288, regOBP: .415, regSLG: .545, regWRC: 170, regWAR: 7.2,
    clBA: .295, clOPS: .985, rispBA: .280, rispOPS: .940, goAheadRBIs: 20, goAheadRate: .110,
    twoOutRISP: .265, walkoffs: 1, levWAR: 7.0, saveConv: 0, highLevPA: 78, highLevOPS: .970,
    highlights: ['Clutch walk to set up rally in G7', 'Go-ahead HR in 8th vs ATL'],
  },
  {
    name: 'Rafael Devers', team: 'BOS', position: '3B', age: 27, overall: 86, type: 'hitter',
    regAvg: .275, regOBP: .345, regSLG: .530, regWRC: 142, regWAR: 4.5,
    clBA: .240, clOPS: .720, rispBA: .255, rispOPS: .750, goAheadRBIs: 14, goAheadRate: .075,
    twoOutRISP: .220, walkoffs: 0, levWAR: 3.2, saveConv: 0, highLevPA: 70, highLevOPS: .710,
    highlights: ['Season has been quiet in big moments', 'Multiple strikeouts with RISP in key spots'],
  },
  {
    name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', age: 24, overall: 90, type: 'hitter',
    regAvg: .332, regOBP: .389, regSLG: .588, regWRC: 168, regWAR: 8.1,
    clBA: .365, clOPS: 1.120, rispBA: .360, rispOPS: 1.100, goAheadRBIs: 35, goAheadRate: .170,
    twoOutRISP: .340, walkoffs: 4, levWAR: 9.8, saveConv: 0, highLevPA: 105, highLevOPS: 1.140,
    highlights: ['Walk-off inside-the-park HR', '5-for-5 in win-or-go-home game', 'Go-ahead triple in 8th', 'Cycle in clutch win'],
  },
  {
    name: 'Shohei Ohtani', team: 'LAD', position: 'DH', age: 30, overall: 93, type: 'hitter',
    regAvg: .304, regOBP: .390, regSLG: .625, regWRC: 190, regWAR: 9.0,
    clBA: .280, clOPS: .920, rispBA: .270, rispOPS: .890, goAheadRBIs: 22, goAheadRate: .105,
    twoOutRISP: .255, walkoffs: 1, levWAR: 8.0, saveConv: 0, highLevPA: 85, highLevOPS: .910,
    highlights: ['Walk-off grand slam in WS', 'Solo HR off closer in tie game'],
  },
  {
    name: 'Gunnar Henderson', team: 'BAL', position: '3B', age: 23, overall: 88, type: 'hitter',
    regAvg: .282, regOBP: .365, regSLG: .540, regWRC: 155, regWAR: 6.8,
    clBA: .310, clOPS: .990, rispBA: .305, rispOPS: .975, goAheadRBIs: 26, goAheadRate: .140,
    twoOutRISP: .300, walkoffs: 2, levWAR: 7.5, saveConv: 0, highLevPA: 92, highLevOPS: 1.000,
    highlights: ['Walk-off HR in extras vs NYY', 'Clutch 2-run double to tie game in 9th', 'Go-ahead HR in ALCS'],
  },
  {
    name: 'Corey Seager', team: 'TEX', position: 'SS', age: 30, overall: 86, type: 'hitter',
    regAvg: .275, regOBP: .355, regSLG: .510, regWRC: 138, regWAR: 4.8,
    clBA: .330, clOPS: 1.050, rispBA: .315, rispOPS: 1.010, goAheadRBIs: 24, goAheadRate: .130,
    twoOutRISP: .305, walkoffs: 2, levWAR: 5.8, saveConv: 0, highLevPA: 80, highLevOPS: 1.035,
    highlights: ['WS MVP-caliber October', 'Walk-off double in ALCS G6', 'Go-ahead HR off closer in Aug'],
  },
  {
    name: 'Adolis Garcia', team: 'TEX', position: 'RF', age: 31, overall: 80, type: 'hitter',
    regAvg: .248, regOBP: .305, regSLG: .465, regWRC: 112, regWAR: 3.0,
    clBA: .310, clOPS: .980, rispBA: .295, rispOPS: .950, goAheadRBIs: 22, goAheadRate: .135,
    twoOutRISP: .290, walkoffs: 3, levWAR: 4.5, saveConv: 0, highLevPA: 75, highLevOPS: .995,
    highlights: ['Walk-off HR in ALCS G1', 'Game-tying HR in 9th vs HOU', 'Clutch throw from RF to nail runner at plate'],
  },
  {
    name: 'Elly De La Cruz', team: 'CIN', position: 'SS', age: 22, overall: 85, type: 'hitter',
    regAvg: .258, regOBP: .318, regSLG: .490, regWRC: 122, regWAR: 5.2,
    clBA: .225, clOPS: .680, rispBA: .235, rispOPS: .700, goAheadRBIs: 12, goAheadRate: .070,
    twoOutRISP: .200, walkoffs: 0, levWAR: 3.5, saveConv: 0, highLevPA: 65, highLevOPS: .660,
    highlights: ['Electric speed but struggles with situational hitting', 'K rate spikes in high-leverage spots'],
  },
  {
    name: 'Bryce Harper', team: 'PHI', position: '1B', age: 31, overall: 86, type: 'hitter',
    regAvg: .274, regOBP: .380, regSLG: .520, regWRC: 150, regWAR: 4.5,
    clBA: .325, clOPS: 1.060, rispBA: .310, rispOPS: 1.020, goAheadRBIs: 28, goAheadRate: .150,
    twoOutRISP: .320, walkoffs: 2, levWAR: 5.8, saveConv: 0, highLevPA: 85, highLevOPS: 1.070,
    highlights: ['Walk-off HR in NLCS G5 repeat', 'Go-ahead 3-run HR in elimination game', '5-RBI game in close win'],
  },
  {
    name: 'Emmanuel Clase', team: 'CLE', position: 'RP', age: 26, overall: 84, type: 'pitcher',
    regAvg: .200, regOBP: .255, regSLG: .290, regWRC: 65, regWAR: 2.5,
    clBA: .170, clOPS: .430, rispBA: .185, rispOPS: .480, goAheadRBIs: 0, goAheadRate: 0,
    twoOutRISP: .165, walkoffs: 0, levWAR: 3.2, saveConv: .920, highLevPA: 120, highLevOPS: .445,
    highlights: ['42-for-46 in save opportunities', 'Cutter untouchable in late innings', '12-pitch immaculate inning'],
  },
  {
    name: 'Ryan Helsley', team: 'STL', position: 'RP', age: 30, overall: 82, type: 'pitcher',
    regAvg: .195, regOBP: .265, regSLG: .310, regWRC: 70, regWAR: 2.0,
    clBA: .215, clOPS: .560, rispBA: .230, rispOPS: .600, goAheadRBIs: 0, goAheadRate: 0,
    twoOutRISP: .225, walkoffs: 0, levWAR: 1.5, saveConv: .820, highLevPA: 105, highLevOPS: .575,
    highlights: ['Multiple blown saves in high-profile spots', '3 blown saves in a 2-week stretch'],
  },
  {
    name: 'Paul Skenes', team: 'PIT', position: 'SP', age: 22, overall: 85, type: 'pitcher',
    regAvg: .205, regOBP: .260, regSLG: .330, regWRC: 72, regWAR: 4.0,
    clBA: .180, clOPS: .450, rispBA: .190, rispOPS: .470, goAheadRBIs: 0, goAheadRate: 0,
    twoOutRISP: .175, walkoffs: 0, levWAR: 4.8, saveConv: 0, highLevPA: 85, highLevOPS: .440,
    highlights: ['Dominant in close games — opponents hit .180 in high leverage', '15K shutout in must-win game'],
  },
  {
    name: 'Trea Turner', team: 'PHI', position: 'SS', age: 31, overall: 82, type: 'hitter',
    regAvg: .268, regOBP: .325, regSLG: .445, regWRC: 118, regWAR: 3.5,
    clBA: .300, clOPS: .880, rispBA: .285, rispOPS: .850, goAheadRBIs: 18, goAheadRate: .110,
    twoOutRISP: .270, walkoffs: 1, levWAR: 3.8, saveConv: 0, highLevPA: 72, highLevOPS: .870,
    highlights: ['Walk-off bunt single in extras', 'Clutch stolen base to set up winning run'],
  },
  {
    name: 'Pete Alonso', team: 'NYM', position: '1B', age: 29, overall: 79, type: 'hitter',
    regAvg: .220, regOBP: .318, regSLG: .475, regWRC: 118, regWAR: 2.8,
    clBA: .195, clOPS: .660, rispBA: .210, rispOPS: .700, goAheadRBIs: 16, goAheadRate: .090,
    twoOutRISP: .185, walkoffs: 1, levWAR: 2.0, saveConv: 0, highLevPA: 68, highLevOPS: .640,
    highlights: ['Power surges but struggles with average in clutch', 'Walk-off HR in HR Derby (does that count?)'],
  },
  {
    name: 'Jarren Duran', team: 'BOS', position: 'CF', age: 27, overall: 82, type: 'hitter',
    regAvg: .285, regOBP: .342, regSLG: .492, regWRC: 135, regWAR: 5.5,
    clBA: .320, clOPS: .950, rispBA: .310, rispOPS: .930, goAheadRBIs: 24, goAheadRate: .130,
    twoOutRISP: .295, walkoffs: 2, levWAR: 6.2, saveConv: 0, highLevPA: 80, highLevOPS: .960,
    highlights: ['ASG MVP with go-ahead HR', 'Walk-off triple in Aug', 'Back-to-back clutch HRs in doubleheader'],
  },
  {
    name: 'Marcus Semien', team: 'TEX', position: '2B', age: 33, overall: 80, type: 'hitter',
    regAvg: .265, regOBP: .330, regSLG: .440, regWRC: 115, regWAR: 3.5,
    clBA: .230, clOPS: .680, rispBA: .240, rispOPS: .710, goAheadRBIs: 13, goAheadRate: .080,
    twoOutRISP: .215, walkoffs: 0, levWAR: 2.5, saveConv: 0, highLevPA: 65, highLevOPS: .670,
    highlights: ['Quiet in big spots this season', '0-for-12 in high-leverage at-bats in Sept'],
  },
];

export function generateDemoClutchPerformance(): ClutchProfile[] {
  return PROFILE_SEEDS.map((seed, i) => {
    const regularOPS = Math.round((seed.regOBP + seed.regSLG) * 1000) / 1000;
    const clutchOPS = seed.type === 'pitcher'
      ? seed.clOPS   // for pitchers, this is opposing OPS
      : seed.clOPS;
    const opsDiff = Math.round((clutchOPS - regularOPS) * 1000) / 1000;

    const clutchRating = seed.type === 'pitcher'
      // Pitchers: lower opponent OPS in clutch = more clutch
      ? computeClutchRating({
          opsDiff: -(seed.clOPS - (seed.regOBP + seed.regSLG)),
          goAheadRate: seed.saveConv > 0 ? seed.saveConv * 0.15 : 0.08,
          rispBA: 0.260 - seed.rispBA,
          walkoffs: 0,
          leverageWAR: seed.levWAR,
          regularWAR: seed.regWAR,
        })
      : computeClutchRating({
          opsDiff: opsDiff,
          goAheadRate: seed.goAheadRate,
          rispBA: seed.rispBA,
          walkoffs: seed.walkoffs,
          leverageWAR: seed.levWAR,
          regularWAR: seed.regWAR,
        });

    const label = ratingToLabel(clutchRating);

    return {
      id: `cp-${i}`,
      name: seed.name,
      team: seed.team,
      position: seed.position,
      age: seed.age,
      overall: seed.overall,
      type: seed.type,
      regular: {
        avg: seed.regAvg,
        obp: seed.regOBP,
        slg: seed.regSLG,
        ops: regularOPS,
        wRC: seed.regWRC,
        war: seed.regWAR,
      },
      clutch: {
        closeAndLateBA: seed.clBA,
        closeAndLateOPS: seed.clOPS,
        rispBA: seed.rispBA,
        rispOPS: seed.rispOPS,
        goAheadRBIs: seed.goAheadRBIs,
        goAheadRBIRate: seed.goAheadRate,
        twoOutRISPBA: seed.twoOutRISP,
        walkoffHits: seed.walkoffs,
        leverageWAR: seed.levWAR,
        saveConversion: seed.saveConv,
        highLevPA: seed.highLevPA,
        highLevOPS: seed.highLevOPS,
      },
      clutchRating,
      clutchLabel: label,
      regularOPS: regularOPS,
      clutchOPS: clutchOPS,
      opsDifferential: opsDiff,
      compositeClutchScore: computeCompositeScore(clutchRating),
      seasonHighlights: seed.highlights,
    };
  });
}
