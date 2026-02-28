// ── Hitter Approach Profiler ─────────────────────────────────────
// Breaks down each hitter's approach by count, zone, pitch type

export interface ApproachZone {
  zone: string;          // e.g. "Up & In", "Down & Away"
  swingRate: number;     // 0-100
  whiffRate: number;     // 0-100
  avgExitVelo: number;
  wOBA: number;
  label: 'strength' | 'neutral' | 'weakness';
}

export interface CountApproach {
  count: string;
  approach: string;      // "aggressive" | "patient" | "two-strike"
  swingRate: number;
  contactRate: number;
  slugging: number;
}

export interface HitterApproach {
  playerName: string;
  position: string;
  overallApproach: string;
  chaseRate: number;
  zoneContactRate: number;
  firstPitchSwingRate: number;
  zones: ApproachZone[];
  countApproaches: CountApproach[];
  tendencies: string[];
}

export interface HitterApproachData {
  teamName: string;
  hitters: HitterApproach[];
}

function getZoneLabel(wOBA: number): 'strength' | 'neutral' | 'weakness' {
  if (wOBA >= 0.370) return 'strength';
  if (wOBA >= 0.310) return 'neutral';
  return 'weakness';
}

export function getApproachColor(label: 'strength' | 'neutral' | 'weakness'): string {
  if (label === 'strength') return '#22c55e';
  if (label === 'weakness') return '#ef4444';
  return '#f59e0b';
}

export function generateDemoHitterApproach(): HitterApproachData {
  const hitters: HitterApproach[] = [
    {
      playerName: 'Carlos Delgado Jr.',
      position: 'DH',
      overallApproach: 'Dead-red fastball hunter',
      chaseRate: 24.1,
      zoneContactRate: 88.3,
      firstPitchSwingRate: 42.5,
      zones: [
        { zone: 'Up & In', swingRate: 72, whiffRate: 18, avgExitVelo: 96.4, wOBA: 0.425, label: 'strength' },
        { zone: 'Middle-Middle', swingRate: 88, whiffRate: 8, avgExitVelo: 98.1, wOBA: 0.510, label: 'strength' },
        { zone: 'Down & Away', swingRate: 38, whiffRate: 34, avgExitVelo: 84.2, wOBA: 0.265, label: 'weakness' },
        { zone: 'Up & Away', swingRate: 55, whiffRate: 22, avgExitVelo: 91.3, wOBA: 0.340, label: 'neutral' },
        { zone: 'Down & In', swingRate: 62, whiffRate: 15, avgExitVelo: 93.8, wOBA: 0.385, label: 'strength' },
        { zone: 'Glove Side Edge', swingRate: 30, whiffRate: 40, avgExitVelo: 82.1, wOBA: 0.220, label: 'weakness' },
      ],
      countApproaches: [
        { count: '0-0', approach: 'aggressive', swingRate: 42.5, contactRate: 91.0, slugging: 0.620 },
        { count: '1-0', approach: 'aggressive', swingRate: 48.2, contactRate: 89.5, slugging: 0.580 },
        { count: '0-2', approach: 'two-strike', swingRate: 55.0, contactRate: 72.3, slugging: 0.310 },
        { count: '3-1', approach: 'aggressive', swingRate: 68.0, contactRate: 94.2, slugging: 0.720 },
        { count: '2-2', approach: 'two-strike', swingRate: 62.0, contactRate: 78.1, slugging: 0.380 },
      ],
      tendencies: ['Ambushes fastballs early in count', 'Expands zone with 2 strikes down & away', 'Pulls inside pitches with authority'],
    },
    {
      playerName: 'Marcus Webb',
      position: 'CF',
      overallApproach: 'Selective patient hitter',
      chaseRate: 18.5,
      zoneContactRate: 91.7,
      firstPitchSwingRate: 22.1,
      zones: [
        { zone: 'Up & In', swingRate: 48, whiffRate: 25, avgExitVelo: 90.1, wOBA: 0.310, label: 'neutral' },
        { zone: 'Middle-Middle', swingRate: 82, whiffRate: 6, avgExitVelo: 94.8, wOBA: 0.480, label: 'strength' },
        { zone: 'Down & Away', swingRate: 52, whiffRate: 12, avgExitVelo: 89.5, wOBA: 0.375, label: 'strength' },
        { zone: 'Up & Away', swingRate: 44, whiffRate: 18, avgExitVelo: 88.7, wOBA: 0.335, label: 'neutral' },
        { zone: 'Down & In', swingRate: 58, whiffRate: 20, avgExitVelo: 91.2, wOBA: 0.350, label: 'neutral' },
        { zone: 'Glove Side Edge', swingRate: 22, whiffRate: 15, avgExitVelo: 85.3, wOBA: 0.290, label: 'weakness' },
      ],
      countApproaches: [
        { count: '0-0', approach: 'patient', swingRate: 22.1, contactRate: 95.0, slugging: 0.410 },
        { count: '1-0', approach: 'patient', swingRate: 30.5, contactRate: 93.2, slugging: 0.450 },
        { count: '0-2', approach: 'two-strike', swingRate: 48.0, contactRate: 82.5, slugging: 0.280 },
        { count: '3-1', approach: 'aggressive', swingRate: 58.0, contactRate: 96.0, slugging: 0.550 },
        { count: '2-2', approach: 'two-strike', swingRate: 55.0, contactRate: 84.0, slugging: 0.350 },
      ],
      tendencies: ['Works deep counts consistently', 'Sprays line drives to all fields', 'Rarely chases breaking balls down'],
    },
    {
      playerName: 'Terrence Baylor',
      position: '1B',
      overallApproach: 'Aggressive pull-side power',
      chaseRate: 31.8,
      zoneContactRate: 82.6,
      firstPitchSwingRate: 52.3,
      zones: [
        { zone: 'Up & In', swingRate: 78, whiffRate: 28, avgExitVelo: 97.2, wOBA: 0.390, label: 'strength' },
        { zone: 'Middle-Middle', swingRate: 92, whiffRate: 12, avgExitVelo: 99.5, wOBA: 0.540, label: 'strength' },
        { zone: 'Down & Away', swingRate: 45, whiffRate: 42, avgExitVelo: 80.5, wOBA: 0.195, label: 'weakness' },
        { zone: 'Up & Away', swingRate: 60, whiffRate: 35, avgExitVelo: 86.4, wOBA: 0.260, label: 'weakness' },
        { zone: 'Down & In', swingRate: 70, whiffRate: 22, avgExitVelo: 94.1, wOBA: 0.365, label: 'neutral' },
        { zone: 'Glove Side Edge', swingRate: 42, whiffRate: 48, avgExitVelo: 78.8, wOBA: 0.180, label: 'weakness' },
      ],
      countApproaches: [
        { count: '0-0', approach: 'aggressive', swingRate: 52.3, contactRate: 84.0, slugging: 0.680 },
        { count: '1-0', approach: 'aggressive', swingRate: 58.0, contactRate: 82.5, slugging: 0.710 },
        { count: '0-2', approach: 'two-strike', swingRate: 60.0, contactRate: 62.1, slugging: 0.250 },
        { count: '3-1', approach: 'aggressive', swingRate: 75.0, contactRate: 88.0, slugging: 0.820 },
        { count: '2-2', approach: 'aggressive', swingRate: 65.0, contactRate: 68.5, slugging: 0.320 },
      ],
      tendencies: ['Swings at first-pitch fastballs in zone', 'Vulnerable to sliders away', 'High K-rate but elite power on contact'],
    },
  ];

  return { teamName: 'San Francisco Giants', hitters };
}
