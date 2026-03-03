import type { PlayerSeasonStats } from '../types/player';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HallOfFameInductee {
  playerId: number;
  name: string;
  position: string;
  inductionSeason: number;
  retiredSeason: number;
  isPitcher: boolean;
  votePct: number;       // 0-100
  ballotYear: number;    // Which year of eligibility they were inducted (1-10)
  careerStats: {
    seasons: number;
    g: number;
    // Hitting
    pa?: number; hr?: number; h?: number; avg?: number; ops?: number; rbi?: number;
    // Pitching
    w?: number; l?: number; sv?: number; era?: number; k?: number; outs?: number;
    // Shared
    war?: number;
  };
}

export interface HallOfFameCandidate {
  playerId: number;
  name: string;
  position: string;
  retiredSeason: number;
  eligibleSeason: number;   // retiredSeason + 5
  yearsOnBallot: number;    // 1-10
  isPitcher: boolean;
  hofScore: number;          // 0-100
  careerStats: Record<string, number>;
}

// ─── HOF Score Computation ───────────────────────────────────────────────────

export function computeHOFScore(
  career: PlayerSeasonStats[],
  isPitcher: boolean,
): number {
  if (career.length === 0) return 0;

  if (isPitcher) {
    return computePitcherHOFScore(career);
  }
  return computeHitterHOFScore(career);
}

function computeHitterHOFScore(career: PlayerSeasonStats[]): number {
  // WAR approximation for hitters
  const warApprox = career.reduce((sum, s) => {
    const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
    const slg =
      s.ab > 0
        ? (s.h - s.doubles - s.triples - s.hr +
           s.doubles * 2 +
           s.triples * 3 +
           s.hr * 4) /
          s.ab
        : 0;
    return sum + ((obp + slg - 0.64) * s.pa) / 20;
  }, 0);

  // Career totals
  const totalH = career.reduce((t, s) => t + s.h, 0);
  const totalHR = career.reduce((t, s) => t + s.hr, 0);
  const totalAB = career.reduce((t, s) => t + s.ab, 0);

  // Milestone bonuses
  let milestoneBonus = 0;
  if (totalH >= 3000) milestoneBonus += 15;
  if (totalHR >= 600) milestoneBonus += 5;
  if (totalHR >= 500) milestoneBonus += 15;
  if (totalHR >= 400) milestoneBonus += 8;
  if (totalHR >= 300) milestoneBonus += 4;

  // Peak season bonus: seasons with 30+ HR or .300+ AVG
  const peakBonus = career.reduce((bonus, s) => {
    const avg = s.ab > 0 ? s.h / s.ab : 0;
    if (s.hr >= 30 || avg >= 0.3) return bonus + 2;
    return bonus;
  }, 0);

  // Career AVG bonus
  const careerAvg = totalAB > 0 ? totalH / totalAB : 0;
  const avgBonus = careerAvg > 0.3 ? 10 : careerAvg > 0.28 ? 5 : 0;

  const raw = warApprox * 1.5 + milestoneBonus + peakBonus + avgBonus;
  return Math.min(100, Math.max(0, raw));
}

function computePitcherHOFScore(career: PlayerSeasonStats[]): number {
  // WAR approximation for pitchers
  const warApprox = career.reduce((sum, s) => {
    const ip = s.outs / 3;
    const era = s.outs > 0 ? (s.er / s.outs) * 27 : 99;
    return sum + (ip > 0 ? ((4.5 - era) * ip) / 9 : 0);
  }, 0);

  // Career totals
  const totalW = career.reduce((t, s) => t + s.w, 0);
  const totalK = career.reduce((t, s) => t + s.ka, 0);

  // Milestone bonuses
  let milestoneBonus = 0;
  if (totalW >= 300) milestoneBonus += 15;
  if (totalK >= 3000) milestoneBonus += 15;
  if (totalW >= 200) milestoneBonus += 8;

  // Peak season bonus: seasons with ERA < 3.00 and outs > 400
  const peakBonus = career.reduce((bonus, s) => {
    const era = s.outs > 0 ? (s.er / s.outs) * 27 : 99;
    if (era < 3.0 && s.outs > 400) return bonus + 2;
    return bonus;
  }, 0);

  // Career ERA bonus
  const totalOuts = career.reduce((t, s) => t + s.outs, 0);
  const totalER = career.reduce((t, s) => t + s.er, 0);
  const careerERA = totalOuts > 0 ? (totalER / totalOuts) * 27 : 99;
  const eraBonus = careerERA < 3.0 ? 10 : careerERA < 3.5 ? 5 : 0;

  const raw = warApprox * 1.5 + milestoneBonus + peakBonus + eraBonus;
  return Math.min(100, Math.max(0, raw));
}

