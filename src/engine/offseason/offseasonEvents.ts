/**
 * Offseason Events Engine
 *
 * Generates interactive offseason storylines: combine surprises,
 * FA bidding wars, coaching carousel, scandals, camp standouts,
 * international signings, draft trade offers, and owner demands.
 * Each event gives the GM a meaningful choice.
 *
 * Ported from football dynasty offseason-events.js, adapted for baseball.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface OffseasonChoice {
  label: string;
  desc: string;
  effectType: string;
  effectValue?: number;
}

export interface OffseasonEvent {
  id: string;
  icon: string;
  label: string;
  headline: string;
  playerName?: string;
  choices: OffseasonChoice[];
  resolved: boolean;
  chosenIdx?: number;
}

// ── Event templates ─────────────────────────────────────────────────────────

export const EVENT_TEMPLATES: Array<{
  id: string;
  icon: string;
  label: string;
  generate: () => OffseasonEvent;
}> = [
  {
    id: 'combine_surprise',
    icon: '🏋️',
    label: 'Combine Surprise',
    generate: () => ({
      id: 'combine_surprise',
      icon: '🏋️',
      label: 'Combine Surprise',
      headline: 'Under-the-radar prospect EXPLODES at the combine — scouts are scrambling to re-evaluate!',
      choices: [
        { label: 'Move him up your board', desc: 'Trust the measurables (+12 OVR boost if drafted)', effectType: 'ovr_boost', effectValue: 12 },
        { label: 'Trust existing evaluation', desc: 'Stick with your scout\'s original grade', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'fa_bidding_war',
    icon: '💰',
    label: 'FA Bidding War',
    generate: () => ({
      id: 'fa_bidding_war',
      icon: '💰',
      label: 'FA Bidding War',
      headline: 'Three teams are driving up the price on a top free agent. Cost is now 30% above market value.',
      choices: [
        { label: 'Match the inflated price', desc: 'Pay 130% market value to lock him up', effectType: 'fa_inflate', effectValue: 130 },
        { label: 'Walk away', desc: 'Let rivals overpay — find value elsewhere', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'coaching_carousel',
    icon: '🎠',
    label: 'Coaching Carousel',
    generate: () => ({
      id: 'coaching_carousel',
      icon: '🎠',
      label: 'Coaching Carousel',
      headline: 'A rival team fired their manager after a disappointing season. Their staff is available.',
      choices: [
        { label: 'Poach their pitching coach', desc: 'Steal their top assistant (+5% development rate)', effectType: 'staff_boost', effectValue: 5 },
        { label: 'Stay out of it', desc: 'Focus on your own coaching staff', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'scandal',
    icon: '⚠️',
    label: 'Player Scandal',
    generate: () => ({
      id: 'scandal',
      icon: '⚠️',
      label: 'Player Scandal',
      headline: 'REPORT: One of your players involved in an off-field incident. MLB investigating — possible 10-game suspension.',
      choices: [
        { label: 'Proactive suspension (10 games)', desc: 'Show discipline — team morale +5, player misses 10 games', effectType: 'suspend', effectValue: 10 },
        { label: 'Stand by your player', desc: 'Loyalty — no action but morale -3, media backlash', effectType: 'loyalty', effectValue: -3 },
      ],
      resolved: false,
    }),
  },
  {
    id: 'camp_standout',
    icon: '🌟',
    label: 'Spring Training Standout',
    generate: () => ({
      id: 'camp_standout',
      icon: '🌟',
      label: 'Spring Training Standout',
      headline: 'An undrafted free agent is dominating spring training. Other teams are already calling about him.',
      choices: [
        { label: 'Add him to the 40-man', desc: 'Sign the project player (58-65 OVR, high ceiling)', effectType: 'add_udfa' },
        { label: 'Let him go', desc: 'Roster is full — can\'t afford the spot', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'international',
    icon: '🌍',
    label: 'International Prospect',
    generate: () => ({
      id: 'international',
      icon: '🌍',
      label: 'International Prospect',
      headline: 'A raw international prospect is available — electric tools but needs development time.',
      choices: [
        { label: 'Sign him (high ceiling, low floor)', desc: 'Add 50-58 OVR player with superstar potential', effectType: 'add_intl' },
        { label: 'Pass', desc: 'Too risky for the investment', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'draft_trade_offer',
    icon: '📞',
    label: 'Draft Day Trade Offer',
    generate: () => ({
      id: 'draft_trade_offer',
      icon: '📞',
      label: 'Draft Day Trade Offer',
      headline: 'A rival GM is on the phone with a blockbuster draft-day trade offer!',
      choices: [
        { label: 'Trade down 5 spots for extra 2nd rounder', desc: 'More picks, lower ceiling on top pick', effectType: 'trade_down', effectValue: 5 },
        { label: 'Keep your pick', desc: 'Stay put and trust your draft board', effectType: 'none' },
      ],
      resolved: false,
    }),
  },
  {
    id: 'owner_demand',
    icon: '👔',
    label: 'Owner Offseason Demand',
    generate: () => ({
      id: 'owner_demand',
      icon: '👔',
      label: 'Owner Offseason Demand',
      headline: 'The owner is not happy with last season. "This isn\'t good enough. Make changes."',
      choices: [
        { label: 'Promise a splashy signing', desc: 'Owner patience +15, but expectations skyrocket', effectType: 'patience_boost', effectValue: 15 },
        { label: 'Ask for patience', desc: 'Owner patience +5, trust the process', effectType: 'patience_boost', effectValue: 5 },
      ],
      resolved: false,
    }),
  },
];

// ── Generation ──────────────────────────────────────────────────────────────

export function generateOffseasonEvents(count: number = 4): OffseasonEvent[] {
  const shuffled = [...EVENT_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(t => t.generate());
}

export function resolveEvent(event: OffseasonEvent, choiceIdx: number): OffseasonEvent {
  return { ...event, resolved: true, chosenIdx: choiceIdx };
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getOffseasonSummary(events: OffseasonEvent[]) {
  return {
    total: events.length,
    resolved: events.filter(e => e.resolved).length,
    pending: events.filter(e => !e.resolved).length,
  };
}
