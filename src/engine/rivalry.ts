/**
 * rivalry.ts — Division rivalry heat system
 *
 * Adapted from Mr. Football Dynasty's rivalry tracking.
 * Each division rival gets a heat score (0–15) that evolves season by season.
 * Heat tiers create morale/narrative modifiers and drive presser questions.
 */

import type { StandingsRow } from '../types/league';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RivalryTier = 'BLOOD_FEUD' | 'BITTER' | 'RIVALRY' | 'DEVELOPING' | 'CASUAL';

export interface RivalRecord {
  rivalTeamId:   number;
  rivalName:     string;
  rivalAbbr:     string;
  heat:          number;          // 0–15
  tier:          RivalryTier;
  userWins:      number;          // all-time vs this rival
  userLosses:    number;
  seasons:       number;          // seasons tracked
  lastDelta:     number;          // heat change last season
  moments:       string[];        // last 3 memorable moments
}

export interface RivalTierInfo {
  label:   string;
  emoji:   string;
  color:   string;
  desc:    string;
}

// ─── Division mappings ────────────────────────────────────────────────────────

const DIVISIONS: Record<string, number[]> = {
  'AL East':    [1, 2, 3, 4, 5],
  'AL Central': [6, 7, 8, 9, 10],
  'AL West':    [11, 12, 13, 14, 15],
  'NL East':    [16, 17, 18, 19, 20],
  'NL Central': [21, 22, 23, 24, 25],
  'NL West':    [26, 27, 28, 29, 30],
};

export function getDivisionRivals(teamId: number): number[] {
  for (const ids of Object.values(DIVISIONS)) {
    if (ids.includes(teamId)) return ids.filter(id => id !== teamId);
  }
  return [];
}

export function getDivisionName(teamId: number): string {
  for (const [div, ids] of Object.entries(DIVISIONS)) {
    if (ids.includes(teamId)) return div;
  }
  return '';
}

// ─── Tier thresholds ─────────────────────────────────────────────────────────

export function getRivalTier(heat: number): RivalryTier {
  if (heat >= 13) return 'BLOOD_FEUD';
  if (heat >= 9)  return 'BITTER';
  if (heat >= 5)  return 'RIVALRY';
  if (heat >= 2)  return 'DEVELOPING';
  return 'CASUAL';
}

export function getRivalTierInfo(tier: RivalryTier): RivalTierInfo {
  switch (tier) {
    case 'BLOOD_FEUD': return {
      label: 'BLOOD FEUD',  emoji: '⚔️',  color: '#dc2626',
      desc:  'The bad blood runs deep. Every matchup feels like the playoffs.',
    };
    case 'BITTER': return {
      label: 'BITTER',      emoji: '😤',  color: '#ef4444',
      desc:  'Respect is gone. These games mean everything.',
    };
    case 'RIVALRY': return {
      label: 'RIVALRY',     emoji: '🔥',  color: '#f97316',
      desc:  'A genuine division rivalry is forming. Watch this space.',
    };
    case 'DEVELOPING': return {
      label: 'DEVELOPING',  emoji: '👀',  color: '#fbbf24',
      desc:  'Early tension building. Could become something real.',
    };
    case 'CASUAL':
    default: return {
      label: 'CASUAL',      emoji: '🤝',  color: '#94a3b8',
      desc:  'Just another team in the division.',
    };
  }
}

// ─── Heat calculation ─────────────────────────────────────────────────────────

interface HeadToHeadContext {
  userTeamId:      number;
  rivalTeamId:     number;
  standings:       StandingsRow[];
  isUserPlayoff:   boolean;
  isRivalPlayoff:  boolean;
}