// ─── Candidate Identification ────────────────────────────────────────────────

export function identifyHOFCandidates(
  retiredPlayers: Map<
    number,
    { name: string; position: string; seasons: PlayerSeasonStats[] }
  >,
  currentSeason: number,
  existingInductees: Set<number>,
): HallOfFameCandidate[] {
  const candidates: HallOfFameCandidate[] = [];

  for (const [playerId, player] of retiredPlayers) {
    // Skip already inducted players
    if (existingInductees.has(playerId)) continue;

    const { seasons } = player;
    if (seasons.length === 0) continue;

    // Determine retired season (last season played)
    const retiredSeason = Math.max(...seasons.map((s) => s.season));

    // Must be retired 5+ seasons
    if (retiredSeason > currentSeason - 5) continue;

    const eligibleSeason = retiredSeason + 5;
    const yearsOnBallot = currentSeason - eligibleSeason + 1;

    // Fell off ballot after 10 years
    if (yearsOnBallot > 10) continue;

    // Determine if pitcher: total outs pitched > total at bats
    const totalOuts = seasons.reduce((t, s) => t + s.outs, 0);
    const totalAB = seasons.reduce((t, s) => t + s.ab, 0);
    const isPitcher = totalOuts > totalAB;

    // Compute HOF score
    const hofScore = computeHOFScore(seasons, isPitcher);

    // Only include candidates with score >= 30
    if (hofScore < 30) continue;

    // Aggregate career stats
    const careerStats: Record<string, number> = {};
    careerStats.seasons = seasons.length;
    careerStats.g = seasons.reduce((t, s) => t + s.g, 0);
    careerStats.pa = seasons.reduce((t, s) => t + s.pa, 0);
    careerStats.ab = seasons.reduce((t, s) => t + s.ab, 0);
    careerStats.h = seasons.reduce((t, s) => t + s.h, 0);
    careerStats.hr = seasons.reduce((t, s) => t + s.hr, 0);
    careerStats.rbi = seasons.reduce((t, s) => t + s.rbi, 0);
    careerStats.bb = seasons.reduce((t, s) => t + s.bb, 0);
    careerStats.sb = seasons.reduce((t, s) => t + s.sb, 0);
    careerStats.doubles = seasons.reduce((t, s) => t + s.doubles, 0);
    careerStats.triples = seasons.reduce((t, s) => t + s.triples, 0);
    careerStats.w = seasons.reduce((t, s) => t + s.w, 0);
    careerStats.l = seasons.reduce((t, s) => t + s.l, 0);
    careerStats.sv = seasons.reduce((t, s) => t + s.sv, 0);
    careerStats.outs = seasons.reduce((t, s) => t + s.outs, 0);
    careerStats.er = seasons.reduce((t, s) => t + s.er, 0);
    careerStats.ka = seasons.reduce((t, s) => t + s.ka, 0);
    careerStats.hbp = seasons.reduce((t, s) => t + s.hbp, 0);

    candidates.push({
      playerId,
      name: player.name,
      position: player.position,
      retiredSeason,
      eligibleSeason,
      yearsOnBallot,
      isPitcher,
      hofScore,
      careerStats,
    });
  }

  return candidates;
}

// ─── HOF Voting Simulation ──────────────────────────────────────────────────

