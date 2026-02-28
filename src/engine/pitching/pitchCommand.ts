/**
 * Pitch Command Analysis
 *
 * Tracks pitch location accuracy vs intended targets,
 * command grades by pitch type, fatigue effects on command,
 * and miss location tendencies. Key to evaluating pitcher control.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CommandGrade = 'elite' | 'plus' | 'average' | 'below_avg' | 'poor';

export const COMMAND_DISPLAY: Record<CommandGrade, { label: string; color: string; emoji: string }> = {
  elite:     { label: 'Elite Command',   color: '#22c55e', emoji: '🎯' },
  plus:      { label: 'Plus Command',    color: '#3b82f6', emoji: '🏹' },
  average:   { label: 'Average',         color: '#eab308', emoji: '➖' },
  below_avg: { label: 'Below Avg',       color: '#f97316', emoji: '📉' },
  poor:      { label: 'Wild',            color: '#ef4444', emoji: '💥' },
};

export type ZoneRegion = 'heart' | 'edge' | 'chase' | 'waste' | 'wild';

export interface PitchTypeCommand {
  pitchType: string;
  thrown: number;
  zoneRate: number;           // % landing in zone
  edgeRate: number;           // % landing on edges
  chaseInduced: number;       // % inducing chases
  whiffRate: number;          // whiff % on pitch
  avgMissDistance: number;    // inches from intended target
  commandGrade: CommandGrade;
}

export interface CommandProfile {
  id: number;
  name: string;
  pos: string;
  team: string;
  overall: number;
  overallCommandGrade: CommandGrade;
  totalPitches: number;
  zoneRate: number;
  edgeRate: number;
  firstPitchStrikeRate: number;
  walkRate: number;
  hitByPitchRate: number;
  wildPitchCount: number;
  fatigueCommandDrop: number;    // command grade drop after 80+ pitches (0-20 scale)
  pitchCommands: PitchTypeCommand[];
  missHeatmap: Record<ZoneRegion, number>;  // % of misses per region
}

export interface CommandSummary {
  teamZoneRate: number;
  teamEdgeRate: number;
  teamFPStrikeRate: number;
  eliteCommandCount: number;
  wildCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getCommandGrade(zoneRate: number, edgeRate: number, walkRate: number): CommandGrade {
  const score = zoneRate + edgeRate * 0.5 - walkRate * 3;
  if (score >= 60) return 'elite';
  if (score >= 50) return 'plus';
  if (score >= 40) return 'average';
  if (score >= 30) return 'below_avg';
  return 'poor';
}

export function getCommandSummary(profiles: CommandProfile[]): CommandSummary {
  const n = profiles.length;
  return {
    teamZoneRate: Math.round(profiles.reduce((s, p) => s + p.zoneRate, 0) / n * 10) / 10,
    teamEdgeRate: Math.round(profiles.reduce((s, p) => s + p.edgeRate, 0) / n * 10) / 10,
    teamFPStrikeRate: Math.round(profiles.reduce((s, p) => s + p.firstPitchStrikeRate, 0) / n * 10) / 10,
    eliteCommandCount: profiles.filter(p => p.overallCommandGrade === 'elite').length,
    wildCount: profiles.filter(p => p.overallCommandGrade === 'poor').length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makePitchCommand(type: string, thrown: number, zr: number, er: number, ci: number, wh: number, miss: number): PitchTypeCommand {
  return {
    pitchType: type, thrown, zoneRate: zr, edgeRate: er, chaseInduced: ci, whiffRate: wh, avgMissDistance: miss,
    commandGrade: getCommandGrade(zr, er, 0),
  };
}

export function generateDemoCommand(): CommandProfile[] {
  const data = [
    {
      name: 'Gerrit Cole', team: 'NYY', pos: 'SP', ovr: 89,
      tp: 3200, zr: 48.5, er: 22.0, fps: 68.5, bb: 5.2, hbp: 0.8, wp: 3, fd: 6,
      pitches: [
        makePitchCommand('4-Seam', 1400, 50.0, 24.0, 15.0, 28.5, 3.2),
        makePitchCommand('Slider', 900, 42.0, 20.0, 32.0, 38.0, 4.5),
        makePitchCommand('Knuckle Curve', 550, 38.0, 18.0, 28.0, 34.0, 5.2),
        makePitchCommand('Changeup', 350, 44.0, 22.0, 22.0, 25.0, 3.8),
      ],
    },
    {
      name: 'Zack Wheeler', team: 'PHI', pos: 'SP', ovr: 87,
      tp: 3100, zr: 50.0, er: 24.0, fps: 70.0, bb: 4.5, hbp: 0.5, wp: 2, fd: 4,
      pitches: [
        makePitchCommand('4-Seam', 1200, 52.0, 25.0, 14.0, 26.0, 2.8),
        makePitchCommand('Slider', 1000, 46.0, 22.0, 30.0, 35.0, 3.5),
        makePitchCommand('Curveball', 500, 40.0, 20.0, 25.0, 30.0, 5.0),
        makePitchCommand('Changeup', 400, 48.0, 24.0, 20.0, 22.0, 3.0),
      ],
    },
    {
      name: 'Spencer Strider', team: 'ATL', pos: 'SP', ovr: 85,
      tp: 2800, zr: 44.0, er: 18.0, fps: 62.0, bb: 7.5, hbp: 1.2, wp: 5, fd: 10,
      pitches: [
        makePitchCommand('4-Seam', 1600, 46.0, 18.0, 18.0, 38.0, 4.0),
        makePitchCommand('Slider', 900, 40.0, 16.0, 35.0, 42.0, 5.5),
        makePitchCommand('Changeup', 300, 42.0, 20.0, 20.0, 28.0, 4.2),
      ],
    },
    {
      name: 'Logan Webb', team: 'SF', pos: 'SP', ovr: 82,
      tp: 3300, zr: 52.0, er: 26.0, fps: 72.0, bb: 3.8, hbp: 0.4, wp: 1, fd: 3,
      pitches: [
        makePitchCommand('Sinker', 1200, 55.0, 28.0, 12.0, 15.0, 2.2),
        makePitchCommand('Changeup', 900, 50.0, 24.0, 28.0, 30.0, 3.0),
        makePitchCommand('Slider', 700, 48.0, 22.0, 25.0, 28.0, 3.5),
        makePitchCommand('Curveball', 500, 42.0, 20.0, 22.0, 25.0, 4.0),
      ],
    },
    {
      name: 'Roansy Contreras', team: 'PIT', pos: 'SP', ovr: 68,
      tp: 2400, zr: 38.0, er: 14.0, fps: 55.0, bb: 10.5, hbp: 1.8, wp: 8, fd: 14,
      pitches: [
        makePitchCommand('4-Seam', 1000, 40.0, 14.0, 12.0, 22.0, 5.8),
        makePitchCommand('Slider', 700, 35.0, 12.0, 28.0, 30.0, 6.5),
        makePitchCommand('Changeup', 400, 36.0, 16.0, 18.0, 20.0, 6.0),
        makePitchCommand('Curveball', 300, 32.0, 10.0, 15.0, 18.0, 7.2),
      ],
    },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    team: d.team,
    overall: d.ovr,
    overallCommandGrade: getCommandGrade(d.zr, d.er, d.bb),
    totalPitches: d.tp,
    zoneRate: d.zr,
    edgeRate: d.er,
    firstPitchStrikeRate: d.fps,
    walkRate: d.bb,
    hitByPitchRate: d.hbp,
    wildPitchCount: d.wp,
    fatigueCommandDrop: d.fd,
    pitchCommands: d.pitches,
    missHeatmap: { heart: 5, edge: 25, chase: 35, waste: 25, wild: 10 },
  }));
}
