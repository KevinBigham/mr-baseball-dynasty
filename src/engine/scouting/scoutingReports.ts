/**
 * Scouting Reports
 *
 * Detailed scouting reports on opposing hitters and pitchers.
 * Includes tendencies, weaknesses, pitch preferences by count,
 * and tactical recommendations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ReportType = 'hitter' | 'pitcher';
export type ThreatLevel = 'dangerous' | 'above_avg' | 'average' | 'below_avg' | 'non_threat';

export const THREAT_DISPLAY: Record<ThreatLevel, { label: string; color: string; emoji: string }> = {
  dangerous: { label: 'Dangerous',  color: '#ef4444', emoji: '🔴' },
  above_avg: { label: 'Above Avg',  color: '#f97316', emoji: '🟠' },
  average:   { label: 'Average',    color: '#eab308', emoji: '🟡' },
  below_avg: { label: 'Below Avg',  color: '#3b82f6', emoji: '🔵' },
  non_threat:{ label: 'Non-Threat', color: '#22c55e', emoji: '🟢' },
};

export interface ScoutingReport {
  id: number;
  name: string;
  team: string;
  pos: string;
  type: ReportType;
  overall: number;
  threatLevel: ThreatLevel;
  tendencies: string[];
  weaknesses: string[];
  strengths: string[];
  keyStats: Record<string, string>;
  gameplan: string;
  scoutGrade: number;       // confidence 1-10
  lastUpdated: string;
}

export interface ReportSummary {
  totalReports: number;
  hitterReports: number;
  pitcherReports: number;
  dangerousCount: number;
  avgConfidence: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getReportSummary(reports: ScoutingReport[]): ReportSummary {
  return {
    totalReports: reports.length,
    hitterReports: reports.filter(r => r.type === 'hitter').length,
    pitcherReports: reports.filter(r => r.type === 'pitcher').length,
    dangerousCount: reports.filter(r => r.threatLevel === 'dangerous').length,
    avgConfidence: Math.round(reports.reduce((s, r) => s + r.scoutGrade, 0) / reports.length * 10) / 10,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoReports(): ScoutingReport[] {
  return [
    {
      id: 0, name: 'Juan Soto', team: 'NYY', pos: 'RF', type: 'hitter', overall: 90, threatLevel: 'dangerous',
      tendencies: ['Patient hitter — walks 15%+ of PAs', 'Crushes hanging breaking balls', 'Pulls fastballs over 95 mph'],
      weaknesses: ['Can be beat inside with hard stuff', 'Slightly weaker vs LHP', 'Less dangerous in 0-2 counts'],
      strengths: ['Elite plate discipline', 'Plus power to all fields', 'Rarely chases out of zone'],
      keyStats: { AVG: '.300', OBP: '.420', SLG: '.530', BB: '15.2%', K: '18.5%' },
      gameplan: 'Pitch backwards — changeup/slider early, fastball in to finish. Do NOT leave breaking balls over the middle.',
      scoutGrade: 9, lastUpdated: 'Aug 25',
    },
    {
      id: 1, name: 'Yordan Alvarez', team: 'HOU', pos: 'DH', type: 'hitter', overall: 88, threatLevel: 'dangerous',
      tendencies: ['Ambush hitter — aggressive in favorable counts', 'Destroys middle-middle pitches', 'Pull-heavy vs RHP'],
      weaknesses: ['Slider down and away from LHP', 'Chases high fastballs occasionally', 'Limited mobility'],
      strengths: ['Elite bat speed', 'Plus-plus raw power', 'Can hit any pitch in zone'],
      keyStats: { AVG: '.290', OBP: '.380', SLG: '.560', HR: '35', OPS: '.940' },
      gameplan: 'Expand the zone early. Slider away is best weapon. Never throw fastball middle-middle.',
      scoutGrade: 8, lastUpdated: 'Aug 23',
    },
    {
      id: 2, name: 'Gerrit Cole', team: 'NYY', pos: 'SP', type: 'pitcher', overall: 89, threatLevel: 'dangerous',
      tendencies: ['Relies heavily on 4-seam up in zone', 'Slider usage increases with runners on', 'Gets more aggressive in 2-strike counts'],
      weaknesses: ['Fastball gets hit hard 3rd time through', 'Curveball hangs when tired', 'Struggles after 95+ pitches'],
      strengths: ['Elite 4-seam rise rate', 'Plus-plus slider', 'Competes well in high leverage'],
      keyStats: { ERA: '2.85', K9: '11.5', WHIP: '1.05', FBAvg: '97.5', 'K%': '28.5%' },
      gameplan: 'Be patient early — he gets hittable 3rd time through. Sit fastball up, adjust to slider. Wait for hanging curve.',
      scoutGrade: 9, lastUpdated: 'Aug 22',
    },
    {
      id: 3, name: 'Framber Valdez', team: 'HOU', pos: 'SP', type: 'pitcher', overall: 82, threatLevel: 'above_avg',
      tendencies: ['Sinker/curveball pitcher — induces ground balls', 'Changes speed effectively', 'Works bottom of zone exclusively'],
      weaknesses: ['Lacks a put-away pitch vs LHH', 'Walk rate spikes in 5th+ inning', 'Curveball less effective from stretch'],
      strengths: ['Elite ground ball rate (65%+)', 'Deceptive delivery', 'Great stamina — goes deep in games'],
      keyStats: { ERA: '3.20', 'GB%': '65.2%', WHIP: '1.18', 'BB/9': '3.2', IP: '185' },
      gameplan: 'Stay on top of the ball — look for pitches middle-up. Ground balls play into his strength. Patience in early innings.',
      scoutGrade: 7, lastUpdated: 'Aug 20',
    },
    {
      id: 4, name: 'Marcus Semien', team: 'TEX', pos: '2B', type: 'hitter', overall: 82, threatLevel: 'above_avg',
      tendencies: ['Aggressive early in counts', 'Loves fastballs middle-in', 'More pull-heavy vs LHP'],
      weaknesses: ['Chases sliders off the plate', 'Struggles with velocity up', 'Below avg vs changeups'],
      strengths: ['Consistent contact', 'Power from 2B position', 'Durable — plays every day'],
      keyStats: { AVG: '.265', OBP: '.330', SLG: '.450', HR: '25', '2B': '38' },
      gameplan: 'Slider away is his kryptonite. Can expand up with fastball. Dont let him pull inside pitches.',
      scoutGrade: 7, lastUpdated: 'Aug 21',
    },
    {
      id: 5, name: 'Whit Merrifield', team: 'PHI', pos: 'UT', type: 'hitter', overall: 65, threatLevel: 'below_avg',
      tendencies: ['Contact-oriented approach', 'Puts ball in play — low K rate', 'Spray hitter with little power'],
      weaknesses: ['Cannot drive offspeed pitches', 'Limited power — no HR threat', 'Gets jammed inside frequently'],
      strengths: ['Makes contact consistently', 'Good speed on bases', 'Versatile defensively'],
      keyStats: { AVG: '.245', OBP: '.295', SLG: '.340', HR: '5', SB: '12' },
      gameplan: 'Attack the zone — he wont hurt you. Fastball in, changeup away. Low damage expected.',
      scoutGrade: 6, lastUpdated: 'Aug 18',
    },
  ];
}
