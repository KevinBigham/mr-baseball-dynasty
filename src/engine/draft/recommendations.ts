import type { DraftBoardEntry } from '../draft';
import { aiSelectPlayer, type DraftPick } from './draftAI';

function compareByScoutedQuality(a: DraftBoardEntry, b: DraftBoardEntry): number {
  return b.scoutedOvr - a.scoutedOvr
    || b.scoutedPot - a.scoutedPot
    || a.rank - b.rank
    || a.playerId - b.playerId;
}

export function getRecommendedDraftTarget(
  available: DraftBoardEntry[],
  teamPicks: DraftPick[],
  round: number,
): DraftBoardEntry | null {
  const playerId = aiSelectPlayer(available, teamPicks, round);
  if (playerId === -1) return null;
  return available.find((player) => player.playerId === playerId) ?? null;
}

export function getBestValueDraftTarget(
  available: DraftBoardEntry[],
  overallPick: number,
): DraftBoardEntry | null {
  if (available.length === 0) return null;

  return [...available].sort((a, b) => {
    const slipA = overallPick - a.rank;
    const slipB = overallPick - b.rank;
    return slipB - slipA
      || compareByScoutedQuality(a, b);
  })[0] ?? null;
}

export function getHighestPotentialDraftTarget(
  available: DraftBoardEntry[],
): DraftBoardEntry | null {
  if (available.length === 0) return null;

  return [...available].sort((a, b) =>
    b.scoutedPot - a.scoutedPot
      || compareByScoutedQuality(a, b),
  )[0] ?? null;
}
