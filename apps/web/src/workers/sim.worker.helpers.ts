/**
 * Shared types, state, and helper functions for the sim worker.
 * Extracted to keep the main worker file under 500 lines.
 */
import {
  GameRNG,
  TEAMS,
  DRAFT_ROUNDS,
  aiSelectPick,
  buildPlayoffPreview,
  determineDraftOrder,
  generateDraftClass,
  getTeamById,
  getOffseasonLength,
  toDisplayRating,
  toLetterGrade,
  advanceInjury,
  describeInjury,
  processInjuries,
  checkMilestones,
  generateNews,
  deduplicateNews,
  createOffseasonState,
  advanceOffseasonDay,
  skipCurrentPhase,
  autoResolveTenderNonTender,
  buildRosterState,
  calculateTeamPayroll,
  createFreeAgencyMarket,
  evaluateTeamNeeds,
  generateArbitrationCase,
  getArbEligiblePlayers,
  getTeamBudget,
  recordArbitration,
  recordDraftPicks,
  recordFASigning,
  recordTenderDecisions,
  resolveArbitration,
  simulateFADay,
  type DraftPickResult,
  type FASigningResult,
  type RetirementResult,
} from '@mbd/sim-core';
import { applyMoraleEvent } from '../../../../packages/sim-core/src/league/narrativeState';
import type {
  GeneratedPlayer,
  PlayoffPreviewSeries as CorePlayoffPreviewSeries,
  ScheduledGame,
  SeasonState,
  PlayoffBracket,
  PlayerGameStats,
  Injury,
  Scout,
  DraftClass,
  DraftProspect,
  RosterState,
  OffseasonState,
  FreeAgencyMarket,
  NewsItem,
  GMPersonality,
} from '@mbd/sim-core';
import type {
  AwardHistoryEntry,
  BriefingItem,
  OwnerState,
  PlayerMorale,
  Rivalry,
  SeasonHistoryEntry,
  TeamChemistry,
  TradeState,
} from '@mbd/contracts';

// ---------------------------------------------------------------------------
// Full game state
// ---------------------------------------------------------------------------

export interface FullGameState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  players: GeneratedPlayer[];
  schedule: ScheduledGame[];
  seasonState: SeasonState;
  userTeamId: string;
  playoffBracket: PlayoffBracket | null;
  // Phase 2 state
  injuries: Map<string, Injury>;
  serviceTime: Map<string, number>;
  scoutingStaffs: Map<string, Scout[]>;
  gmPersonalities: Map<string, GMPersonality>;
  offseasonState: OffseasonState | null;
  draftClass: DraftSessionState | null;
  freeAgencyMarket: FreeAgencyMarket | null;
  news: NewsItem[];
  rosterStates: Map<string, RosterState>;
  playerMorale: Map<string, PlayerMorale>;
  teamChemistry: Map<string, TeamChemistry>;
  ownerState: Map<string, OwnerState>;
  briefingQueue: BriefingItem[];
  storyFlags: Map<string, string[]>;
  rivalries: Map<string, Rivalry>;
  awardHistory: AwardHistoryEntry[];
  seasonHistory: SeasonHistoryEntry[];
  tradeState: TradeState;
}

export let state: FullGameState | null = null;

export function setState(s: FullGameState | null): void {
  state = s;
}

// ---------------------------------------------------------------------------
// DTO types for the UI
// ---------------------------------------------------------------------------

export interface TeamStandingsDTO {
  teamId: string;
  teamName: string;
  city: string;
  abbreviation: string;
  division: string;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: number;
  streak: string;
  runDifferential: number;
}

export interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  displayRating: number;
  letterGrade: string;
  rosterStatus: string;
  teamId: string;
  stats: {
    pa: number;
    ab: number;
    hits: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
    avg: string;
    ip: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    era: string;
  } | null;
}

export interface SimResultDTO {
  day: number;
  season: number;
  phase: string;
  gamesPlayed: number;
  seasonComplete: boolean;
}

export interface OffseasonProgressResult {
  aiSignings: Array<{
    playerId: string;
    teamId: string;
    years: number;
    annualSalary: number;
    marketValue: number;
  }>;
}

export type OffseasonTransactionTone = 'user' | 'division_rival' | 'neutral';

export interface OffseasonTransactionRow {
  id: string;
  phase: string;
  tone: OffseasonTransactionTone;
  summary: string;
}

export interface OffseasonTransactionGroup {
  phase: string;
  label: string;
  rows: OffseasonTransactionRow[];
}

export interface OffseasonStateView extends OffseasonState {
  transactionGroups: OffseasonTransactionGroup[];
}

export type DraftRoomStatus = 'available' | 'in_progress' | 'complete';

export interface DraftRoomProspect {
  id: string;
  playerId: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  scoutingGrade: number;
  age: number;
  origin: string;
}

export interface DraftRoomPick {
  round: number;
  pickNumber: number;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  playerId: string;
  playerName: string;
  position: string;
  scoutingGrade: number;
  origin: string;
  tone: OffseasonTransactionTone;
}

export interface DraftBoardTeam {
  teamId: string;
  teamName: string;
  abbreviation: string;
  tone: OffseasonTransactionTone;
}

export interface DraftBoardCell {
  round: number;
  pickInRound: number;
  teamId: string;
  teamAbbreviation: string;
  tone: OffseasonTransactionTone;
  pick: DraftRoomPick | null;
}

export interface DraftBoardRow {
  round: number;
  cells: DraftBoardCell[];
}

export type SeasonFlowStatus =
  | 'preseason'
  | 'regular'
  | 'regular_season_complete'
  | 'playoff_preview'
  | 'playoffs_complete'
  | 'offseason'
  | 'offseason_complete';

export interface SeasonFlowStanding {
  teamId: string;
  teamName: string;
  abbreviation: string;
  wins: number;
  losses: number;
  division: string;
}

export interface SeasonFlowPreviewTeam {
  teamId: string | null;
  teamName: string;
  abbreviation: string;
  seed: number | null;
  placeholder: string | null;
}

export interface SeasonFlowPreviewSeries {
  id: string;
  round: string;
  bestOf: number;
  home: SeasonFlowPreviewTeam;
  away: SeasonFlowPreviewTeam;
}

export interface SeasonFlowChampionSummary {
  championTeamId: string | null;
  championTeamName: string;
  runnerUpTeamName: string;
  seriesRecord: string;
}

export interface SeasonFlowOffseasonSummary {
  nextSeason: number;
  moves: string[];
}

export interface SeasonFlowStateView {
  status: SeasonFlowStatus;
  season: number;
  phaseLabel: string;
  detailLabel: string;
  progress: number;
  canUseRegularSimControls: boolean;
  action: 'proceed_to_playoffs' | 'sim_playoffs' | 'proceed_to_offseason' | 'start_next_season' | null;
  actionLabel: string | null;
  daysUntilTradeDeadline: number | null;
  standingsSnapshot: SeasonFlowStanding[];
  playoffPreview: SeasonFlowPreviewSeries[];
  championSummary: SeasonFlowChampionSummary | null;
  offseasonSummary: SeasonFlowOffseasonSummary | null;
}

