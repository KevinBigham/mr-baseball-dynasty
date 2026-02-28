/**
 * Prospect Pipeline Intelligence
 *
 * Comprehensive prospect tracking across multiple levels
 * with ETA projections, development grades, tool assessments,
 * and organizational strength ratings.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProspectLevel = 'MLB' | 'AAA' | 'AA' | 'A+' | 'A' | 'Rk' | 'Intl';
export type DevStatus = 'rising' | 'steady' | 'stalling' | 'struggling';
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export const DEV_DISPLAY: Record<DevStatus, { label: string; color: string; emoji: string }> = {
  rising:     { label: 'Rising',     color: '#22c55e', emoji: '📈' },
  steady:     { label: 'Steady',     color: '#3b82f6', emoji: '➡️' },
  stalling:   { label: 'Stalling',   color: '#f97316', emoji: '📉' },
  struggling: { label: 'Struggling', color: '#ef4444', emoji: '🔻' },
};

export const RISK_DISPLAY: Record<RiskLevel, { label: string; color: string }> = {
  low:     { label: 'Low',     color: '#22c55e' },
  medium:  { label: 'Medium',  color: '#eab308' },
  high:    { label: 'High',    color: '#f97316' },
  extreme: { label: 'Extreme', color: '#ef4444' },
};

export interface ProspectTool {
  name: string;
  current: number;   // 20-80 scale
  future: number;    // 20-80 projected
}

export interface PipelineProspect {
  id: number;
  name: string;
  age: number;
  pos: string;
  level: ProspectLevel;
  orgRank: number;
  overallFV: number;         // future value 20-80
  eta: string;               // e.g. "2025", "2026 mid"
  devStatus: DevStatus;
  risk: RiskLevel;
  tools: ProspectTool[];
  stats: Record<string, string>;
  scouting: string;          // one-line scout's take
}

export interface PipelineSummary {
  totalProspects: number;
  avgFV: number;
  risingCount: number;
  mlbReadyCount: number;
  topTierCount: number;      // FV 55+
  riskBreakdown: Record<RiskLevel, number>;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPipelineSummary(prospects: PipelineProspect[]): PipelineSummary {
  const n = prospects.length;
  return {
    totalProspects: n,
    avgFV: Math.round(prospects.reduce((s, p) => s + p.overallFV, 0) / n),
    risingCount: prospects.filter(p => p.devStatus === 'rising').length,
    mlbReadyCount: prospects.filter(p => p.level === 'AAA' || p.level === 'MLB').length,
    topTierCount: prospects.filter(p => p.overallFV >= 55).length,
    riskBreakdown: {
      low: prospects.filter(p => p.risk === 'low').length,
      medium: prospects.filter(p => p.risk === 'medium').length,
      high: prospects.filter(p => p.risk === 'high').length,
      extreme: prospects.filter(p => p.risk === 'extreme').length,
    },
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPipeline(): PipelineProspect[] {
  return [
    {
      id: 0, name: 'Jackson Holliday', age: 20, pos: 'SS', level: 'AAA', orgRank: 1, overallFV: 70,
      eta: '2024', devStatus: 'rising', risk: 'low',
      tools: [
        { name: 'Hit', current: 60, future: 70 },
        { name: 'Power', current: 50, future: 60 },
        { name: 'Speed', current: 55, future: 55 },
        { name: 'Field', current: 50, future: 55 },
        { name: 'Arm', current: 55, future: 55 },
      ],
      stats: { AVG: '.310', OBP: '.400', SLG: '.510', HR: '18', SB: '22' },
      scouting: 'Elite bat-to-ball with developing power. Plus plate discipline. Future all-star shortstop.',
    },
    {
      id: 1, name: 'Dylan Crews', age: 21, pos: 'CF', level: 'AA', orgRank: 2, overallFV: 65,
      eta: '2025', devStatus: 'rising', risk: 'low',
      tools: [
        { name: 'Hit', current: 55, future: 65 },
        { name: 'Power', current: 50, future: 60 },
        { name: 'Speed', current: 60, future: 55 },
        { name: 'Field', current: 55, future: 60 },
        { name: 'Arm', current: 55, future: 55 },
      ],
      stats: { AVG: '.285', OBP: '.370', SLG: '.475', HR: '15', SB: '18' },
      scouting: 'Well-rounded toolset with polished approach. Can stick in center. Everyday starter projection.',
    },
    {
      id: 2, name: 'Coby Mayo', age: 21, pos: '3B', level: 'AA', orgRank: 3, overallFV: 60,
      eta: '2025', devStatus: 'steady', risk: 'medium',
      tools: [
        { name: 'Hit', current: 45, future: 55 },
        { name: 'Power', current: 60, future: 70 },
        { name: 'Speed', current: 35, future: 30 },
        { name: 'Field', current: 45, future: 50 },
        { name: 'Arm', current: 60, future: 60 },
      ],
      stats: { AVG: '.260', OBP: '.330', SLG: '.520', HR: '25', '2B': '30' },
      scouting: 'Premium raw power with improving hit tool. Strikeout rate needs work. Power-over-hit profile.',
    },
    {
      id: 3, name: 'Chase Burns', age: 22, pos: 'RHP', level: 'A+', orgRank: 4, overallFV: 60,
      eta: '2026', devStatus: 'rising', risk: 'medium',
      tools: [
        { name: 'Fastball', current: 65, future: 70 },
        { name: 'Slider', current: 55, future: 65 },
        { name: 'Changeup', current: 40, future: 50 },
        { name: 'Command', current: 45, future: 55 },
      ],
      stats: { ERA: '2.85', K9: '12.5', BB9: '3.2', WHIP: '1.10', IP: '95' },
      scouting: 'Electric arm with plus-plus heater. Slider flashes plus. Needs 3rd pitch and command refinement.',
    },
    {
      id: 4, name: 'Tink Hence', age: 21, pos: 'RHP', level: 'A+', orgRank: 5, overallFV: 55,
      eta: '2026 mid', devStatus: 'steady', risk: 'high',
      tools: [
        { name: 'Fastball', current: 60, future: 65 },
        { name: 'Curveball', current: 55, future: 60 },
        { name: 'Changeup', current: 45, future: 55 },
        { name: 'Command', current: 45, future: 50 },
      ],
      stats: { ERA: '3.40', K9: '11.0', BB9: '3.8', WHIP: '1.18', IP: '75' },
      scouting: 'Projectable frame with good stuff. Health track record is concern. Mid-rotation ceiling if healthy.',
    },
    {
      id: 5, name: 'Thayron Liranzo', age: 18, pos: 'C', level: 'A', orgRank: 6, overallFV: 55,
      eta: '2027', devStatus: 'rising', risk: 'high',
      tools: [
        { name: 'Hit', current: 40, future: 55 },
        { name: 'Power', current: 55, future: 65 },
        { name: 'Speed', current: 30, future: 25 },
        { name: 'Field', current: 45, future: 50 },
        { name: 'Arm', current: 60, future: 60 },
      ],
      stats: { AVG: '.240', OBP: '.340', SLG: '.460', HR: '12', RBI: '50' },
      scouting: 'Rare power upside for a catcher. Raw but improving defensively. Long development runway ahead.',
    },
    {
      id: 6, name: 'Adrian Santana', age: 17, pos: 'SS', level: 'Intl', orgRank: 7, overallFV: 50,
      eta: '2028', devStatus: 'steady', risk: 'extreme',
      tools: [
        { name: 'Hit', current: 35, future: 55 },
        { name: 'Power', current: 30, future: 50 },
        { name: 'Speed', current: 60, future: 55 },
        { name: 'Field', current: 50, future: 55 },
        { name: 'Arm', current: 55, future: 55 },
      ],
      stats: { AVG: '.265', OBP: '.330', SLG: '.380' },
      scouting: 'High ceiling intl signing. Projectable frame with plus speed. Years away but tools are legit.',
    },
    {
      id: 7, name: 'Braden Montgomery', age: 22, pos: 'OF', level: 'A', orgRank: 8, overallFV: 50,
      eta: '2026', devStatus: 'stalling', risk: 'medium',
      tools: [
        { name: 'Hit', current: 40, future: 50 },
        { name: 'Power', current: 55, future: 60 },
        { name: 'Speed', current: 50, future: 50 },
        { name: 'Field', current: 45, future: 50 },
        { name: 'Arm', current: 50, future: 50 },
      ],
      stats: { AVG: '.230', OBP: '.320', SLG: '.420', HR: '14', K: '28%' },
      scouting: 'Switch-hitter with above avg power. Needs to improve contact rate. Possible utility/platoon role.',
    },
  ];
}
