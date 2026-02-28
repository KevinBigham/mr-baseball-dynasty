// ─── Grudge & Revenge Games ───────────────────────────────────────────────
// Tracks player grudges against former teams and series rivalry revenge.

export interface Grudge {
  playerId: number;
  playerName: string;
  formerTeam: string;
  formerTeamAbbr: string;
  reason: 'traded' | 'released' | 'non-tendered' | 'left_in_fa' | 'benched';
  seriesActive: number;
  torched: boolean;
  boostOVR: number;
}

export interface RevengeGame {
  teamA: string;
  teamB: string;
  revengeTeam: string;
  losingStreak: number;
  rivalryHeat: number;
  bonus: number;
  label: string;
}

export type GrudgeReason = Grudge['reason'];

const REASON_LABELS: Record<GrudgeReason, string> = {
  traded: 'Traded away',
  released: 'Released',
  'non-tendered': 'Non-tendered',
  left_in_fa: 'Left in free agency',
  benched: 'Lost starting job',
};

const REASON_EMOJIS: Record<GrudgeReason, string> = {
  traded: '🔄',
  released: '📋',
  'non-tendered': '❌',
  left_in_fa: '✈️',
  benched: '🪑',
};

export function getReasonLabel(reason: GrudgeReason): string {
  return REASON_LABELS[reason];
}

export function getReasonEmoji(reason: GrudgeReason): string {
  return REASON_EMOJIS[reason];
}

// ─── Grudge creation ──────────────────────────────────────────────────────

export function createGrudge(
  playerId: number,
  playerName: string,
  formerTeam: string,
  formerTeamAbbr: string,
  reason: GrudgeReason,
): Grudge {
  return {
    playerId,
    playerName,
    formerTeam,
    formerTeamAbbr,
    reason,
    seriesActive: 0,
    torched: false,
    boostOVR: reason === 'released' || reason === 'non-tendered' ? 8 : 5,
  };
}

// ─── Grudge resolution ────────────────────────────────────────────────────

export interface GrudgeResult {
  resolved: boolean;
  headline: string | null;
}

export function resolveGrudge(grudge: Grudge, hadGoodGame: boolean): GrudgeResult {
  grudge.seriesActive++;

  if (hadGoodGame && !grudge.torched) {
    grudge.torched = true;
    return {
      resolved: false,
      headline: `${grudge.playerName} TORCHES former team ${grudge.formerTeamAbbr}! (${getReasonLabel(grudge.reason)})`,
    };
  }

  // Grudge fades after 4 series (roughly a month of matchups)
  if (grudge.seriesActive >= 4 || grudge.torched) {
    return { resolved: true, headline: null };
  }

  return { resolved: false, headline: null };
}

// ─── Revenge games ────────────────────────────────────────────────────────

export interface RivalryRecord {
  teamA: string;
  teamB: string;
  teamAWins: number;
  teamBWins: number;
  heat: number; // 0-100
}

export function checkRevengeGame(teamA: string, teamB: string, rivalries: RivalryRecord[]): RevengeGame | null {
  const rivalry = rivalries.find(
    r => (r.teamA === teamA && r.teamB === teamB) || (r.teamA === teamB && r.teamB === teamA),
  );
  if (!rivalry) return null;

  const aWins = rivalry.teamA === teamA ? rivalry.teamAWins : rivalry.teamBWins;
  const bWins = rivalry.teamA === teamA ? rivalry.teamBWins : rivalry.teamAWins;

  // Team B has dominated → Team A wants revenge
  if (bWins - aWins >= 3) {
    const streak = bWins - aWins;
    const bonus = Math.min(6, Math.floor(streak / 2) + 1);
    return {
      teamA,
      teamB,
      revengeTeam: teamA,
      losingStreak: streak,
      rivalryHeat: rivalry.heat,
      bonus,
      label: `${teamA} seeking revenge after ${streak}-game losing streak vs ${teamB}`,
    };
  }

  // Team A has dominated → Team B wants revenge
  if (aWins - bWins >= 3) {
    const streak = aWins - bWins;
    const bonus = Math.min(6, Math.floor(streak / 2) + 1);
    return {
      teamA,
      teamB,
      revengeTeam: teamB,
      losingStreak: streak,
      rivalryHeat: rivalry.heat,
      bonus,
      label: `${teamB} seeking revenge after ${streak}-game losing streak vs ${teamA}`,
    };
  }

  // High heat but no clear streak
  if (rivalry.heat >= 60) {
    return {
      teamA,
      teamB,
      revengeTeam: '',
      losingStreak: 0,
      rivalryHeat: rivalry.heat,
      bonus: 2,
      label: `Heated rivalry: ${teamA} vs ${teamB} (Heat: ${rivalry.heat})`,
    };
  }

  return null;
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoGrudges(): Grudge[] {
  return [
    createGrudge(101, 'Marcus Bell', 'Boston Red Sox', 'BOS', 'traded'),
    createGrudge(102, 'Carlos Reyes', 'New York Yankees', 'NYY', 'released'),
    createGrudge(103, 'James O\'Brien', 'Los Angeles Dodgers', 'LAD', 'non-tendered'),
    createGrudge(104, 'Derek Tanaka', 'Chicago Cubs', 'CHC', 'left_in_fa'),
    createGrudge(105, 'Ryan Mitchell', 'Houston Astros', 'HOU', 'benched'),
  ];
}

export function generateDemoRivalries(): RivalryRecord[] {
  return [
    { teamA: 'NYY', teamB: 'BOS', teamAWins: 8, teamBWins: 5, heat: 85 },
    { teamA: 'LAD', teamB: 'SFG', teamAWins: 7, teamBWins: 6, heat: 72 },
    { teamA: 'CHC', teamB: 'STL', teamAWins: 4, teamBWins: 9, heat: 78 },
    { teamA: 'NYM', teamB: 'PHI', teamAWins: 6, teamBWins: 6, heat: 55 },
    { teamA: 'HOU', teamB: 'TEX', teamAWins: 3, teamBWins: 7, heat: 65 },
  ];
}

export function generateDemoRevengeGames(): RevengeGame[] {
  const rivalries = generateDemoRivalries();
  const games: RevengeGame[] = [];
  const matchups: [string, string][] = [
    ['NYY', 'BOS'],
    ['LAD', 'SFG'],
    ['CHC', 'STL'],
    ['HOU', 'TEX'],
  ];
  for (const [a, b] of matchups) {
    const result = checkRevengeGame(a, b, rivalries);
    if (result) games.push(result);
  }
  return games;
}
