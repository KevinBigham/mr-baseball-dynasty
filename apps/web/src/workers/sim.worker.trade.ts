import type {
  BriefingItem,
  PersistentTradeOffer,
  TradeHistoryEntry,
} from '@mbd/contracts';
import {
  applyMoraleEvent,
  buildRosterState,
  calculateTeamChemistry,
  comparePackages,
  createInitialPlayerMorale,
  deduplicateNews,
  evaluateTradeProposal,
  executeTrade,
  generateAITradeOffers,
  generateNews,
  generateNewsId,
  getTeamById,
} from '@mbd/sim-core';
import type { TradeProposal } from '@mbd/sim-core';
import type { FullGameState } from './sim.worker.helpers.js';
import { getTeamPlayers, timestamp } from './sim.worker.helpers.js';
import { applyTradeConsequences } from './sim.worker.consequences.js';
import { rebuildBriefing } from './sim.worker.narrative.js';

export const TRADE_DEADLINE_DAY = 120;

export interface TradeAssetView {
  playerId: string;
  playerName: string;
  position: string;
}

export interface TradeOfferView {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  fromTeamAbbreviation: string;
  toTeamId: string;
  toTeamName: string;
  toTeamAbbreviation: string;
  fairnessScore: number;
  message: string;
  createdAt: string;
  offeringPlayers: TradeAssetView[];
  requestingPlayers: TradeAssetView[];
}

export interface TradeHistoryView {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  fromTeamAbbreviation: string;
  toTeamId: string;
  toTeamName: string;
  toTeamAbbreviation: string;
  fairnessScore: number;
  summary: string;
  timestamp: string;
  offeringPlayers: TradeAssetView[];
  requestingPlayers: TradeAssetView[];
}

export interface TradeCounterPackage {
  offeringPlayerIds: string[];
  requestingPlayerIds: string[];
}

export interface TradeOfferResponseResult {
  success: boolean;
  decision: 'accepted' | 'declined' | 'countered' | 'rejected';
  message: string;
}

function teamName(teamId: string): string {
  const team = getTeamById(teamId);
  return team ? `${team.city} ${team.name}` : teamId.toUpperCase();
}

function teamAbbreviation(teamId: string): string {
  return getTeamById(teamId)?.abbreviation ?? teamId.toUpperCase();
}

function tradeSignature(
  fromTeamId: string,
  toTeamId: string,
  offeringPlayerIds: string[],
  requestingPlayerIds: string[],
): string {
  const offered = [...offeringPlayerIds].sort().join(',');
  const requested = [...requestingPlayerIds].sort().join(',');
  return `${fromTeamId}->${toTeamId}:${offered}|${requested}`;
}

function playerViewForId(state: FullGameState, playerId: string): TradeAssetView {
  const player = state.players.find((candidate) => candidate.id === playerId);
  return {
    playerId,
    playerName: player ? `${player.firstName} ${player.lastName}` : playerId,
    position: player?.position ?? 'UNK',
  };
}

function createBriefingItem(headline: string, body: string, relatedPlayerIds: string[], relatedTeamIds: string[]): BriefingItem {
  return {
    id: `brief-${headline.replace(/\s+/g, '-').toLowerCase()}`,
    priority: 2,
    category: 'news',
    headline,
    body,
    relatedPlayerIds,
    relatedTeamIds,
    timestamp: '',
    acknowledged: false,
  };
}

function pushBriefing(state: FullGameState, item: BriefingItem) {
  const stamped = { ...item, timestamp: timestamp() };
  state.briefingQueue = [stamped, ...state.briefingQueue];
  rebuildBriefing(state);
}

function pushNewsAndBriefing(
  state: FullGameState,
  headline: string,
  body: string,
  relatedPlayerIds: string[],
  relatedTeamIds: string[],
) {
  const newsItem = {
    id: generateNewsId(state.rng.fork()),
    headline,
    body,
    priority: 2 as const,
    category: 'trade' as const,
    timestamp: timestamp(),
    relatedPlayerIds,
    relatedTeamIds,
    read: false,
  };
  state.news = deduplicateNews([newsItem, ...state.news]);
  pushBriefing(
    state,
    createBriefingItem(headline, body, relatedPlayerIds, relatedTeamIds),
  );
}

