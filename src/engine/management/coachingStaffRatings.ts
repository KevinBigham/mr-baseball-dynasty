/**
 * coachingStaffRatings.ts – Coaching Staff Ratings
 *
 * Detailed ratings and impact metrics for each coach on staff.
 * Covers hitting, pitching, bench, base running, bullpen,
 * and specialty coaches with individual area breakdowns.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CoachImpact {
  area: string;
  rating: number;
  trend: 'improving' | 'declining' | 'stable';
  leagueRank: number;
}

export interface StaffCoach {
  coachId: number;
  name: string;
  role: string;
  overallRating: number;
  yearsExperience: number;
  contractYearsLeft: number;
  impacts: CoachImpact[];
  specialty: string;
  recentPerf: 'excellent' | 'good' | 'average' | 'poor';
}

export interface CoachingStaffData {
  teamName: string;
  staff: StaffCoach[];
  overallGrade: string;
  strengthArea: string;
  weaknessArea: string;
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export const PERF_DISPLAY: Record<StaffCoach['recentPerf'], { label: string; color: string }> = {
  excellent: { label: 'EXCELLENT', color: '#22c55e' },
  good:      { label: 'GOOD',     color: '#4ade80' },
  average:   { label: 'AVERAGE',  color: '#f59e0b' },
  poor:      { label: 'POOR',     color: '#ef4444' },
};

export const TREND_DISPLAY: Record<CoachImpact['trend'], { label: string; symbol: string; color: string }> = {
  improving: { label: 'Improving', symbol: '^', color: '#22c55e' },
  declining: { label: 'Declining', symbol: 'v', color: '#ef4444' },
  stable:    { label: 'Stable',    symbol: '-', color: '#9ca3af' },
};

export function ratingColor(rating: number): string {
  if (rating >= 85) return '#22c55e';
  if (rating >= 75) return '#4ade80';
  if (rating >= 65) return '#f59e0b';
  if (rating >= 55) return '#f97316';
  return '#ef4444';
}

export function gradeFromRating(rating: number): string {
  if (rating >= 90) return 'A+';
  if (rating >= 85) return 'A';
  if (rating >= 80) return 'A-';
  if (rating >= 75) return 'B+';
  if (rating >= 70) return 'B';
  if (rating >= 65) return 'B-';
  if (rating >= 60) return 'C+';
  if (rating >= 55) return 'C';
  if (rating >= 50) return 'C-';
  return 'D';
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoCoachingRatings(): CoachingStaffData {
  const staff: StaffCoach[] = [
    {
      coachId: 1,
      name: 'Mike Hargrove',
      role: 'Manager',
      overallRating: 82,
      yearsExperience: 18,
      contractYearsLeft: 2,
      impacts: [
        { area: 'Game Strategy', rating: 88, trend: 'stable', leagueRank: 5 },
        { area: 'Bullpen Management', rating: 79, trend: 'improving', leagueRank: 11 },
        { area: 'Lineup Construction', rating: 84, trend: 'stable', leagueRank: 7 },
        { area: 'Player Development', rating: 78, trend: 'improving', leagueRank: 12 },
        { area: 'Clubhouse Leadership', rating: 91, trend: 'stable', leagueRank: 2 },
      ],
      specialty: 'Veteran Leadership',
      recentPerf: 'good',
    },
    {
      coachId: 2,
      name: 'Carlos Delgado',
      role: 'Hitting Coach',
      overallRating: 87,
      yearsExperience: 12,
      contractYearsLeft: 3,
      impacts: [
        { area: 'Batting Average', rating: 85, trend: 'stable', leagueRank: 6 },
        { area: 'Power Development', rating: 92, trend: 'improving', leagueRank: 2 },
        { area: 'Plate Discipline', rating: 88, trend: 'improving', leagueRank: 4 },
        { area: 'Situational Hitting', rating: 81, trend: 'stable', leagueRank: 9 },
        { area: 'Prospect Grooming', rating: 84, trend: 'improving', leagueRank: 7 },
      ],
      specialty: 'Power Hitting',
      recentPerf: 'excellent',
    },
    {
      coachId: 3,
      name: 'Greg Maddux Jr.',
      role: 'Pitching Coach',
      overallRating: 90,
      yearsExperience: 15,
      contractYearsLeft: 1,
      impacts: [
        { area: 'Pitch Design', rating: 94, trend: 'stable', leagueRank: 1 },
        { area: 'Mechanics', rating: 91, trend: 'stable', leagueRank: 3 },
        { area: 'Game Planning', rating: 88, trend: 'improving', leagueRank: 4 },
        { area: 'Stamina Building', rating: 82, trend: 'declining', leagueRank: 10 },
        { area: 'Injury Prevention', rating: 76, trend: 'declining', leagueRank: 16 },
      ],
      specialty: 'Pitch Tunneling',
      recentPerf: 'excellent',
    },
    {
      coachId: 4,
      name: 'Dave Roberts',
      role: 'Bench Coach',
      overallRating: 75,
      yearsExperience: 9,
      contractYearsLeft: 2,
      impacts: [
        { area: 'In-Game Adjustments', rating: 80, trend: 'improving', leagueRank: 8 },
        { area: 'Defensive Positioning', rating: 74, trend: 'stable', leagueRank: 14 },
        { area: 'Advance Scouting', rating: 78, trend: 'stable', leagueRank: 11 },
        { area: 'Manager Succession', rating: 72, trend: 'improving', leagueRank: 15 },
      ],
      specialty: 'Defensive Shifts',
      recentPerf: 'good',
    },
    {
      coachId: 5,
      name: 'Rickey Henderson II',
      role: 'First Base / Baserunning Coach',
      overallRating: 84,
      yearsExperience: 7,
      contractYearsLeft: 4,
      impacts: [
        { area: 'Stolen Base Success', rating: 95, trend: 'stable', leagueRank: 1 },
        { area: 'Lead Aggression', rating: 89, trend: 'improving', leagueRank: 3 },
        { area: 'Base Advance Rate', rating: 86, trend: 'stable', leagueRank: 5 },
        { area: 'Pickoff Avoidance', rating: 80, trend: 'stable', leagueRank: 8 },
      ],
      specialty: 'Speed Development',
      recentPerf: 'excellent',
    },
    {
      coachId: 6,
      name: 'Scott Brosius',
      role: 'Third Base Coach',
      overallRating: 71,
      yearsExperience: 5,
      contractYearsLeft: 1,
      impacts: [
        { area: 'Send/Hold Decisions', rating: 74, trend: 'declining', leagueRank: 16 },
        { area: 'Runner Aggression', rating: 68, trend: 'stable', leagueRank: 20 },
        { area: 'Scoring Rate', rating: 72, trend: 'declining', leagueRank: 17 },
      ],
      specialty: 'Defensive Fundamentals',
      recentPerf: 'average',
    },
    {
      coachId: 7,
      name: 'Mariano Duncan',
      role: 'Bullpen Coach',
      overallRating: 78,
      yearsExperience: 11,
      contractYearsLeft: 2,
      impacts: [
        { area: 'Reliever Development', rating: 83, trend: 'improving', leagueRank: 6 },
        { area: 'Warm-up Timing', rating: 80, trend: 'stable', leagueRank: 9 },
        { area: 'Role Assignment', rating: 76, trend: 'stable', leagueRank: 12 },
        { area: 'Arm Health', rating: 72, trend: 'declining', leagueRank: 18 },
      ],
      specialty: 'Reliever Conversion',
      recentPerf: 'good',
    },
    {
      coachId: 8,
      name: 'Tina Martinez',
      role: 'Quality Control Coach',
      overallRating: 80,
      yearsExperience: 6,
      contractYearsLeft: 3,
      impacts: [
        { area: 'Video Analysis', rating: 90, trend: 'improving', leagueRank: 2 },
        { area: 'Opponent Prep', rating: 85, trend: 'stable', leagueRank: 5 },
        { area: 'Data Integration', rating: 88, trend: 'improving', leagueRank: 3 },
        { area: 'Pregame Reports', rating: 82, trend: 'stable', leagueRank: 7 },
      ],
      specialty: 'Analytics Integration',
      recentPerf: 'excellent',
    },
  ];

  const avgRating = Math.round(staff.reduce((s, c) => s + c.overallRating, 0) / staff.length);

  return {
    teamName: 'Portland Pioneers',
    staff,
    overallGrade: gradeFromRating(avgRating),
    strengthArea: 'Pitching Development',
    weaknessArea: 'Third Base Coaching',
  };
}
