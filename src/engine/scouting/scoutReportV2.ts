// Scouting Report v2 — advanced opponent scouting with pitcher/batter tendencies

export interface PitcherScoutReport {
  name: string;
  team: string;
  pitches: Array<{ name: string; velocity: number; usage: number; whiffPct: number; weakness: string }>;
  tendencies: string[];
  exploitableWeakness: string;
  overallThreat: number;
}

export interface BatterScoutReport {
  name: string;
  team: string;
  hotZones: string[];
  coldZones: string[];
  chaseRate: number;
  pullTendency: number;
  weakPitchType: string;
  overallThreat: number;
}

export interface ScoutReportV2Data {
  opponentTeam: string;
  gameDate: string;
  pitcherReports: PitcherScoutReport[];
  batterReports: BatterScoutReport[];
  teamTendencies: string[];
}

export function getThreatColor(threat: number): string {
  if (threat >= 80) return '#ef4444';
  if (threat >= 60) return '#f59e0b';
  if (threat >= 40) return '#3b82f6';
  return '#22c55e';
}

export function generateDemoScoutReportV2(): ScoutReportV2Data {
  return {
    opponentTeam: 'Los Angeles Dodgers',
    gameDate: 'June 28, 2026',
    pitcherReports: [
      { name: 'Tyler Glasnow', team: 'LAD', pitches: [
        { name: 'Fastball', velocity: 97.2, usage: 48, whiffPct: 28, weakness: 'Hittable when thrown middle-middle' },
        { name: 'Curveball', velocity: 78.5, usage: 32, whiffPct: 38, weakness: 'Hangs when behind in count' },
        { name: 'Changeup', velocity: 89.1, usage: 20, whiffPct: 22, weakness: 'Below-average command' },
      ], tendencies: ['Heavy fastball early in counts', 'Goes to curveball with 2 strikes', 'Struggles with control in 1st inning'], exploitableWeakness: 'First-inning command issues — attack early', overallThreat: 85 },
      { name: 'Ryan Brasier', team: 'LAD', pitches: [
        { name: 'Sinker', velocity: 95.8, usage: 55, whiffPct: 12, weakness: 'Very hittable to opposite field' },
        { name: 'Slider', velocity: 87.2, usage: 45, whiffPct: 32, weakness: 'Backdoor slider telegraphed by arm angle' },
      ], tendencies: ['Sinker-heavy vs RHB', 'Slider-heavy vs LHB'], exploitableWeakness: 'Predictable pitch selection by batter handedness', overallThreat: 58 },
    ],
    batterReports: [
      { name: 'Shohei Ohtani', team: 'LAD', hotZones: ['Inner half up', 'Middle-middle'], coldZones: ['Down and away', 'Low and inside'], chaseRate: 23.8, pullTendency: 42.5, weakPitchType: 'Slider low and away', overallThreat: 95 },
      { name: 'Mookie Betts', team: 'LAD', hotZones: ['Up in zone', 'Inner half'], coldZones: ['Low and away'], chaseRate: 22.8, pullTendency: 38.2, weakPitchType: 'Hard sinker down', overallThreat: 88 },
      { name: 'Freddie Freeman', team: 'LAD', hotZones: ['Middle-away', 'Belt-high'], coldZones: ['Up and in'], chaseRate: 20.5, pullTendency: 35.2, weakPitchType: 'High fastball inside', overallThreat: 85 },
    ],
    teamTendencies: [
      'Most patient lineup in NL — force strikes early',
      'Aggressive on first pitch when ahead in count',
      'Bullpen vulnerable in 7th inning — target middle relief',
      'Steal attempts up 20% vs slow-delivering pitchers',
    ],
  };
}