function applyDeclineMorale(state: FullGameState, playerIds: string[]) {
  for (const playerId of playerIds) {
    const player = state.players.find((candidate) => candidate.id === playerId && candidate.teamId === state.userTeamId);
    if (!player) continue;
    const current = state.playerMorale.get(player.id)
      ?? createInitialPlayerMorale(player, timestamp());
    state.playerMorale.set(player.id, applyMoraleEvent(player, current, {
      type: 'trade',
      impact: 3,
      summary: 'Front office turned away trade talks and kept the room intact.',
      timestamp: timestamp(),
    }));
  }

  state.teamChemistry.set(
    state.userTeamId,
    calculateTeamChemistry(state.userTeamId, state.players, state.playerMorale),
  );
}

function playersStillMatchProposal(state: FullGameState, proposal: TradeProposal): boolean {
  return proposal.playersOffered.every((playerId) =>
    state.players.some((player) => player.id === playerId && player.teamId === proposal.fromTeamId),
  ) && proposal.playersRequested.every((playerId) =>
    state.players.some((player) => player.id === playerId && player.teamId === proposal.toTeamId),
  );
}

function fairValueForProposal(state: FullGameState, proposal: TradeProposal): number {
  const offered = state.players.filter((player) => proposal.playersOffered.includes(player.id));
  const requested = state.players.filter((player) => proposal.playersRequested.includes(player.id));
  return comparePackages(offered, requested).fairness;
}

function buildTradeHistoryEntry(
  state: FullGameState,
  proposal: TradeProposal,
  fairnessScore: number,
): TradeHistoryEntry {
  const offeringNames = proposal.playersOffered
    .map((playerId) => playerViewForId(state, playerId).playerName)
    .slice(0, 2)
    .join(', ');
  const requestingNames = proposal.playersRequested
    .map((playerId) => playerViewForId(state, playerId).playerName)
    .slice(0, 2)
    .join(', ');

  return {
    id: proposal.id,
    fromTeamId: proposal.fromTeamId,
    toTeamId: proposal.toTeamId,
    offeringPlayerIds: proposal.playersOffered,
    requestingPlayerIds: proposal.playersRequested,
    fairnessScore,
    summary: `${teamName(proposal.fromTeamId)} sent ${offeringNames || 'players'} to ${teamName(proposal.toTeamId)} for ${requestingNames || 'players'}.`,
    timestamp: timestamp(),
  };
}

function addTradeHistoryEntry(state: FullGameState, entry: TradeHistoryEntry) {
  const next = [
    entry,
    ...state.tradeState.tradeHistory.filter((existing) => existing.id !== entry.id),
  ];
  state.tradeState = {
    ...state.tradeState,
    tradeHistory: next,
  };
}

function addPendingOffer(state: FullGameState, offer: PersistentTradeOffer) {
  const next = [
    offer,
    ...state.tradeState.pendingOffers.filter((existing) => existing.id !== offer.id),
  ];
  state.tradeState = {
    ...state.tradeState,
    pendingOffers: next,
  };
}

function removePendingOffer(state: FullGameState, offerId: string) {
  state.tradeState = {
    ...state.tradeState,
    pendingOffers: state.tradeState.pendingOffers.filter((offer) => offer.id !== offerId),
  };
}

function existingTradeSignatures(state: FullGameState): Set<string> {
  const signatures = new Set<string>();
  for (const offer of state.tradeState.pendingOffers) {
    signatures.add(tradeSignature(
      offer.fromTeamId,
      offer.toTeamId,
      offer.offeringPlayerIds,
      offer.requestingPlayerIds,
    ));
  }
  for (const history of state.tradeState.tradeHistory) {
    signatures.add(tradeSignature(
      history.fromTeamId,
      history.toTeamId,
      history.offeringPlayerIds,
      history.requestingPlayerIds,
    ));
  }
  return signatures;
}

function isContender(state: FullGameState, teamId: string): boolean {
  const record = state.seasonState.standings.getRecord(teamId);
  if (!record) return false;
  return record.wins >= record.losses;
}

