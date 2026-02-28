/**
 * sprayDirectionMatrix.ts – Advanced directional hitting analysis
 *
 * Bloomberg-terminal-style spray chart analytics for hitters.
 * Breaks down batted balls across a 9-zone matrix (pull/center/oppo
 * crossed with ground/line/fly), pitch-type spray tendencies,
 * spray scores, gap-to-gap profiling, and pull-power metrics.
 * All demo data — no sim engine changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SprayZone =
  | 'pull_ground'
  | 'pull_line'
  | 'pull_fly'
  | 'center_ground'
  | 'center_line'
  | 'center_fly'
  | 'oppo_ground'
  | 'oppo_line'
  | 'oppo_fly';

export interface SprayZoneData {
  zone: SprayZone;
  hitPct: number;       // % of total batted balls landing in this zone
  avgEV: number;        // average exit velocity (mph)
  wOBA: number;         // weighted on-base average in zone
  xBA: number;          // expected batting average in zone
  hardHitPct: number;   // % of balls hit >= 95 mph EV in this zone
}

export interface PitchTypeSpray {
  pitchType: string;    // e.g. "4-Seam Fastball", "Slider"
  pullPct: number;      // % of batted balls pulled
  centerPct: number;    // % to center
  oppoPct: number;      // % to opposite field
  pullwOBA: number;     // wOBA on pulled balls of this pitch type
  centerwOBA: number;   // wOBA on center-field balls of this pitch type
  oppowOBA: number;     // wOBA on opposite-field balls of this pitch type
}

export interface SprayProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  overallPullPct: number;
  overallCenterPct: number;
  overallOppoPct: number;
  zones: SprayZoneData[];               // 9 zones (3 directions x 3 ball types)
  pitchTypeBreakdown: PitchTypeSpray[]; // 4 pitch types
  pullPower: number;                    // HR pct to pull side (0-100)
  oppoFieldPct: number;                 // % of all batted balls to oppo field
  gapToGapPct: number;                  // % of line drives to LCF/RCF gaps
  sprayScore: number;                   // 0-100 — how well they use all fields
  tendencyLabel: string;                // e.g. "Dead Pull Hitter", "All-Fields Hitter"
  notes: string;
}

export type SprayGrade =
  | 'elite_spray'
  | 'good_spray'
  | 'avg_spray'
  | 'pull_heavy'
  | 'extreme_pull';

// ─── Display Map ────────────────────────────────────────────────────────────

export const SPRAY_GRADE_DISPLAY: Record<SprayGrade, { label: string; color: string; emoji: string }> = {
  elite_spray:  { label: 'ELITE SPRAY',    color: '#22c55e', emoji: '🎯' },
  good_spray:   { label: 'GOOD SPRAY',     color: '#4ade80', emoji: '✅' },
  avg_spray:    { label: 'AVERAGE SPRAY',  color: '#f59e0b', emoji: '➡️' },
  pull_heavy:   { label: 'PULL HEAVY',     color: '#f97316', emoji: '⬅️' },
  extreme_pull: { label: 'EXTREME PULL',   color: '#ef4444', emoji: '🔴' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function sprayGradeFromScore(score: number): SprayGrade {
  if (score >= 80) return 'elite_spray';
  if (score >= 65) return 'good_spray';
  if (score >= 45) return 'avg_spray';
  if (score >= 25) return 'pull_heavy';
  return 'extreme_pull';
}

export function sprayGradeColor(grade: SprayGrade): string {
  return SPRAY_GRADE_DISPLAY[grade].color;
}

function deriveTendencyLabel(pullPct: number, oppoPct: number, sprayScore: number): string {
  if (sprayScore >= 85) return 'All-Fields Hitter';
  if (sprayScore >= 70 && oppoPct >= 28) return 'Gap-to-Gap Hitter';
  if (pullPct >= 55) return 'Dead Pull Hitter';
  if (pullPct >= 48) return 'Pull-Side Heavy';
  if (oppoPct >= 35) return 'Opposite-Field Artist';
  if (sprayScore >= 55) return 'Balanced Approach';
  return 'Pull-Dominant';
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface SprayDirectionSummary {
  totalHitters: number;
  bestSpray: string;
  worstSpray: string;
  avgPullPct: string;
  avgSprayScore: string;
  mostPower: string;
}

export function getSprayDirectionSummary(profiles: SprayProfile[]): SprayDirectionSummary {
  if (profiles.length === 0) {
    return {
      totalHitters: 0,
      bestSpray: 'N/A',
      worstSpray: 'N/A',
      avgPullPct: '0.0',
      avgSprayScore: '0.0',
      mostPower: 'N/A',
    };
  }

  const byScore = [...profiles].sort((a, b) => b.sprayScore - a.sprayScore);
  const bestSpray = byScore[0];
  const worstSpray = byScore[byScore.length - 1];

  const avgPull = profiles.reduce((s, p) => s + p.overallPullPct, 0) / profiles.length;
  const avgScore = profiles.reduce((s, p) => s + p.sprayScore, 0) / profiles.length;

  const mostPowerHitter = [...profiles].sort((a, b) => b.pullPower - a.pullPower)[0];

  return {
    totalHitters: profiles.length,
    bestSpray: bestSpray.name,
    worstSpray: worstSpray.name,
    avgPullPct: avgPull.toFixed(1),
    avgSprayScore: avgScore.toFixed(1),
    mostPower: mostPowerHitter.name,
  };
}

// ─── Demo Data Builders ─────────────────────────────────────────────────────

function buildZones(
  pullG: number, pullL: number, pullF: number,
  cenG: number,  cenL: number,  cenF: number,
  oppG: number,  oppL: number,  oppF: number,
): SprayZoneData[] {
  // Each tuple: zone key, pct, base EV, base wOBA, base xBA, base hardHit%
  const raw: [SprayZone, number, number, number, number, number][] = [
    ['pull_ground',   pullG, 88.4,  0.195, 0.225, 22.4],
    ['pull_line',     pullL, 97.2,  0.485, 0.558, 62.8],
    ['pull_fly',      pullF, 95.0,  0.405, 0.262, 54.2],
    ['center_ground', cenG,  85.6,  0.235, 0.260, 15.8],
    ['center_line',   cenL,  94.8,  0.565, 0.625, 58.4],
    ['center_fly',    cenF,  93.2,  0.358, 0.198, 48.6],
    ['oppo_ground',   oppG,  83.2,  0.175, 0.235, 10.2],
    ['oppo_line',     oppL,  91.4,  0.445, 0.502, 42.6],
    ['oppo_fly',      oppF,  89.0,  0.295, 0.165, 28.8],
  ];

  return raw.map(([zone, pct, baseEV, baseWoba, baseXba, baseHH]) => ({
    zone,
    hitPct:     +pct.toFixed(1),
    avgEV:      +(baseEV + pct * 0.15).toFixed(1),
    wOBA:       +(baseWoba + pct * 0.006).toFixed(3),
    xBA:        +Math.min(baseXba + pct * 0.004, 0.780).toFixed(3),
    hardHitPct: +Math.min(baseHH + pct * 0.8, 95.0).toFixed(1),
  }));
}

function buildPitchSpray(
  pitchType: string,
  pullPct: number, centerPct: number, oppoPct: number,
  pullW: number, centerW: number, oppoW: number,
): PitchTypeSpray {
  return {
    pitchType,
    pullPct:    +pullPct.toFixed(1),
    centerPct:  +centerPct.toFixed(1),
    oppoPct:    +oppoPct.toFixed(1),
    pullwOBA:   +pullW.toFixed(3),
    centerwOBA: +centerW.toFixed(3),
    oppowOBA:   +oppoW.toFixed(3),
  };
}

// ─── Demo Generator ─────────────────────────────────────────────────────────

export function generateDemoSprayDirection(): SprayProfile[] {
  const profiles: SprayProfile[] = [
    // 1 — Elite spray hitter (contact/gap artist)
    {
      id: 'sdm-1',
      name: 'Kenji Tanaka',
      team: 'SEA',
      position: '2B',
      bats: 'L',
      overallPullPct: 34.2,
      overallCenterPct: 33.4,
      overallOppoPct: 32.4,
      zones: buildZones(10.4, 13.2, 10.6, 11.0, 12.6, 9.8, 10.8, 12.4, 9.2),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 36.0, 33.2, 30.8, 0.372, 0.395, 0.380),
        buildPitchSpray('Slider',          32.8, 34.0, 33.2, 0.335, 0.352, 0.345),
        buildPitchSpray('Changeup',        31.4, 35.2, 33.4, 0.358, 0.382, 0.362),
        buildPitchSpray('Curveball',       34.2, 33.0, 32.8, 0.305, 0.328, 0.318),
      ],
      pullPower: 44.8,
      oppoFieldPct: 32.4,
      gapToGapPct: 51.2,
      sprayScore: 93,
      tendencyLabel: '',
      notes: 'Best spray hitter in the league. Near-perfect 1/3 distribution across all directions. Elite contact with gap-to-gap approach. Virtually impossible to shift effectively.',
    },
    // 2 — Extreme pull power hitter
    {
      id: 'sdm-2',
      name: 'Carlos Ramirez',
      team: 'HOU',
      position: '1B',
      bats: 'R',
      overallPullPct: 58.8,
      overallCenterPct: 25.6,
      overallOppoPct: 15.6,
      zones: buildZones(20.2, 22.4, 16.2, 9.0, 9.6, 7.0, 5.0, 6.2, 4.4),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 63.2, 24.2, 12.6, 0.472, 0.318, 0.192),
        buildPitchSpray('Slider',          55.8, 26.8, 17.4, 0.385, 0.270, 0.168),
        buildPitchSpray('Changeup',        51.2, 29.8, 19.0, 0.408, 0.302, 0.210),
        buildPitchSpray('Curveball',       59.4, 25.0, 15.6, 0.352, 0.255, 0.148),
      ],
      pullPower: 92.4,
      oppoFieldPct: 15.6,
      gapToGapPct: 21.8,
      sprayScore: 16,
      tendencyLabel: '',
      notes: 'Extreme pull hitter — 92% of HRs to pull side. Devastating power but predictable. Aggressive shifts reduce BABIP by ~40 points. Feasts on inside fastballs.',
    },
    // 3 — All-fields gap hitter
    {
      id: 'sdm-3',
      name: 'David Chen',
      team: 'LAD',
      position: 'SS',
      bats: 'L',
      overallPullPct: 36.8,
      overallCenterPct: 34.0,
      overallOppoPct: 29.2,
      zones: buildZones(11.6, 14.2, 11.0, 11.4, 12.8, 9.8, 9.8, 11.2, 8.2),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 38.6, 33.8, 27.6, 0.392, 0.415, 0.368),
        buildPitchSpray('Slider',          35.2, 35.4, 29.4, 0.348, 0.378, 0.342),
        buildPitchSpray('Changeup',        33.4, 36.0, 30.6, 0.372, 0.398, 0.356),
        buildPitchSpray('Curveball',       35.8, 34.2, 30.0, 0.315, 0.345, 0.332),
      ],
      pullPower: 53.6,
      oppoFieldPct: 29.2,
      gapToGapPct: 47.8,
      sprayScore: 84,
      tendencyLabel: '',
      notes: 'True all-fields hitter. Spray score in 96th percentile. Can drive the ball to any part of the park. Shifts are ineffective. MVP-caliber bat.',
    },
    // 4 — Switch hitter with balanced profile
    {
      id: 'sdm-4',
      name: 'Tyler Washington',
      team: 'ATL',
      position: 'CF',
      bats: 'S',
      overallPullPct: 40.6,
      overallCenterPct: 34.2,
      overallOppoPct: 25.2,
      zones: buildZones(13.6, 15.0, 12.0, 11.8, 12.8, 9.6, 8.4, 10.0, 6.8),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 43.2, 32.4, 24.4, 0.402, 0.386, 0.345),
        buildPitchSpray('Slider',          38.8, 35.6, 25.6, 0.358, 0.368, 0.322),
        buildPitchSpray('Changeup',        36.4, 37.0, 26.6, 0.378, 0.392, 0.338),
        buildPitchSpray('Curveball',       40.2, 34.0, 25.8, 0.325, 0.352, 0.302),
      ],
      pullPower: 63.8,
      oppoFieldPct: 25.2,
      gapToGapPct: 43.2,
      sprayScore: 71,
      tendencyLabel: '',
      notes: 'Switch hitter with balanced spray from both sides. More pull-oriented from right side vs LHP. Good gap power and plus speed creates extra-base hits.',
    },
    // 5 — Pull-heavy slugger
    {
      id: 'sdm-5',
      name: 'Derek Williams',
      team: 'CHC',
      position: 'LF',
      bats: 'R',
      overallPullPct: 53.2,
      overallCenterPct: 28.0,
      overallOppoPct: 18.8,
      zones: buildZones(18.4, 20.2, 14.6, 9.6, 10.2, 8.2, 6.2, 7.4, 5.2),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 57.0, 26.4, 16.6, 0.448, 0.340, 0.228),
        buildPitchSpray('Slider',          50.8, 29.0, 20.2, 0.372, 0.292, 0.202),
        buildPitchSpray('Changeup',        49.2, 30.4, 20.4, 0.395, 0.315, 0.235),
        buildPitchSpray('Curveball',       53.0, 28.0, 19.0, 0.332, 0.278, 0.182),
      ],
      pullPower: 85.2,
      oppoFieldPct: 18.8,
      gapToGapPct: 27.6,
      sprayScore: 28,
      tendencyLabel: '',
      notes: 'Heavy pull hitter with monster pull-side power. High K-rate on outside pitches. Struggles against oppo-field shifting but raw power compensates on pull side.',
    },
    // 6 — Balanced veteran
    {
      id: 'sdm-6',
      name: 'Andre Brooks',
      team: 'STL',
      position: 'DH',
      bats: 'R',
      overallPullPct: 42.4,
      overallCenterPct: 33.0,
      overallOppoPct: 24.6,
      zones: buildZones(14.2, 15.6, 12.6, 11.2, 12.2, 9.6, 8.2, 9.8, 6.6),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 45.2, 31.8, 23.0, 0.412, 0.388, 0.335),
        buildPitchSpray('Slider',          40.6, 33.8, 25.6, 0.350, 0.322, 0.292),
        buildPitchSpray('Changeup',        39.2, 34.8, 26.0, 0.378, 0.362, 0.318),
        buildPitchSpray('Curveball',       42.8, 32.6, 24.6, 0.312, 0.298, 0.272),
      ],
      pullPower: 68.8,
      oppoFieldPct: 24.6,
      gapToGapPct: 40.6,
      sprayScore: 64,
      tendencyLabel: '',
      notes: 'Balanced power hitter with slight pull tendency. Veteran approach — can adjust mid-AB. Good plate coverage makes him dangerous in RBI situations.',
    },
    // 7 — Opposite-field contact specialist
    {
      id: 'sdm-7',
      name: 'Marcus Johnson',
      team: 'NYY',
      position: 'RF',
      bats: 'R',
      overallPullPct: 38.0,
      overallCenterPct: 30.4,
      overallOppoPct: 31.6,
      zones: buildZones(12.2, 14.0, 11.8, 10.4, 11.2, 8.8, 10.6, 12.0, 9.0),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 40.8, 29.6, 29.6, 0.385, 0.358, 0.368),
        buildPitchSpray('Slider',          36.2, 31.2, 32.6, 0.342, 0.318, 0.345),
        buildPitchSpray('Changeup',        34.8, 32.0, 33.2, 0.365, 0.342, 0.358),
        buildPitchSpray('Curveball',       37.4, 30.8, 31.8, 0.308, 0.288, 0.312),
      ],
      pullPower: 56.2,
      oppoFieldPct: 31.6,
      gapToGapPct: 44.8,
      sprayScore: 78,
      tendencyLabel: '',
      notes: 'Rare oppo-field approach with above-average power to all fields. Produces higher wOBA to opposite field than most hitters do to pull side. Shift-proof.',
    },
    // 8 — Pull-side power with adjustment ability
    {
      id: 'sdm-8',
      name: 'Jordan Mitchell',
      team: 'SD',
      position: '3B',
      bats: 'R',
      overallPullPct: 45.0,
      overallCenterPct: 31.2,
      overallOppoPct: 23.8,
      zones: buildZones(15.4, 16.8, 12.8, 10.6, 11.6, 9.0, 7.8, 9.4, 6.6),
      pitchTypeBreakdown: [
        buildPitchSpray('4-Seam Fastball', 48.6, 29.8, 21.6, 0.428, 0.382, 0.315),
        buildPitchSpray('Slider',          42.4, 32.4, 25.2, 0.362, 0.315, 0.278),
        buildPitchSpray('Changeup',        40.8, 33.6, 25.6, 0.390, 0.358, 0.302),
        buildPitchSpray('Curveball',       45.2, 30.8, 24.0, 0.318, 0.285, 0.252),
      ],
      pullPower: 72.4,
      oppoFieldPct: 23.8,
      gapToGapPct: 38.2,
      sprayScore: 56,
      tendencyLabel: '',
      notes: 'Slightly pull-heavy but shows oppo-field ability on breaking balls. Corner power with 30+ HR upside. Adjusts approach with 2 strikes to use whole field.',
    },
  ];

  // Derive tendency labels from computed stats
  for (const p of profiles) {
    p.tendencyLabel = deriveTendencyLabel(p.overallPullPct, p.overallOppoPct, p.sprayScore);
  }

  return profiles;
}
