import type { PlayerSeasonStats, Player } from '../types/player';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FranchiseRecord {
  category: string;
  value: number;
  displayValue: string;
  playerName: string;
  playerId: number;
  season?: number;
  isPitcher: boolean;
}

export interface FranchiseRecordBook {
  singleSeasonHitting: FranchiseRecord[];
  singleSeasonPitching: FranchiseRecord[];
  careerHitting: FranchiseRecord[];
  careerPitching: FranchiseRecord[];
  teamRecords: Array<{
    category: string;
    value: string;
    season: number;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPitcherPosition(position: string): boolean {
  return position === 'SP' || position === 'RP' || position === 'CP';
}

function getPlayerName(
  playerId: number,
  playerMap: Map<number, Player>,
  _seasonStats?: PlayerSeasonStats,
): string {
  const player = playerMap.get(playerId);
  if (player) return player.name;
  return 'Unknown';
}

function isPlayerPitcher(
  playerId: number,
  playerMap: Map<number, Player>,
): boolean {
  const player = playerMap.get(playerId);
  if (player) return player.isPitcher || isPitcherPosition(player.position);
  return false;
}

function formatValue(value: number, category: string): string {
  const rateStats = ['AVG', 'OPS'];
  const precisionTwoStats = ['ERA', 'WHIP'];

  if (rateStats.includes(category)) {
    return value.toFixed(3);
  }
  if (precisionTwoStats.includes(category)) {
    return value.toFixed(2);
  }
  return String(Math.round(value));
}

/** For "lower is better" categories (ERA, WHIP), a lower value beats the existing record. */
function isLowerBetter(category: string): boolean {
  return category === 'ERA' || category === 'WHIP';
}

function beats(newValue: number, existingValue: number, category: string): boolean {
  if (isLowerBetter(category)) {
    return newValue < existingValue;
  }
  return newValue > existingValue;
}

function findExisting(records: FranchiseRecord[], category: string): FranchiseRecord | undefined {
  return records.find((r) => r.category === category);
}

function upsertRecord(
  records: FranchiseRecord[],
  record: FranchiseRecord,
): void {
  const idx = records.findIndex((r) => r.category === record.category);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
}

// ─── Stat Computation ────────────────────────────────────────────────────────

function computeAVG(stats: { h: number; ab: number }): number {
  return stats.ab > 0 ? stats.h / stats.ab : 0;
}

function computeOPS(stats: PlayerSeasonStats): number {
  const { h, bb, hbp, pa, doubles, triples, hr, ab } = stats;
  const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
  const singles = h - doubles - triples - hr;
  const totalBases = singles + doubles * 2 + triples * 3 + hr * 4;
  const slg = ab > 0 ? totalBases / ab : 0;
  return obp + slg;
}

function computeERA(er: number, outs: number): number {
  return outs > 0 ? (er / outs) * 27 : Infinity;
}

function computeWHIP(ha: number, bba: number, outs: number): number {
  const innings = outs / 3;
  return innings > 0 ? (ha + bba) / innings : Infinity;
}

// ─── Single-Season Candidate Generators ──────────────────────────────────────

interface StatCandidate {
  category: string;
  value: number;
  playerName: string;
  playerId: number;
  season: number;
  isPitcher: boolean;
}

function generateHittingCandidates(
  stats: PlayerSeasonStats,
  playerName: string,
  isPitcher: boolean,
  season: number,
): StatCandidate[] {
  if (stats.pa < 200) return [];

  return [
    { category: 'HR', value: stats.hr, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'AVG', value: computeAVG(stats), playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'OPS', value: computeOPS(stats), playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'RBI', value: stats.rbi, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'H', value: stats.h, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'SB', value: stats.sb, playerName, playerId: stats.playerId, season, isPitcher },
  ];
}

function generatePitchingCandidates(
  stats: PlayerSeasonStats,
  playerName: string,
  isPitcher: boolean,
  season: number,
): StatCandidate[] {
  if (stats.outs < 100) return [];

  return [
    { category: 'W', value: stats.w, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'ERA', value: computeERA(stats.er, stats.outs), playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'K', value: stats.ka, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'SV', value: stats.sv, playerName, playerId: stats.playerId, season, isPitcher },
    { category: 'WHIP', value: computeWHIP(stats.ha, stats.bba, stats.outs), playerName, playerId: stats.playerId, season, isPitcher },
  ];
}

// ─── Career Aggregation ──────────────────────────────────────────────────────

interface AggregatedStats {
  h: number;
  ab: number;
  hr: number;
  rbi: number;
  // Pitching
  w: number;
  ka: number;
  sv: number;
  er: number;
  outs: number;
  ha: number;
  bba: number;
  pa: number;
}

function aggregateCareer(seasons: PlayerSeasonStats[]): AggregatedStats {
  const agg: AggregatedStats = {
    h: 0, ab: 0, hr: 0, rbi: 0,
    w: 0, ka: 0, sv: 0, er: 0, outs: 0, ha: 0, bba: 0, pa: 0,
  };

  for (const s of seasons) {
    agg.h += s.h;
    agg.ab += s.ab;
    agg.hr += s.hr;
    agg.rbi += s.rbi;
    agg.w += s.w;
    agg.ka += s.ka;
    agg.sv += s.sv;
    agg.er += s.er;
    agg.outs += s.outs;
    agg.ha += s.ha;
    agg.bba += s.bba;
    agg.pa += s.pa;
  }

  return agg;
}

function generateCareerHittingCandidates(
  agg: AggregatedStats,
  playerName: string,
  playerId: number,
  isPitcher: boolean,
): StatCandidate[] {
  return [
    { category: 'HR', value: agg.hr, playerName, playerId, season: 0, isPitcher },
    { category: 'H', value: agg.h, playerName, playerId, season: 0, isPitcher },
    { category: 'RBI', value: agg.rbi, playerName, playerId, season: 0, isPitcher },
    { category: 'AVG', value: computeAVG(agg), playerName, playerId, season: 0, isPitcher },
  ];
}

function generateCareerPitchingCandidates(
  agg: AggregatedStats,
  playerName: string,
  playerId: number,
  isPitcher: boolean,
): StatCandidate[] {
  return [
    { category: 'W', value: agg.w, playerName, playerId, season: 0, isPitcher },
    { category: 'K', value: agg.ka, playerName, playerId, season: 0, isPitcher },
    { category: 'ERA', value: computeERA(agg.er, agg.outs), playerName, playerId, season: 0, isPitcher },
    { category: 'SV', value: agg.sv, playerName, playerId, season: 0, isPitcher },
  ];
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function emptyRecordBook(): FranchiseRecordBook {
  return {
    singleSeasonHitting: [],
    singleSeasonPitching: [],
    careerHitting: [],
    careerPitching: [],
    teamRecords: [],
  };
}

export function updateFranchiseRecords(
  existing: FranchiseRecordBook,
  seasonStats: Map<number, PlayerSeasonStats>,
  careerHistory: Map<number, PlayerSeasonStats[]>,
  playerMap: Map<number, Player>,
  teamRecord: { wins: number; losses: number },
  season: number,
  userTeamId: number,
): { records: FranchiseRecordBook; newRecords: FranchiseRecord[] } {
  // Deep-clone existing record book so we don't mutate the input
  const records: FranchiseRecordBook = {
    singleSeasonHitting: [...existing.singleSeasonHitting.map((r) => ({ ...r }))],
    singleSeasonPitching: [...existing.singleSeasonPitching.map((r) => ({ ...r }))],
    careerHitting: [...existing.careerHitting.map((r) => ({ ...r }))],
    careerPitching: [...existing.careerPitching.map((r) => ({ ...r }))],
    teamRecords: [...existing.teamRecords.map((r) => ({ ...r }))],
  };

  const newRecords: FranchiseRecord[] = [];

  // Helper to check a candidate against a record array
  function checkCandidate(
    candidates: StatCandidate[],
    recordArray: FranchiseRecord[],
    isSeason: boolean,
  ): void {
    for (const candidate of candidates) {
      if (!isFinite(candidate.value)) continue;

      const existingRecord = findExisting(recordArray, candidate.category);

      const isNew =
        !existingRecord || beats(candidate.value, existingRecord.value, candidate.category);

      if (isNew) {
        const record: FranchiseRecord = {
          category: candidate.category,
          value: candidate.value,
          displayValue: formatValue(candidate.value, candidate.category),
          playerName: candidate.playerName,
          playerId: candidate.playerId,
          isPitcher: candidate.isPitcher,
          ...(isSeason ? { season: candidate.season } : {}),
        };
        upsertRecord(recordArray, record);
        newRecords.push(record);
      }
    }
  }

  // ── Single-season records ──────────────────────────────────────────────────

  for (const [playerId, stats] of seasonStats) {
    // Only track records for the user's team
    if (stats.teamId !== userTeamId) continue;

    const playerName = getPlayerName(playerId, playerMap, stats);
    const pitcher = isPlayerPitcher(playerId, playerMap);

    // Hitting records (non-pitchers, or anyone with enough PA)
    const hittingCandidates = generateHittingCandidates(stats, playerName, pitcher, season);
    checkCandidate(hittingCandidates, records.singleSeasonHitting, true);

    // Pitching records (only pitchers)
    if (pitcher) {
      const pitchingCandidates = generatePitchingCandidates(stats, playerName, pitcher, season);
      checkCandidate(pitchingCandidates, records.singleSeasonPitching, true);
    }
  }

  // ── Career records ─────────────────────────────────────────────────────────

  for (const [playerId, seasons] of careerHistory) {
    // Filter to only seasons on the user's team
    const teamSeasons = seasons.filter((s) => s.teamId === userTeamId);
    if (teamSeasons.length === 0) continue;

    const playerName = getPlayerName(playerId, playerMap);
    const pitcher = isPlayerPitcher(playerId, playerMap);
    const agg = aggregateCareer(teamSeasons);

    // Career hitting
    const careerHittingCandidates = generateCareerHittingCandidates(
      agg, playerName, playerId, pitcher,
    );
    checkCandidate(careerHittingCandidates, records.careerHitting, false);

    // Career pitching (only pitchers)
    if (pitcher) {
      const careerPitchingCandidates = generateCareerPitchingCandidates(
        agg, playerName, playerId, pitcher,
      );
      checkCandidate(careerPitchingCandidates, records.careerPitching, false);
    }
  }

  // ── Team records ───────────────────────────────────────────────────────────

  const bestIdx = records.teamRecords.findIndex((r) => r.category === 'Best Record');
  const worstIdx = records.teamRecords.findIndex((r) => r.category === 'Worst Record');

  const currentWins = teamRecord.wins;
  const currentValue = `${teamRecord.wins}-${teamRecord.losses}`;

  // Best Record
  if (bestIdx >= 0) {
    const existingWins = parseRecordWins(records.teamRecords[bestIdx].value);
    if (currentWins > existingWins) {
      records.teamRecords[bestIdx] = {
        category: 'Best Record',
        value: currentValue,
        season,
      };
    }
  } else {
    records.teamRecords.push({
      category: 'Best Record',
      value: currentValue,
      season,
    });
  }

  // Worst Record
  if (worstIdx >= 0) {
    const existingWins = parseRecordWins(records.teamRecords[worstIdx].value);
    if (currentWins < existingWins) {
      records.teamRecords[worstIdx] = {
        category: 'Worst Record',
        value: currentValue,
        season,
      };
    }
  } else {
    records.teamRecords.push({
      category: 'Worst Record',
      value: currentValue,
      season,
    });
  }

  return { records, newRecords };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function parseRecordWins(value: string): number {
  const parts = value.split('-');
  return parseInt(parts[0], 10) || 0;
}
