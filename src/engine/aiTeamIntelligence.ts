import type { Player } from '../types/player';
import type { Team, TeamStrategy } from '../types/team';
import type { StandingsRow } from '../types/league';
import { evaluatePlayer } from './trading';
import { pythagenpatWinPct } from './math/bayesian';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PositionalNeed {
  position: string;
  severity: 'critical' | 'moderate' | 'mild';
  urgency: 'immediate' | 'future';
  bestInternalOvr: number; // OVR of best internal option at this position
}

export type AIPriority =
  | 'win_now_FA'
  | 'prospect_hoard'
  | 'salary_dump'
  | 'trade_for_ace'
  | 'draft_best_available'
  | 'draft_positional_need';

export interface TeamProfile {
  teamId: number;
  mode: TeamStrategy;
  windowYears: number;           // 1-5 year competitive window
  positionalNeeds: PositionalNeed[];
  rosterStrength: number;        // 0-100 composite
  farmStrength: number;          // 0-100 prospect pipeline rating
  payrollFlexibility: number;    // dollars available under budget
  priorityActions: AIPriority[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const POSITION_SLOTS = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'] as const;

const MIN_COUNTS: Record<string, number> = {
  C: 1, '1B': 1, '2B': 1, SS: 1, '3B': 1,
  LF: 1, CF: 1, RF: 1, DH: 1,
  SP: 5, RP: 5,
};

const IDEAL_COUNTS: Record<string, number> = {
  C: 2, '1B': 1, '2B': 1, SS: 1, '3B': 1,
  LF: 1, CF: 1, RF: 1, DH: 1,
  SP: 5, RP: 7,
};

// ─── Team Mode Classification ────────────────────────────────────────────────

export function classifyTeamMode(
  team: Team,
  players: Player[],
  standings?: StandingsRow[],
): TeamStrategy {
  // Use standings if available, otherwise use season record
  let wins: number;
  let pythagWins: number;

  if (standings) {
    const row = standings.find(s => s.teamId === team.teamId);
    wins = row?.wins ?? team.seasonRecord.wins;
    pythagWins = row?.pythagWins ?? wins;
  } else {
    const { runsScored, runsAllowed } = team.seasonRecord;
    wins = team.seasonRecord.wins;
    pythagWins = Math.round(pythagenpatWinPct(runsScored, runsAllowed) * ((team.seasonRecord.wins + team.seasonRecord.losses) || 162));
  }

  // Core roster age curve
  const mlbActive = players.filter(
    p => p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE',
  );
  const avgAge = mlbActive.length > 0
    ? mlbActive.reduce((s, p) => s + p.age, 0) / mlbActive.length
    : 28;

  // Average overall of MLB roster
  const avgOvr = mlbActive.length > 0
    ? mlbActive.reduce((s, p) => s + p.overall, 0) / mlbActive.length
    : 275;

  // Farm system depth (minor leaguers with high potential)
  const farmProspects = players.filter(
    p => p.teamId === team.teamId &&
    p.rosterData.rosterStatus.startsWith('MINORS_') &&
    p.potential >= 350,
  );
  const farmDepth = farmProspects.length;

  // Scoring: higher = more contender-like
  let score = 0;

  // Wins / projected wins
  const effectiveWins = Math.max(wins, pythagWins);
  if (effectiveWins >= 90) score += 3;
  else if (effectiveWins >= 85) score += 2;
  else if (effectiveWins >= 78) score += 1;
  else if (effectiveWins <= 65) score -= 2;
  else if (effectiveWins <= 72) score -= 1;

  // Roster quality
  if (avgOvr >= 370) score += 2;
  else if (avgOvr >= 330) score += 1;
  else if (avgOvr < 280) score -= 2;
  else if (avgOvr < 310) score -= 1;

  // Age factor — older rosters with high wins are still contenders but window is short
  if (avgAge >= 33) score -= 1;

  // Farm depth — strong farm with weak MLB = rebuilder with hope
  if (farmDepth >= 8) score += 1;
  else if (farmDepth <= 2) score -= 1;

  if (score >= 2) return 'contender';
  if (score <= -1) return 'rebuilder';
  return 'fringe';
}

// ─── Positional Needs Analysis ───────────────────────────────────────────────

export function analyzePositionalNeeds(
  teamId: number,
  players: Player[],
): PositionalNeed[] {
  const teamPlayers = players.filter(
    p => p.teamId === teamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
     p.rosterData.rosterStatus.startsWith('MINORS_')),
  );

  const needs: PositionalNeed[] = [];

  for (const pos of POSITION_SLOTS) {
    const mlbAtPos = teamPlayers.filter(
      p => p.position === pos && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    const allAtPos = teamPlayers.filter(p => p.position === pos);
    const bestOvr = allAtPos.length > 0
      ? Math.max(...allAtPos.map(p => p.overall))
      : 0;

    const mlbCount = mlbAtPos.length;
    const mlbAvgOvr = mlbCount > 0
      ? mlbAtPos.reduce((s, p) => s + p.overall, 0) / mlbCount
      : 0;

    const minCount = MIN_COUNTS[pos] ?? 1;
    const idealCount = IDEAL_COUNTS[pos] ?? 1;

    // Determine severity
    let severity: 'critical' | 'moderate' | 'mild' | null = null;

    if (pos === 'SP' && mlbCount < 2) {
      severity = 'critical';
    } else if (pos === 'SP' && mlbCount < 5) {
      severity = 'moderate';
    } else if (pos === 'RP' && mlbCount < 2) {
      severity = 'critical';
    } else if (pos === 'RP' && mlbCount < 5) {
      severity = 'moderate';
    } else if (mlbCount < minCount) {
      severity = 'critical';
    } else if (mlbCount < idealCount && mlbAvgOvr < 300) {
      severity = 'moderate';
    } else if (mlbAvgOvr < 250 && mlbCount > 0) {
      severity = 'mild';
    }

    if (severity) {
      // Urgency: immediate if no MLB-level players exist, future if there are minor league options
      const hasMinorLeagueOption = allAtPos.some(
        p => p.rosterData.rosterStatus.startsWith('MINORS_') && p.overall >= 280,
      );
      const urgency: 'immediate' | 'future' = (severity === 'critical' && !hasMinorLeagueOption)
        ? 'immediate'
        : 'future';

      needs.push({ position: pos, severity, urgency, bestInternalOvr: bestOvr });
    }
  }

  // Sort: critical first, then moderate, then mild
  const severityOrder = { critical: 0, moderate: 1, mild: 2 };
  needs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return needs;
}

// ─── Compute Full Team Profile ───────────────────────────────────────────────

export function computeTeamProfile(
  team: Team,
  players: Player[],
  standings?: StandingsRow[],
): TeamProfile {
  const mode = classifyTeamMode(team, players, standings);
  const positionalNeeds = analyzePositionalNeeds(team.teamId, players);

  // Roster strength: average OVR of top 26 players, mapped to 0-100
  const teamPlayers = players
    .filter(p => p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE')
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 26);
  const avgOvr = teamPlayers.length > 0
    ? teamPlayers.reduce((s, p) => s + p.overall, 0) / teamPlayers.length
    : 200;
  // Map 200-450 OVR range to 0-100
  const rosterStrength = Math.round(Math.max(0, Math.min(100, ((avgOvr - 200) / 250) * 100)));

  // Farm strength: count and quality of minor league prospects
  const prospects = players.filter(
    p => p.teamId === team.teamId &&
    p.rosterData.rosterStatus.startsWith('MINORS_') &&
    p.age <= 25,
  );
  const topProspects = prospects.filter(p => p.potential >= 380);
  const goodProspects = prospects.filter(p => p.potential >= 320 && p.potential < 380);
  // Scale: 0-5 top prospects + depth = 0-100
  const farmStrength = Math.round(Math.min(100,
    topProspects.length * 15 + goodProspects.length * 5 + Math.min(prospects.length, 20),
  ));

  // Payroll flexibility
  const currentPayroll = players
    .filter(p => p.teamId === team.teamId && p.rosterData.salary > 0)
    .reduce((s, p) => s + p.rosterData.salary, 0);
  const payrollFlexibility = Math.max(0, team.budget - currentPayroll);

  // Competitive window estimate
  const corePlayersUnder30 = teamPlayers.filter(p => p.age < 30 && p.overall >= 350);
  const corePlayersOver32 = teamPlayers.filter(p => p.age > 32 && p.overall >= 350);
  let windowYears: number;
  if (mode === 'rebuilder') {
    windowYears = Math.min(5, 2 + Math.floor(topProspects.length / 2));
  } else if (mode === 'contender') {
    // Window shrinks with older cores
    windowYears = corePlayersOver32.length > corePlayersUnder30.length ? 1 : 3;
  } else {
    windowYears = 2;
  }

  // Priority actions based on mode
  const priorityActions: AIPriority[] = [];
  if (mode === 'contender') {
    if (positionalNeeds.some(n => n.severity === 'critical')) {
      priorityActions.push('win_now_FA', 'trade_for_ace');
    } else {
      priorityActions.push('win_now_FA');
    }
    priorityActions.push('draft_best_available');
  } else if (mode === 'rebuilder') {
    priorityActions.push('prospect_hoard', 'draft_best_available');
    if (currentPayroll > team.budget * 0.8) {
      priorityActions.push('salary_dump');
    }
  } else {
    // Fringe — depends on farm
    if (farmStrength >= 50) {
      priorityActions.push('prospect_hoard', 'draft_positional_need');
    } else {
      priorityActions.push('win_now_FA', 'draft_positional_need');
    }
  }

  return {
    teamId: team.teamId,
    mode,
    windowYears,
    positionalNeeds,
    rosterStrength,
    farmStrength,
    payrollFlexibility,
    priorityActions,
  };
}

// ─── Rank Targets (for draft, FA, or trade evaluation) ───────────────────────

export function rankTargets(
  profile: TeamProfile,
  candidates: Player[],
): Array<{ player: Player; score: number }> {
  return candidates
    .map(player => {
      let score = evaluatePlayer(player);

      // Need bonus: boost score if player fills a positional need
      const need = profile.positionalNeeds.find(n => n.position === player.position);
      if (need) {
        if (need.severity === 'critical') score += 20;
        else if (need.severity === 'moderate') score += 10;
        else score += 5;

        if (need.urgency === 'immediate') score += 5;
      }

      // Mode adjustments
      if (profile.mode === 'contender') {
        // Contenders prefer MLB-ready players (high OVR, lower potential gap)
        if (player.rosterData.rosterStatus === 'MLB_ACTIVE' && player.overall >= 350) {
          score += 10;
        }
        // Contenders discount raw prospects
        if (player.age <= 22 && player.overall < 250) {
          score -= 10;
        }
      } else if (profile.mode === 'rebuilder') {
        // Rebuilders prefer high-ceiling young players
        const potentialGap = player.potential - player.overall;
        if (potentialGap > 100 && player.age <= 24) {
          score += 15;
        }
        // Rebuilders discount expensive veterans
        if (player.age >= 30 && player.rosterData.salary > 10_000_000) {
          score -= 15;
        }
      }

      return { player, score };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Evaluate Trade from Team Perspective ────────────────────────────────────

export function evaluateTradeForTeam(
  profile: TeamProfile,
  incoming: Player[],
  outgoing: Player[],
): { accept: boolean; netValue: number; reason: string } {
  let incomingValue = 0;
  let outgoingValue = 0;

  for (const p of incoming) {
    let val = evaluatePlayer(p);
    // Boost value if incoming player fills a need
    const need = profile.positionalNeeds.find(n => n.position === p.position);
    if (need) {
      if (need.severity === 'critical') val *= 1.3;
      else if (need.severity === 'moderate') val *= 1.15;
    }
    // Mode adjustments
    if (profile.mode === 'contender' && p.rosterData.rosterStatus === 'MLB_ACTIVE' && p.overall >= 350) {
      val *= 1.1; // Premium for immediate contributors
    }
    if (profile.mode === 'rebuilder' && p.age <= 24 && (p.potential - p.overall) > 80) {
      val *= 1.2; // Premium for young upside
    }
    incomingValue += val;
  }

  for (const p of outgoing) {
    let val = evaluatePlayer(p);
    // Reduce pain of losing player at surplus position
    const need = profile.positionalNeeds.find(n => n.position === p.position);
    if (!need) {
      val *= 0.9; // Surplus position — easier to trade away
    }
    // Rebuilders are more willing to part with veterans
    if (profile.mode === 'rebuilder' && p.age >= 30) {
      val *= 0.8;
    }
    // Contenders are reluctant to trade core pieces
    if (profile.mode === 'contender' && p.overall >= 380) {
      val *= 1.2;
    }
    outgoingValue += val;
  }

  const netValue = incomingValue - outgoingValue;
  // AI teams accept if they're getting at least 85% of value
  // (Contenders in win-now mode are more aggressive)
  const threshold = profile.mode === 'contender' ? -8 : -3;
  const accept = netValue >= threshold;

  let reason: string;
  if (accept) {
    if (netValue > 10) reason = 'Strong deal for us';
    else if (netValue > 0) reason = 'Fair trade';
    else reason = 'Acceptable — fills a need';
  } else {
    reason = 'Not enough value in return';
  }

  return { accept, netValue: Math.round(netValue), reason };
}

// ─── Utility: compute payroll for a team ─────────────────────────────────────

export function computeTeamPayroll(players: Player[], teamId: number): number {
  return players
    .filter(p => p.teamId === teamId && p.rosterData.salary > 0)
    .reduce((s, p) => s + p.rosterData.salary, 0);
}
