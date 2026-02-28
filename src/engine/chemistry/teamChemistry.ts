/**
 * Team Chemistry Engine — Mr. Baseball Dynasty
 *
 * Models clubhouse dynamics and team chemistry:
 *   - Individual player morale (0-100)
 *   - Team cohesion score (0-100)
 *   - Leadership value from veteran presence
 *   - Chemistry events (feuds, team meetings, hot streaks)
 *   - Performance modifiers based on chemistry
 *
 * Inspired by OOTP's morale/chemistry system.
 */

import type { Player } from '../../types/player';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PlayerMorale {
  playerId:      number;
  name:          string;
  morale:        number;   // 0-100 (50 = neutral, 80+ = fired up, 20- = disgruntled)
  role:          'star' | 'starter' | 'bench' | 'prospect' | 'veteran_leader';
  leadershipValue: number; // 0-10 contribution to team chemistry
  chemistryFit:  number;   // -10 to +10 (positive = good clubhouse guy)
}

export interface ChemistryEvent {
  season:     number;
  type:       'team_meeting' | 'feud' | 'hot_streak' | 'cold_streak' | 'captain_speech' | 'trade_shock' | 'winning_streak' | 'losing_streak';
  description: string;
  impact:     number;  // Chemistry change (-15 to +15)
  playerIds:  number[];
}

export interface TeamChemistryData {
  teamId:           number;
  overall:          number;     // 0-100 team chemistry score
  cohesion:         number;     // 0-100 how well players gel
  leadershipScore:  number;     // 0-30 from veteran/captain presence
  moraleAvg:        number;     // Average player morale
  clubhouseRating:  string;     // 'Toxic' | 'Fractured' | 'Average' | 'Good' | 'Excellent' | 'Elite'
  events:           ChemistryEvent[];
  performanceBonus: number;     // -0.03 to +0.03 (applied to win probability)
  playerMorales:    PlayerMorale[];
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const CHEMISTRY_LABELS: [number, string][] = [
  [85, 'Elite'],
  [70, 'Excellent'],
  [55, 'Good'],
  [40, 'Average'],
  [25, 'Fractured'],
  [0,  'Toxic'],
];

// ─── Determine player role ──────────────────────────────────────────────────────

function determineRole(player: Player): PlayerMorale['role'] {
  const grade = toScoutingScale(player.overall);
  const age = player.age;
  const status = player.rosterData.rosterStatus;

  if (age >= 32 && grade >= 50 && status === 'MLB_ACTIVE') return 'veteran_leader';
  if (grade >= 65) return 'star';
  if (status === 'MLB_ACTIVE') return 'starter';
  if (status.startsWith('MINORS')) return 'prospect';
  return 'bench';
}

// ─── Compute individual morale ──────────────────────────────────────────────────

function computePlayerMorale(player: Player): number {
  let morale = 50; // Neutral baseline

  const status = player.rosterData.rosterStatus;

  // Playing time satisfaction
  if (status === 'MLB_ACTIVE') {
    morale += 10; // Happy to be in majors
  } else if (status === 'DFA') {
    morale -= 25; // Very unhappy
  } else if (status.startsWith('MINORS_AAA')) {
    morale -= 5; // Wants to be up
    // Young players in AAA more patient
    if (player.age <= 24) morale += 5;
  }

  // Contract satisfaction
  const grade = toScoutingScale(player.overall);
  if (grade >= 60 && player.rosterData.salary < 2_000_000) {
    morale -= 10; // Underpaid star
  }
  if (grade < 45 && player.rosterData.salary > 10_000_000) {
    morale += 5; // Overpaid but grateful
  }

  // Age + service time: veterans are more stable
  if (player.age >= 30) morale += 5;

  // Mental toughness helps morale stability
  const mentalToughness = player.isPitcher
    ? (player.pitcherAttributes?.mentalToughness ?? 50)
    : (player.hitterAttributes?.mentalToughness ?? 50);
  morale += (mentalToughness - 50) / 10;

  return Math.max(0, Math.min(100, Math.round(morale)));
}

// ─── Compute leadership value ───────────────────────────────────────────────────

function computeLeadership(player: Player): number {
  let leadership = 0;
  const age = player.age;
  const grade = toScoutingScale(player.overall);

  // Age-based leadership
  if (age >= 34) leadership += 4;
  else if (age >= 30) leadership += 3;
  else if (age >= 28) leadership += 1;

  // Performance-based respect
  if (grade >= 70) leadership += 3;
  else if (grade >= 60) leadership += 2;
  else if (grade >= 50) leadership += 1;

  // Service time (been around the block)
  const serviceYears = player.rosterData.serviceTimeDays / 172;
  if (serviceYears >= 10) leadership += 2;
  else if (serviceYears >= 6) leadership += 1;

  // Work ethic adds to leadership
  const workEthic = player.isPitcher
    ? (player.pitcherAttributes?.workEthic ?? 50)
    : (player.hitterAttributes?.workEthic ?? 50);
  if (workEthic >= 80) leadership += 1;

  return Math.min(10, leadership);
}

// ─── Chemistry fit (is this player a good clubhouse guy?) ───────────────────────

function computeChemistryFit(player: Player): number {
  let fit = 0;

  // Work ethic: high work ethic players are good clubhouse guys
  const workEthic = player.isPitcher
    ? (player.pitcherAttributes?.workEthic ?? 50)
    : (player.hitterAttributes?.workEthic ?? 50);

  if (workEthic >= 80) fit += 4;
  else if (workEthic >= 60) fit += 2;
  else if (workEthic < 30) fit -= 3;

  // Mental toughness: stable players help chemistry
  const mental = player.isPitcher
    ? (player.pitcherAttributes?.mentalToughness ?? 50)
    : (player.hitterAttributes?.mentalToughness ?? 50);

  if (mental >= 80) fit += 2;
  else if (mental < 30) fit -= 2;

  // Young players are neutral, veterans stabilize
  if (player.age >= 30) fit += 1;

  return Math.max(-10, Math.min(10, fit));
}

// ─── Generate chemistry events for a season ─────────────────────────────────────

export function generateChemistryEvents(
  players: Player[],
  teamId: number,
  season: number,
  wins: number,
  losses: number,
): ChemistryEvent[] {
  const events: ChemistryEvent[] = [];
  const teamPlayers = players.filter(p =>
    p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
  );

  if (teamPlayers.length === 0) return events;

  const winPct = (wins + losses) > 0 ? wins / (wins + losses) : 0.5;

  // Winning streak bonus
  if (winPct >= 0.580) {
    events.push({
      season, type: 'winning_streak',
      description: 'Team riding a hot streak — energy is electric in the clubhouse.',
      impact: 8, playerIds: [],
    });
  }

  // Losing streak impact
  if (winPct <= 0.400) {
    events.push({
      season, type: 'losing_streak',
      description: 'Frustration mounting after extended losing stretch.',
      impact: -8, playerIds: [],
    });
  }

  // Captain speech (if team has strong veteran leader)
  const leaders = teamPlayers.filter(p =>
    computeLeadership(p) >= 6 && toScoutingScale(p.overall) >= 55
  );
  if (leaders.length > 0 && winPct <= 0.480) {
    const captain = leaders[0];
    events.push({
      season, type: 'captain_speech',
      description: `${captain.name} rallies the team with a passionate clubhouse speech.`,
      impact: 10, playerIds: [captain.playerId],
    });
  }

  // Team meeting (if chemistry is low)
  const avgMorale = teamPlayers.reduce((sum, p) => sum + computePlayerMorale(p), 0) / teamPlayers.length;
  if (avgMorale < 40) {
    events.push({
      season, type: 'team_meeting',
      description: 'Players-only meeting called to clear the air.',
      impact: 5, playerIds: [],
    });
  }

  // Feud potential (disgruntled stars)
  const disgruntled = teamPlayers.filter(p => {
    const grade = toScoutingScale(p.overall);
    return grade >= 60 && p.rosterData.salary < 3_000_000;
  });
  if (disgruntled.length >= 2) {
    events.push({
      season, type: 'feud',
      description: `Underpaid stars expressing frustration with front office direction.`,
      impact: -6, playerIds: disgruntled.slice(0, 2).map(p => p.playerId),
    });
  }

  return events;
}

// ─── Compute full team chemistry ────────────────────────────────────────────────

export function computeTeamChemistry(
  players: Player[],
  teamId: number,
  season: number,
  wins: number,
  losses: number,
  coachChemistryBonus: number, // From coaching staff
): TeamChemistryData {
  const teamPlayers = players.filter(p =>
    p.teamId === teamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
     p.rosterData.rosterStatus === 'MLB_IL_10' ||
     p.rosterData.rosterStatus === 'MLB_IL_60')
  );

