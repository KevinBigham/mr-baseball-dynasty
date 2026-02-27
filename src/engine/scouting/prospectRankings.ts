/**
 * Prospect Rankings & Scouting Report Engine — Mr. Baseball Dynasty
 *
 * Generates league-wide and team prospect rankings:
 *   - Top 100 overall prospects (league-wide)
 *   - Top 30 per organization
 *   - Scouting reports with grade breakdowns
 *   - ETA projections (when prospect might reach MLB)
 *   - Risk/ceiling classifications
 *
 * Inspired by OOTP's prospect lists and Baseball America rankings.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Extreme';
export type CeilingLevel = 'Superstar' | 'All-Star' | 'Above Average' | 'Average' | 'Bench' | 'Organizational';
export type ETALabel = 'MLB Ready' | '2025' | '2026' | '2027' | '2028' | '2029' | '2030+';

export interface ScoutingGrades {
  // Hitters
  hit?:    number;
  power?:  number;
  eye?:    number;
  speed?:  number;
  field?:  number;
  arm?:    number;
  // Pitchers
  stuff?:   number;
  movement?: number;
  command?: number;
  stamina?: number;
  // Universal
  overall:    number;
  potential:  number;
}

export interface ProspectReport {
  playerId:    number;
  name:        string;
  age:         number;
  position:    string;
  teamId:      number;
  teamName:    string;
  isPitcher:   boolean;
  level:       string;     // Current roster level (AAA, AA, etc.)
  grades:      ScoutingGrades;
  overallRank: number;     // League-wide (0 = unranked)
  orgRank:     number;     // Within organization
  risk:        RiskLevel;
  ceiling:     CeilingLevel;
  eta:         string;     // Projected MLB arrival
  summary:     string;     // One-line scouting summary
  fv:          number;     // Future Value (20-80 scale, OOTP-style)
}

// ─── ETA calculation ────────────────────────────────────────────────────────────

function estimateETA(player: Player, currentSeason: number): string {
  const level = player.rosterData.rosterStatus;
  const overall = toScoutingScale(player.overall);
  const potential = toScoutingScale(player.potential);

  // Already in MLB
  if (level === 'MLB_ACTIVE' || level === 'MLB_IL_10' || level === 'MLB_IL_60') return 'MLB Ready';

  // Estimate years based on level
  const levelYears: Record<string, number> = {
    'MINORS_AAA': 0.5,
    'MINORS_AA': 1.5,
    'MINORS_APLUS': 2.5,
    'MINORS_AMINUS': 3,
    'MINORS_ROOKIE': 3.5,
    'MINORS_INTL': 4.5,
    'DRAFT_ELIGIBLE': 4,
  };

  const base = levelYears[level] ?? 3;
  // Adjust: high OVR players move faster
  const ovrAdj = overall >= 60 ? -0.5 : overall >= 50 ? 0 : 0.5;
  // High potential players get promoted faster
  const potAdj = potential >= 65 ? -0.5 : 0;

  const years = Math.max(0.5, base + ovrAdj + potAdj);
  const etaSeason = Math.round(currentSeason + years);

  if (years <= 0.5) return 'MLB Ready';
  return String(etaSeason);
}

// ─── Risk assessment ────────────────────────────────────────────────────────────

function assessRisk(player: Player): RiskLevel {
  const age = player.age;
  const sigma = player.development.sigma;
  const phase = player.development.phase;

  // High volatility = high risk
  if (sigma >= 28) return 'Extreme';
  if (sigma >= 22) return 'High';

  // Young players with lots of development left
  if (age <= 18 && phase === 'prospect') return 'High';
  if (age <= 20 && phase === 'prospect') return 'Medium';

  // Low volatility + older = lower risk
  if (sigma <= 12 && age >= 22) return 'Low';

  return 'Medium';
}

// ─── Ceiling projection ─────────────────────────────────────────────────────────

function projectCeiling(player: Player): CeilingLevel {
  const potential = toScoutingScale(player.potential);

  if (potential >= 75) return 'Superstar';
  if (potential >= 65) return 'All-Star';
  if (potential >= 55) return 'Above Average';
  if (potential >= 45) return 'Average';
  if (potential >= 38) return 'Bench';
  return 'Organizational';
}

// ─── Future Value (FV) ─────────────────────────────────────────────────────────
// Combines current talent + upside + proximity to MLB

function computeFV(player: Player): number {
  const ovr = toScoutingScale(player.overall);
  const pot = toScoutingScale(player.potential);
  const age = player.age;

  // Base: weighted average of current and potential
  const ageWeight = Math.max(0.2, Math.min(0.8, (age - 16) / 10));
  const base = ovr * ageWeight + pot * (1 - ageWeight);

  // Young bonus
  const youngBonus = Math.max(0, (22 - age) * 0.5);

  return Math.round(Math.max(20, Math.min(80, base + youngBonus)));
}

// ─── Scouting grades ────────────────────────────────────────────────────────────

function computeScoutingGrades(player: Player, scoutingQuality: number): ScoutingGrades {
  const grades: ScoutingGrades = {
    overall: toScoutingScale(player.overall),
    potential: toScoutingScale(player.potential),
  };

  // Apply fog of war: lower scouting quality = more noise
  const noise = (1 - scoutingQuality) * 8;

  if (player.hitterAttributes) {
    const h = player.hitterAttributes;
    grades.hit = Math.round(toScoutingScale(h.contact) + (Math.random() - 0.5) * noise);
    grades.power = Math.round(toScoutingScale(h.power) + (Math.random() - 0.5) * noise);
    grades.eye = Math.round(toScoutingScale(h.eye) + (Math.random() - 0.5) * noise);
    grades.speed = Math.round(toScoutingScale(h.speed) + (Math.random() - 0.5) * noise);
    grades.field = Math.round(toScoutingScale(h.fielding) + (Math.random() - 0.5) * noise);
    grades.arm = Math.round(toScoutingScale(h.armStrength) + (Math.random() - 0.5) * noise);
  }
  if (player.pitcherAttributes) {
    const p = player.pitcherAttributes;
    grades.stuff = Math.round(toScoutingScale(p.stuff) + (Math.random() - 0.5) * noise);
    grades.movement = Math.round(toScoutingScale(p.movement) + (Math.random() - 0.5) * noise);
    grades.command = Math.round(toScoutingScale(p.command) + (Math.random() - 0.5) * noise);
    grades.stamina = Math.round(toScoutingScale(p.stamina) + (Math.random() - 0.5) * noise);
  }

  return grades;
}

// ─── Generate scouting summary ──────────────────────────────────────────────────

function generateSummary(player: Player, grades: ScoutingGrades): string {
  const ceiling = projectCeiling(player);
  const risk = assessRisk(player);

  if (player.isPitcher) {
    const bestTool =
      (grades.stuff ?? 0) >= (grades.command ?? 0) && (grades.stuff ?? 0) >= (grades.movement ?? 0) ? 'stuff'
      : (grades.command ?? 0) >= (grades.movement ?? 0) ? 'command' : 'movement';

    const toolDesc = bestTool === 'stuff' ? 'electric arm'
      : bestTool === 'command' ? 'pinpoint command'
      : 'quality pitch movement';

    return `${ceiling} ceiling ${player.position} with ${toolDesc}. ${risk} risk profile.`;
  } else {
    const bestTool =
      (grades.power ?? 0) >= (grades.hit ?? 0) && (grades.power ?? 0) >= (grades.speed ?? 0) ? 'power'
      : (grades.hit ?? 0) >= (grades.speed ?? 0) ? 'hit tool' : 'speed';

    const toolDesc = bestTool === 'power' ? 'plus raw power'
      : bestTool === 'hit tool' ? 'advanced hit tool'
      : 'elite speed';

    return `${ceiling} ceiling ${player.position} with ${toolDesc}. ${risk} risk profile.`;
  }
}

// ─── Level label ────────────────────────────────────────────────────────────────

function levelLabel(status: string): string {
  const map: Record<string, string> = {
    'MLB_ACTIVE': 'MLB',
    'MLB_IL_10': 'MLB (IL)',
    'MLB_IL_60': 'MLB (IL-60)',
    'MINORS_AAA': 'AAA',
    'MINORS_AA': 'AA',
    'MINORS_APLUS': 'A+',
    'MINORS_AMINUS': 'A-',
    'MINORS_ROOKIE': 'RK',
    'MINORS_INTL': 'INTL',
    'DRAFT_ELIGIBLE': 'Draft',
  };
  return map[status] ?? status;
}

// ─── Main ranking functions ─────────────────────────────────────────────────────

function isProspectEligible(player: Player): boolean {
  // Eligible: not retired, not free agent, in minors or low MLB service time
  if (player.rosterData.rosterStatus === 'RETIRED') return false;
  if (player.rosterData.rosterStatus === 'FREE_AGENT') return false;
  if (player.rosterData.rosterStatus === 'DFA') return false;

  // MLB players with less than 1 year service are still prospects
  if (player.rosterData.rosterStatus === 'MLB_ACTIVE') {
    return player.rosterData.serviceTimeDays < 172;
  }

  // All minors players are eligible
  return player.rosterData.rosterStatus.startsWith('MINORS_') || player.rosterData.rosterStatus === 'DRAFT_ELIGIBLE';
}

export function generateLeagueProspectRankings(
  players: Player[],
  teams: Team[],
  scoutingQuality: number,
  season: number,
  limit = 100,
): ProspectReport[] {
  const teamMap = new Map(teams.map(t => [t.teamId, t]));
  const eligible = players.filter(isProspectEligible);

  // Score all prospects by FV
  const scored = eligible.map(p => ({
    player: p,
    fv: computeFV(p),
    grades: computeScoutingGrades(p, scoutingQuality),
  })).sort((a, b) => b.fv - a.fv);

  // Build league-wide top list
  const reports: ProspectReport[] = scored.slice(0, limit).map((s, i) => {
    const team = teamMap.get(s.player.teamId);
    return {
      playerId: s.player.playerId,
      name: s.player.name,
      age: s.player.age,
      position: s.player.position,
      teamId: s.player.teamId,
      teamName: team?.name ?? 'Free Agent',
      isPitcher: s.player.isPitcher,
      level: levelLabel(s.player.rosterData.rosterStatus),
      grades: s.grades,
      overallRank: i + 1,
      orgRank: 0, // Set below
      risk: assessRisk(s.player),
      ceiling: projectCeiling(s.player),
      eta: estimateETA(s.player, season),
      summary: generateSummary(s.player, s.grades),
      fv: s.fv,
    };
  });

  return reports;
}

export function generateOrgProspectRankings(
  players: Player[],
  teamId: number,
  teamName: string,
  scoutingQuality: number,
  season: number,
  limit = 30,
): ProspectReport[] {
  const eligible = players.filter(p => p.teamId === teamId && isProspectEligible(p));

  const scored = eligible.map(p => ({
    player: p,
    fv: computeFV(p),
    grades: computeScoutingGrades(p, scoutingQuality),
  })).sort((a, b) => b.fv - a.fv);

  return scored.slice(0, limit).map((s, i) => ({
    playerId: s.player.playerId,
    name: s.player.name,
    age: s.player.age,
    position: s.player.position,
    teamId,
    teamName,
    isPitcher: s.player.isPitcher,
    level: levelLabel(s.player.rosterData.rosterStatus),
    grades: s.grades,
    overallRank: 0,
    orgRank: i + 1,
    risk: assessRisk(s.player),
    ceiling: projectCeiling(s.player),
    eta: estimateETA(s.player, season),
    summary: generateSummary(s.player, s.grades),
    fv: s.fv,
  }));
}
