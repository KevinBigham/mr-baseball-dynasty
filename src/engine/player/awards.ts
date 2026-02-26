import type { Player, PlayerSeasonStats } from '../../types/player';
import type { Team } from '../../types/team';

// ─── Award winner shape ───────────────────────────────────────────────────────

export interface AwardWinner {
  playerId:   number;
  name:       string;
  teamId:     number;
  teamAbbr:   string;
  position:   string;
  age:        number;
  statLine:   string;   // Human-readable summary e.g. "31 HR / .312 / .985 OPS"
}

export interface SeasonAwards {
  mvpAL:       AwardWinner | null;
  mvpNL:       AwardWinner | null;
  cyYoungAL:   AwardWinner | null;
  cyYoungNL:   AwardWinner | null;
  royAL:       AwardWinner | null;  // Rookie of the Year
  royNL:       AwardWinner | null;
}

// ─── Division champion shape ──────────────────────────────────────────────────

export interface DivisionChampion {
  league:       'AL' | 'NL';
  division:     string;
  teamId:       number;
  name:         string;
  abbreviation: string;
  wins:         number;
  losses:       number;
}

// ─── Scoring functions ────────────────────────────────────────────────────────

function mvpScore(s: PlayerSeasonStats): number {
  if (s.pa < 300) return -Infinity;
  const avg = s.ab > 0 ? s.h / s.ab : 0;
  const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const slg = s.ab > 0
    ? (s.h - s.doubles - s.triples - s.hr
       + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab
    : 0;
  const ops = obp + slg;
  // OPS dominates, HR and RBI provide secondary tie-breaking weight
  return ops * 80 + s.hr * 0.25 + s.rbi * 0.08 + avg * 10;
}

function cyYoungScore(s: PlayerSeasonStats): number {
  if (s.outs < 45) return -Infinity; // Min ~15 IP
  const ip   = s.outs / 3;
  const era  = s.outs > 0 ? (s.er / s.outs) * 27 : 99;
  const k9   = ip > 0 ? (s.ka / ip) * 9 : 0;
  const whip = ip > 0 ? (s.bba + s.ha) / ip : 99;
  // Weighted: ERA most important, then W, K9, WHIP
  return -era * 6 + s.w * 2.5 + k9 * 1.5 - whip * 8 + ip * 0.04;
}

function royHitterScore(s: PlayerSeasonStats): number {
  if (s.pa < 100) return -Infinity;
  const avg = s.ab > 0 ? s.h / s.ab : 0;
  const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const slg = s.ab > 0
    ? (s.h - s.doubles - s.triples - s.hr
       + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab
    : 0;
  return (obp + slg) * 60 + s.hr * 0.20 + avg * 8;
}

function royPitcherScore(s: PlayerSeasonStats): number {
  if (s.outs < 30) return -Infinity;
  const ip   = s.outs / 3;
  const era  = s.outs > 0 ? (s.er / s.outs) * 27 : 99;
  const whip = ip > 0 ? (s.bba + s.ha) / ip : 99;
  return -era * 5 + s.w * 2 - whip * 7 + ip * 0.03;
}

// ─── Stat line builders ───────────────────────────────────────────────────────

function hitterStatLine(s: PlayerSeasonStats): string {
  const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3) : '.000';
  const obp = s.pa > 0 ? ((s.h + s.bb + s.hbp) / s.pa).toFixed(3) : '.000';
  const slg = s.ab > 0
    ? ((s.h - s.doubles - s.triples - s.hr
        + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab).toFixed(3)
    : '.000';
  return `${s.hr} HR / .${avg.slice(1)} AVG / .${obp.slice(1)}-.${slg.slice(1)} OPS`;
}

function pitcherStatLine(s: PlayerSeasonStats): string {
  const ip   = (s.outs / 3).toFixed(1);
  const era  = s.outs > 0 ? ((s.er / s.outs) * 27).toFixed(2) : '-.--';
  const whip = s.outs > 0 ? ((s.bba + s.ha) / (s.outs / 3)).toFixed(2) : '-.--';
  return `${s.w}-${s.l}, ${era} ERA, ${s.ka} K, ${whip} WHIP, ${ip} IP`;
}

// ─── Main award computation ───────────────────────────────────────────────────

export function computeAwards(
  players: Player[],
  stats: Map<number, PlayerSeasonStats>,
  teams: Team[],
): SeasonAwards {
  const teamMap = new Map(teams.map(t => [t.teamId, t]));

  // Separate by league
  const alPlayers = players.filter(p => teamMap.get(p.teamId)?.league === 'AL');
  const nlPlayers = players.filter(p => teamMap.get(p.teamId)?.league === 'NL');

  // Rookie criterion: ≤ 130 service-time days (roughly first call-up season)
  // AND must have played this season
  const isRookie = (p: Player) => p.rosterData.serviceTimeDays <= 130;

  function bestHitter(candidates: Player[]): AwardWinner | null {
    let best: { player: Player; score: number } | null = null;
    for (const p of candidates) {
      if (p.isPitcher) continue;
      const s = stats.get(p.playerId);
      if (!s) continue;
      const score = mvpScore(s);
      if (!isFinite(score)) continue;
      if (!best || score > best.score) best = { player: p, score };
    }
    if (!best) return null;
    const p = best.player;
    const s = stats.get(p.playerId)!;
    const team = teamMap.get(p.teamId);
    return {
      playerId: p.playerId,
      name:     p.name,
      teamId:   p.teamId,
      teamAbbr: team?.abbreviation ?? '---',
      position: p.position,
      age:      p.age,
      statLine: hitterStatLine(s),
    };
  }

  function bestPitcher(candidates: Player[]): AwardWinner | null {
    let best: { player: Player; score: number } | null = null;
    for (const p of candidates) {
      if (!p.isPitcher) continue;
      const s = stats.get(p.playerId);
      if (!s) continue;
      const score = cyYoungScore(s);
      if (!isFinite(score)) continue;
      if (!best || score > best.score) best = { player: p, score };
    }
    if (!best) return null;
    const p = best.player;
    const s = stats.get(p.playerId)!;
    const team = teamMap.get(p.teamId);
    return {
      playerId: p.playerId,
      name:     p.name,
      teamId:   p.teamId,
      teamAbbr: team?.abbreviation ?? '---',
      position: p.position,
      age:      p.age,
      statLine: pitcherStatLine(s),
    };
  }

  function bestRookie(candidates: Player[]): AwardWinner | null {
    let best: { player: Player; score: number } | null = null;
    for (const p of candidates) {
      if (!isRookie(p)) continue;
      const s = stats.get(p.playerId);
      if (!s) continue;
      const score = p.isPitcher ? royPitcherScore(s) : royHitterScore(s);
      if (!isFinite(score)) continue;
      if (!best || score > best.score) best = { player: p, score };
    }
    if (!best) return null;
    const p = best.player;
    const s = stats.get(p.playerId)!;
    const team = teamMap.get(p.teamId);
    return {
      playerId: p.playerId,
      name:     p.name,
      teamId:   p.teamId,
      teamAbbr: team?.abbreviation ?? '---',
      position: p.position,
      age:      p.age,
      statLine: p.isPitcher ? pitcherStatLine(s) : hitterStatLine(s),
    };
  }

  return {
    mvpAL:     bestHitter(alPlayers),
    mvpNL:     bestHitter(nlPlayers),
    cyYoungAL: bestPitcher(alPlayers),
    cyYoungNL: bestPitcher(nlPlayers),
    royAL:     bestRookie(alPlayers),
    royNL:     bestRookie(nlPlayers),
  };
}

// ─── Division champions ───────────────────────────────────────────────────────

export function computeDivisionChampions(
  teams: Team[],
): DivisionChampion[] {
  const divisions = [
    { league: 'AL' as const, division: 'East' },
    { league: 'AL' as const, division: 'Central' },
    { league: 'AL' as const, division: 'West' },
    { league: 'NL' as const, division: 'East' },
    { league: 'NL' as const, division: 'Central' },
    { league: 'NL' as const, division: 'West' },
  ];

  const champions: DivisionChampion[] = [];

  for (const { league, division } of divisions) {
    const divTeams = teams.filter(t => t.league === league && t.division === division);
    if (divTeams.length === 0) continue;

    const champ = divTeams.reduce((best, t) =>
      t.seasonRecord.wins > best.seasonRecord.wins ? t : best,
    );

    champions.push({
      league,
      division,
      teamId:       champ.teamId,
      name:         champ.name,
      abbreviation: champ.abbreviation,
      wins:         champ.seasonRecord.wins,
      losses:       champ.seasonRecord.losses,
    });
  }

  return champions;
}
