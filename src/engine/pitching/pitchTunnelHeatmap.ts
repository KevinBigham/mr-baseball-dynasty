// Pitch Tunnel Heatmap — visualize where pitchers release and tunnel pitch pairs

export interface TunnelZone {
  x: number;           // horizontal zone (-1 to 1)
  y: number;           // vertical zone (-1 to 1)
  pitchType: string;
  frequency: number;   // percentage
  whiffPct: number;
  velocity: number;
}

export interface PitcherTunnelHeatmap {
  name: string;
  team: string;
  tunnelZones: TunnelZone[];
  bestTunnelPair: { pitch1: string; pitch2: string; tunnelScore: number };
  overallTunnelGrade: string;
  releaseConsistency: number;  // 0-100
}

export interface TunnelHeatmapData {
  pitchers: PitcherTunnelHeatmap[];
  leagueAvgConsistency: number;
}

export function getTunnelGradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#22c55e';
  if (grade === 'B+' || grade === 'B') return '#3b82f6';
  if (grade === 'C+' || grade === 'C') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoTunnelHeatmap(): TunnelHeatmapData {
  return {
    leagueAvgConsistency: 72,
    pitchers: [
      { name: 'Javier Castillo', team: 'SF', tunnelZones: [
        { x: 0.1, y: 0.8, pitchType: 'FF', frequency: 35, whiffPct: 22, velocity: 96.5 },
        { x: 0.12, y: 0.82, pitchType: 'SL', frequency: 28, whiffPct: 38, velocity: 87.2 },
        { x: 0.08, y: 0.75, pitchType: 'CH', frequency: 18, whiffPct: 30, velocity: 88.8 },
        { x: -0.2, y: 0.6, pitchType: 'CB', frequency: 19, whiffPct: 28, velocity: 82.4 },
      ], bestTunnelPair: { pitch1: 'FF', pitch2: 'SL', tunnelScore: 92 }, overallTunnelGrade: 'A', releaseConsistency: 88 },
      { name: 'Greg Thornton', team: 'SF', tunnelZones: [
        { x: -0.1, y: 0.7, pitchType: 'SI', frequency: 38, whiffPct: 16, velocity: 93.2 },
        { x: -0.05, y: 0.65, pitchType: 'SL', frequency: 25, whiffPct: 32, velocity: 85.5 },
        { x: 0.15, y: 0.8, pitchType: 'FF', frequency: 22, whiffPct: 18, velocity: 94.1 },
        { x: -0.15, y: 0.55, pitchType: 'CH', frequency: 15, whiffPct: 26, velocity: 86.0 },
      ], bestTunnelPair: { pitch1: 'SI', pitch2: 'SL', tunnelScore: 85 }, overallTunnelGrade: 'B+', releaseConsistency: 78 },
      { name: 'Tyler Kim', team: 'SF', tunnelZones: [
        { x: 0.2, y: 0.9, pitchType: 'FF', frequency: 42, whiffPct: 24, velocity: 97.8 },
        { x: 0.18, y: 0.85, pitchType: 'SL', frequency: 35, whiffPct: 42, velocity: 89.2 },
        { x: 0.25, y: 0.7, pitchType: 'CH', frequency: 23, whiffPct: 28, velocity: 89.5 },
      ], bestTunnelPair: { pitch1: 'FF', pitch2: 'SL', tunnelScore: 94 }, overallTunnelGrade: 'A+', releaseConsistency: 92 },
    ],
  };
}
