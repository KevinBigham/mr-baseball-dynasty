/**
 * reputation.ts — Franchise Reputation Score
 *
 * Computes a multi-dimensional legacy grade from franchise history.
 * Four dimensions (25 pts each):
 *   1. Winning     — overall win percentage
 *   2. October     — playoff rate + championship bonus
 *   3. Development — breakout hit rate across seasons
 *   4. Longevity   — seasons managed + consistency (low variance)
 */

import type { SeasonSummary } from '../store/leagueStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReputationDimension {
  label:  string;
  score:  number;   // 0–25
  max:    number;   // always 25
  color:  string;
}

export interface ReputationScore {
  overall:    number;          // 0–100
  grade:      string;          // S / A+ / A / B+ / B / C / D / F
  gradeColor: string;
  flavor:     string;          // "👑 THE DYNASTY", "🌱 THE ARCHITECT", etc.
  flavorDesc: string;
  dimensions: ReputationDimension[];
}

// ─── Grade thresholds ─────────────────────────────────────────────────────────

function computeGrade(score: number): { grade: string; color: string } {
  if (score >= 93) return { grade: 'S',  color: '#fbbf24' };
  if (score >= 85) return { grade: 'A+', color: '#4ade80' };
  if (score >= 75) return { grade: 'A',  color: '#86efac' };
  if (score >= 65) return { grade: 'B+', color: '#a3e635' };
  if (score >= 55) return { grade: 'B',  color: '#fbbf24' };
  if (score >= 45) return { grade: 'C',  color: '#fb923c' };
  if (score >= 30) return { grade: 'D',  color: '#ef4444' };
  return                  { grade: 'F',  color: '#dc2626' };
}

// ─── Flavor archetypes ────────────────────────────────────────────────────────

function computeFlavor(history: SeasonSummary[]): { flavor: string; desc: string } {
  const titles    = history.filter(s => s.playoffResult === 'Champion').length;
  const playoffs  = history.filter(s => s.playoffResult !== null).length;
  const totalWins = history.reduce((s, x) => s + x.wins, 0);
  const avgWins   = totalWins / history.length;
  const totalHits = history.reduce((s, x) => s + x.breakoutHits, 0);
  const hitRate   = totalHits / history.length;

  if (titles >= 3) return {
    flavor: '👑 THE DYNASTY',
    desc: 'Multiple championships define this franchise era. A machine built to win.',
  };
  if (titles >= 2) return {
    flavor: '🏆 THE CHAMPION',
    desc: 'A franchise that delivers in October when it matters most.',
  };
  if (titles === 1 && playoffs >= 3) return {
    flavor: '🥇 THE CONTENDER',
    desc: 'One ring and the hunger for more. This franchise knows how to win.',
  };
  if (playoffs >= 3 && avgWins >= 88) return {
    flavor: '🔥 THE PERENNIAL',
    desc: 'A model of sustained winning. Every season is a playoff push.',
  };
  if (hitRate >= 1.5 && playoffs >= 1) return {
    flavor: '🌱 THE ARCHITECT',
    desc: 'Elite player development powers this organization from within.',
  };
  if (avgWins >= 85) return {
    flavor: '💪 THE COMPETITOR',
    desc: 'A winning franchise that consistently puts quality teams on the field.',
  };
  if (playoffs >= 2) return {
    flavor: '⚡ THE DARK HORSE',
    desc: 'Punches above its weight class when the spotlight is brightest.',
  };
  if (hitRate >= 1.0) return {
    flavor: '🌱 THE ARCHITECT',
    desc: 'Building from within. The pipeline is becoming an organizational identity.',
  };
  if (avgWins >= 75) return {
    flavor: '📈 THE BUILDER',
    desc: 'Moving in the right direction. The best years may still be ahead.',
  };
  return {
    flavor: '🏗️ THE REBUILD',
    desc: 'Still finding the right formula. The investment in tomorrow continues.',
  };
}

// ─── Main computation ─────────────────────────────────────────────────────────

export function computeReputation(history: SeasonSummary[]): ReputationScore | null {
  if (history.length === 0) return null;

  const seasons   = history.length;
  const titles    = history.filter(s => s.playoffResult === 'Champion').length;
  const playoffs  = history.filter(s => s.playoffResult !== null).length;
  const wsApps    = history.filter(s => s.playoffResult === 'WS' || s.playoffResult === 'Champion').length;
  const totalWins = history.reduce((s, x) => s + x.wins, 0);
  const avgWins   = totalWins / seasons;
  const winPct    = totalWins / (seasons * 162);
  const totalHits = history.reduce((s, x) => s + x.breakoutHits, 0);

  // ── Dimension 1: Winning (0–25) ──────────────────────────────────────────
  // Maps win% from .370 (bad) to .617 (elite) into 0–25 pts
  const winningScore = Math.round(Math.max(0, Math.min(25,
    (winPct - 0.37) / (0.617 - 0.37) * 25,
  )));

  // ── Dimension 2: October (0–25) ──────────────────────────────────────────
  const playoffRate  = playoffs / seasons;
  const baseOctober  = playoffRate * 14;
  const champBonus   = Math.min(10, titles * 4);
  const wsBonus      = Math.min(3,  wsApps * 1);
  const octoberScore = Math.round(Math.min(25, baseOctober + champBonus + wsBonus));

  // ── Dimension 3: Development (0–25) ──────────────────────────────────────
  const hitPerSeason = totalHits / seasons;
  const devScore     = Math.round(Math.max(0, Math.min(25,
    4 + hitPerSeason * 12,
  )));

  // ── Dimension 4: Longevity (0–25) ────────────────────────────────────────
  const seasonsPoints = Math.min(10, seasons * 1.4);   // max 10 pts for 7+ seasons
  // Consistency: penalize high win variance (low variance = stable franchise)
  const winVariance   = history.reduce((s, x) => s + Math.pow(x.wins - avgWins, 2), 0) / seasons;
  const consistPoints = Math.max(0, 15 - winVariance / 30);
  const longevityScore = Math.round(Math.min(25, seasonsPoints + consistPoints));

  // ── Total ─────────────────────────────────────────────────────────────────
  const overall = Math.min(100, winningScore + octoberScore + devScore + longevityScore);

  const { grade, color: gradeColor } = computeGrade(overall);
  const { flavor, desc: flavorDesc } = computeFlavor(history);

  return {
    overall,
    grade,
    gradeColor,
    flavor,
    flavorDesc,
    dimensions: [
      { label: 'WINNING',     score: winningScore,   max: 25, color: '#4ade80' },
      { label: 'OCTOBER',     score: octoberScore,   max: 25, color: '#f97316' },
      { label: 'DEVELOPMENT', score: devScore,        max: 25, color: '#60a5fa' },
      { label: 'LONGEVITY',   score: longevityScore,  max: 25, color: '#a78bfa' },
    ],
  };
}