function buildPersistentOffer(
  state: FullGameState,
  proposal: TradeProposal,
  fairnessScore: number,
): PersistentTradeOffer {
  return {
    id: proposal.id,
    fromTeamId: proposal.fromTeamId,
    toTeamId: proposal.toTeamId,
    offeringPlayerIds: proposal.playersOffered,
    requestingPlayerIds: proposal.playersRequested,
    fairnessScore,
    message: `The ${teamName(proposal.fromTeamId)} want to discuss a trade. ${proposal.reason}`,
    createdAt: timestamp(),
  };
}

function buildTradeViews<T extends PersistentTradeOffer | TradeHistoryEntry>(
  state: FullGameState,
  trades: T[],
) {
  return trades.map((trade) => ({
    ...trade,
    fromTeamName: teamName(trade.fromTeamId),
    fromTeamAbbreviation: teamAbbreviation(trade.fromTeamId),
    toTeamName: teamName(trade.toTeamId),
    toTeamAbbreviation: teamAbbreviation(trade.toTeamId),
    offeringPlayers: trade.offeringPlayerIds.map((playerId) => playerViewForId(state, playerId)),
    requestingPlayers: trade.requestingPlayerIds.map((playerId) => playerViewForId(state, playerId)),
  }));
}

export function isTradeMarketOpen(state: FullGameState): boolean {
  return state.phase === 'regular' && state.day <= TRADE_DEADLINE_DAY;
}

export function buildTradeOffersView(state: FullGameState): TradeOfferView[] {
  return buildTradeViews(state, state.tradeState.pendingOffers) as TradeOfferView[];
}

export function buildTradeHistoryView(state: FullGameState): TradeHistoryView[] {
  return buildTradeViews(state, state.tradeState.tradeHistory) as TradeHistoryView[];
}

export function clearPendingTradeOffers(state: FullGameState) {
  if (state.tradeState.pendingOffers.length === 0) return;
  state.tradeState = {
    ...state.tradeState,
    pendingOffers: [],
  };
}

function recordLeagueTradeNews(state: FullGameState, proposal: TradeProposal) {
  const players = state.players.filter((player) =>
    proposal.playersOffered.includes(player.id) || proposal.playersRequested.includes(player.id),
  );
  const items = generateNews(
    state.rng.fork(),
    {
      type: 'trade',
      season: state.season,
      day: state.day,
      data: {
        player1Id: proposal.playersOffered[0],
        player2Id: proposal.playersRequested[0],
        team1Id: proposal.fromTeamId,
        team2Id: proposal.toTeamId,
        team1Name: teamName(proposal.fromTeamId),
        team2Name: teamName(proposal.toTeamId),
      },
    },
    players,
    state.season,
    state.day,
  );

  if (items.length === 0) return;

  state.news = deduplicateNews([...items, ...state.news]);
  const userDivision = getTeamById(state.userTeamId)?.division;
  const involvesRelevantTeam = [proposal.fromTeamId, proposal.toTeamId].some((teamId) =>
    teamId === state.userTeamId || getTeamById(teamId)?.division === userDivision,
  );
  if (involvesRelevantTeam) {
    for (const item of items) {
      pushBriefing(state, createBriefingItem(item.headline, item.body, item.relatedPlayerIds, item.relatedTeamIds));
    }
  }
}

function executeAcceptedTrade(
  state: FullGameState,
  proposal: TradeProposal,
  fairnessScore: number,
) {
  executeTrade(proposal, state.players);
  state.rosterStates.set(proposal.fromTeamId, buildRosterState(proposal.fromTeamId, state.players));
  state.rosterStates.set(proposal.toTeamId, buildRosterState(proposal.toTeamId, state.players));
  addTradeHistoryEntry(state, buildTradeHistoryEntry(state, proposal, fairnessScore));
}

