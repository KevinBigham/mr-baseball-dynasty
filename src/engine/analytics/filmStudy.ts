/**
 * Film Study / Post-Game Scouting Report — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's film study system.
 * Generates post-game analysis with:
 *   - Offense / Defense / Pitching / Baserunning grading (0-99)
 *   - Letter grades (A+ through F)
 *   - Contextual insights based on performance thresholds
 *   - Turning point narratives based on game flow
 *   - Fix-it drills (targeted improvement suggestions)
 *   - Game highlights
 */

import type { BoxScore } from '../../types/game';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilmStudyReport {
  won:           boolean;
  margin:        number;
  userScore:     number;
  oppScore:      number;
  userTeam:      string;
  oppTeam:       string;
  grades: {
    offense:     number;
    pitching:    number;
    defense:     number;
    baserunning: number;
  };
  overall:       number;
  insights:      FilmInsight[];
  turning:       string;
  highlights:    FilmHighlight[];
  drills:        FixItDrill[];
}

export interface FilmInsight {
  emoji:   string;
  text:    string;
  grade:   string;   // A, B, C, D, F
  area:    'offense' | 'pitching' | 'defense' | 'baserunning' | 'general';
}

export interface FilmHighlight {
  type:  string;
  icon:  string;
  text:  string;
}

export interface FixItDrill {
  key:     string;
  drill:   string;
  action:  string;
  icon:    string;
}

// ─── Letter Grade ─────────────────────────────────────────────────────────────

export function letterGrade(n: number): string {
  if (n >= 90) return 'A+';
  if (n >= 85) return 'A';
  if (n >= 80) return 'B+';
  if (n >= 75) return 'B';
  if (n >= 65) return 'C+';
  if (n >= 55) return 'C';
  if (n >= 45) return 'D';
  return 'F';
}

// ─── Grade Helpers ────────────────────────────────────────────────────────────

function gradeOffense(runs: number, hits: number, hrs: number, walks: number, ks: number): number {
  let g = 70;
  g += (runs - 4) * 4;       // 4 runs = average
  g += (hits - 8) * 1.5;     // 8 hits = average
  g += hrs * 5;               // HR bonus
  g += walks * 1.5;           // Walk discipline
  g -= ks * 1.2;              // K penalty
  return clamp(Math.round(g), 0, 99);
}

function gradePitching(runsAllowed: number, hitsAllowed: number, ksEarned: number, walksAllowed: number, hrsAllowed: number): number {
  let g = 75;
  g -= (runsAllowed - 4) * 4; // 4 runs = average
  g -= (hitsAllowed - 8) * 1; // 8 hits = average
  g += ksEarned * 1.5;        // K bonus
  g -= walksAllowed * 2;      // Walk penalty
  g -= hrsAllowed * 5;        // HR allowed penalty
  return clamp(Math.round(g), 0, 99);
}

function gradeDefense(errors: number, doublePlays: number): number {
  let g = 72;
  g -= errors * 8;
  g += doublePlays * 4;
  return clamp(Math.round(g), 40, 95);
}

function gradeBaserunning(sb: number, cs: number): number {
  let g = 70;
  g += sb * 4;
  g -= cs * 6;
  return clamp(Math.round(g), 40, 95);
}

// ─── Main Analysis ────────────────────────────────────────────────────────────