export interface DraftCurrentPick {
  round: number;
  pickNumber: number;
  pickInRound: number;
  totalPicks: number;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  userOnClock: boolean;
}

export interface DraftClassSummaryPick {
  playerId: string;
  playerName: string;
  position: string;
  scoutingGrade: number;
  origin: string;
  assessment: string;
}

export interface DraftClassSummary {
  picks: DraftClassSummaryPick[];
  overallGrade: string;
  averageScoutingGrade: number;
}

export interface DraftRoomView {
  status: DraftRoomStatus;
  availableProspects: DraftRoomProspect[];
  completedPicks: DraftRoomPick[];
  currentPick: DraftCurrentPick | null;
  board: {
    teams: DraftBoardTeam[];
    rounds: DraftBoardRow[];
  };
  counts: {
    totalRounds: number;
    totalPicks: number;
    picksMade: number;
    picksRemaining: number;
  };
  userDraftClass: DraftClassSummary | null;
}

export interface DraftActionResult {
  success: boolean;
  draft: DraftRoomView | null;
  newPicks: DraftRoomPick[];
  error?: string;
}

export interface DraftSessionState extends DraftClass {
  draftOrder: string[];
  completedPicks: DraftRoomPick[];
  status: DraftRoomStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function requireState(): FullGameState {
  if (!state) throw new Error('No game initialized');
  return state;
}

export function timestamp(): string {
  const s = requireState();
  return `S${s.season}D${s.day}`;
}

export function getTeamPlayers(teamId: string): GeneratedPlayer[] {
  return requireState().players.filter(p => p.teamId === teamId);
}

export function createEmptyTradeState(): TradeState {
  return {
    pendingOffers: [],
    tradeHistory: [],
  };
}

function playerLabel(player: GeneratedPlayer | null | undefined): string {
  return player ? `${player.firstName} ${player.lastName}` : 'Unknown player';
}

function teamLabel(teamId: string): string {
  const team = getTeamById(teamId);
  return team ? `${team.city} ${team.name}` : teamId.toUpperCase();
}

function sameDivision(teamA: string, teamB: string): boolean {
  const left = getTeamById(teamA);
  const right = getTeamById(teamB);
  return Boolean(left && right && left.division === right.division);
}

export function transactionToneForTeam(s: FullGameState, teamId: string): OffseasonTransactionTone {
  if (teamId === s.userTeamId) return 'user';
  return sameDivision(teamId, s.userTeamId) ? 'division_rival' : 'neutral';
}

function formatMoneyPerYear(value: number): string {
  return `$${value.toFixed(1)}M/yr`;
}

function formatYears(years: number): string {
  return `(${years} year${years === 1 ? '' : 's'})`;
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'season_review': return 'Season Review';
    case 'arbitration': return 'Arbitration';
    case 'tender_nontender': return 'Tender / Non-Tender';
    case 'free_agency': return 'Free Agency';
    case 'draft': return 'Amateur Draft';
    case 'spring_training': return 'Spring Training';
    default: return phase;
  }
}

function buildDraftOrderFromStandings(seasonState: SeasonState): string[] {
  const records = new Map<string, { teamId: string; wins: number; losses: number }>();
  for (const entries of Object.values(seasonState.standings.getFullStandings())) {
    for (const entry of entries) {
      records.set(entry.teamId, { teamId: entry.teamId, wins: entry.wins, losses: entry.losses });
    }
  }

  for (const team of TEAMS) {
    if (!records.has(team.id)) {
      records.set(team.id, { teamId: team.id, wins: 0, losses: 0 });
    }
  }

  return determineDraftOrder(Array.from(records.values()));
}

function originLabel(origin: string): string {
  switch (origin) {
    case 'college':
      return 'College';
    case 'high_school':
      return 'HS';
    case 'international':
      return 'International';
    default:
      return origin || 'Unknown';
  }
}

function isDraftSessionState(value: DraftClass | DraftSessionState): value is DraftSessionState {
  return Array.isArray((value as DraftSessionState).draftOrder)
    && Array.isArray((value as DraftSessionState).completedPicks);
}

function getDraftStatus(session: DraftSessionState): DraftRoomStatus {
  const totalSlots = session.draftOrder.length * DRAFT_ROUNDS;
  if (session.prospects.length === 0 || session.completedPicks.length >= totalSlots) {
    return 'complete';
  }
  if (session.completedPicks.length === 0) {
    return session.status === 'in_progress' ? 'in_progress' : 'available';
  }
  return 'in_progress';
}

function normalizeDraftRoomPick(
  userTeamId: string,
  entry: Partial<DraftRoomPick>,
): DraftRoomPick {
  const teamId = entry.teamId ?? '';
  const team = getTeamById(teamId);
  const tone = teamId === userTeamId
    ? 'user'
    : sameDivision(teamId, userTeamId)
      ? 'division_rival'
      : 'neutral';

  return {
    round: entry.round ?? 1,
    pickNumber: entry.pickNumber ?? 1,
    teamId,
    teamName: entry.teamName ?? (team ? `${team.city} ${team.name}` : teamId.toUpperCase()),
    teamAbbreviation: entry.teamAbbreviation ?? (team?.abbreviation ?? teamId.toUpperCase()),
    playerId: entry.playerId ?? '',
    playerName: entry.playerName ?? 'Unknown Prospect',
    position: entry.position ?? 'UNK',
    scoutingGrade: entry.scoutingGrade ?? 0,
    origin: originLabel(entry.origin ?? 'Unknown'),
    tone,
  };
}

export function createDraftSessionState(
  draftClass: DraftClass,
  seasonState: SeasonState,
): DraftSessionState {
  return {
    ...draftClass,
    draftOrder: buildDraftOrderFromStandings(seasonState),
    completedPicks: [],
    status: 'available',
  };
}

export function normalizeDraftSessionState(
  draftClass: DraftSessionState | DraftClass | null,
  seasonState: SeasonState,
  userTeamId: string,
): DraftSessionState | null {
  if (!draftClass) {
    return null;
  }

  const normalized = isDraftSessionState(draftClass)
    ? {
      ...draftClass,
      draftOrder: draftClass.draftOrder.length > 0
        ? [...draftClass.draftOrder]
        : buildDraftOrderFromStandings(seasonState),
      completedPicks: draftClass.completedPicks.map((pick) => normalizeDraftRoomPick(userTeamId, pick)),
    }
    : createDraftSessionState(draftClass, seasonState);

  return {
    ...normalized,
    status: getDraftStatus(normalized),
  };
}

