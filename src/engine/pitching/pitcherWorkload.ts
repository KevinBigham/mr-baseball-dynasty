/**
 * pitcherWorkload.ts – Pitcher workload monitor
 *
 * Tracks pitcher innings/pitch count progression, compares to career norms,
 * flags overuse risks, and provides workload management recommendations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type WorkloadStatus = 'green' | 'yellow' | 'orange' | 'red';

export interface MonthlyWorkload {
  month: string;
  ip: number;
  pitches: number;
  starts: number;
  avgPitchesPerStart: number;
}

export interface PitcherWorkloadProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP';
  age: number;
  currentIP: number;
  projectedIP: number;
  careerHighIP: number;
  ipLimit: number;           // recommended max IP
  currentPitches: number;
  pitchesPerStart: number;
  status: WorkloadStatus;
  overuseRisk: number;       // 0-100
  daysRest: number;
  avgDaysRest: number;
  monthlyBreakdown: MonthlyWorkload[];
  velocityTrend: number;     // mph change from start of season, negative = declining
  eraSecondHalf: number;
  eraFirstHalf: number;
  fatigueIndicators: string[];
  recommendation: string;
  notes: string;
}

export const STATUS_DISPLAY: Record<WorkloadStatus, { label: string; color: string }> = {
  green: { label: 'HEALTHY', color: '#22c55e' },
  yellow: { label: 'MONITOR', color: '#facc15' },
  orange: { label: 'CAUTION', color: '#f97316' },
  red: { label: 'SHUTDOWN', color: '#ef4444' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface WorkloadSummary {
  totalPitchers: number;
  greenCount: number;
  cautionCount: number;
  highestIP: string;
  avgOveruseRisk: number;
  shutdownCandidates: number;
}

export function getWorkloadSummary(pitchers: PitcherWorkloadProfile[]): WorkloadSummary {
  const highest = pitchers.reduce((a, b) => a.currentIP > b.currentIP ? a : b);
  const avgRisk = pitchers.reduce((s, p) => s + p.overuseRisk, 0) / pitchers.length;

  return {
    totalPitchers: pitchers.length,
    greenCount: pitchers.filter(p => p.status === 'green').length,
    cautionCount: pitchers.filter(p => p.status === 'orange' || p.status === 'red').length,
    highestIP: highest.name,
    avgOveruseRisk: Math.round(avgRisk),
    shutdownCandidates: pitchers.filter(p => p.status === 'red').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoPitcherWorkload(): PitcherWorkloadProfile[] {
  const data: Omit<PitcherWorkloadProfile, 'id'>[] = [
    {
      name: 'Marcus Webb', team: 'NYM', role: 'SP', age: 28,
      currentIP: 178.2, projectedIP: 205, careerHighIP: 198, ipLimit: 200,
      currentPitches: 2850, pitchesPerStart: 98, status: 'yellow',
      overuseRisk: 45, daysRest: 4, avgDaysRest: 4.5,
      monthlyBreakdown: [
        { month: 'Apr', ip: 32, pitches: 510, starts: 5, avgPitchesPerStart: 102 },
        { month: 'May', ip: 35, pitches: 555, starts: 6, avgPitchesPerStart: 93 },
        { month: 'Jun', ip: 34, pitches: 540, starts: 5, avgPitchesPerStart: 108 },
        { month: 'Jul', ip: 38, pitches: 600, starts: 6, avgPitchesPerStart: 100 },
        { month: 'Aug', ip: 39.2, pitches: 645, starts: 6, avgPitchesPerStart: 108 },
      ],
      velocityTrend: -0.8, eraFirstHalf: 3.05, eraSecondHalf: 3.42,
      fatigueIndicators: ['Velocity down 0.8 mph', 'Pitch count trending up', 'Approaching career-high IP'],
      recommendation: 'Start managing pitch counts. Skip one September start to stay under 200 IP.',
      notes: 'Workload increasing. Velocity dip is a concern. Still effective but watch closely.',
    },
    {
      name: 'Derek Calloway', team: 'HOU', role: 'SP', age: 26,
      currentIP: 168.0, projectedIP: 195, careerHighIP: 180, ipLimit: 190,
      currentPitches: 2720, pitchesPerStart: 102, status: 'yellow',
      overuseRisk: 52, daysRest: 5, avgDaysRest: 4.8,
      monthlyBreakdown: [
        { month: 'Apr', ip: 28, pitches: 448, starts: 5, avgPitchesPerStart: 90 },
        { month: 'May', ip: 33, pitches: 535, starts: 5, avgPitchesPerStart: 107 },
        { month: 'Jun', ip: 35, pitches: 570, starts: 6, avgPitchesPerStart: 95 },
        { month: 'Jul', ip: 36, pitches: 585, starts: 6, avgPitchesPerStart: 98 },
        { month: 'Aug', ip: 36, pitches: 582, starts: 5, avgPitchesPerStart: 116 },
      ],
      velocityTrend: -0.3, eraFirstHalf: 2.85, eraSecondHalf: 3.15,
      fatigueIndicators: ['Aug pitch counts elevated', 'Will surpass career-high IP by ~15'],
      recommendation: 'Consider a piggyback start in September. Limit to 90 pitches in remaining starts.',
      notes: 'Young arm being pushed. Still throwing hard but workload management important for long-term health.',
    },
    {
      name: 'Carlos Medina', team: 'SD', role: 'SP', age: 30,
      currentIP: 155.0, projectedIP: 180, careerHighIP: 210, ipLimit: 195,
      currentPitches: 2480, pitchesPerStart: 95, status: 'green',
      overuseRisk: 18, daysRest: 5, avgDaysRest: 5.0,
      monthlyBreakdown: [
        { month: 'Apr', ip: 30, pitches: 480, starts: 5, avgPitchesPerStart: 96 },
        { month: 'May', ip: 32, pitches: 512, starts: 5, avgPitchesPerStart: 102 },
        { month: 'Jun', ip: 30, pitches: 475, starts: 5, avgPitchesPerStart: 95 },
        { month: 'Jul', ip: 32, pitches: 510, starts: 6, avgPitchesPerStart: 85 },
        { month: 'Aug', ip: 31, pitches: 503, starts: 5, avgPitchesPerStart: 101 },
      ],
      velocityTrend: 0.2, eraFirstHalf: 3.25, eraSecondHalf: 3.18,
      fatigueIndicators: [],
      recommendation: 'On track. No workload concerns. Can pitch deep into October if needed.',
      notes: 'Well-managed workload well under career norms. Velocity actually ticking up. Healthy and fresh.',
    },
    {
      name: 'Ryan Kowalski', team: 'ATL', role: 'RP', age: 29,
      currentIP: 62.0, projectedIP: 72, careerHighIP: 68, ipLimit: 70,
      currentPitches: 1020, pitchesPerStart: 18, status: 'orange',
      overuseRisk: 68, daysRest: 1, avgDaysRest: 1.8,
      monthlyBreakdown: [
        { month: 'Apr', ip: 10, pitches: 162, starts: 10, avgPitchesPerStart: 16 },
        { month: 'May', ip: 12, pitches: 198, starts: 12, avgPitchesPerStart: 17 },
        { month: 'Jun', ip: 11, pitches: 182, starts: 11, avgPitchesPerStart: 17 },
        { month: 'Jul', ip: 14, pitches: 235, starts: 14, avgPitchesPerStart: 17 },
        { month: 'Aug', ip: 15, pitches: 243, starts: 13, avgPitchesPerStart: 19 },
      ],
      velocityTrend: -1.2, eraFirstHalf: 1.85, eraSecondHalf: 2.95,
      fatigueIndicators: ['Velocity down 1.2 mph', 'ERA spiked 2nd half', 'Pitching on back-to-back days frequently', 'Approaching career-high IP'],
      recommendation: 'REDUCE USAGE IMMEDIATELY. Give 2+ days rest between appearances. Save for October.',
      notes: 'Clear fatigue signs. Being leaned on too heavily. Velocity drop and ERA spike are red flags.',
    },
    {
      name: 'Terrence Miles', team: 'CWS', role: 'SP', age: 27,
      currentIP: 142.0, projectedIP: 165, careerHighIP: 155, ipLimit: 170,
      currentPitches: 2310, pitchesPerStart: 90, status: 'green',
      overuseRisk: 22, daysRest: 5, avgDaysRest: 5.2,
      monthlyBreakdown: [
        { month: 'Apr', ip: 28, pitches: 452, starts: 5, avgPitchesPerStart: 90 },
        { month: 'May', ip: 30, pitches: 485, starts: 5, avgPitchesPerStart: 97 },
        { month: 'Jun', ip: 28, pitches: 448, starts: 5, avgPitchesPerStart: 90 },
        { month: 'Jul', ip: 28, pitches: 455, starts: 5, avgPitchesPerStart: 91 },
        { month: 'Aug', ip: 28, pitches: 470, starts: 5, avgPitchesPerStart: 94 },
      ],
      velocityTrend: 0.0, eraFirstHalf: 4.15, eraSecondHalf: 4.22,
      fatigueIndicators: [],
      recommendation: 'No concerns. Low pitch counts and consistent rest days. Can stretch into September.',
      notes: 'Well-managed. Short outings keep workload down. Not a fatigue risk.',
    },
    {
      name: 'Austin Pierce', team: 'BOS', role: 'RP', age: 28,
      currentIP: 58.0, projectedIP: 68, careerHighIP: 65, ipLimit: 68,
      currentPitches: 955, pitchesPerStart: 17, status: 'red',
      overuseRisk: 82, daysRest: 0, avgDaysRest: 1.5,
      monthlyBreakdown: [
        { month: 'Apr', ip: 9, pitches: 148, starts: 9, avgPitchesPerStart: 16 },
        { month: 'May', ip: 11, pitches: 182, starts: 11, avgPitchesPerStart: 17 },
        { month: 'Jun', ip: 10, pitches: 165, starts: 10, avgPitchesPerStart: 17 },
        { month: 'Jul', ip: 14, pitches: 235, starts: 14, avgPitchesPerStart: 17 },
        { month: 'Aug', ip: 14, pitches: 225, starts: 12, avgPitchesPerStart: 19 },
      ],
      velocityTrend: -1.8, eraFirstHalf: 1.65, eraSecondHalf: 3.85,
      fatigueIndicators: ['Velocity down 1.8 mph', '2nd half ERA doubled', 'Pitched 3 days in a row', 'Career-high IP pace', 'Splitter losing depth'],
      recommendation: 'SHUTDOWN CANDIDATE. Velocity plummeting. Must rest for minimum 7-10 days to preserve for playoffs.',
      notes: 'Serious overuse. All signs point to fatigue-related breakdown. Splitter is losing movement. Immediate rest needed.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `wl-${i}` }));
}
