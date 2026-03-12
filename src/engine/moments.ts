/**
 * moments.ts — Season Moments Gallery
 *
 * Generates categorized highlight moments from each season.
 * Moments are accumulated in leagueStore and displayed as a scrollable gallery.
 *
 * Categories:
 *   🏆 dynasty   — Championships, deep playoff runs
 *   ⚡ breakout  — Prospect breakouts, award winners
 *   💔 heartbreak — Near misses, late-season collapses, busts
 *   📈 record    — Stat lines that demand attention
 *   🎯 upset     — Unexpected results (good or bad)
 *   ⚾ milestone  — Franchise firsts, season counts
 */

import type { SeasonResult } from '../types/league';
import type { SeasonSummary } from '../store/leagueStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MomentCategory = 'dynasty' | 'breakout' | 'heartbreak' | 'record' | 'upset' | 'milestone';

export interface SeasonMoment {
  id:         string;
  season:     number;
  category:   MomentCategory;
  icon:       string;
  headline:   string;
  detail:     string;
  isUserTeam: boolean;
  weight:     number;  // 1–10 importance
}

const CATEGORY_META: Record<MomentCategory, { icon: string; color: string; label: string }> = {
  dynasty:    { icon: '🏆', color: '#fbbf24', label: 'DYNASTY MOMENT' },
  breakout:   { icon: '⚡', color: '#4ade80', label: 'BREAKOUT ALERT'  },
  heartbreak: { icon: '💔', color: '#ef4444', label: 'HEARTBREAK'      },
  record:     { icon: '📈', color: '#60a5fa', label: 'RECORD CHASER'   },
  upset:      { icon: '🎯', color: '#a78bfa', label: 'UPSET'           },
  milestone:  { icon: '⭐', color: '#fb923c', label: 'MILESTONE'        },
};

export function getMomentMeta(category: MomentCategory) {
  return CATEGORY_META[category];
}

// ─── ID generator ─────────────────────────────────────────────────────────────

