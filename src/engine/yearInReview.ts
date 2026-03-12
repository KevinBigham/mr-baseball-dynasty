/**
 * yearInReview.ts — Season Recap / Year-in-Review Generator
 *
 * Compiles a rich end-of-season report from all available narrative data.
 * Generates the "Sports Illustrated" season recap page.
 */

import type { SeasonAwards } from './league/awards';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YearInReviewSection {
  title: string;
  icon: string;
  lines: string[];
}

export interface YearInReview {
  season: number;
  teamName: string;
  headline: string;           // "A Season to Remember" / "Rebuilding Year"
  subHeadline: string;        // "The Stockyards finished 95-67..."
  record: { wins: number; losses: number };
  divisionRank: number;
  playoffResult: string | null;
  arcType: string;
  sections: YearInReviewSection[];
}

// ─── Headline generators ─────────────────────────────────────────────────────

const ARC_HEADLINES: Record<string, string> = {
  year_one: 'THE BEGINNING',
  dynasty_rising: 'A DYNASTY IN THE MAKING',
  dynasty_peak: 'THE SUMMIT',
  dynasty_defense: 'DEFENDING THE THRONE',
  contender: 'IN THE HUNT',
  window_closing: 'NOW OR NEVER',
  last_stand: 'ONE LAST RIDE',
  rebuild_begins: 'TEARING IT DOWN',
  rebuild_progress: 'BUILDING THE FUTURE',
  dark_horse: 'NOBODY SAW THIS COMING',
  underdog: 'AGAINST ALL ODDS',
  bounce_back: 'REDEMPTION SEASON',
  transition: 'A YEAR OF CHANGE',
};

function getWinDescription(wins: number): string {
  if (wins >= 100) return 'a dominant';
  if (wins >= 90) return 'an excellent';
  if (wins >= 85) return 'a strong';
  if (wins >= 80) return 'a competitive';
  if (wins >= 75) return 'a middling';
  if (wins >= 70) return 'a disappointing';
  return 'a difficult';
}

// ─── Main generator ──────────────────────────────────────────────────────────

export interface YearInReviewInput {
  season: number;
  teamName: string;
  teamAbbr: string;
  record: { wins: number; losses: number };
  divisionRank: number;
  playoffResult: string | null;
  arcType: string;
  awards: SeasonAwards | null;
  userTeamId: number;
  topHitter: { name: string; statLine: string } | null;
  topPitcher: { name: string; statLine: string } | null;
  newRecordCount: number;
  milestonesReached: string[];
  retirements: string[];
  topProspect: { name: string; grade: string } | null;
  ownerPatienceChange: number;
  rivalryUpdate: string | null;
  faSignings: Array<{ playerName: string; teamName: string }>;
  leagueHistoryEntry: {
    champion: { teamName: string } | null;
    topWins: { teamName: string; wins: number };
    topHR: { name: string; hr: number };
  } | null;
}