function buildMonthlyTradeCandidates(state: FullGameState) {
  const userCandidates: TradeProposal[] = [];
  const aiCandidates: TradeProposal[] = [];
  const signatures = existingTradeSignatures(state);

  for (const team of Array.from(new Set(state.players.map((player) => player.teamId))).filter((teamId) => teamId && teamId !== state.userTeamId)) {
    const gm = state.gmPersonalities.get(team);
    if (!gm) continue;

    const proposals = generateAITradeOffers(
      state.rng.fork(),
      team,
      getTeamPlayers(team),
      state.players,
      gm,
      isContender(state, team),
    );

    for (const proposal of proposals) {
      if (!playersStillMatchProposal(state, proposal)) continue;

      const signature = tradeSignature(
        proposal.fromTeamId,
        proposal.toTeamId,
        proposal.playersOffered,
        proposal.playersRequested,
      );
      if (signatures.has(signature)) continue;
      signatures.add(signature);

      if (proposal.toTeamId === state.userTeamId) {
        userCandidates.push(proposal);
      } else if (proposal.fromTeamId !== state.userTeamId) {
        aiCandidates.push(proposal);
      }
    }
  }

  return {
    userCandidates: state.rng.shuffle(userCandidates),
    aiCandidates: state.rng.shuffle(aiCandidates),
  };
}

function generateMonthlyTradeActivity(state: FullGameState) {
  const { userCandidates, aiCandidates } = buildMonthlyTradeCandidates(state);
  const userOfferTarget = state.rng.nextInt(1, 3);

  for (const proposal of userCandidates.slice(0, userOfferTarget)) {
    const fairnessScore = fairValueForProposal(state, proposal);
    addPendingOffer(state, buildPersistentOffer(state, proposal, fairnessScore));
  }

  for (const proposal of aiCandidates.slice(0, 1)) {
    const gm = state.gmPersonalities.get(proposal.toTeamId);
    if (!gm || !playersStillMatchProposal(state, proposal)) continue;
    const result = evaluateTradeProposal(
      state.rng.fork(),
      proposal,
      getTeamPlayers(proposal.fromTeamId),
      getTeamPlayers(proposal.toTeamId),
      gm,
      isContender(state, proposal.toTeamId),
    );
    if (result.decision !== 'accepted') continue;

    const fairnessScore = fairValueForProposal(state, proposal);
    executeAcceptedTrade(state, proposal, fairnessScore);
    recordLeagueTradeNews(state, proposal);
  }
}

export function processTradeMarketActivity(
  state: FullGameState,
  previousDay: number,
  currentDay: number,
) {
  if (state.phase !== 'regular' || currentDay <= previousDay) {
    return;
  }

  if (previousDay <= TRADE_DEADLINE_DAY && currentDay > TRADE_DEADLINE_DAY) {
    clearPendingTradeOffers(state);
  }

  const previousWindow = Math.floor((Math.max(previousDay, 1) - 1) / 30);
  const currentWindow = Math.floor((Math.max(currentDay, 1) - 1) / 30);
  for (let windowIndex = previousWindow + 1; windowIndex <= currentWindow; windowIndex++) {
    const windowStartDay = windowIndex * 30 + 1;
    if (windowStartDay > TRADE_DEADLINE_DAY) continue;
    generateMonthlyTradeActivity(state);
  }
}

export function recordAcceptedUserTrade(
  state: FullGameState,
  proposal: TradeProposal,
) {
  addTradeHistoryEntry(state, buildTradeHistoryEntry(state, proposal, fairValueForProposal(state, proposal)));
}

