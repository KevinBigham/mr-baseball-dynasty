// Prospect Call-Up Readiness — evaluate when prospects are ready for MLB

export interface ReadinessMetric {
  category: string;
  score: number;         // 0-100
  threshold: number;     // minimum needed
  passed: boolean;
}

export interface CallUpCandidate {
  name: string;
  position: string;
  age: number;
  level: 'A' | 'A+' | 'AA' | 'AAA';
  overallReadiness: number;    // 0-100
  eta: string;
  metrics: ReadinessMetric[];
  strengths: string[];
  concerns: string[];
  recommendation: 'ready-now' | 'needs-time' | 'close' | 'not-ready';
}

export interface CallUpReadinessData {
  teamName: string;
  candidates: CallUpCandidate[];
  nextCallUpWindow: string;
}

export function getReadinessColor(readiness: number): string {
  if (readiness >= 85) return '#22c55e';
  if (readiness >= 70) return '#3b82f6';
  if (readiness >= 50) return '#f59e0b';
  return '#ef4444';
}

export function getRecColor(rec: string): string {
  if (rec === 'ready-now') return '#22c55e';
  if (rec === 'close') return '#3b82f6';
  if (rec === 'needs-time') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoCallUpReadiness(): CallUpReadinessData {
  return {
    teamName: 'San Francisco Giants',
    nextCallUpWindow: 'September 1, 2026',
    candidates: [
      {
        name: 'Miguel Santos', position: 'SS', age: 22, level: 'AAA', overallReadiness: 88, eta: 'Ready Now',
        metrics: [
          { category: 'Hit Tool', score: 82, threshold: 70, passed: true },
          { category: 'Power', score: 75, threshold: 60, passed: true },
          { category: 'Defense', score: 90, threshold: 75, passed: true },
          { category: 'Plate Discipline', score: 78, threshold: 65, passed: true },
          { category: 'AAA Performance', score: 85, threshold: 70, passed: true },
        ],
        strengths: ['Elite glove at SS', 'Advanced plate approach', 'Consistent AAA production'],
        concerns: ['Limited power vs LHP', 'Has not faced MLB velocity'],
        recommendation: 'ready-now',
      },
      {
        name: 'Tyler Washington', position: 'OF', age: 23, level: 'AAA', overallReadiness: 72, eta: '2-3 months',
        metrics: [
          { category: 'Hit Tool', score: 68, threshold: 70, passed: false },
          { category: 'Power', score: 82, threshold: 60, passed: true },
          { category: 'Defense', score: 70, threshold: 65, passed: true },
          { category: 'Plate Discipline', score: 55, threshold: 65, passed: false },
          { category: 'AAA Performance', score: 75, threshold: 70, passed: true },
        ],
        strengths: ['Plus raw power', 'Strong arm in RF', 'Good AAA numbers'],
        concerns: ['High strikeout rate (28%)', 'Needs to cut chase rate', 'Below-avg vs breaking balls'],
        recommendation: 'close',
      },
      {
        name: 'Jordan Park', position: 'SP', age: 21, level: 'AA', overallReadiness: 55, eta: 'Mid-2027',
        metrics: [
          { category: 'Fastball Command', score: 62, threshold: 70, passed: false },
          { category: 'Secondary Stuff', score: 78, threshold: 65, passed: true },
          { category: 'Stamina', score: 55, threshold: 70, passed: false },
          { category: 'AA Performance', score: 72, threshold: 65, passed: true },
          { category: 'Composure', score: 48, threshold: 60, passed: false },
        ],
        strengths: ['Wipeout slider', 'High ceiling arm', 'Improving changeup'],
        concerns: ['Command inconsistency', 'Has not pitched past 5th inning consistently', 'Needs AA seasoning'],
        recommendation: 'needs-time',
      },
      {
        name: 'Derek Liu', position: 'RP', age: 24, level: 'AAA', overallReadiness: 82, eta: 'Ready Now',
        metrics: [
          { category: 'Velocity', score: 88, threshold: 75, passed: true },
          { category: 'Swing & Miss', score: 85, threshold: 70, passed: true },
          { category: 'Control', score: 72, threshold: 65, passed: true },
          { category: 'High Leverage', score: 78, threshold: 70, passed: true },
          { category: 'AAA Performance', score: 80, threshold: 70, passed: true },
        ],
        strengths: ['98 mph fastball', '35% whiff rate on slider', 'Dominates AAA hitters'],
        concerns: ['Occasional wildness', 'No MLB experience'],
        recommendation: 'ready-now',
      },
    ],
  };
}
