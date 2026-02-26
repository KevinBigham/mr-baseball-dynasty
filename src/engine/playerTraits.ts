/**
 * playerTraits.ts — Player Development Trait Badges
 *
 * Every player has hidden traits that describe HOW they develop.
 * Traits are computed deterministically from public-facing RosterPlayer data.
 * Displayed as colored badge chips on the minors/prospect tabs.
 *
 * Trait assignment logic:
 *   We derive traits from overall, potential, age, service time, and position.
 *   The assignment is deterministic (playerId-seeded) so it doesn't flicker.
 */

import type { RosterPlayer } from '../types/league';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerTrait {
  id:    string;
  label: string;
  emoji: string;
  color: string;
  desc:  string;
}

// ─── Trait definitions ────────────────────────────────────────────────────────

const ALL_TRAITS: PlayerTrait[] = [
  {
    id: 'late_bloomer', label: 'Late Bloomer', emoji: '🌸', color: '#86efac',
    desc: 'Develops slower than peers but peaks higher. Patience pays off.',
  },
  {
    id: 'toolsy', label: 'Toolsy', emoji: '🔧', color: '#60a5fa',
    desc: 'Raw tools are elite, but translating them to production takes time.',
  },
  {
    id: 'polished', label: 'Polished', emoji: '💎', color: '#a78bfa',
    desc: 'Fundamentally sound. Makes the most of his current skill level every at-bat.',
  },
  {
    id: 'grinder', label: 'Grinder', emoji: '💪', color: '#fb923c',
    desc: 'Maximum effort every rep. Outworks his physical limitations.',
  },
  {
    id: 'ace_mentality', label: 'Ace Mentality', emoji: '🧠', color: '#fbbf24',
    desc: 'Elevated performance in high-leverage situations. Born for big moments.',
  },
  {
    id: 'glass_cannon', label: 'Glass Cannon', emoji: '💥', color: '#ef4444',
    desc: 'Explosive upside, fragile durability. High variance player.',
  },
  {
    id: 'contact_artist', label: 'Contact Artist', emoji: '🎯', color: '#4ade80',
    desc: 'Elite bat control. Almost never misses his pitch.',
  },
  {
    id: 'power_spike', label: 'Power Spike', emoji: '⚡', color: '#f97316',
    desc: 'One offseason this player could add 10+ HR of pop.',
  },
  {
    id: 'floor_over_ceiling', label: 'High Floor', emoji: '🏛️', color: '#9ca3af',
    desc: 'Limited upside, but almost never has a bad season. Reliable.',
  },
  {
    id: 'under_the_radar', label: 'Under the Radar', emoji: '🕵️', color: '#6b7280',
    desc: 'Consistently underrated by scouts. Quietly producing every day.',
  },
  {
    id: 'command_specialist', label: 'Command Specialist', emoji: '🎯', color: '#34d399',
    desc: 'Could walk a tightrope in a hurricane. Pinpoint control defines his game.',
  },
  {
    id: 'stuff_over_command', label: 'Stuff Over Command', emoji: '🔥', color: '#f97316',
    desc: 'Electric arsenal, but walks are a perpetual concern. Raw power arm.',
  },
  {
    id: 'competitor', label: 'Competitor', emoji: '🥊', color: '#fbbf24',
    desc: 'Refuses to lose. His toughest opponent is himself.',
  },
  {
    id: 'workhorse', label: 'Workhorse', emoji: '🐴', color: '#a3e635',
    desc: 'Eats innings and asks for more. The rotation\'s backbone.',
  },
];

const TRAIT_LOOKUP: Record<string, PlayerTrait> = Object.fromEntries(
  ALL_TRAITS.map(t => [t.id, t])
);

// ─── Assignment logic ─────────────────────────────────────────────────────────

/**
 * Assign 1–2 development traits to a player.
 * Fully deterministic: seeded by playerId, no Math.random().
 */
export function assignTraits(p: RosterPlayer): PlayerTrait[] {
  const id     = p.playerId;
  const gap    = p.potential - p.overall;   // upside gap
  const age    = p.age;
  const isPitcher = p.isPitcher;

  const candidates: string[] = [];

  // Primary trait selection based on player profile
  if (gap >= 20 && age >= 25) candidates.push('late_bloomer');
  if (gap >= 15 && p.overall <= 60) candidates.push('toolsy');
  if (gap <= 8 && p.overall >= 65) candidates.push('polished');
  if (p.serviceTimeDays >= 172 && p.overall >= 60) candidates.push('grinder');
  if (p.overall >= 70 && isPitcher) candidates.push('ace_mentality');
  if (gap >= 18 && p.overall <= 55) candidates.push('glass_cannon');
  if (!isPitcher && p.overall >= 65 && gap <= 10) candidates.push('contact_artist');
  if (!isPitcher && p.potential >= 75 && age <= 23) candidates.push('power_spike');
  if (p.overall >= 60 && gap <= 5) candidates.push('floor_over_ceiling');
  if (p.overall >= 55 && p.potential <= 68) candidates.push('under_the_radar');
  if (isPitcher && p.overall >= 60 && gap <= 10) candidates.push('command_specialist');
  if (isPitcher && gap >= 12 && age <= 24) candidates.push('stuff_over_command');
  if (p.overall >= 55 && p.serviceTimeDays >= 340) candidates.push('competitor');
  if (isPitcher && p.overall >= 65 && !p.rosterStatus.startsWith('MINORS')) candidates.push('workhorse');

  if (candidates.length === 0) {
    // Fallback: deterministic from ID
    const fallbacks = ['grinder', 'under_the_radar', 'floor_over_ceiling', 'competitor'];
    candidates.push(fallbacks[id % fallbacks.length]);
  }

  // Deduplicate and pick up to 2 using deterministic seed
  const unique = [...new Set(candidates)];
  const seed1  = id % unique.length;
  const seed2  = (id * 7 + 3) % unique.length;

  const picks: string[] = [unique[seed1]];
  if (unique.length > 1 && seed2 !== seed1 && gap >= 10) {
    picks.push(unique[seed2]);
  }

  return picks.map(id => TRAIT_LOOKUP[id]).filter(Boolean);
}
