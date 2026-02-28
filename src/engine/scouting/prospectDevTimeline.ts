/**
 * prospectDevTimeline.ts – Prospect Development Timeline
 *
 * Tracks prospect progression through the minor league system
 * with milestone events, grade changes, and projected MLB arrival.
 * Provides visual timeline data for development tracking.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MilestoneType = 'promotion' | 'grade_up' | 'grade_down' | 'injury' | 'breakout' | 'debut' | 'signed';

export interface DevMilestone {
  date: string;
  type: MilestoneType;
  level: string;
  description: string;
  gradeChange?: { from: number; to: number };
}

export interface ProspectTimeline {
  prospectId: number;
  name: string;
  position: string;
  currentLevel: string;
  currentGrade: number;
  draftYear: number;
  milestones: DevMilestone[];
  projectedDebut: string;
  developmentPace: 'fast' | 'normal' | 'slow';
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const MILESTONE_DISPLAY: Record<MilestoneType, { label: string; color: string; icon: string }> = {
  promotion:  { label: 'PROMOTION',  color: '#22c55e', icon: '↑' },
  grade_up:   { label: 'GRADE UP',   color: '#4ade80', icon: '+' },
  grade_down: { label: 'GRADE DOWN', color: '#ef4444', icon: '−' },
  injury:     { label: 'INJURY',     color: '#f97316', icon: '!' },
  breakout:   { label: 'BREAKOUT',   color: '#f59e0b', icon: '★' },
  debut:      { label: 'MLB DEBUT',  color: '#3b82f6', icon: '◆' },
  signed:     { label: 'SIGNED',     color: '#9ca3af', icon: '✓' },
};

export function getPaceColor(pace: ProspectTimeline['developmentPace']): string {
  return pace === 'fast' ? '#22c55e' : pace === 'normal' ? '#f59e0b' : '#ef4444';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoProspectTimelines(): ProspectTimeline[] {
  return [
    {
      prospectId: 1, name: 'Jaden Cruz', position: 'SS', currentLevel: 'AA', currentGrade: 72, draftYear: 2023,
      projectedDebut: 'Mid 2025', developmentPace: 'fast',
      milestones: [
        { date: 'Jun 2023', type: 'signed', level: 'Rookie', description: '1st round pick, signed for $5.2M bonus' },
        { date: 'Aug 2023', type: 'promotion', level: 'A', description: 'Promoted to Low-A after dominant Rookie ball' },
        { date: 'Sep 2023', type: 'grade_up', level: 'A', description: 'Hit tool improved', gradeChange: { from: 55, to: 60 } },
        { date: 'Apr 2024', type: 'promotion', level: 'A+', description: 'Started season at High-A' },
        { date: 'Jun 2024', type: 'breakout', level: 'A+', description: '.320/.400/.540 in June, named prospect of month' },
        { date: 'Jul 2024', type: 'promotion', level: 'AA', description: 'Fast-tracked to Double-A' },
        { date: 'Sep 2024', type: 'grade_up', level: 'AA', description: 'Power tool developing', gradeChange: { from: 50, to: 60 } },
      ],
    },
    {
      prospectId: 2, name: 'Blake Harrison', position: 'RHP', currentLevel: 'AAA', currentGrade: 68, draftYear: 2022,
      projectedDebut: 'Apr 2025', developmentPace: 'fast',
      milestones: [
        { date: 'Jul 2022', type: 'signed', level: 'Rookie', description: '2nd round pick, college arm' },
        { date: 'Mar 2023', type: 'promotion', level: 'A+', description: 'Skipped Low-A to start at High-A' },
        { date: 'May 2023', type: 'grade_up', level: 'A+', description: 'Slider became plus pitch', gradeChange: { from: 50, to: 60 } },
        { date: 'Jul 2023', type: 'promotion', level: 'AA', description: 'Promoted mid-season to Double-A' },
        { date: 'Sep 2023', type: 'injury', level: 'AA', description: 'Forearm tightness, shut down for season' },
        { date: 'Apr 2024', type: 'promotion', level: 'AAA', description: 'Healthy, opened at Triple-A' },
        { date: 'Aug 2024', type: 'breakout', level: 'AAA', description: '2.15 ERA over final 8 starts' },
      ],
    },
    {
      prospectId: 3, name: 'Marcus Cole', position: 'CF', currentLevel: 'A+', currentGrade: 62, draftYear: 2023,
      projectedDebut: 'Late 2026', developmentPace: 'normal',
      milestones: [
        { date: 'Jul 2023', type: 'signed', level: 'Rookie', description: '1st round pick (HS), raw tools' },
        { date: 'Sep 2023', type: 'grade_up', level: 'Rookie', description: 'Speed tool confirmed elite', gradeChange: { from: 65, to: 70 } },
        { date: 'Apr 2024', type: 'promotion', level: 'A', description: 'Full season at Low-A' },
        { date: 'Jul 2024', type: 'grade_down', level: 'A', description: 'Struggled with breaking balls', gradeChange: { from: 55, to: 50 } },
        { date: 'Sep 2024', type: 'promotion', level: 'A+', description: 'Earned late-season promotion despite struggles' },
      ],
    },
    {
      prospectId: 4, name: 'Ryan Matsuda', position: 'C', currentLevel: 'AA', currentGrade: 65, draftYear: 2022,
      projectedDebut: 'Mid 2025', developmentPace: 'normal',
      milestones: [
        { date: 'Jul 2022', type: 'signed', level: 'Rookie', description: '3rd round pick, premium defender' },
        { date: 'Apr 2023', type: 'promotion', level: 'A', description: 'Full season assignment at Low-A' },
        { date: 'Jun 2023', type: 'grade_up', level: 'A', description: 'Framing improved dramatically', gradeChange: { from: 55, to: 65 } },
        { date: 'Sep 2023', type: 'promotion', level: 'A+', description: 'End-of-season promotion' },
        { date: 'Apr 2024', type: 'promotion', level: 'AA', description: 'Opened season at Double-A' },
        { date: 'Aug 2024', type: 'breakout', level: 'AA', description: 'Hit .285 with 14 HR, offensive breakout' },
      ],
    },
    {
      prospectId: 5, name: 'Derek Kim', position: 'LHP', currentLevel: 'A', currentGrade: 55, draftYear: 2023,
      projectedDebut: '2027', developmentPace: 'slow',
      milestones: [
        { date: 'Jul 2023', type: 'signed', level: 'Rookie', description: '4th round pick, projectable frame' },
        { date: 'Apr 2024', type: 'promotion', level: 'A', description: 'Assigned to Low-A' },
        { date: 'Jun 2024', type: 'injury', level: 'A', description: 'Lat strain, missed 6 weeks' },
        { date: 'Aug 2024', type: 'grade_down', level: 'A', description: 'Velo down post-injury', gradeChange: { from: 55, to: 50 } },
      ],
    },
  ];
}
