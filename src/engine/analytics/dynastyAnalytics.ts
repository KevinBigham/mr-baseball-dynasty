/**
 * Dynasty Analytics Engine — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's dynasty-analytics system.
 * Tracks franchise dominance over time with:
 *   - Dominance scoring per season
 *   - Dynasty index (cumulative franchise value)
 *   - Peak power windows (best 5-year stretch)
 *   - Longevity tracking (consistency over time)
 *   - Identity tags (team archetypes like "Juggernaut", "Pitching Factory")
 *   - Era cards (sustained excellence periods)
 *   - Hall of Seasons (top 20 all-time team seasons)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeasonTeamRecord {
  teamId:        number;
  abbr:          string;
  name:          string;
  wins:          number;
  losses:        number;
  runsScored:    number;
  runsAllowed:   number;
  playoffWins:   number;
  offenseRank:   number;   // 1-30
  pitchingRank:  number;   // 1-30
  farmRank:      number;   // 1-30
}

export interface SeasonHistoryEntry {
  year:         number;
  championId:   number | null;
  mvpAL?:       { name: string; teamAbbr: string; position: string };
  mvpNL?:       { name: string; teamAbbr: string; position: string };
  cyAL?:        { name: string; teamAbbr: string };
  cyNL?:        { name: string; teamAbbr: string };
  teamRecords:  SeasonTeamRecord[];
}

export interface IdentityTag {
  id:     string;
  label:  string;
  color:  string;
}

export interface EraCard {
  abbr:          string;
  teamName:      string;
  startYear:     number;
  endYear:       number;
  wins:          number;
  losses:        number;
  titles:        number;
  seasons:       number;
  avgDominance:  number;
  totalDominance: number;
  playoffWins:   number;
  bestOffense:   number;   // Times ranked #1 offense
  bestPitching:  number;   // Times ranked #1 pitching
}

export interface HallOfSeasonEntry {
  year:          number;
  abbr:          string;
  teamName:      string;
  wins:          number;
  losses:        number;
  dominance:     number;
  isChampion:    boolean;
  topPlayer:     { name: string; position: string; label: string } | null;
  identityTags:  IdentityTag[];
  plaque:        string;
}

export interface PeakPowerWindow {
  score:      number;
  startYear:  number;
  endYear:    number;
}

export interface LongevityProfile {
  score:               number;
  winningSeasons:      number;
  playoffAppearances:  number;
  consistency:         number;  // 0-100%
}

export interface DynastyProfile {
  dynastyIndex:   number;
  peakPower:      PeakPowerWindow;
  longevity:      LongevityProfile;
  identityTags:   IdentityTag[];
  eraCards:       EraCard[];
  hallOfSeasons:  HallOfSeasonEntry[];
}

// ─── Dominance Scoring ────────────────────────────────────────────────────────

export function calcDominanceScore(tr: SeasonTeamRecord, entry: SeasonHistoryEntry): number {
  let score = tr.wins * 2; // Base: 2 pts per win (162-game season)

  // Championship bonus
  if (entry.championId === tr.teamId) score += 40;

  // Playoff wins
  score += tr.playoffWins * 8;

  // Run differential bonus
  const runDiff = tr.runsScored - tr.runsAllowed;
  if (runDiff > 0) score += Math.round(runDiff / 5);

  // Elite unit bonuses
  if (tr.offenseRank <= 3) score += 12 - (tr.offenseRank - 1) * 3;
  if (tr.pitchingRank <= 3) score += 12 - (tr.pitchingRank - 1) * 3;

  // Penalty for losing seasons
  if (tr.wins < tr.losses) score -= 10;

  return Math.max(0, score);
}

// ─── Dynasty Index ────────────────────────────────────────────────────────────

export function calcDynastyIndex(data: {
  seasons: number;
  wins: number;
  losses: number;
  titles: number;
  playoffWins: number;
  mvps: number;
  cyYoungs: number;
  rivalryDominance: number;
}): number {
  if (data.seasons < 1) return 0;
  const winPct = data.wins / Math.max(1, data.wins + data.losses);
  return Math.round(
    data.titles * 120 +
    data.playoffWins * 15 +
    winPct * 50 * data.seasons +
    data.mvps * 25 +
    data.cyYoungs * 20 +
    data.rivalryDominance * 10
  );
}

// ─── Peak Power Window (best 5-year stretch) ──────────────────────────────────

export function calcPeakPower(
  history: SeasonHistoryEntry[],
  teamId: number,
): PeakPowerWindow {
  if (history.length < 5) return { score: 0, startYear: 0, endYear: 0 };

  let bestScore = 0;
  let bestStart = 0;

  for (let i = 0; i <= history.length - 5; i++) {
    let windowScore = 0;
    for (let j = i; j < i + 5; j++) {
      const h = history[j]!;
      const tr = h.teamRecords.find(r => r.teamId === teamId);
      if (tr) {
        windowScore += calcDominanceScore(tr, h);
        if (h.championId === teamId) windowScore += 30;
      }
    }
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = i;
    }
  }

  return {
    score: Math.round(bestScore),
    startYear: history[bestStart]?.year ?? 0,
    endYear: history[Math.min(bestStart + 4, history.length - 1)]?.year ?? 0,
  };
}

// ─── Longevity ────────────────────────────────────────────────────────────────

export function calcLongevity(
  history: SeasonHistoryEntry[],
  teamId: number,
): LongevityProfile {
  if (history.length < 1) return { score: 0, winningSeasons: 0, playoffAppearances: 0, consistency: 0 };

  let winningSeasons = 0;
  let playoffApp = 0;
  let totalDom = 0;

  for (const h of history) {
    const tr = h.teamRecords.find(r => r.teamId === teamId);
    if (tr) {
      if (tr.wins > tr.losses) winningSeasons++;
      if (tr.playoffWins > 0) playoffApp++;
      totalDom += calcDominanceScore(tr, h);
    }
  }

  const consistency = Math.round((winningSeasons / history.length) * 100);

  return {
    score: Math.round(
      (totalDom / Math.max(1, history.length)) * 10 +
      winningSeasons * 8 +
      playoffApp * 12
    ),
    winningSeasons,
    playoffAppearances: playoffApp,
    consistency,
  };
}

// ─── Identity Tags ────────────────────────────────────────────────────────────

export function generateIdentityTags(
  tr: SeasonTeamRecord,
  entry: SeasonHistoryEntry,
): IdentityTag[] {
  const tags: IdentityTag[] = [];

  if (tr.pitchingRank <= 3) {
    tags.push({ id: 'pitching_factory', label: 'Pitching Factory', color: '#34d399' });
  }
  if (tr.offenseRank <= 3) {
    tags.push({ id: 'offensive_juggernaut', label: 'Offensive Juggernaut', color: '#60a5fa' });
  }

  const runDiff = tr.runsScored - tr.runsAllowed;
  if (runDiff >= 120) {
    tags.push({ id: 'dominant', label: 'Dominant', color: '#f59e0b' });
  }
  if (tr.runsAllowed < tr.runsScored * 0.75 && tr.runsAllowed > 0) {
    tags.push({ id: 'fortress', label: 'Fortress', color: '#a78bfa' });
  }
  if (tr.wins >= 100 && tr.losses <= 62) {
    tags.push({ id: 'juggernaut', label: 'Juggernaut', color: '#ef4444' });
  }
  if (tr.wins >= 95) {
    tags.push({ id: 'powerhouse', label: 'Powerhouse', color: '#fb923c' });
  }

  // Check if MVP came from this team
  if (entry.mvpAL?.teamAbbr === tr.abbr || entry.mvpNL?.teamAbbr === tr.abbr) {
    tags.push({ id: 'mvp_factory', label: 'MVP Factory', color: '#fbbf24' });
  }
  if (entry.championId === tr.teamId) {
    tags.push({ id: 'champion', label: 'World Champions', color: '#f472b6' });
  }
  if (tr.farmRank <= 3) {
    tags.push({ id: 'prospect_pipeline', label: 'Prospect Pipeline', color: '#22d3ee' });
  }

  return tags.slice(0, 3);
}

// ─── Era Cards ────────────────────────────────────────────────────────────────

const ERA_THRESHOLD = 200; // Dominance score threshold for an "era" season (baseball scale)

export function generateEraCards(
  history: SeasonHistoryEntry[],
): EraCard[] {
  if (history.length < 3) return [];

  const teamStreaks: Record<string, {
    start: number; end: number; wins: number; losses: number; titles: number;
    playoffWins: number; domScores: number[]; downYears: number;
    bestOffense: number; bestPitching: number; name: string;
  }> = {};

  const eras: EraCard[] = [];

  const flush = (abbr: string) => {
    const s = teamStreaks[abbr]!;
    if (s.domScores.length >= 2) {
      const avg = Math.round(s.domScores.reduce((a, b) => a + b, 0) / s.domScores.length);
      eras.push({
        abbr,
        teamName: s.name,
        startYear: s.start,
        endYear: s.end,
        wins: s.wins,
        losses: s.losses,
        titles: s.titles,
        seasons: s.domScores.length,
        avgDominance: avg,
        totalDominance: s.domScores.reduce((a, b) => a + b, 0),
        playoffWins: s.playoffWins,
        bestOffense: s.bestOffense,
        bestPitching: s.bestPitching,
      });
    }
  };

  for (const h of history) {
    for (const tr of h.teamRecords) {
      const ds = calcDominanceScore(tr, h);
      if (!teamStreaks[tr.abbr]) {
        teamStreaks[tr.abbr] = {
          start: h.year, end: h.year, wins: 0, losses: 0, titles: 0,
          playoffWins: 0, domScores: [], downYears: 0,
          bestOffense: 0, bestPitching: 0, name: tr.name,
        };
      }
      const s = teamStreaks[tr.abbr]!;

      if (ds >= ERA_THRESHOLD) {
        s.wins += tr.wins;
        s.losses += tr.losses;
        s.end = h.year;
        if (h.championId === tr.teamId) s.titles++;
        s.playoffWins += tr.playoffWins;
        s.domScores.push(ds);
        s.downYears = 0;
        if (tr.offenseRank === 1) s.bestOffense++;
        if (tr.pitchingRank === 1) s.bestPitching++;
      } else {
        s.downYears++;
        if (s.downYears >= 2) {
          flush(tr.abbr);
          // Reset
          teamStreaks[tr.abbr] = {
            start: h.year, end: h.year,
            wins: ds >= ERA_THRESHOLD ? tr.wins : 0,
            losses: ds >= ERA_THRESHOLD ? tr.losses : 0,
            titles: h.championId === tr.teamId ? 1 : 0,
            playoffWins: tr.playoffWins,
            domScores: ds >= ERA_THRESHOLD ? [ds] : [],
            downYears: ds >= ERA_THRESHOLD ? 0 : 1,
            bestOffense: 0, bestPitching: 0, name: tr.name,
          };
        }
      }
    }
  }

  // Flush remaining
  for (const abbr of Object.keys(teamStreaks)) {
    flush(abbr);
  }

  return eras.sort((a, b) => b.totalDominance - a.totalDominance).slice(0, 10);
}

// ─── Hall of Seasons (top 20 all-time team seasons) ───────────────────────────

export function buildHallOfSeasons(
  history: SeasonHistoryEntry[],
): HallOfSeasonEntry[] {
  if (history.length < 1) return [];

  const seasons: HallOfSeasonEntry[] = [];

  for (const h of history) {
    for (const tr of h.teamRecords) {
      const ds = calcDominanceScore(tr, h);

      // Identify top player
      let topPlayer: HallOfSeasonEntry['topPlayer'] = null;
      if (h.mvpAL?.teamAbbr === tr.abbr) {
        topPlayer = { name: h.mvpAL.name, position: h.mvpAL.position, label: 'AL MVP' };
      } else if (h.mvpNL?.teamAbbr === tr.abbr) {
        topPlayer = { name: h.mvpNL.name, position: h.mvpNL.position, label: 'NL MVP' };
      } else if (h.cyAL?.teamAbbr === tr.abbr) {
        topPlayer = { name: h.cyAL.name, position: 'SP', label: 'AL Cy Young' };
      } else if (h.cyNL?.teamAbbr === tr.abbr) {
        topPlayer = { name: h.cyNL.name, position: 'SP', label: 'NL Cy Young' };
      }

      const tags = generateIdentityTags(tr, h);
      const plaque = generatePlaque(tr, h, ds, topPlayer);

      seasons.push({
        year: h.year,
        abbr: tr.abbr,
        teamName: tr.name,
        wins: tr.wins,
        losses: tr.losses,
        dominance: ds,
        isChampion: h.championId === tr.teamId,
        topPlayer,
        identityTags: tags,
        plaque,
      });
    }
  }

  return seasons.sort((a, b) => b.dominance - a.dominance).slice(0, 20);
}

// ─── Plaque generator ─────────────────────────────────────────────────────────

function generatePlaque(
  tr: SeasonTeamRecord,
  h: SeasonHistoryEntry,
  dominance: number,
  topPlayer: HallOfSeasonEntry['topPlayer'],
): string {
  const parts: string[] = [];

  if (h.championId === tr.teamId) parts.push('World Champions');
  if (tr.offenseRank === 1) parts.push('#1 Offense');
  if (tr.pitchingRank === 1) parts.push('#1 Pitching');

  if (tr.wins >= 105) parts.push(`Dominant ${tr.wins}-${tr.losses}`);
  else if (tr.wins >= 95) parts.push(`Elite ${tr.wins}-${tr.losses}`);
  else parts.push(`${tr.wins}-${tr.losses}`);

  parts.push(`${dominance} DOM`);

  if (topPlayer) parts.push(`${topPlayer.name} (${topPlayer.label})`);

  const runDiff = tr.runsScored - tr.runsAllowed;
  if (runDiff >= 100) parts.push(`+${runDiff} run diff`);

  return parts.slice(0, 4).join(' · ');
}