export function respondToTradeOffer(
  state: FullGameState,
  offerId: string,
  action: 'accept' | 'decline' | 'counter',
  counterPackage?: TradeCounterPackage,
): TradeOfferResponseResult {
  const offer = state.tradeState.pendingOffers.find((candidate) => candidate.id === offerId);
  if (!offer) {
    return { success: false, decision: 'rejected', message: 'Trade offer no longer exists.' };
  }

  const proposal: TradeProposal = {
    id: offer.id,
    fromTeamId: offer.fromTeamId,
    toTeamId: offer.toTeamId,
    playersOffered: offer.offeringPlayerIds,
    playersRequested: offer.requestingPlayerIds,
    status: 'proposed',
    reason: offer.message,
  };

  if (action === 'decline') {
    removePendingOffer(state, offerId);
    applyDeclineMorale(state, offer.requestingPlayerIds);
    pushNewsAndBriefing(
      state,
      `${teamName(offer.fromTeamId)} offer declined`,
      `${teamName(state.userTeamId)} declined a trade proposal involving ${playerViewForId(state, offer.requestingPlayerIds[0] ?? '').playerName}.`,
      [...offer.offeringPlayerIds, ...offer.requestingPlayerIds],
      [offer.fromTeamId, offer.toTeamId],
    );
    return {
      success: true,
      decision: 'declined',
      message: 'Offer declined and the room took note.',
    };
  }

  if (action === 'accept') {
    if (!isTradeMarketOpen(state) || !playersStillMatchProposal(state, proposal)) {
      removePendingOffer(state, offerId);
      return {
        success: false,
        decision: 'rejected',
        message: 'That offer is no longer actionable.',
      };
    }

    const preTradeUserPlayers = getTeamPlayers(state.userTeamId);
    const preTradePartnerPlayers = getTeamPlayers(offer.fromTeamId);
    executeAcceptedTrade(state, proposal, offer.fairnessScore);
    removePendingOffer(state, offerId);
    applyTradeConsequences(
      state,
      offer.requestingPlayerIds,
      offer.offeringPlayerIds,
      offer.fromTeamId,
      preTradeUserPlayers,
      preTradePartnerPlayers,
    );
    return {
      success: true,
      decision: 'accepted',
      message: 'Trade accepted.',
    };
  }

  if (!counterPackage || !isTradeMarketOpen(state)) {
    return {
      success: false,
      decision: 'rejected',
      message: 'Counter-offer could not be sent.',
    };
  }

  const counterProposal: TradeProposal = {
    id: offer.id,
    fromTeamId: state.userTeamId,
    toTeamId: offer.fromTeamId,
    playersOffered: counterPackage.offeringPlayerIds,
    playersRequested: counterPackage.requestingPlayerIds,
    status: 'proposed',
    reason: 'Counter-offer from user GM',
  };

  const gm = state.gmPersonalities.get(offer.fromTeamId);
  if (!gm) {
    return { success: false, decision: 'rejected', message: 'Unable to reach the other front office.' };
  }

  const result = evaluateTradeProposal(
    state.rng.fork(),
    counterProposal,
    getTeamPlayers(state.userTeamId),
    getTeamPlayers(offer.fromTeamId),
    gm,
    isContender(state, offer.fromTeamId),
  );

  removePendingOffer(state, offerId);

  if (result.decision === 'accepted') {
    const preTradeUserPlayers = getTeamPlayers(state.userTeamId);
    const preTradePartnerPlayers = getTeamPlayers(offer.fromTeamId);
    const fairnessScore = fairValueForProposal(state, counterProposal);
    executeAcceptedTrade(state, counterProposal, fairnessScore);
    applyTradeConsequences(
      state,
      counterProposal.playersOffered,
      counterProposal.playersRequested,
      counterProposal.toTeamId,
      preTradeUserPlayers,
      preTradePartnerPlayers,
    );
    return {
      success: true,
      decision: 'accepted',
      message: 'Counter-offer accepted.',
    };
  }

  if (result.decision === 'countered' && result.counter) {
    const fairnessScore = fairValueForProposal(state, result.counter);
    addPendingOffer(state, buildPersistentOffer(state, result.counter, fairnessScore));
    pushNewsAndBriefing(
      state,
      `${teamName(offer.fromTeamId)} countered back`,
      `${teamName(offer.fromTeamId)} sent a revised trade framework back to ${teamName(state.userTeamId)}.`,
      [...result.counter.playersOffered, ...result.counter.playersRequested],
      [result.counter.fromTeamId, result.counter.toTeamId],
    );
    return {
      success: true,
      decision: 'countered',
      message: 'The other GM sent a revised proposal.',
    };
  }

  pushNewsAndBriefing(
    state,
    `${teamName(offer.fromTeamId)} walked away from talks`,
    `${teamName(offer.fromTeamId)} rejected the counter-offer.`,
    [...counterProposal.playersOffered, ...counterProposal.playersRequested],
    [offer.fromTeamId, state.userTeamId],
  );
  return {
    success: true,
    decision: 'rejected',
    message: result.reason,
  };
}