export function calcRivalHeatDelta(ctx: HeadToHeadContext): { delta: number; moment: string | null } {
  const userRow  = ctx.standings.find(r => r.teamId === ctx.userTeamId);
  const rivalRow = ctx.standings.find(r => r.teamId === ctx.rivalTeamId);

  if (!userRow || !rivalRow) return { delta: 0, moment: null };

  const gamesDiff = Math.abs(userRow.wins - rivalRow.wins);
  let delta = 0;
  let moment: string | null = null;

  // Close race in division (within 5 games) → big heat spike
  if (gamesDiff <= 3) {
    delta += 4;
    moment = rivalRow.wins > userRow.wins
      ? `${rivalRow.abbreviation} edged us by ${gamesDiff} game${gamesDiff !== 1 ? 's' : ''} — that stings.`
      : `We edged ${rivalRow.abbreviation} by ${gamesDiff} game${gamesDiff !== 1 ? 's' : ''} in a tight race.`;
  } else if (gamesDiff <= 7) {
    delta += 2;
    moment = rivalRow.wins > userRow.wins
      ? `${rivalRow.abbreviation} finished ${gamesDiff}GB ahead — they know it too.`
      : `We finished ${gamesDiff} games clear of ${rivalRow.abbreviation}.`;
  } else if (gamesDiff > 18) {
    // One team in rebuild → cool the rivalry
    delta -= 2;
  }

  // Both teams in playoffs → rivalry intensifies
  if (ctx.isUserPlayoff && ctx.isRivalPlayoff) {
    delta += 3;
    moment = `Both clubs in the postseason — the division rivalry just leveled up.`;
  }

  // User missed playoffs, rival made it → extra heat
  if (!ctx.isUserPlayoff && ctx.isRivalPlayoff) {
    delta += 2;
    moment = `${rivalRow.abbreviation} danced in October while we watched. Remember that all winter.`;
  }

  // Rival missed playoffs, we made it
  if (ctx.isUserPlayoff && !ctx.isRivalPlayoff) {
    delta += 1;
    moment = `We went deep while ${rivalRow.abbreviation} stayed home. They\'ll be motivated.`;
  }

  // Natural offseason decay
  delta -= 1;

  return { delta: Math.max(-3, Math.min(5, delta)), moment };
}

// ─── Initialize rivals for a new franchise ────────────────────────────────────

export function initRivals(userTeamId: number, standings: StandingsRow[]): RivalRecord[] {
  const rivalIds = getDivisionRivals(userTeamId);

  return rivalIds.map(id => {
    const row = standings.find(r => r.teamId === id);
    return {
      rivalTeamId: id,
      rivalName:   row?.name ?? `Team ${id}`,
      rivalAbbr:   row?.abbreviation ?? `T${id}`,
      heat:        2,      // start developing
      tier:        'DEVELOPING',
      userWins:    0,
      userLosses:  0,
      seasons:     0,
      lastDelta:   0,
      moments:     [],
    };
  });
}

// ─── Update rivals after a season ────────────────────────────────────────────

export function updateRivals(
  rivals:        RivalRecord[],
  standings:     StandingsRow[],
  userTeamId:    number,
  isUserPlayoff: boolean,
): RivalRecord[] {
  return rivals.map(rival => {
    const { delta, moment } = calcRivalHeatDelta({
      userTeamId,
      rivalTeamId:    rival.rivalTeamId,
      standings,
      isUserPlayoff,
      isRivalPlayoff: standings.find(r => r.teamId === rival.rivalTeamId)?.wins != null
        ? (standings.find(r => r.teamId === rival.rivalTeamId)!.wins >= 88) // approximate playoff threshold
        : false,
    });

    // Update name/abbr from latest standings in case they changed
    const row = standings.find(r => r.teamId === rival.rivalTeamId);
    const newHeat = Math.max(0, Math.min(15, rival.heat + delta));
    const newTier = getRivalTier(newHeat);

    const newMoments = moment
      ? [moment, ...rival.moments].slice(0, 3)
      : rival.moments;

    return {
      ...rival,
      rivalName:  row?.name ?? rival.rivalName,
      rivalAbbr:  row?.abbreviation ?? rival.rivalAbbr,
      heat:       newHeat,
      tier:       newTier,
      seasons:    rival.seasons + 1,
      lastDelta:  delta,
      moments:    newMoments,
    };
  });
}

// ─── Get top rival (for presser questions + display) ─────────────────────────

export function getTopRival(rivals: RivalRecord[]): RivalRecord | null {
  if (rivals.length === 0) return null;
  return [...rivals].sort((a, b) => b.heat - a.heat)[0];
}