function getCurrentDraftSlot(session: DraftSessionState) {
  if (session.prospects.length === 0) {
    return null;
  }

  const totalSlots = session.draftOrder.length * DRAFT_ROUNDS;
  if (session.completedPicks.length >= totalSlots) {
    return null;
  }

  const pickIndex = session.completedPicks.length;
  const round = Math.floor(pickIndex / session.draftOrder.length) + 1;
  const pickInRound = (pickIndex % session.draftOrder.length) + 1;
  const teamId = session.draftOrder[pickInRound - 1] ?? '';
  if (!teamId) {
    return null;
  }

  return {
    round,
    pickNumber: pickIndex + 1,
    pickInRound,
    teamId,
  };
}

function ensureDraftSession(s: FullGameState): DraftSessionState | null {
  const normalized = normalizeDraftSessionState(s.draftClass, s.seasonState, s.userTeamId);
  s.draftClass = normalized;
  return normalized;
}

function recordDraftPickForState(
  s: FullGameState,
  session: DraftSessionState,
  slot: NonNullable<ReturnType<typeof getCurrentDraftSlot>>,
  prospect: DraftProspect,
): DraftRoomPick {
  const teamId = slot.teamId;
  const team = getTeamById(teamId);
  const pick: DraftRoomPick = {
    round: slot.round,
    pickNumber: slot.pickNumber,
    teamId,
    teamName: team ? `${team.city} ${team.name}` : teamId.toUpperCase(),
    teamAbbreviation: team?.abbreviation ?? teamId.toUpperCase(),
    playerId: prospect.player.id,
    playerName: `${prospect.player.firstName} ${prospect.player.lastName}`,
    position: prospect.player.position,
    scoutingGrade: prospect.scoutingGrade,
    origin: originLabel(prospect.collegeOrHS),
    tone: transactionToneForTeam(s, teamId),
  };

  (prospect.player as { teamId: string }).teamId = teamId;
  if (!s.players.some((player) => player.id === prospect.player.id)) {
    s.players.push(prospect.player);
  }

  session.prospects = session.prospects.filter((candidate) => candidate.player.id !== prospect.player.id);
  session.completedPicks = [...session.completedPicks, pick];
  session.status = getDraftStatus(session);
  s.rosterStates.set(teamId, buildRosterState(teamId, s.players));

  if (!s.offseasonState) {
    s.offseasonState = createOffseasonState(s.season);
  }
  s.offseasonState = recordDraftPicks(s.offseasonState, [{
    round: pick.round,
    pickNumber: pick.pickNumber,
    teamId: pick.teamId,
    playerId: pick.playerId,
    playerName: pick.playerName,
    position: pick.position,
    scoutingGrade: pick.scoutingGrade,
    origin: pick.origin,
  }]);

  return pick;
}

function advanceDraftToUserTurn(s: FullGameState): DraftRoomPick[] {
  const session = ensureDraftSession(s);
  if (!session) {
    return [];
  }

  const newPicks: DraftRoomPick[] = [];
  let currentSlot = getCurrentDraftSlot(session);
  while (currentSlot && session.prospects.length > 0 && currentSlot.teamId !== s.userTeamId) {
    const teamRoster = s.players.filter((player) => player.teamId === currentSlot?.teamId);
    const selection = aiSelectPick(s.rng.fork(), currentSlot.teamId, session.prospects, teamRoster);
    newPicks.push(recordDraftPickForState(s, session, currentSlot, selection));
    currentSlot = getCurrentDraftSlot(session);
  }

  session.status = getDraftStatus(session);
  return newPicks;
}

function assessmentForDraftPick(pick: DraftRoomPick, totalPicks: number): string {
  const expectedGrade = 66 - ((pick.pickNumber - 1) / Math.max(1, totalPicks - 1)) * 28;
  const delta = pick.scoutingGrade - expectedGrade;

  if (delta >= 8) return 'Clear value pick with impact upside.';
  if (delta >= 3) return 'Strong value with a realistic path to contributing.';
  if (delta >= -2) return 'On-slot selection with balanced risk and upside.';
  if (delta >= -7) return 'Development bet that may need patience.';
  return 'Longer-term project relative to the slot.';
}

function overallDraftGrade(picks: DraftRoomPick[], totalPicks: number): string {
  if (picks.length === 0) {
    return 'Incomplete';
  }

  const averageDelta = picks.reduce((sum, pick) => {
    const expectedGrade = 66 - ((pick.pickNumber - 1) / Math.max(1, totalPicks - 1)) * 28;
    return sum + (pick.scoutingGrade - expectedGrade);
  }, 0) / picks.length;

  if (averageDelta >= 8) return 'A';
  if (averageDelta >= 4) return 'B';
  if (averageDelta >= 0) return 'C';
  if (averageDelta >= -4) return 'D';
  return 'F';
}

function buildDraftBoard(s: FullGameState, session: DraftSessionState | null) {
  const draftOrder = session?.draftOrder ?? buildDraftOrderFromStandings(s.seasonState);
  const teams = draftOrder.map((teamId) => {
    const team = getTeamById(teamId);
    return {
      teamId,
      teamName: team ? `${team.city} ${team.name}` : teamId.toUpperCase(),
      abbreviation: team?.abbreviation ?? teamId.toUpperCase(),
      tone: transactionToneForTeam(s, teamId),
    };
  });

  const picksByKey = new Map(
    (session?.completedPicks ?? []).map((pick) => [`${pick.round}:${pick.teamId}`, pick] as const),
  );

  const rounds: DraftBoardRow[] = [];
  for (let round = 1; round <= DRAFT_ROUNDS; round++) {
    rounds.push({
      round,
      cells: draftOrder.map((teamId, index) => ({
        round,
        pickInRound: index + 1,
        teamId,
        teamAbbreviation: getTeamById(teamId)?.abbreviation ?? teamId.toUpperCase(),
        tone: transactionToneForTeam(s, teamId),
        pick: picksByKey.get(`${round}:${teamId}`) ?? null,
      })),
    });
  }

  return { teams, rounds };
}