export function generateYearInReview(input: YearInReviewInput): YearInReview {
  const { season, teamName, teamAbbr, record, divisionRank, playoffResult, arcType, awards } = input;

  const headline = ARC_HEADLINES[arcType] ?? 'SEASON IN REVIEW';
  const winDesc = getWinDescription(record.wins);
  const subHeadline = `The ${teamName} finished ${record.wins}-${record.losses} in ${winDesc} Season ${season} campaign.`;

  const sections: YearInReviewSection[] = [];

  // ── Section 1: Season Summary ──────────────────────────────────────────
  const summaryLines: string[] = [];
  if (divisionRank === 1) {
    summaryLines.push(`Clinched the division title with a ${record.wins}-${record.losses} record.`);
  } else {
    summaryLines.push(`Finished ${ordinal(divisionRank)} in the division at ${record.wins}-${record.losses}.`);
  }
  if (playoffResult) {
    summaryLines.push(`Playoff result: ${playoffResult}.`);
  } else {
    summaryLines.push('Did not qualify for the postseason.');
  }
  sections.push({ title: 'SEASON SUMMARY', icon: '📊', lines: summaryLines });

  // ── Section 2: Award Winners ───────────────────────────────────────────
  if (awards) {
    const awardLines: string[] = [];
    const majorAwards = [awards.alMVP, awards.nlMVP, awards.alCyYoung, awards.nlCyYoung];
    for (const aw of majorAwards) {
      if (aw.playerId > 0) {
        const isOurs = aw.teamId === input.userTeamId;
        awardLines.push(`${aw.awardName}: ${aw.playerName} (${aw.statLine})${isOurs ? ' ★' : ''}`);
      }
    }
    if (awards.alROY && awards.alROY.playerId > 0) {
      const isOurs = awards.alROY.teamId === input.userTeamId;
      awardLines.push(`AL ROY: ${awards.alROY.playerName} (${awards.alROY.statLine})${isOurs ? ' ★' : ''}`);
    }
    if (awards.nlROY && awards.nlROY.playerId > 0) {
      const isOurs = awards.nlROY.teamId === input.userTeamId;
      awardLines.push(`NL ROY: ${awards.nlROY.playerName} (${awards.nlROY.statLine})${isOurs ? ' ★' : ''}`);
    }
    if (awardLines.length > 0) {
      sections.push({ title: 'AWARD WINNERS', icon: '🏆', lines: awardLines });
    }
  }

  // ── Section 3: Team Stars ──────────────────────────────────────────────
  const starLines: string[] = [];
  if (input.topHitter) starLines.push(`Top Hitter: ${input.topHitter.name} — ${input.topHitter.statLine}`);
  if (input.topPitcher) starLines.push(`Top Pitcher: ${input.topPitcher.name} — ${input.topPitcher.statLine}`);
  if (starLines.length > 0) {
    sections.push({ title: `${teamAbbr} STARS`, icon: '⭐', lines: starLines });
  }

  // ── Section 4: Records & Milestones ────────────────────────────────────
  const recordLines: string[] = [];
  if (input.newRecordCount > 0) {
    recordLines.push(`${input.newRecordCount} new franchise record${input.newRecordCount > 1 ? 's' : ''} set this season.`);
  }
  for (const m of input.milestonesReached.slice(0, 3)) {
    recordLines.push(m);
  }
  if (recordLines.length > 0) {
    sections.push({ title: 'RECORDS & MILESTONES', icon: '📈', lines: recordLines });
  }

  // ── Section 5: Retirements ─────────────────────────────────────────────
  if (input.retirements.length > 0) {
    const retLines = input.retirements.slice(0, 5).map(name => `${name} announced retirement.`);
    sections.push({ title: 'FAREWELL', icon: '👋', lines: retLines });
  }

  // ── Section 6: Farm System ─────────────────────────────────────────────
  if (input.topProspect) {
    sections.push({
      title: 'PROSPECT WATCH',
      icon: '🔭',
      lines: [`#1 Prospect: ${input.topProspect.name} (Grade: ${input.topProspect.grade})`],
    });
  }

  // ── Section 7: Front Office ────────────────────────────────────────────
  const foLines: string[] = [];
  if (input.ownerPatienceChange > 5) foLines.push('Owner confidence surged this season.');
  else if (input.ownerPatienceChange > 0) foLines.push('Owner confidence improved slightly.');
  else if (input.ownerPatienceChange < -5) foLines.push('Owner patience is wearing thin.');
  else if (input.ownerPatienceChange < 0) foLines.push('Owner confidence dipped.');
  if (input.rivalryUpdate) foLines.push(input.rivalryUpdate);
  if (foLines.length > 0) {
    sections.push({ title: 'FRONT OFFICE', icon: '🏢', lines: foLines });
  }

  // ── Section 8: Hot Stove Preview ───────────────────────────────────────
  if (input.faSignings.length > 0) {
    const stoveLines = input.faSignings.slice(0, 3).map(s => `${s.playerName} signed with ${s.teamName}.`);
    sections.push({ title: 'HOT STOVE PREVIEW', icon: '🔥', lines: stoveLines });
  }

  // ── Section 9: Around the League ───────────────────────────────────────
  if (input.leagueHistoryEntry) {
    const leagueLines: string[] = [];
    if (input.leagueHistoryEntry.champion) {
      leagueLines.push(`Champion: ${input.leagueHistoryEntry.champion.teamName}`);
    }
    leagueLines.push(`Best Record: ${input.leagueHistoryEntry.topWins.teamName} (${input.leagueHistoryEntry.topWins.wins} wins)`);
    leagueLines.push(`HR Leader: ${input.leagueHistoryEntry.topHR.name} (${input.leagueHistoryEntry.topHR.hr} HR)`);
    sections.push({ title: 'AROUND THE LEAGUE', icon: '⚾', lines: leagueLines });
  }

  return {
    season,
    teamName,
    headline,
    subHeadline,
    record,
    divisionRank,
    playoffResult,
    arcType,
    sections,
  };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
