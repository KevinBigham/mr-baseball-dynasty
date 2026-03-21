/**
 * farmReport.ts — Monthly Farm System Report
 *
 * Generates scannable 3-5 bullet point farm reports for the in-season monthly pulse.
 * Categories: risers, fallers, promotion alerts, development stalls.
 *
 * Pure functions — deterministic, no side effects.
 */

import type { RosterPlayer } from '../types/league';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FarmAlertType = 'riser' | 'faller' | 'promotion' | 'stall' | 'note';

export interface FarmAlert {
  type: FarmAlertType;
  icon: string;
  playerName: string;
  position: string;
  level: string;
  headline: string;
  detail: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function toScout(raw: number): number {
  return Math.round(20 + (Math.max(0, Math.min(550, raw)) / 550) * 60);
}

function levelLabel(status: string): string {
  if (status.includes('AAA')) return 'AAA';
  if (status.includes('AA') && !status.includes('AAA')) return 'AA';
  if (status.includes('APLUS') || status.includes('HIGH')) return 'A+';
  if (status.includes('AMINUS') || status.includes('LOW')) return 'A-';
  if (status.includes('ROOKIE')) return 'Rk';
  if (status.includes('INTL')) return 'Intl';
  return 'MLB';
}

// ─── Main Generator ──────────────────────────────────────────────────────

/**
 * Generate a monthly farm report from the current minor league roster.
 * Uses a deterministic seed based on season + segment for reproducibility.
 *
 * @param minorLeaguers All minor league players
 * @param segment Current season segment (0-4)
 * @param season Current season number
 * @returns Array of 3-5 FarmAlerts
 */
export function generateFarmReport(
  minorLeaguers: RosterPlayer[],
  segment: number,
  season: number,
): FarmAlert[] {
  const alerts: FarmAlert[] = [];

  if (minorLeaguers.length === 0) return alerts;

  // Sort by potential descending (focus on top prospects)
  const sorted = [...minorLeaguers].sort((a, b) => b.potential - a.potential);

  // Deterministic selection based on segment
  const seed = season * 100 + segment;

  // ── Risers: Prospects closest to their ceiling (small gap = rapid development) ──
  const risers = sorted.filter(p => {
    const gap = p.potential - p.overall;
    const pct = p.potential > 0 ? p.overall / p.potential : 0;
    return pct >= 0.85 && gap > 20 && p.age <= 25;
  }).slice(0, 2);

  for (const p of risers) {
    alerts.push({
      type: 'riser',
      icon: '📈',
      playerName: p.name,
      position: p.position,
      level: levelLabel(p.rosterStatus),
      headline: `${p.name} surging at ${levelLabel(p.rosterStatus)}`,
      detail: `${toScout(p.overall)} OVR / ${toScout(p.potential)} POT — approaching ceiling rapidly.`,
    });
  }

  // ── Promotion alerts: Players dominating their level ──
  const promotable = sorted.filter(p => {
    const ovr = toScout(p.overall);
    const level = levelLabel(p.rosterStatus);
    // Player is good enough for the next level
    return (level === 'A-' && ovr >= 40) ||
           (level === 'A+' && ovr >= 45) ||
           (level === 'AA' && ovr >= 50) ||
           (level === 'AAA' && ovr >= 55);
  }).slice(0, 2);

  for (const p of promotable) {
    alerts.push({
      type: 'promotion',
      icon: '🔼',
      playerName: p.name,
      position: p.position,
      level: levelLabel(p.rosterStatus),
      headline: `${p.name} ready for promotion`,
      detail: `Dominating at ${levelLabel(p.rosterStatus)} with a ${toScout(p.overall)} OVR. Consider moving up.`,
    });
  }

  // ── Fallers: Older prospects with big gaps ──
  const fallers = sorted.filter(p => {
    const pct = p.potential > 0 ? p.overall / p.potential : 0;
    return p.age >= 24 && pct < 0.65 && p.potential >= 300;
  }).slice(0, 1);

  for (const p of fallers) {
    alerts.push({
      type: 'faller',
      icon: '📉',
      playerName: p.name,
      position: p.position,
      level: levelLabel(p.rosterStatus),
      headline: `${p.name} development stalling`,
      detail: `Age ${p.age} with only ${toScout(p.overall)} OVR vs ${toScout(p.potential)} ceiling. Running out of time.`,
    });
  }

  // ── Stall warnings: Prospects stuck at a level too long ──
  const stalled = sorted.filter(p => {
    return p.age >= 26 && toScout(p.overall) < 45 && p.potential >= 350;
  }).slice(0, 1);

  for (const p of stalled) {
    alerts.push({
      type: 'stall',
      icon: '⚠️',
      playerName: p.name,
      position: p.position,
      level: levelLabel(p.rosterStatus),
      headline: `${p.name} — development stall warning`,
      detail: `Age ${p.age}, still at ${levelLabel(p.rosterStatus)} with ${toScout(p.overall)} OVR. The tools haven't translated.`,
    });
  }

  // ── Generic note if few alerts ──
  if (alerts.length === 0) {
    // Use deterministic index to pick a prospect to highlight
    const idx = seed % Math.min(5, sorted.length);
    const p = sorted[idx];
    if (p) {
      alerts.push({
        type: 'note',
        icon: '📋',
        playerName: p.name,
        position: p.position,
        level: levelLabel(p.rosterStatus),
        headline: `Farm system check: ${p.name}`,
        detail: `Your top prospect is ${toScout(p.overall)} OVR / ${toScout(p.potential)} POT at ${levelLabel(p.rosterStatus)}. Developing normally.`,
      });
    }
  }

  // Cap at 5 alerts
  return alerts.slice(0, 5);
}