export function buildDraftRoomView(s: FullGameState): DraftRoomView | null {
  const session = ensureDraftSession(s);
  if (!session) {
    if (s.phase !== 'offseason') {
      return null;
    }

    return {
      status: 'available',
      availableProspects: [],
      completedPicks: [],
      currentPick: null,
      board: buildDraftBoard(s, null),
      counts: {
        totalRounds: DRAFT_ROUNDS,
        totalPicks: 0,
        picksMade: 0,
        picksRemaining: 0,
      },
      userDraftClass: null,
    };
  }

  const sortedProspects = [...session.prospects].sort((left, right) => {
    if (right.scoutingGrade !== left.scoutingGrade) {
      return right.scoutingGrade - left.scoutingGrade;
    }
    return `${left.player.lastName}${left.player.firstName}`.localeCompare(
      `${right.player.lastName}${right.player.firstName}`,
    );
  });
  const availableProspects = sortedProspects.map((prospect) => ({
    id: prospect.player.id,
    playerId: prospect.player.id,
    name: `${prospect.player.firstName} ${prospect.player.lastName}`,
    firstName: prospect.player.firstName,
    lastName: prospect.player.lastName,
    position: prospect.player.position,
    scoutingGrade: prospect.scoutingGrade,
    age: prospect.player.age,
    origin: originLabel(prospect.collegeOrHS),
  }));

  const currentSlot = session.status === 'complete' ? null : getCurrentDraftSlot(session);
  const totalPicks = session.completedPicks.length + session.prospects.length;
  const currentTeam = currentSlot ? getTeamById(currentSlot.teamId) : null;
  const userPicks = session.completedPicks.filter((pick) => pick.teamId === s.userTeamId);

  return {
    status: session.status,
    availableProspects,
    completedPicks: session.completedPicks,
    currentPick: currentSlot ? {
      round: currentSlot.round,
      pickNumber: currentSlot.pickNumber,
      pickInRound: currentSlot.pickInRound,
      totalPicks,
      teamId: currentSlot.teamId,
      teamName: currentTeam ? `${currentTeam.city} ${currentTeam.name}` : currentSlot.teamId.toUpperCase(),
      teamAbbreviation: currentTeam?.abbreviation ?? currentSlot.teamId.toUpperCase(),
      userOnClock: currentSlot.teamId === s.userTeamId,
    } : null,
    board: buildDraftBoard(s, session),
    counts: {
      totalRounds: DRAFT_ROUNDS,
      totalPicks,
      picksMade: session.completedPicks.length,
      picksRemaining: session.prospects.length,
    },
    userDraftClass: userPicks.length > 0 ? {
      picks: userPicks.map((pick) => ({
        playerId: pick.playerId,
        playerName: pick.playerName,
        position: pick.position,
        scoutingGrade: pick.scoutingGrade,
        origin: pick.origin,
        assessment: assessmentForDraftPick(pick, totalPicks),
      })),
      overallGrade: overallDraftGrade(userPicks, totalPicks),
      averageScoutingGrade: Number(
        (userPicks.reduce((sum, pick) => sum + pick.scoutingGrade, 0) / userPicks.length).toFixed(1),
      ),
    } : null,
  };
}

export function startDraftSession(s: FullGameState, draftClass?: DraftClass): DraftActionResult {
  if (draftClass) {
    s.draftClass = createDraftSessionState(draftClass, s.seasonState);
  }

  const session = ensureDraftSession(s);
  if (!session) {
    return { success: false, draft: null, newPicks: [], error: 'Draft class unavailable' };
  }

  if (session.status === 'complete') {
    return { success: true, draft: buildDraftRoomView(s), newPicks: [] };
  }

  session.status = 'in_progress';
  const newPicks = advanceDraftToUserTurn(s);
  session.status = getDraftStatus(session);
  return {
    success: true,
    draft: buildDraftRoomView(s),
    newPicks,
  };
}

export function makeUserDraftSelection(s: FullGameState, prospectId: string): DraftActionResult {
  const session = ensureDraftSession(s);
  const currentSlot = session ? getCurrentDraftSlot(session) : null;
  if (!session || !currentSlot) {
    return { success: false, draft: buildDraftRoomView(s), newPicks: [], error: 'Draft is not active' };
  }
  if (currentSlot.teamId !== s.userTeamId) {
    return { success: false, draft: buildDraftRoomView(s), newPicks: [], error: 'You are not on the clock' };
  }

  const prospect = session.prospects.find((candidate) => candidate.player.id === prospectId);
  if (!prospect) {
    return { success: false, draft: buildDraftRoomView(s), newPicks: [], error: 'Prospect not available' };
  }

  const newPicks = [recordDraftPickForState(s, session, currentSlot, prospect), ...advanceDraftToUserTurn(s)];
  session.status = getDraftStatus(session);
  return {
    success: true,
    draft: buildDraftRoomView(s),
    newPicks,
  };
}

export function simulateRemainingDraftSession(s: FullGameState): DraftActionResult {
  const session = ensureDraftSession(s);
  if (!session) {
    return { success: false, draft: null, newPicks: [], error: 'Draft class unavailable' };
  }

  session.status = 'in_progress';
  const newPicks: DraftRoomPick[] = [];
  let currentSlot = getCurrentDraftSlot(session);

  while (currentSlot && session.prospects.length > 0) {
    const teamRoster = s.players.filter((player) => player.teamId === currentSlot?.teamId);
    const selection = aiSelectPick(s.rng.fork(), currentSlot.teamId, session.prospects, teamRoster);
    newPicks.push(recordDraftPickForState(s, session, currentSlot, selection));
    currentSlot = getCurrentDraftSlot(session);
  }

  session.status = getDraftStatus(session);
  return {
    success: true,
    draft: buildDraftRoomView(s),
    newPicks,
  };
}

function normalizeDraftPickResult(entry: Partial<DraftPickResult> & { playerName?: string }): DraftPickResult {
  return {
    round: entry.round ?? 1,
    pickNumber: entry.pickNumber ?? 1,
    teamId: entry.teamId ?? '',
    playerId: entry.playerId ?? '',
    playerName: entry.playerName ?? 'Unknown Prospect',
    position: entry.position ?? 'UNK',
    scoutingGrade: entry.scoutingGrade ?? 0,
    origin: entry.origin ?? 'Unknown',
  };
}

function normalizeRetirementResult(
  entry: RetirementResult | string,
  players: GeneratedPlayer[],
  serviceTime: Map<string, number>,
): RetirementResult {
  if (typeof entry !== 'string') {
    return {
      playerId: entry.playerId,
      teamId: entry.teamId,
      playerName: entry.playerName,
      seasonsPlayed: entry.seasonsPlayed,
      summary: entry.summary,
    };
  }

  const player = players.find((candidate) => candidate.id === entry);
  const seasonsPlayed = serviceTime.get(entry) ?? 0;
  const name = playerLabel(player);
  return {
    playerId: entry,
    teamId: player?.teamId ?? '',
    playerName: name,
    seasonsPlayed,
    summary: `${name} retired after ${seasonsPlayed} seasons.`,
  };
}

