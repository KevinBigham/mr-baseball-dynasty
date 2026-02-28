import type { BoxScore } from '../../types/game';
import type { GameWeather } from '../sim/weather';

/**
 * Game recap narrative generator.
 *
 * Creates short, ESPN-style game summaries from box score data.
 * The recap highlights the most notable events: dominant pitching,
 * big home run performances, walk-offs, blowouts, pitcher duels, etc.
 */

export interface GameRecap {
  headline: string;   // Short headline (e.g., "Wolves Walk Off in 11th")
  summary: string;    // 1-2 sentence recap
  tags: string[];     // Narrative tags: 'walk-off', 'shutout', 'blowout', etc.
}

export function generateGameRecap(
  boxScore: BoxScore,
  playerNames: Map<number, string>,
  homeTeamName: string,
  awayTeamName: string,
  walkOff?: boolean,
  weather?: GameWeather,
): GameRecap {
  const { homeScore, awayScore, innings } = boxScore;
  const margin = Math.abs(homeScore - awayScore);
  const winnerName = homeScore > awayScore ? homeTeamName : awayTeamName;
  const loserName  = homeScore > awayScore ? awayTeamName : homeTeamName;
  const winnerScore = Math.max(homeScore, awayScore);
  const loserScore  = Math.min(homeScore, awayScore);

  const tags: string[] = [];
  const lines: string[] = [];

  // Find key performers
  const allBatters = [...boxScore.homeBatting, ...boxScore.awayBatting];
  const allPitchers = [...boxScore.homePitching, ...boxScore.awayPitching];

  const topHR = allBatters.filter(b => b.hr > 0).sort((a, b) => b.hr - a.hr);
  const topHitter = allBatters.filter(b => b.h >= 3).sort((a, b) => b.h - a.h);
  const topRBI = allBatters.filter(b => b.rbi >= 3).sort((a, b) => b.rbi - a.rbi);
  const winningPitcher = allPitchers.find(p => p.decision === 'W');
  const losingPitcher = allPitchers.find(p => p.decision === 'L');
  const savePitcher = allPitchers.find(p => p.decision === 'S');

  // Detect game narrative type
  const isShutout = loserScore === 0;
  const isBlowout = margin >= 7;
  const isExtraInnings = innings > 9;
  const isOneRun = margin === 1;
  const isPitchersDuel = homeScore + awayScore <= 3;

  // Check for quality starts / complete games
  const completeGame = allPitchers.find(p => p.completeGame);
  const qualityStart = allPitchers.find(p => p.qualityStart && !p.completeGame);

  // Headline construction
  let headline: string;

  if (walkOff) {
    tags.push('walk-off');
    const walkOffHero = topHR[0] ?? topRBI[0] ?? allBatters.find(b => b.rbi > 0);
    const heroName = walkOffHero ? (playerNames.get(walkOffHero.playerId) ?? 'Unknown') : winnerName;
    if (topHR[0] && topHR[0] === walkOffHero) {
      headline = `${heroName} Walk-Off Homer Lifts ${winnerName}`;
    } else {
      headline = `${winnerName} Walk Off ${loserName} in ${ordinal(innings)}`;
    }
  } else if (isShutout && completeGame) {
    tags.push('shutout', 'complete-game');
    const cgPitcher = playerNames.get(completeGame.playerId) ?? 'Starter';
    headline = `${cgPitcher} Throws Complete Game Shutout`;
  } else if (isShutout) {
    tags.push('shutout');
    headline = `${winnerName} Blank ${loserName}, ${winnerScore}-0`;
  } else if (isBlowout) {
    tags.push('blowout');
    headline = `${winnerName} Rout ${loserName}, ${winnerScore}-${loserScore}`;
  } else if (isExtraInnings) {
    tags.push('extra-innings');
    headline = `${winnerName} Edge ${loserName} in ${innings} Innings`;
  } else if (isPitchersDuel) {
    tags.push('pitchers-duel');
    headline = `${winnerName} Squeeze Past ${loserName}, ${winnerScore}-${loserScore}`;
  } else if (isOneRun) {
    tags.push('one-run');
    headline = `${winnerName} Nip ${loserName}, ${winnerScore}-${loserScore}`;
  } else {
    headline = `${winnerName} Top ${loserName}, ${winnerScore}-${loserScore}`;
  }

  // Summary construction
  if (topHR.length > 0) {
    const hrBatter = topHR[0]!;
    const name = playerNames.get(hrBatter.playerId) ?? 'Unknown';
    if (hrBatter.hr >= 2) {
      lines.push(`${name} went deep ${hrBatter.hr} times`);
    } else {
      lines.push(`${name} homered`);
    }
  }

  if (topHitter.length > 0 && topHitter[0] !== topHR[0]) {
    const hitter = topHitter[0]!;
    const name = playerNames.get(hitter.playerId) ?? 'Unknown';
    lines.push(`${name} had ${hitter.h} hits`);
  }

  if (winningPitcher) {
    const wpName = playerNames.get(winningPitcher.playerId) ?? 'Unknown';
    const ip = `${Math.floor(winningPitcher.outs / 3)}.${winningPitcher.outs % 3}`;
    if (winningPitcher.outs >= 18 && winningPitcher.er <= 2) {
      lines.push(`${wpName} dominated over ${ip} IP (${winningPitcher.k} K)`);
    } else {
      lines.push(`${wpName} earned the win`);
    }
  }

  if (savePitcher) {
    const svName = playerNames.get(savePitcher.playerId) ?? 'Unknown';
    lines.push(`${svName} locked it down for the save`);
  }

  // Weather flavor
  if (weather && weather.temperature >= 90) {
    lines.push(`Game played in sweltering ${weather.temperature}°F heat`);
  } else if (weather && weather.temperature <= 45) {
    lines.push(`A frigid ${weather.temperature}°F affair`);
  }

  const summary = lines.slice(0, 3).join('. ') + (lines.length > 0 ? '.' : '');

  return { headline, summary, tags };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