export function analyzeGame(
  boxScore: BoxScore,
  userTeamId: number,
  homeTeamName: string,
  awayTeamName: string,
  homeTeamAbbr: string,
  awayTeamAbbr: string,
): FilmStudyReport {
  const isUserHome = true; // Simplified — caller determines perspective
  const userScore = isUserHome ? boxScore.homeScore : boxScore.awayScore;
  const oppScore = isUserHome ? boxScore.awayScore : boxScore.homeScore;
  const won = userScore > oppScore;
  const margin = Math.abs(userScore - oppScore);

  const userBatting = isUserHome ? boxScore.homeBatting : boxScore.awayBatting;
  const oppBatting = isUserHome ? boxScore.awayBatting : boxScore.homeBatting;
  const userPitching = isUserHome ? boxScore.homePitching : boxScore.awayPitching;
  const oppPitching = isUserHome ? boxScore.awayPitching : boxScore.homePitching;

  // Aggregate user batting
  const userHits = userBatting.reduce((s, b) => s + b.h, 0);
  const userHR = userBatting.reduce((s, b) => s + b.hr, 0);
  const userBB = userBatting.reduce((s, b) => s + b.bb, 0);
  const userK = userBatting.reduce((s, b) => s + b.k, 0);
  const userSB = userBatting.reduce((s, b) => s + (b.sb ?? 0), 0);
  const userCS = userBatting.reduce((s, b) => s + (b.cs ?? 0), 0);
  const userErrors = userBatting.reduce((s, b) => s + (b.e ?? 0), 0);

  // Aggregate opponent batting (for pitching grade)
  const oppHits = oppBatting.reduce((s, b) => s + b.h, 0);
  const oppHR = oppBatting.reduce((s, b) => s + b.hr, 0);
  const oppBB = oppBatting.reduce((s, b) => s + b.bb, 0);
  const oppK = userPitching.reduce((s, p) => s + p.k, 0);
  const oppDP = 0; // DP not tracked in box score

  // Grades
  const offGrade = gradeOffense(userScore, userHits, userHR, userBB, userK);
  const pitGrade = gradePitching(oppScore, oppHits, oppK, oppBB, oppHR);
  const defGrade = gradeDefense(userErrors, oppDP);
  const brGrade = gradeBaserunning(userSB, userCS);
  const overall = Math.round((offGrade * 0.35 + pitGrade * 0.35 + defGrade * 0.15 + brGrade * 0.15));

  // Insights
  const insights: FilmInsight[] = [];

  if (userHR >= 3) insights.push({ emoji: '💣', text: `${userHR} home runs — the bats were alive today.`, grade: 'A', area: 'offense' });
  if (userHits >= 14) insights.push({ emoji: '🔥', text: `${userHits} hits. The offense was firing on all cylinders.`, grade: 'A', area: 'offense' });
  if (userK >= 12) insights.push({ emoji: '⚠️', text: `${userK} strikeouts. Too many empty at-bats.`, grade: 'D', area: 'offense' });
  if (userBB >= 6) insights.push({ emoji: '👁️', text: `${userBB} walks drawn. Great plate discipline.`, grade: 'A', area: 'offense' });

  if (oppScore === 0) insights.push({ emoji: '🚫', text: 'Shutout! Pitching staff was untouchable.', grade: 'A+', area: 'pitching' });
  if (oppK >= 12) insights.push({ emoji: '🎯', text: `${oppK} strikeouts by the pitching staff — dominant stuff.`, grade: 'A', area: 'pitching' });
  if (oppHR >= 3) insights.push({ emoji: '⚠️', text: `Gave up ${oppHR} home runs. The pitching left too many over the plate.`, grade: 'D', area: 'pitching' });
  if (oppBB >= 6) insights.push({ emoji: '⚠️', text: `${oppBB} walks issued. Command was an issue today.`, grade: 'D', area: 'pitching' });

  if (userErrors >= 3) insights.push({ emoji: '🧤', text: `${userErrors} errors. Sloppy defense cost us.`, grade: 'F', area: 'defense' });
  if (userSB >= 3) insights.push({ emoji: '💨', text: `${userSB} stolen bases — wreaking havoc on the basepaths.`, grade: 'A', area: 'baserunning' });

  if (insights.length === 0) {
    insights.push(won
      ? { emoji: '✅', text: 'Solid all-around performance. No major red flags.', grade: 'B', area: 'general' }
      : { emoji: '📋', text: 'Competitive game. Small margins made the difference.', grade: 'C', area: 'general' }
    );
  }

  // Turning point
  let turning: string;
  if (margin === 0) turning = 'A deadlocked affair from start to finish.';
  else if (margin <= 1) turning = 'Came down to the final at-bat — a true nail-biter.';
  else if (margin <= 3) turning = 'One-run game. Every pitch mattered down the stretch.';
  else if (margin >= 8) turning = won ? 'Dominant performance from first pitch to last.' : 'Outmatched in every phase. Back to the drawing board.';
  else if (!won && margin >= 5) turning = 'Fell behind early and couldn\'t recover.';
  else turning = 'Game controlled from the middle innings onward.';

  // Highlights
  const highlights: FilmHighlight[] = [];
  const multiHRBatters = userBatting.filter(b => b.hr >= 2);
  if (multiHRBatters.length > 0) {
    highlights.push({ type: 'power', icon: '💣', text: `Multi-HR game — ${multiHRBatters.length} batter(s) went deep multiple times` });
  }

  const dominantPitcher = userPitching.find(p => p.outs >= 18 && p.er <= 1);
  if (dominantPitcher) {
    highlights.push({ type: 'ace', icon: '⭐', text: `Dominant start: ${Math.floor(dominantPitcher.outs / 3)}.${dominantPitcher.outs % 3} IP, ${dominantPitcher.er} ER, ${dominantPitcher.k} K` });
  }

  const saveSituation = userPitching.find(p => p.decision === 'S');
  if (saveSituation && margin <= 3) {
    highlights.push({ type: 'clutch', icon: '🔒', text: 'Closer locked it down in a tight save situation' });
  }

  if (highlights.length < 2 && margin <= 2) {
    highlights.push({ type: 'close', icon: '😤', text: `A ${margin}-run game decided in the late innings` });
  }

  // Fix-it drills
  const drills: FixItDrill[] = [];
  if (userK >= 10) drills.push({ key: 'strikeouts', drill: 'Contact Approach', action: 'Focus on putting the ball in play — reduce strikeout rate', icon: '🏏' });
  if (oppHR >= 3) drills.push({ key: 'hrAllowed', drill: 'Pitch Location', action: 'Keep the ball down in the zone — eliminate mistake pitches', icon: '🎯' });
  if (userErrors >= 2) drills.push({ key: 'errors', drill: 'Fielding Practice', action: 'Extra infield reps — clean up the glovework', icon: '🧤' });
  if (oppBB >= 5) drills.push({ key: 'walks', drill: 'Command Drills', action: 'Pitchers need to attack the zone — too many free passes', icon: '🎯' });
  if (userHits <= 4 && !won) drills.push({ key: 'hitting', drill: 'Batting Practice', action: 'Extra cage work — the bats were cold today', icon: '🏏' });

  return {
    won,
    margin,
    userScore,
    oppScore,
    userTeam: isUserHome ? homeTeamAbbr : awayTeamAbbr,
    oppTeam: isUserHome ? awayTeamAbbr : homeTeamAbbr,
    grades: { offense: offGrade, pitching: pitGrade, defense: defGrade, baserunning: brGrade },
    overall,
    insights,
    turning,
    highlights: highlights.slice(0, 3),
    drills,
  };
}

// ─── Fix-It Drill Definitions ─────────────────────────────────────────────────

export const FIX_IT_DRILLS: Record<string, { drill: string; action: string; icon: string }> = {
  strikeouts:  { drill: 'Contact Approach', action: 'Shorten swings, focus on putting the ball in play', icon: '🏏' },
  hrAllowed:   { drill: 'Pitch Location', action: 'Keep the ball low — limit mistake pitches up in the zone', icon: '🎯' },
  errors:      { drill: 'Fielding Practice', action: 'Extra infield reps and routine groundball work', icon: '🧤' },
  walks:       { drill: 'Command Drills', action: 'Pitchers must attack the zone early in counts', icon: '🎯' },
  hitting:     { drill: 'Batting Practice', action: 'Extra cage time — sharpen the approach', icon: '🏏' },
  baserunning: { drill: 'Baserunning Fundamentals', action: 'Read jumps, timing, and situational awareness', icon: '💨' },
  bullpen:     { drill: 'Bullpen Session', action: 'Relief arms need to sharpen command and efficiency', icon: '⚾' },
  clutch:      { drill: 'Situational Hitting', action: 'RISP approach — shorten up with runners on', icon: '🎯' },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