export function normalizeOffseasonState(
  offseasonState: OffseasonState | null,
  players: GeneratedPlayer[],
  serviceTime: Map<string, number>,
): OffseasonState | null {
  if (!offseasonState) return null;

  const phaseResults = offseasonState.phaseResults as Partial<OffseasonState['phaseResults']> & {
    draftPicks?: Array<Partial<DraftPickResult>>;
    retiredPlayers?: Array<RetirementResult | string>;
  };

  return {
    ...offseasonState,
    phaseResults: {
      arbitrationResolved: phaseResults.arbitrationResolved ?? [],
      tenderedPlayers: phaseResults.tenderedPlayers ?? [],
      nonTenderedPlayers: phaseResults.nonTenderedPlayers ?? [],
      freeAgentSignings: phaseResults.freeAgentSignings ?? [],
      draftPicks: (phaseResults.draftPicks ?? []).map((entry) => normalizeDraftPickResult(entry)),
      retiredPlayers: (phaseResults.retiredPlayers ?? []).map((entry) =>
        normalizeRetirementResult(entry, players, serviceTime)),
    },
  };
}

export function buildOffseasonStateView(s: FullGameState): OffseasonStateView | null {
  const offseasonState = normalizeOffseasonState(s.offseasonState, s.players, s.serviceTime);
  if (!offseasonState) return null;

  const rowsByPhase = new Map<string, OffseasonTransactionRow[]>();
  const pushRow = (phase: string, row: OffseasonTransactionRow) => {
    const existing = rowsByPhase.get(phase) ?? [];
    existing.push(row);
    rowsByPhase.set(phase, existing);
  };

  for (const result of offseasonState.phaseResults.arbitrationResolved) {
    const player = s.players.find((candidate) => candidate.id === result.playerId);
    const summary = result.teamWon
      ? `${playerLabel(player)} signed for ${formatMoneyPerYear(result.newSalary)} ${formatYears(1)}`
      : `${playerLabel(player)} lost arbitration case`;
    pushRow('arbitration', {
      id: `arb-${result.playerId}`,
      phase: 'arbitration',
      tone: transactionToneForTeam(s, result.teamId),
      summary,
    });
  }

  for (const playerId of offseasonState.phaseResults.tenderedPlayers) {
    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) continue;
    pushRow('tender_nontender', {
      id: `tender-${playerId}`,
      phase: 'tender_nontender',
      tone: transactionToneForTeam(s, player.teamId),
      summary: `${teamLabel(player.teamId)} tendered ${playerLabel(player)}`,
    });
  }

  for (const playerId of offseasonState.phaseResults.nonTenderedPlayers) {
    const player = s.players.find((candidate) => candidate.id === playerId);
    const teamId = player?.teamId ?? '';
    pushRow('tender_nontender', {
      id: `nontender-${playerId}`,
      phase: 'tender_nontender',
      tone: transactionToneForTeam(s, teamId),
      summary: `${teamLabel(teamId)} non-tendered ${playerLabel(player)} (now free agent)`,
    });
  }

  for (const signing of offseasonState.phaseResults.freeAgentSignings) {
    const player = s.players.find((candidate) => candidate.id === signing.playerId);
    pushRow('free_agency', {
      id: `fa-${signing.playerId}-${signing.teamId}`,
      phase: 'free_agency',
      tone: transactionToneForTeam(s, signing.teamId),
      summary: `${playerLabel(player)} signed with ${teamLabel(signing.teamId)} for ${formatMoneyPerYear(signing.annualSalary)} ${formatYears(signing.years)}`,
    });
  }

  for (const pick of offseasonState.phaseResults.draftPicks) {
    pushRow('draft', {
      id: `draft-${pick.pickNumber}`,
      phase: 'draft',
      tone: transactionToneForTeam(s, pick.teamId),
      summary: `Round ${pick.round}, Pick ${pick.pickNumber}: ${teamLabel(pick.teamId)} selected ${pick.playerName} (${pick.position}, ${pick.origin})`,
    });
  }

  for (const retirement of offseasonState.phaseResults.retiredPlayers) {
    pushRow('spring_training', {
      id: `retire-${retirement.playerId}`,
      phase: 'spring_training',
      tone: transactionToneForTeam(s, retirement.teamId),
      summary: retirement.summary,
    });
  }

  const transactionGroups = [
    'arbitration',
    'tender_nontender',
    'free_agency',
    'draft',
    'spring_training',
  ]
    .map((phase) => ({
      phase,
      label: phaseLabel(phase),
      rows: rowsByPhase.get(phase) ?? [],
    }))
    .filter((group) => group.rows.length > 0);

  return {
    ...offseasonState,
    transactionGroups,
  };
}

function roundLabel(round: string): string {
  switch (round) {
    case 'WILD_CARD':
      return 'Wild Card';
    case 'DIVISION_SERIES':
      return 'Division Series';
    case 'CHAMPIONSHIP_SERIES':
      return 'Championship Series';
    case 'WORLD_SERIES':
      return 'World Series';
    default:
      return round;
  }
}

function previewTeamView(
  slot: CorePlayoffPreviewSeries['home'],
): SeasonFlowPreviewTeam {
  if (slot.teamId) {
    const team = getTeamById(slot.teamId);
    return {
      teamId: slot.teamId,
      teamName: team ? `${team.city} ${team.name}` : slot.teamId.toUpperCase(),
      abbreviation: team?.abbreviation ?? slot.teamId.toUpperCase(),
      seed: slot.seed,
      placeholder: null,
    };
  }

  return {
    teamId: null,
    teamName: slot.placeholder ?? 'TBD',
    abbreviation: 'TBD',
    seed: null,
    placeholder: slot.placeholder,
  };
}

function buildStandingsSnapshot(s: FullGameState): SeasonFlowStanding[] {
  return Object.entries(s.seasonState.standings.getFullStandings())
    .flatMap(([division, entries]) =>
      entries.map((entry) => {
        const team = getTeamById(entry.teamId);
        return {
          teamId: entry.teamId,
          teamName: team ? `${team.city} ${team.name}` : entry.teamId.toUpperCase(),
          abbreviation: team?.abbreviation ?? entry.teamId.toUpperCase(),
          wins: entry.wins,
          losses: entry.losses,
          division,
        };
      }),
    )
    .sort((left, right) => {
      if (right.wins !== left.wins) return right.wins - left.wins;
      return left.losses - right.losses;
    });
}

function buildChampionSummary(s: FullGameState): SeasonFlowChampionSummary | null {
  if (!s.playoffBracket?.champion) return null;

  const championTeam = getTeamById(s.playoffBracket.champion);
  const worldSeries = s.playoffBracket.series.find((series) => series.round === 'WORLD_SERIES');
  const runnerUpTeam = worldSeries ? getTeamById(worldSeries.loserId) : null;

  return {
    championTeamId: s.playoffBracket.champion,
    championTeamName: championTeam ? `${championTeam.city} ${championTeam.name}` : s.playoffBracket.champion.toUpperCase(),
    runnerUpTeamName: runnerUpTeam
      ? `${runnerUpTeam.city} ${runnerUpTeam.name}`
      : (worldSeries?.loserId ? teamLabel(worldSeries.loserId) : 'Runner-up'),
    seriesRecord: worldSeries ? `${worldSeries.winnerWins}-${worldSeries.loserWins}` : '4-0',
  };
}