function mid(season: number, suffix: string): string {
  return `moment-${season}-${suffix}`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateSeasonMoments(
  result:    SeasonResult,
  summary:   Omit<SeasonSummary, 'keyMoment'>,
_userTeamId: number,
): SeasonMoment[] {
  const moments: SeasonMoment[] = [];
  const s = result.season;

  const isPlayoff   = !!summary.playoffResult;
  const isChampion  = summary.playoffResult === 'Champion';
  const isWSApp     = summary.playoffResult === 'WS' || isChampion;
  const wins        = summary.wins;
  const losses      = summary.losses;

  // ── Dynasty / Deep Run moments ──────────────────────────────────────────────

  if (isChampion) {
    moments.push({
      id: mid(s, 'champion'), season: s, category: 'dynasty', icon: '🏆',
      headline: `World Series Champions`,
      detail: `Finished ${wins}–${losses} and completed the ultimate mission. The franchise has its ring.`,
      isUserTeam: true, weight: 10,
    });
  } else if (isWSApp) {
    moments.push({
      id: mid(s, 'ws-app'), season: s, category: 'heartbreak', icon: '💔',
      headline: `World Series — Fell One Series Short`,
      detail: `Reached the Fall Classic at ${wins}–${losses} but couldn't finish. The ring remains elusive.`,
      isUserTeam: true, weight: 8,
    });
  } else if (summary.playoffResult === 'CS') {
    moments.push({
      id: mid(s, 'cs-exit'), season: s, category: 'heartbreak', icon: '💔',
      headline: `Championship Series Exit`,
      detail: `A ${wins}-win season ended in the ALCS/NLCS. Two wins away from the World Series.`,
      isUserTeam: true, weight: 7,
    });
  } else if (summary.playoffResult === 'DS') {
    moments.push({
      id: mid(s, 'ds-exit'), season: s, category: 'milestone', icon: '⭐',
      headline: `Division Series Appearance`,
      detail: `${wins}–${losses} earned an October ticket. The postseason run gave the fanbase a taste.`,
      isUserTeam: true, weight: 5,
    });
  } else if (wins >= 95) {
    moments.push({
      id: mid(s, 'dominant-miss'), season: s, category: 'heartbreak', icon: '💔',
      headline: `${wins} Wins, No October`,
      detail: `One of the franchise's best regular seasons — and somehow no playoff berth. A confounding result.`,
      isUserTeam: true, weight: 6,
    });
  }

  // ── Breakout moments ────────────────────────────────────────────────────────

  const breakouts = (result.developmentEvents ?? []).filter(e => e.type === 'breakout');
  if (breakouts.length >= 5) {
    moments.push({
      id: mid(s, 'mass-breakout'), season: s, category: 'breakout', icon: '⚡',
      headline: `${breakouts.length} Players Break Out Leaguewide`,
      detail: `A historic development cycle — the league's minor league system produced elite talent at a staggering rate this offseason.`,
      isUserTeam: false, weight: 4,
    });
  } else if (breakouts.length >= 1) {
    const top = breakouts[0];
    moments.push({
      id: mid(s, `breakout-${top.playerId}`), season: s, category: 'breakout', icon: '⚡',
      headline: `${top.playerName} Announces Himself`,
      detail: `A +${top.overallDelta} OVR jump this offseason. Circle this name — he'll be in conversations for years.`,
      isUserTeam: false, weight: 3,
    });
  }

  // ── Award moments ────────────────────────────────────────────────────────────

  if (result.awards?.mvpAL) {
    const mvp = result.awards.mvpAL;
    moments.push({
      id: mid(s, 'mvp-al'), season: s, category: 'record', icon: '📈',
      headline: `${mvp.name} Dominates the AL`,
      detail: `AL MVP honors in a commanding season. ${mvp.statLine}`,
      isUserTeam: false, weight: 4,
    });
  }
  if (result.awards?.mvpNL) {
    const mvp = result.awards.mvpNL;
    moments.push({
      id: mid(s, 'mvp-nl'), season: s, category: 'record', icon: '📈',
      headline: `${mvp.name} Rules the NL`,
      detail: `NL MVP — a player at the absolute peak of his abilities. ${mvp.statLine}`,
      isUserTeam: false, weight: 4,
    });
  }
  if (result.awards?.cyYoungAL) {
    const cy = result.awards.cyYoungAL;
    moments.push({
      id: mid(s, 'cy-al'), season: s, category: 'record', icon: '📈',
      headline: `${cy.name} Claims AL Cy Young`,
      detail: `Dominant pitching earns AL Cy Young honors. ${cy.statLine}`,
      isUserTeam: false, weight: 4,
    });
  }
  if (result.awards?.cyYoungNL) {
    const cy = result.awards.cyYoungNL;
    moments.push({
      id: mid(s, 'cy-nl'), season: s, category: 'record', icon: '📈',
      headline: `${cy.name} Wins NL Cy Young`,
      detail: `NL Cy Young — an arm that carried the staff all season. ${cy.statLine}`,
      isUserTeam: false, weight: 4,
    });
  }
  if (result.awards?.royAL) {
    const roy = result.awards.royAL;
    moments.push({
      id: mid(s, 'roy-al'), season: s, category: 'breakout', icon: '⚡',
      headline: `${roy.name} Takes the AL Rookie Crown`,
      detail: `An electrifying debut earns AL Rookie of the Year honors. ${roy.statLine}`,
      isUserTeam: false, weight: 3,
    });
  }
  if (result.awards?.royNL) {
    const roy = result.awards.royNL;
    moments.push({
      id: mid(s, 'roy-nl'), season: s, category: 'breakout', icon: '⚡',
      headline: `${roy.name} Shines in NL Debut`,
      detail: `NL Rookie of the Year — the next wave of superstar talent has arrived. ${roy.statLine}`,
      isUserTeam: false, weight: 3,
    });
  }

  // ── Stat line extremes ───────────────────────────────────────────────────────

  if (result.leagueERA <= 3.80) {
    moments.push({
      id: mid(s, 'pitcher-era'), season: s, category: 'record', icon: '📈',
      headline: `The Year of the Pitcher — ERA at ${result.leagueERA.toFixed(2)}`,
      detail: `Historically dominant pitching suppressed offense leaguewide. Hitters adjusted their expectations downward.`,
      isUserTeam: false, weight: 3,
    });
  }
  if (result.leagueERA >= 4.40) {
    moments.push({
      id: mid(s, 'hitter-era'), season: s, category: 'record', icon: '📈',
      headline: `Offense Reigns — ERA Balloons to ${result.leagueERA.toFixed(2)}`,
      detail: `A historic year for hitters. Run totals shattered expectations across both leagues.`,
      isUserTeam: false, weight: 3,
    });
  }

  // ── Upset / surprise ─────────────────────────────────────────────────────────

  if (result.teamWinsSD >= 12) {
    moments.push({
      id: mid(s, 'parity-gone'), season: s, category: 'upset', icon: '🎯',
      headline: `A Lopsided Season — Talent Gap Widens`,
      detail: `Win distribution this season was among the most spread in league history. Clear haves and have-nots emerged early.`,
      isUserTeam: false, weight: 2,
    });
  }

  if (wins >= 98 && !isPlayoff) {
    moments.push({
      id: mid(s, 'curse'), season: s, category: 'upset', icon: '🎯',
      headline: `${wins} Wins, No October — A Historic Anomaly`,
      detail: `One of the greatest regular seasons in franchise history, and somehow no postseason berth. The simulation gods have spoken.`,
      isUserTeam: true, weight: 9,
    });
  }

  // ── Milestones ───────────────────────────────────────────────────────────────

  const retirements = (result.developmentEvents ?? []).filter(e => e.type === 'retirement');
  if (retirements.length >= 3) {
    moments.push({
      id: mid(s, 'retirements'), season: s, category: 'milestone', icon: '⭐',
      headline: `An Era Ends — ${retirements.length} Veterans Hang Up the Cleats`,
      detail: `A significant roster transition underway as multiple stalwarts call it a career after the ${s} season.`,
      isUserTeam: false, weight: 2,
    });
  }

  // Sort by weight descending, limit to 5 per season
  return moments
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}