  // Compute individual morales
  const playerMorales: PlayerMorale[] = teamPlayers.map(p => ({
    playerId: p.playerId,
    name: p.name,
    morale: computePlayerMorale(p),
    role: determineRole(p),
    leadershipValue: computeLeadership(p),
    chemistryFit: computeChemistryFit(p),
  }));

  // Aggregate scores
  const moraleAvg = playerMorales.length > 0
    ? playerMorales.reduce((sum, pm) => sum + pm.morale, 0) / playerMorales.length
    : 50;

  const leadershipScore = Math.min(30,
    playerMorales.reduce((sum, pm) => sum + pm.leadershipValue, 0)
  );

  const chemistryFitAvg = playerMorales.length > 0
    ? playerMorales.reduce((sum, pm) => sum + pm.chemistryFit, 0) / playerMorales.length
    : 0;

  // Generate events
  const events = generateChemistryEvents(players, teamId, season, wins, losses);
  const eventImpact = events.reduce((sum, e) => sum + e.impact, 0);

  // Cohesion: base from morale + chemistry fits + leadership
  const cohesion = Math.max(0, Math.min(100,
    moraleAvg * 0.4 +
    (chemistryFitAvg + 5) * 4 + // Shift -10..+10 to 0..60, scale to ~0-40
    leadershipScore * 0.8 +
    eventImpact * 0.3
  ));

  // Overall chemistry
  const overall = Math.max(0, Math.min(100,
    cohesion * 0.5 +
    moraleAvg * 0.3 +
    leadershipScore +
    coachChemistryBonus * 60 + // Coach bonus
    eventImpact * 0.2
  ));

  // Rating label
  const clubhouseRating = CHEMISTRY_LABELS.find(([threshold]) => overall >= threshold)?.[1] ?? 'Toxic';

  // Performance bonus: chemistry affects win probability slightly
  const performanceBonus = (overall - 50) / 1500; // -0.033 to +0.033

  return {
    teamId,
    overall: Math.round(overall),
    cohesion: Math.round(cohesion),
    leadershipScore: Math.round(leadershipScore),
    moraleAvg: Math.round(moraleAvg),
    clubhouseRating,
    events,
    performanceBonus: Math.round(performanceBonus * 1000) / 1000,
    playerMorales,
  };
}