function buildOffseasonSummary(s: FullGameState): SeasonFlowOffseasonSummary | null {
  const offseasonView = buildOffseasonStateView(s);
  if (!offseasonView) return null;

  return {
    nextSeason: s.season + 1,
    moves: offseasonView.transactionGroups
      .flatMap((group) => group.rows.map((row) => row.summary))
      .slice(0, 4),
  };
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function buildSeasonFlowStateView(s: FullGameState): SeasonFlowStateView {
  const standingsSnapshot = buildStandingsSnapshot(s);
  const userRecord = standingsSnapshot.find((entry) => entry.teamId === s.userTeamId);
  const playoffPreview = s.playoffBracket
    ? buildPlayoffPreview(s.playoffBracket.seeds).map((series) => ({
      id: series.id,
      round: roundLabel(series.round),
      bestOf: series.bestOf,
      home: previewTeamView(series.home),
      away: previewTeamView(series.away),
    }))
    : [];

  if (s.phase === 'preseason') {
    return {
      status: 'preseason',
      season: s.season,
      phaseLabel: `Season ${s.season} — Spring Training`,
      detailLabel: 'Spring Training begins',
      progress: 0,
      canUseRegularSimControls: true,
      action: null,
      actionLabel: null,
      daysUntilTradeDeadline: null,
      standingsSnapshot,
      playoffPreview: [],
      championSummary: null,
      offseasonSummary: null,
    };
  }

  if (s.phase === 'regular') {
    return {
      status: 'regular',
      season: s.season,
      phaseLabel: `Season ${s.season} — Day ${s.day}/162`,
      detailLabel: 'Regular Season',
      progress: clampProgress(s.day / 162),
      canUseRegularSimControls: true,
      action: null,
      actionLabel: null,
      daysUntilTradeDeadline: Math.max(0, 120 - s.day),
      standingsSnapshot,
      playoffPreview: [],
      championSummary: null,
      offseasonSummary: null,
    };
  }

  if (s.phase === 'playoffs' && !s.playoffBracket) {
    return {
      status: 'regular_season_complete',
      season: s.season,
      phaseLabel: `Season ${s.season} — Regular Season Complete`,
      detailLabel: userRecord
        ? `${teamLabel(s.userTeamId)} finished ${userRecord.wins}-${userRecord.losses}`
        : 'The regular season has ended.',
      progress: 1,
      canUseRegularSimControls: false,
      action: 'proceed_to_playoffs',
      actionLabel: 'Proceed to Playoffs',
      daysUntilTradeDeadline: null,
      standingsSnapshot: standingsSnapshot.slice(0, 6),
      playoffPreview: [],
      championSummary: null,
      offseasonSummary: null,
    };
  }

  if (s.phase === 'playoffs' && s.playoffBracket && !s.playoffBracket.champion) {
    return {
      status: 'playoff_preview',
      season: s.season,
      phaseLabel: `Season ${s.season} — Playoff Bracket`,
      detailLabel: 'Bracket is set. Twelve teams remain.',
      progress: 0,
      canUseRegularSimControls: false,
      action: 'sim_playoffs',
      actionLabel: 'Sim Playoffs',
      daysUntilTradeDeadline: null,
      standingsSnapshot: standingsSnapshot.slice(0, 6),
      playoffPreview,
      championSummary: null,
      offseasonSummary: null,
    };
  }

  if (s.phase === 'playoffs') {
    const championSummary = buildChampionSummary(s);
    return {
      status: 'playoffs_complete',
      season: s.season,
      phaseLabel: `Season ${s.season} — World Series Final`,
      detailLabel: championSummary
        ? `${championSummary.championTeamName} defeated ${championSummary.runnerUpTeamName} ${championSummary.seriesRecord}`
        : 'The postseason has concluded.',
      progress: 1,
      canUseRegularSimControls: false,
      action: 'proceed_to_offseason',
      actionLabel: 'Proceed to Offseason',
      daysUntilTradeDeadline: null,
      standingsSnapshot: standingsSnapshot.slice(0, 6),
      playoffPreview,
      championSummary,
      offseasonSummary: null,
    };
  }

  if (s.offseasonState?.completed) {
    return {
      status: 'offseason_complete',
      season: s.season,
      phaseLabel: `Welcome to Season ${s.season + 1}`,
      detailLabel: 'Spring Training begins',
      progress: 1,
      canUseRegularSimControls: false,
      action: 'start_next_season',
      actionLabel: `Start Season ${s.season + 1}`,
      daysUntilTradeDeadline: null,
      standingsSnapshot,
      playoffPreview: [],
      championSummary: null,
      offseasonSummary: buildOffseasonSummary(s),
    };
  }

  const offseasonView = buildOffseasonStateView(s);
  const offseasonLength = getOffseasonLength();
  const offseasonDay = offseasonView?.totalDay ?? 1;
  const offseasonPhase = offseasonView?.currentPhase ?? 'season_review';

  return {
    status: 'offseason',
    season: s.season,
    phaseLabel: `Season ${s.season} — Offseason: ${phaseLabel(offseasonPhase)}`,
    detailLabel: `Day ${Math.min(offseasonDay, offseasonLength)}/${offseasonLength}`,
    progress: clampProgress(offseasonDay / offseasonLength),
    canUseRegularSimControls: false,
    action: null,
    actionLabel: null,
    daysUntilTradeDeadline: null,
    standingsSnapshot,
    playoffPreview: [],
    championSummary: null,
    offseasonSummary: null,
  };
}

export function toPlayerDTO(player: GeneratedPlayer, stats?: PlayerGameStats): PlayerDTO {
  const seasonStats = stats ?? (state ? state.seasonState.playerSeasonStats.get(player.id) : undefined);
  let statBlock: PlayerDTO['stats'] = null;
  if (seasonStats && (seasonStats.pa > 0 || seasonStats.strikeouts > 0)) {
    const avg = seasonStats.ab > 0
      ? (seasonStats.hits / seasonStats.ab).toFixed(3).replace(/^0/, '')
      : '.000';
    const era = seasonStats.ip > 0
      ? ((seasonStats.earnedRuns / (seasonStats.ip / 3)) * 9).toFixed(2)
      : '0.00';
    statBlock = {
      pa: seasonStats.pa, ab: seasonStats.ab, hits: seasonStats.hits,
      hr: seasonStats.hr, rbi: seasonStats.rbi, bb: seasonStats.bb,
      k: seasonStats.k, avg,
      ip: seasonStats.ip, earnedRuns: seasonStats.earnedRuns,
      strikeouts: seasonStats.strikeouts, walks: seasonStats.walks, era,
    };
  }
  return {
    id: player.id, firstName: player.firstName, lastName: player.lastName,
    age: player.age, position: player.position,
    overallRating: player.overallRating,
    displayRating: toDisplayRating(player.overallRating),
    letterGrade: toLetterGrade(player.overallRating),
    rosterStatus: player.rosterStatus, teamId: player.teamId,
    stats: statBlock,
  };
}

/** Post-day injury processing and news generation. */
export function processDayInjuriesAndNews(s: FullGameState): void {
  // Advance existing injuries by 1 day
  for (const [pid, injury] of s.injuries) {
    const advanced = advanceInjury(injury);
    if (advanced) {
      s.injuries.set(pid, advanced);
    } else {
      s.injuries.delete(pid);
    }
  }

  // Check new injuries on MLB players
  const mlbPlayers = s.players.filter(p => p.rosterStatus === 'MLB');
  const newInjuries = processInjuries(s.rng.fork(), mlbPlayers, s.injuries);
  for (const [pid, injury] of newInjuries) {
    if (!s.injuries.has(pid)) {
      s.injuries.set(pid, injury);
      const player = s.players.find(p => p.id === pid);
      if (player) {
        const currentMorale = s.playerMorale.get(pid);
        if (currentMorale) {
          s.playerMorale.set(pid, applyMoraleEvent(player, currentMorale, {
            type: 'injury',
            impact: -14,
            summary: describeInjury(injury),
            timestamp: timestamp(),
          }));
        }
        const newsItems = generateNews(s.rng.fork(), {
          type: 'injury', season: s.season, day: s.day, data: {
            playerId: pid, playerName: `${player.firstName} ${player.lastName}`,
            teamId: player.teamId, description: describeInjury(injury),
          },
        }, s.players, s.season, s.day);
        s.news.push(...newsItems);
      }
    }
  }

  // Check milestones
  const milestones = checkMilestones(s.seasonState.playerSeasonStats, s.players, s.season, s.day);
  for (const m of milestones) {
    const mNews = generateNews(s.rng.fork(), {
      type: 'milestone', season: s.season, day: s.day,
      data: m as unknown as Record<string, unknown>,
    }, s.players, s.season, s.day);
    s.news.push(...mNews);
  }

  s.news = deduplicateNews(s.news);
}

function ensureOffseasonState(s: FullGameState) {
  if (!s.offseasonState) {
    s.offseasonState = createOffseasonState(s.season);
  }
}

function updateOffseasonClock(s: FullGameState) {
  if (s.offseasonState) {
    s.day = s.offseasonState.totalDay;
  }
}

function applyArbitrationResultsOnce(s: FullGameState) {
  if (!s.offseasonState) return;

  const resolvedIds = new Set(
    s.offseasonState.phaseResults.arbitrationResolved.map((entry) => entry.playerId),
  );

  for (const teamId of TEAMS.map((team) => team.id)) {
    const eligiblePlayers = getArbEligiblePlayers(s.players, teamId, s.serviceTime)
      .filter((player) => player.rosterStatus === 'MLB');

    for (const player of eligiblePlayers) {
      if (resolvedIds.has(player.id)) continue;

      const yearsOfService = s.serviceTime.get(player.id) ?? 0;
      const arbitrationRng = s.rng.fork();
      const arbitrationCase = generateArbitrationCase(
        arbitrationRng,
        player,
        yearsOfService,
        player.contract.annualSalary,
      );
      const awardedSalary = resolveArbitration(arbitrationRng, arbitrationCase);

      player.contract.annualSalary = awardedSalary;
      player.contract.years = Math.max(1, player.contract.years);
      s.offseasonState = recordArbitration(s.offseasonState, {
        playerId: player.id,
        teamId,
        previousSalary: arbitrationCase.currentSalary,
        newSalary: awardedSalary,
        teamWon: awardedSalary === arbitrationCase.teamOffer,
      });
      resolvedIds.add(player.id);
    }
  }
}

function applyTenderDecisionsOnce(s: FullGameState) {
  if (!s.offseasonState) return;

  const existingTendered = new Set(s.offseasonState.phaseResults.tenderedPlayers);
  const existingNonTendered = new Set(s.offseasonState.phaseResults.nonTenderedPlayers);
  const affectedTeams = new Set<string>();

  for (const teamId of TEAMS.map((team) => team.id)) {
    if (teamId === s.userTeamId) continue;

    const arbEligiblePlayers = getArbEligiblePlayers(s.players, teamId, s.serviceTime)
      .filter((player) => player.rosterStatus === 'MLB');
    if (arbEligiblePlayers.length === 0) continue;

    const eligibleIds = new Set(arbEligiblePlayers.map((player) => player.id));
    const decisions = autoResolveTenderNonTender(s.rng.fork(), teamId, s.players, s.serviceTime);
    const tendered = decisions.tendered
      .filter((playerId) => eligibleIds.has(playerId) && !existingTendered.has(playerId) && !existingNonTendered.has(playerId));
    const nonTendered = decisions.nonTendered
      .filter((playerId) => eligibleIds.has(playerId) && !existingTendered.has(playerId) && !existingNonTendered.has(playerId));

    if (tendered.length === 0 && nonTendered.length === 0) continue;

    s.offseasonState = recordTenderDecisions(s.offseasonState, tendered, nonTendered);
    for (const playerId of tendered) existingTendered.add(playerId);
    for (const playerId of nonTendered) existingNonTendered.add(playerId);

    for (const playerId of nonTendered) {
      const player = s.players.find((candidate) => candidate.id === playerId);
      if (!player) continue;
      const previousTeamId = player.teamId;
      player.teamId = '';
      player.rosterStatus = 'INTERNATIONAL';
      player.contract = {
        ...player.contract,
        years: 0,
      };
      affectedTeams.add(previousTeamId);
    }
  }

  for (const teamId of affectedTeams) {
    s.rosterStates.set(teamId, buildRosterState(teamId, s.players));
  }
}

function ensureFreeAgencyMarket(s: FullGameState) {
  if (!s.freeAgencyMarket) {
    s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
  }
}

function buildFreeAgencyPayrolls(s: FullGameState) {
  const freeAgentIds = new Set(s.freeAgencyMarket?.freeAgents.map((freeAgent) => freeAgent.player.id) ?? []);
  return new Map(
    TEAMS
      .filter((team) => team.id !== s.userTeamId)
      .map((team) => {
        const teamPlayers = s.players.filter(
          (player) => player.teamId === team.id && !freeAgentIds.has(player.id),
        );
        return [team.id, calculateTeamPayroll(team.id, teamPlayers).totalPayroll] as const;
      }),
  );
}

function buildFreeAgencyNeeds(s: FullGameState) {
  const freeAgentIds = new Set(s.freeAgencyMarket?.freeAgents.map((freeAgent) => freeAgent.player.id) ?? []);
  return new Map(
    TEAMS
      .filter((team) => team.id !== s.userTeamId)
      .map((team) => {
        const teamRoster = s.players.filter(
          (player) => player.teamId === team.id && player.rosterStatus === 'MLB' && !freeAgentIds.has(player.id),
        );
        return [team.id, evaluateTeamNeeds(teamRoster)] as const;
      }),
  );
}

function applyNewFreeAgencySignings(
  s: FullGameState,
  previousSignedIds: Set<string>,
): OffseasonProgressResult['aiSignings'] {
  if (!s.freeAgencyMarket || !s.offseasonState) return [];

  const progress: OffseasonProgressResult['aiSignings'] = [];
  const currentSigningIds = new Set(s.offseasonState.phaseResults.freeAgentSignings.map((entry) => entry.playerId));

  for (const signedPlayer of s.freeAgencyMarket.signedPlayers) {
    const contract = signedPlayer.contract;
    const teamId = signedPlayer.signedWith;
    if (!contract || !teamId || previousSignedIds.has(signedPlayer.player.id) || currentSigningIds.has(signedPlayer.player.id)) {
      continue;
    }

    const player = s.players.find((candidate) => candidate.id === signedPlayer.player.id);
    if (!player) continue;

    const previousTeamId = player.teamId;
    player.teamId = teamId;
    player.rosterStatus = 'MLB';
    player.contract = {
      years: contract.years,
      annualSalary: contract.annualSalary,
      noTradeClause: contract.noTradeClause,
      playerOption: contract.playerOption,
      teamOption: contract.teamOption,
    };

    if (previousTeamId) {
      s.rosterStates.set(previousTeamId, buildRosterState(previousTeamId, s.players));
    }
    s.rosterStates.set(teamId, buildRosterState(teamId, s.players));

    const signingResult: FASigningResult = {
      playerId: player.id,
      teamId,
      years: contract.years,
      annualSalary: contract.annualSalary,
      totalValue: contract.totalValue,
    };
    s.offseasonState = recordFASigning(s.offseasonState, signingResult);
    currentSigningIds.add(player.id);
    progress.push({
      playerId: player.id,
      teamId,
      years: contract.years,
      annualSalary: contract.annualSalary,
      marketValue: signedPlayer.marketValue,
    });
  }

  return progress;
}

function simulateFreeAgencyDays(
  s: FullGameState,
  daysToSimulate: number,
): OffseasonProgressResult['aiSignings'] {
  ensureFreeAgencyMarket(s);
  const aiSignings: OffseasonProgressResult['aiSignings'] = [];

  for (let day = 0; day < daysToSimulate; day++) {
    if (!s.freeAgencyMarket) break;
    const previousSignedIds = new Set(s.freeAgencyMarket.signedPlayers.map((entry) => entry.player.id));
    const teamBudgets = new Map(
      TEAMS
        .filter((team) => team.id !== s.userTeamId)
        .map((team) => [team.id, getTeamBudget(team.id)] as const),
    );
    const teamPayrolls = buildFreeAgencyPayrolls(s);
    const teamNeeds = buildFreeAgencyNeeds(s);
    s.freeAgencyMarket = simulateFADay(
      s.rng.fork(),
      s.freeAgencyMarket,
      teamBudgets,
      teamPayrolls,
      teamNeeds,
    );
    aiSignings.push(...applyNewFreeAgencySignings(s, previousSignedIds));
  }

  return aiSignings;
}

function processCurrentOffseasonPhase(
  s: FullGameState,
  previousPhase: OffseasonState['currentPhase'] | null,
  previousPhaseDay: number | null,
): OffseasonProgressResult {
  if (!s.offseasonState) return { aiSignings: [] };

  const currentPhase = s.offseasonState.currentPhase;
  const enteredPhase = previousPhase !== currentPhase;

  if (currentPhase === 'tender_nontender' && enteredPhase) {
    applyArbitrationResultsOnce(s);
    applyTenderDecisionsOnce(s);
    return { aiSignings: [] };
  }

  if (currentPhase === 'free_agency') {
    const advancedWithinPhase = previousPhase === currentPhase && previousPhaseDay !== s.offseasonState.phaseDay;
    if (enteredPhase || advancedWithinPhase) {
      return {
        aiSignings: simulateFreeAgencyDays(s, 1),
      };
    }
  }

  return { aiSignings: [] };
}

function finalizeFreeAgencyIfNeeded(
  s: FullGameState,
  previousPhase: OffseasonState['currentPhase'],
  nextPhase: OffseasonState['currentPhase'] | null,
): OffseasonProgressResult['aiSignings'] {
  if (previousPhase !== 'free_agency' || nextPhase === 'free_agency') {
    return [];
  }

  ensureFreeAgencyMarket(s);
  const remainingDays = s.freeAgencyMarket ? Math.max(0, 60 - s.freeAgencyMarket.day) : 0;
  return simulateFreeAgencyDays(s, remainingDays);
}

function finalizeDraftIfNeeded(
  s: FullGameState,
  previousPhase: OffseasonState['currentPhase'],
  nextPhase: OffseasonState['currentPhase'] | null,
) {
  if (previousPhase !== 'draft' || nextPhase === 'draft') {
    return;
  }

  if (!s.draftClass) {
    s.draftClass = createDraftSessionState(generateDraftClass(s.rng.fork(), s.season), s.seasonState);
  }

  const session = ensureDraftSession(s);
  if (!session || session.status === 'complete') {
    return;
  }

  simulateRemainingDraftSession(s);
}

function applyOffseasonTransition(
  s: FullGameState,
  previousState: OffseasonState,
  nextState: OffseasonState,
): OffseasonProgressResult {
  const aiSignings = finalizeFreeAgencyIfNeeded(s, previousState.currentPhase, nextState.currentPhase);
  finalizeDraftIfNeeded(s, previousState.currentPhase, nextState.currentPhase);
  s.offseasonState = {
    ...nextState,
    phaseResults: s.offseasonState?.phaseResults ?? previousState.phaseResults,
  };
  updateOffseasonClock(s);
  const currentProgress = processCurrentOffseasonPhase(s, previousState.currentPhase, previousState.phaseDay);
  return {
    aiSignings: [...aiSignings, ...currentProgress.aiSignings],
  };
}

/** Handle one offseason day with AI auto-resolution. */
export function advanceOffseasonOnce(s: FullGameState): OffseasonProgressResult {
  ensureOffseasonState(s);
  if (!s.offseasonState || s.offseasonState.completed) return { aiSignings: [] };

  const previousState = s.offseasonState;
  const nextState = advanceOffseasonDay(previousState);
  return applyOffseasonTransition(s, previousState, nextState);
}

export function skipOffseasonPhaseWithAI(s: FullGameState): OffseasonProgressResult {
  ensureOffseasonState(s);
  if (!s.offseasonState || s.offseasonState.completed) return { aiSignings: [] };

  const previousState = s.offseasonState;
  const nextState = skipCurrentPhase(previousState);
  return applyOffseasonTransition(s, previousState, nextState);
}
