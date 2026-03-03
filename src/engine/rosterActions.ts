import type { Player, RosterStatus } from '../types/player';

// ─── Roster limits ──────────────────────────────────────────────────────────────
export const ACTIVE_ROSTER_LIMIT = 26;
export const FORTY_MAN_LIMIT = 40;

// ─── Roster level hierarchy (lowest to highest) ─────────────────────────────────
const LEVEL_ORDER: RosterStatus[] = [
  'MINORS_INTL',
  'MINORS_ROOKIE',
  'MINORS_AMINUS',
  'MINORS_APLUS',
  'MINORS_AA',
  'MINORS_AAA',
  'MLB_ACTIVE',
];

function levelIndex(status: RosterStatus): number {
  return LEVEL_ORDER.indexOf(status);
}

function isMinorLeague(status: RosterStatus): boolean {
  return status.startsWith('MINORS_');
}

// ─── Transaction result ─────────────────────────────────────────────────────────
export interface TransactionResult {
  ok: boolean;
  error?: string;
}

// ─── Count helpers ──────────────────────────────────────────────────────────────
export function countActive(players: Player[], teamId: number): number {
  return players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE').length;
}

export function count40Man(players: Player[], teamId: number): number {
  return players.filter(p => p.teamId === teamId && p.rosterData.isOn40Man).length;
}

// ─── Promote player ─────────────────────────────────────────────────────────────
export function promotePlayer(
  player: Player,
  targetStatus: RosterStatus,
  allPlayers: Player[],
): TransactionResult {
  const currentIdx = levelIndex(player.rosterData.rosterStatus);
  const targetIdx = levelIndex(targetStatus);

  if (currentIdx === -1 || targetIdx === -1) {
    return { ok: false, error: 'Invalid roster status for promotion.' };
  }
  if (targetIdx <= currentIdx) {
    return { ok: false, error: 'Target level must be higher than current level.' };
  }

  // Check 26-man limit if promoting to MLB
  if (targetStatus === 'MLB_ACTIVE') {
    const activeCount = countActive(allPlayers, player.teamId);
    if (activeCount >= ACTIVE_ROSTER_LIMIT) {
      return { ok: false, error: `Active roster is full (${ACTIVE_ROSTER_LIMIT}/${ACTIVE_ROSTER_LIMIT}).` };
    }
    // Add to 40-man if not already
    if (!player.rosterData.isOn40Man) {
      const fortyCount = count40Man(allPlayers, player.teamId);
      if (fortyCount >= FORTY_MAN_LIMIT) {
        return { ok: false, error: `40-man roster is full (${FORTY_MAN_LIMIT}/${FORTY_MAN_LIMIT}).` };
      }
    }
  }

  // Execute promotion
  player.rosterData.rosterStatus = targetStatus;
  if (targetStatus === 'MLB_ACTIVE') {
    player.rosterData.isOn40Man = true;
  }

  return { ok: true };
}

// ─── Demote player ──────────────────────────────────────────────────────────────
export function demotePlayer(
  player: Player,
  targetStatus: RosterStatus,
): TransactionResult {
  const currentIdx = levelIndex(player.rosterData.rosterStatus);
  const targetIdx = levelIndex(targetStatus);

  if (currentIdx === -1 || targetIdx === -1) {
    return { ok: false, error: 'Invalid roster status for demotion.' };
  }
  if (targetIdx >= currentIdx) {
    return { ok: false, error: 'Target level must be lower than current level.' };
  }

  // Check option years if demoting from MLB to minors
  if (player.rosterData.rosterStatus === 'MLB_ACTIVE' && isMinorLeague(targetStatus)) {
    if (player.rosterData.optionYearsRemaining <= 0 && player.rosterData.serviceTimeDays >= 172 * 3) {
      return { ok: false, error: 'No option years remaining. Must DFA or release.' };
    }
    // Consume option
    if (!player.rosterData.optionUsedThisSeason) {
      player.rosterData.optionYearsRemaining = Math.max(0, player.rosterData.optionYearsRemaining - 1);
      player.rosterData.optionUsedThisSeason = true;
    }
    player.rosterData.demotionsThisSeason++;
  }

  player.rosterData.rosterStatus = targetStatus;
  return { ok: true };
}

// ─── DFA player ─────────────────────────────────────────────────────────────────
export function dfaPlayer(player: Player): TransactionResult {
  if (player.rosterData.rosterStatus === 'DFA') {
    return { ok: false, error: 'Player is already DFA.' };
  }
  if (player.rosterData.rosterStatus === 'FREE_AGENT') {
    return { ok: false, error: 'Player is a free agent.' };
  }

  player.rosterData.rosterStatus = 'DFA';
  player.rosterData.isOn40Man = false; // Opens a 40-man spot
  return { ok: true };
}

// ─── Release player ─────────────────────────────────────────────────────────────
export function releasePlayer(player: Player): TransactionResult {
  if (player.rosterData.rosterStatus === 'FREE_AGENT') {
    return { ok: false, error: 'Player is already a free agent.' };
  }
  if (player.rosterData.rosterStatus === 'RETIRED') {
    return { ok: false, error: 'Player is retired.' };
  }

  player.rosterData.rosterStatus = 'FREE_AGENT';
  player.rosterData.isOn40Man = false;
  player.teamId = -1;
  return { ok: true };
}

// ─── Get available actions for a player ─────────────────────────────────────────
export type RosterAction = 'promote' | 'demote' | 'dfa' | 'release';

export interface AvailableAction {
  action: RosterAction;
  label: string;
  targetStatus?: RosterStatus;
}

export function getAvailableActions(player: Player, _allPlayers: Player[]): AvailableAction[] {
  const actions: AvailableAction[] = [];
  const status = player.rosterData.rosterStatus;
  const idx = levelIndex(status);

  // Promote options (one level up)
  if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
    const nextLevel = LEVEL_ORDER[idx + 1];
    const label = nextLevel === 'MLB_ACTIVE' ? 'Call Up to MLB' : `Promote to ${formatLevel(nextLevel)}`;
    actions.push({ action: 'promote', label, targetStatus: nextLevel });
  }

  // Demote options (one level down)
  if (idx > 0) {
    const prevLevel = LEVEL_ORDER[idx - 1];
    const label = status === 'MLB_ACTIVE' ? `Option to ${formatLevel(prevLevel)}` : `Demote to ${formatLevel(prevLevel)}`;
    actions.push({ action: 'demote', label, targetStatus: prevLevel });
  }

  // DFA (only for MLB/40-man players)
  if (status === 'MLB_ACTIVE' || player.rosterData.isOn40Man) {
    actions.push({ action: 'dfa', label: 'Designate for Assignment' });
  }

  // Release (anyone on the team)
  if (status !== 'FREE_AGENT' && status !== 'RETIRED' && status !== 'DRAFT_ELIGIBLE') {
    actions.push({ action: 'release', label: 'Release' });
  }

  return actions;
}

function formatLevel(status: RosterStatus): string {
  switch (status) {
    case 'MLB_ACTIVE': return 'MLB';
    case 'MINORS_AAA': return 'AAA';
    case 'MINORS_AA': return 'AA';
    case 'MINORS_APLUS': return 'High-A';
    case 'MINORS_AMINUS': return 'Low-A';
    case 'MINORS_ROOKIE': return 'Rookie';
    case 'MINORS_INTL': return 'Intl';
    default: return status;
  }
}
