// Bullpen Matchup Matrix — reliever performance vs lineup spots and handedness

export interface RelieverMatchup {
  pitcherId: string;
  name: string;
  throws: 'L' | 'R';
  role: string;
  vsLHB: { pa: number; avg: number; ops: number; k_pct: number };
  vsRHB: { pa: number; avg: number; ops: number; k_pct: number };
  byLineupSpot: Array<{
    spot: number;           // 1-9
    pa: number;
    avg: number;
    ops: number;
  }>;
  highLeverage: { pa: number; avg: number; era: number; kRate: number };
  overall: { era: number; whip: number; kPer9: number; bbPer9: number; ip: number };
  bestMatchup: string;
  worstMatchup: string;
}

export interface BullpenMatchupData {
  relievers: RelieverMatchup[];
  teamBullpenERA: number;
  teamBullpenWHIP: number;
}

export function getSplitColor(ops: number): string {
  if (ops <= 0.550) return '#22c55e';
  if (ops <= 0.700) return '#3b82f6';
  if (ops <= 0.800) return '#f59e0b';
  return '#ef4444';
}

export function getKRateColor(kPct: number): string {
  if (kPct >= 30) return '#22c55e';
  if (kPct >= 25) return '#3b82f6';
  if (kPct >= 20) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoBullpenMatchup(): BullpenMatchupData {
  const relievers: RelieverMatchup[] = [
    {
      pitcherId: 'R1', name: 'Félix Bautista', throws: 'R', role: 'Closer',
      vsLHB: { pa: 82, avg: .198, ops: .589, k_pct: 34.1 },
      vsRHB: { pa: 95, avg: .211, ops: .621, k_pct: 31.6 },
      byLineupSpot: [
        { spot: 1, pa: 22, avg: .182, ops: .545 }, { spot: 2, pa: 20, avg: .200, ops: .580 },
        { spot: 3, pa: 25, avg: .240, ops: .720 }, { spot: 4, pa: 23, avg: .217, ops: .652 },
        { spot: 5, pa: 18, avg: .167, ops: .500 }, { spot: 6, pa: 17, avg: .235, ops: .647 },
        { spot: 7, pa: 16, avg: .188, ops: .563 }, { spot: 8, pa: 20, avg: .150, ops: .450 },
        { spot: 9, pa: 16, avg: .125, ops: .375 },
      ],
      highLeverage: { pa: 68, avg: .191, era: 1.89, kRate: 35.3 },
      overall: { era: 2.14, whip: 0.94, kPer9: 12.4, bbPer9: 2.8, ip: 42.0 },
      bestMatchup: '#8-9 hitters (combined .138 AVG)',
      worstMatchup: '#3 hitters (.240 AVG)',
    },
    {
      pitcherId: 'R2', name: 'Yennier Cano', throws: 'R', role: 'Setup',
      vsLHB: { pa: 94, avg: .234, ops: .667, k_pct: 22.3 },
      vsRHB: { pa: 108, avg: .185, ops: .534, k_pct: 26.9 },
      byLineupSpot: [
        { spot: 1, pa: 24, avg: .208, ops: .583 }, { spot: 2, pa: 22, avg: .227, ops: .636 },
        { spot: 3, pa: 28, avg: .214, ops: .607 }, { spot: 4, pa: 26, avg: .231, ops: .654 },
        { spot: 5, pa: 22, avg: .182, ops: .500 }, { spot: 6, pa: 20, avg: .200, ops: .550 },
        { spot: 7, pa: 21, avg: .190, ops: .524 }, { spot: 8, pa: 18, avg: .167, ops: .444 },
        { spot: 9, pa: 21, avg: .143, ops: .381 },
      ],
      highLeverage: { pa: 72, avg: .194, era: 2.45, kRate: 27.8 },
      overall: { era: 2.67, whip: 1.05, kPer9: 9.3, bbPer9: 2.1, ip: 50.2 },
      bestMatchup: 'vs RHB (.185 AVG)',
      worstMatchup: 'vs LHB (.234 AVG)',
    },
    {
      pitcherId: 'R3', name: 'Danny Coulombe', throws: 'L', role: 'LOOGY',
      vsLHB: { pa: 65, avg: .154, ops: .462, k_pct: 32.3 },
      vsRHB: { pa: 48, avg: .292, ops: .833, k_pct: 16.7 },
      byLineupSpot: [
        { spot: 1, pa: 14, avg: .214, ops: .643 }, { spot: 2, pa: 12, avg: .167, ops: .500 },
        { spot: 3, pa: 16, avg: .250, ops: .750 }, { spot: 4, pa: 15, avg: .200, ops: .600 },
        { spot: 5, pa: 13, avg: .154, ops: .462 }, { spot: 6, pa: 11, avg: .182, ops: .545 },
        { spot: 7, pa: 12, avg: .250, ops: .667 }, { spot: 8, pa: 10, avg: .100, ops: .300 },
        { spot: 9, pa: 10, avg: .200, ops: .500 },
      ],
      highLeverage: { pa: 40, avg: .175, era: 2.70, kRate: 30.0 },
      overall: { era: 3.12, whip: 1.15, kPer9: 10.1, bbPer9: 3.4, ip: 34.2 },
      bestMatchup: 'vs LHB (.154 AVG)',
      worstMatchup: 'vs RHB (.292 AVG)',
    },
    {
      pitcherId: 'R4', name: 'Cionel Pérez', throws: 'L', role: 'Middle Relief',
      vsLHB: { pa: 70, avg: .186, ops: .543, k_pct: 28.6 },
      vsRHB: { pa: 88, avg: .239, ops: .705, k_pct: 21.6 },
      byLineupSpot: [
        { spot: 1, pa: 18, avg: .222, ops: .611 }, { spot: 2, pa: 17, avg: .235, ops: .647 },
        { spot: 3, pa: 22, avg: .227, ops: .682 }, { spot: 4, pa: 20, avg: .250, ops: .700 },
        { spot: 5, pa: 19, avg: .211, ops: .579 }, { spot: 6, pa: 16, avg: .188, ops: .563 },
        { spot: 7, pa: 15, avg: .200, ops: .533 }, { spot: 8, pa: 14, avg: .143, ops: .429 },
        { spot: 9, pa: 17, avg: .176, ops: .471 },
      ],
      highLeverage: { pa: 55, avg: .218, era: 3.10, kRate: 25.5 },
      overall: { era: 3.28, whip: 1.18, kPer9: 9.6, bbPer9: 3.0, ip: 46.2 },
      bestMatchup: 'vs LHB (.186 AVG)',
      worstMatchup: '#4 hitters (.250 AVG)',
    },
    {
      pitcherId: 'R5', name: 'Jacob Webb', throws: 'R', role: '7th Inning',
      vsLHB: { pa: 76, avg: .250, ops: .724, k_pct: 19.7 },
      vsRHB: { pa: 82, avg: .195, ops: .561, k_pct: 28.0 },
      byLineupSpot: [
        { spot: 1, pa: 19, avg: .211, ops: .632 }, { spot: 2, pa: 18, avg: .222, ops: .611 },
        { spot: 3, pa: 21, avg: .238, ops: .714 }, { spot: 4, pa: 20, avg: .250, ops: .700 },
        { spot: 5, pa: 17, avg: .176, ops: .529 }, { spot: 6, pa: 16, avg: .250, ops: .688 },
        { spot: 7, pa: 15, avg: .200, ops: .533 }, { spot: 8, pa: 17, avg: .176, ops: .471 },
        { spot: 9, pa: 15, avg: .133, ops: .400 },
      ],
      highLeverage: { pa: 48, avg: .229, era: 3.38, kRate: 22.9 },
      overall: { era: 3.45, whip: 1.22, kPer9: 8.8, bbPer9: 2.9, ip: 44.1 },
      bestMatchup: 'vs RHB (.195 AVG)',
      worstMatchup: 'vs LHB (.250 AVG)',
    },
    {
      pitcherId: 'R6', name: 'Mike Baumann', throws: 'R', role: 'Long Relief',
      vsLHB: { pa: 62, avg: .226, ops: .677, k_pct: 24.2 },
      vsRHB: { pa: 70, avg: .214, ops: .614, k_pct: 25.7 },
      byLineupSpot: [
        { spot: 1, pa: 16, avg: .188, ops: .563 }, { spot: 2, pa: 14, avg: .214, ops: .643 },
        { spot: 3, pa: 18, avg: .278, ops: .778 }, { spot: 4, pa: 16, avg: .250, ops: .688 },
        { spot: 5, pa: 14, avg: .214, ops: .571 }, { spot: 6, pa: 13, avg: .154, ops: .462 },
        { spot: 7, pa: 12, avg: .167, ops: .500 }, { spot: 8, pa: 15, avg: .200, ops: .533 },
        { spot: 9, pa: 14, avg: .214, ops: .571 },
      ],
      highLeverage: { pa: 32, avg: .250, era: 3.94, kRate: 21.9 },
      overall: { era: 3.67, whip: 1.28, kPer9: 8.4, bbPer9: 3.2, ip: 52.0 },
      bestMatchup: '#6-7 hitters (combined .160 AVG)',
      worstMatchup: '#3 hitters (.278 AVG)',
    },
  ];

  return { relievers, teamBullpenERA: 3.05, teamBullpenWHIP: 1.14 };
}