export function simulateHOFVoting(
  candidates: HallOfFameCandidate[],
  seed: number,
): { inducted: HallOfFameInductee[]; remaining: HallOfFameCandidate[] } {
  const hash = (s: number): number => {
    s = ((s >> 16) ^ s) * 0x45d9f3b;
    s = ((s >> 16) ^ s) * 0x45d9f3b;
    return ((s >> 16) ^ s) & 0x7fffffff;
  };

  const inducted: HallOfFameInductee[] = [];
  const remaining: HallOfFameCandidate[] = [];

  for (const candidate of candidates) {
    // Compute vote percentage
    const yearBonus = Math.min(candidate.yearsOnBallot * 2, 15);
    const baseVote = candidate.hofScore * 0.85 + yearBonus;
    const noise = (hash(seed + candidate.playerId) % 20) - 10;
    const votePct = Math.min(100, Math.max(5, baseVote + noise));

    if (votePct >= 75) {
      // Build aggregated career stats for inductee
      const cs = candidate.careerStats;
      const totalAB = cs.ab ?? 0;
      const totalH = cs.h ?? 0;
      const totalOuts = cs.outs ?? 0;
      const totalER = cs.er ?? 0;

      const careerAvg = totalAB > 0 ? totalH / totalAB : 0;

      // Compute OBP and SLG for OPS
      const totalPA = cs.pa ?? 0;
      const totalBB = cs.bb ?? 0;
      const totalHBP = cs.hbp ?? 0;
      const totalDoubles = cs.doubles ?? 0;
      const totalTriples = cs.triples ?? 0;
      const totalHR = cs.hr ?? 0;

      const obp =
        totalPA > 0 ? (totalH + totalBB + totalHBP) / totalPA : 0;
      const slg =
        totalAB > 0
          ? (totalH - totalDoubles - totalTriples - totalHR +
             totalDoubles * 2 +
             totalTriples * 3 +
             totalHR * 4) /
            totalAB
          : 0;
      const ops = obp + slg;

      const careerERA =
        totalOuts > 0 ? (totalER / totalOuts) * 27 : undefined;

      // Compute approximate WAR for the inductee record
      let warApprox: number;
      if (candidate.isPitcher) {
        warApprox = 0;
        // Re-derive from career stats (approximation using aggregated totals)
        const ip = totalOuts / 3;
        const era = totalOuts > 0 ? (totalER / totalOuts) * 27 : 99;
        warApprox = ip > 0 ? ((4.5 - era) * ip) / 9 : 0;
      } else {
        warApprox =
          ((obp + slg - 0.64) * totalPA) / 20;
      }

      const inductee: HallOfFameInductee = {
        playerId: candidate.playerId,
        name: candidate.name,
        position: candidate.position,
        inductionSeason:
          candidate.retiredSeason + 5 + candidate.yearsOnBallot - 1,
        retiredSeason: candidate.retiredSeason,
        isPitcher: candidate.isPitcher,
        votePct: Math.round(votePct * 10) / 10,
        ballotYear: candidate.yearsOnBallot,
        careerStats: {
          seasons: cs.seasons ?? 0,
          g: cs.g ?? 0,
          // Hitting stats
          pa: totalPA || undefined,
          h: totalH || undefined,
          hr: totalHR || undefined,
          avg: totalAB > 0 ? Math.round(careerAvg * 1000) / 1000 : undefined,
          ops: totalPA > 0 ? Math.round(ops * 1000) / 1000 : undefined,
          rbi: (cs.rbi ?? 0) || undefined,
          // Pitching stats
          w: (cs.w ?? 0) || undefined,
          l: (cs.l ?? 0) || undefined,
          sv: (cs.sv ?? 0) || undefined,
          era:
            careerERA !== undefined
              ? Math.round(careerERA * 100) / 100
              : undefined,
          k: (cs.ka ?? 0) || undefined,
          outs: totalOuts || undefined,
          // Shared
          war: Math.round(warApprox * 10) / 10,
        },
      };

      inducted.push(inductee);
    } else if (candidate.yearsOnBallot < 10) {
      // Still on ballot for future years
      remaining.push(candidate);
    }
    // If yearsOnBallot >= 10 and not inducted, they fall off the ballot entirely
  }

  return { inducted, remaining };
}
