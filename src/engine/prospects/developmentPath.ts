/**
 * Prospect Development Path
 *
 * Tracks development plans for prospects with skill drills,
 * progress milestones, coaching assignments, and projected
 * graduation timelines. Key for player development strategy.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DrillFocus = 'hitting' | 'power' | 'plate_discipline' | 'speed' | 'fielding' | 'arm' | 'pitch_dev' | 'command' | 'mental';
export type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming' | 'blocked';

export const DRILL_DISPLAY: Record<DrillFocus, { label: string; color: string; emoji: string }> = {
  hitting:           { label: 'Hit Tool',        color: '#22c55e', emoji: '🏏' },
  power:             { label: 'Power Dev',       color: '#ef4444', emoji: '💪' },
  plate_discipline:  { label: 'Plate Disc',      color: '#3b82f6', emoji: '👁️' },
  speed:             { label: 'Speed/Base',      color: '#a855f7', emoji: '⚡' },
  fielding:          { label: 'Glove Work',      color: '#eab308', emoji: '🧤' },
  arm:               { label: 'Arm Strength',    color: '#f97316', emoji: '💨' },
  pitch_dev:         { label: 'Pitch Dev',       color: '#06b6d4', emoji: '🎯' },
  command:           { label: 'Command',         color: '#8b5cf6', emoji: '📍' },
  mental:            { label: 'Mental Game',     color: '#64748b', emoji: '🧠' },
};

export const MILESTONE_DISPLAY: Record<MilestoneStatus, { label: string; color: string }> = {
  completed:   { label: 'Completed',    color: '#22c55e' },
  in_progress: { label: 'In Progress',  color: '#f59e0b' },
  upcoming:    { label: 'Upcoming',     color: '#3b82f6' },
  blocked:     { label: 'Blocked',      color: '#ef4444' },
};

export interface DevDrill {
  focus: DrillFocus;
  name: string;
  progressPct: number;       // 0-100
  weeksRemaining: number;
  expectedGain: string;      // e.g. "+5 Hit tool"
}

export interface DevMilestone {
  label: string;
  status: MilestoneStatus;
  targetDate: string;
  notes: string;
}

export interface ProspectDevPath {
  id: number;
  name: string;
  age: number;
  pos: string;
  level: string;
  orgRank: number;
  overallFV: number;
  assignedCoach: string;
  currentFocus: DrillFocus;
  drills: DevDrill[];
  milestones: DevMilestone[];
  devNotes: string;
  projectedGrad: string;     // "2025 mid", "2026", etc.
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDevPaths(): ProspectDevPath[] {
  return [
    {
      id: 0, name: 'Jackson Holliday', age: 20, pos: 'SS', level: 'AAA', orgRank: 1, overallFV: 70,
      assignedCoach: 'Matt Stairs (Hitting Coord)', currentFocus: 'power',
      drills: [
        { focus: 'power', name: 'Launch Angle Optimization', progressPct: 75, weeksRemaining: 4, expectedGain: '+5 Power' },
        { focus: 'plate_discipline', name: 'Two-Strike Approach', progressPct: 90, weeksRemaining: 2, expectedGain: '+3 Discipline' },
        { focus: 'fielding', name: 'Double Play Turns', progressPct: 60, weeksRemaining: 6, expectedGain: '+3 Fielding' },
      ],
      milestones: [
        { label: 'Reach 20 HR in AAA', status: 'in_progress', targetDate: 'Sep 2024', notes: '18 HR — on pace' },
        { label: 'Maintain .400+ OBP', status: 'completed', targetDate: 'Aug 2024', notes: '.410 OBP — achieved' },
        { label: 'MLB call-up evaluation', status: 'upcoming', targetDate: 'Sep 2024', notes: 'Final stretch assessment' },
      ],
      devNotes: 'Elite bat-to-ball already. Power developing rapidly. Ready for MLB audition in September.',
      projectedGrad: '2024 Sep',
    },
    {
      id: 1, name: 'Chase Burns', age: 22, pos: 'RHP', level: 'A+', orgRank: 4, overallFV: 60,
      assignedCoach: 'Rick Anderson (Pitching Dev)', currentFocus: 'pitch_dev',
      drills: [
        { focus: 'pitch_dev', name: 'Changeup Development', progressPct: 40, weeksRemaining: 16, expectedGain: '+10 Changeup' },
        { focus: 'command', name: 'Glove-Side Command', progressPct: 55, weeksRemaining: 10, expectedGain: '+5 Command' },
        { focus: 'mental', name: 'Pitch Sequencing IQ', progressPct: 30, weeksRemaining: 20, expectedGain: '+5 Composure' },
      ],
      milestones: [
        { label: 'Throw 50+ changeups/month', status: 'in_progress', targetDate: 'Oct 2024', notes: 'Currently at 35/month' },
        { label: 'Sub-3.00 ERA in A+', status: 'completed', targetDate: 'Jul 2024', notes: '2.85 ERA' },
        { label: 'Promotion to AA', status: 'upcoming', targetDate: 'Apr 2025', notes: 'Pending changeup progress' },
      ],
      devNotes: 'Electric arm. Fastball/slider already plus. Changeup is the key to front-of-rotation ceiling.',
      projectedGrad: '2026',
    },
    {
      id: 2, name: 'Thayron Liranzo', age: 18, pos: 'C', level: 'A', orgRank: 6, overallFV: 55,
      assignedCoach: 'Sandy Alomar Jr. (Catching Dev)', currentFocus: 'hitting',
      drills: [
        { focus: 'hitting', name: 'Pitch Recognition', progressPct: 25, weeksRemaining: 24, expectedGain: '+8 Hit Tool' },
        { focus: 'fielding', name: 'Framing & Blocking', progressPct: 45, weeksRemaining: 16, expectedGain: '+5 Catching' },
        { focus: 'mental', name: 'Game Calling', progressPct: 20, weeksRemaining: 30, expectedGain: '+5 Baseball IQ' },
      ],
      milestones: [
        { label: 'Reduce K% below 25%', status: 'in_progress', targetDate: 'Oct 2024', notes: 'Currently at 28%' },
        { label: 'Throw out 30%+ of runners', status: 'blocked', targetDate: 'Aug 2024', notes: 'Arm is there — footwork needs work' },
        { label: 'Full-season A ball', status: 'upcoming', targetDate: '2025', notes: 'Needs full development season' },
      ],
      devNotes: 'Rare power upside for a catcher. Very raw but improving. Long runway — patience required.',
      projectedGrad: '2027',
    },
    {
      id: 3, name: 'Braden Montgomery', age: 22, pos: 'OF', level: 'A', orgRank: 8, overallFV: 50,
      assignedCoach: 'Justin Morneau (Hitting Coord)', currentFocus: 'hitting',
      drills: [
        { focus: 'hitting', name: 'Contact Rate Improvement', progressPct: 35, weeksRemaining: 14, expectedGain: '+5 Hit Tool' },
        { focus: 'power', name: 'Pull-Side Power', progressPct: 50, weeksRemaining: 10, expectedGain: '+3 Power' },
        { focus: 'speed', name: 'Baserunning Reads', progressPct: 70, weeksRemaining: 4, expectedGain: '+2 Speed' },
      ],
      milestones: [
        { label: 'K% below 25%', status: 'blocked', targetDate: 'Sep 2024', notes: 'Currently at 28% — stalling' },
        { label: 'Switch-hit consistency', status: 'in_progress', targetDate: 'Oct 2024', notes: 'LH side lagging behind RH' },
        { label: 'Promotion to A+', status: 'upcoming', targetDate: 'Apr 2025', notes: 'Contingent on K% progress' },
      ],
      devNotes: 'Switch-hitter with power potential. Contact issues from left side concerning. Needs breakout.',
      projectedGrad: '2026 mid',
    },
  ];
}
