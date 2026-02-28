// ─── Owner Personality Events ─────────────────────────────────────────────
// 5 owner archetypes with triggered mood events throughout the season.

export type OwnerArchetype = 'win_now' | 'patient_builder' | 'profit_first' | 'fan_favorite' | 'legacy_obsessed';

export interface OwnerProfile {
  name: string;
  archetype: OwnerArchetype;
  mood: number; // 0-100
  tenureSeason: number;
}

export interface OwnerEvent {
  archetype: OwnerArchetype;
  emoji: string;
  msg: string;
  mood: number;
  tag: 'PRESSURE' | 'PRAISE' | 'WARNING' | 'DEMAND';
}

export interface OwnerEventResult extends OwnerEvent {
  ownerName: string;
  season: number;
  week: number;
}

// ─── Archetype display ────────────────────────────────────────────────────

export const ARCHETYPE_DISPLAY: Record<OwnerArchetype, { label: string; icon: string; color: string; desc: string }> = {
  win_now:        { label: 'Win Now', icon: '🏆', color: '#f59e0b', desc: 'Demands immediate contention, impatient with rebuilds' },
  patient_builder:{ label: 'Patient Builder', icon: '🌱', color: '#22c55e', desc: 'Values farm system and long-term development' },
  profit_first:   { label: 'Profit First', icon: '💰', color: '#a855f7', desc: 'Bottom-line focused, demands financial efficiency' },
  fan_favorite:   { label: 'Fan Favorite', icon: '🎉', color: '#3b82f6', desc: 'Wants star power and fan excitement' },
  legacy_obsessed:{ label: 'Legacy Builder', icon: '🏛️', color: '#94a3b8', desc: 'Dreams of dynasty, focused on franchise history' },
};

// ─── Event templates ──────────────────────────────────────────────────────

const EVENT_TEMPLATES: OwnerEvent[] = [
  // Win Now (2 events)
  {
    archetype: 'win_now',
    emoji: '😤',
    msg: 'Owner unhappy with losing record — demands a "splash signing" at the deadline.',
    mood: -6,
    tag: 'PRESSURE',
  },
  {
    archetype: 'win_now',
    emoji: '🎉',
    msg: 'Owner thrilled with the winning streak — offers to increase the payroll budget.',
    mood: 4,
    tag: 'PRAISE',
  },

  // Patient Builder (2 events)
  {
    archetype: 'patient_builder',
    emoji: '🌟',
    msg: 'Owner excited about top prospect promotions — praises farm system development.',
    mood: 5,
    tag: 'PRAISE',
  },
  {
    archetype: 'patient_builder',
    emoji: '⚠️',
    msg: 'Owner concerned about payroll exceeding the luxury tax threshold.',
    mood: -4,
    tag: 'WARNING',
  },

  // Profit First (2 events)
  {
    archetype: 'profit_first',
    emoji: '📈',
    msg: 'Owner pleased with revenue growth — fan attendance is up this quarter.',
    mood: 4,
    tag: 'PRAISE',
  },
  {
    archetype: 'profit_first',
    emoji: '💸',
    msg: 'Owner demands payroll cuts — wants you to shed $15M by the offseason.',
    mood: -5,
    tag: 'DEMAND',
  },

  // Fan Favorite (2 events)
  {
    archetype: 'fan_favorite',
    emoji: '⭐',
    msg: 'Owner loves having a star player — jersey sales are through the roof!',
    mood: 4,
    tag: 'PRAISE',
  },
  {
    archetype: 'fan_favorite',
    emoji: '😞',
    msg: 'Owner frustrated with empty seats — attendance is down 15% from last season.',
    mood: -5,
    tag: 'PRESSURE',
  },

  // Legacy Obsessed (2 events)
  {
    archetype: 'legacy_obsessed',
    emoji: '🏆',
    msg: 'Owner ecstatic after making the playoffs — "This is what we build dynasties for!"',
    mood: 6,
    tag: 'PRAISE',
  },
  {
    archetype: 'legacy_obsessed',
    emoji: '😠',
    msg: 'Owner embarrassed by losing season — threatens front office changes.',
    mood: -6,
    tag: 'WARNING',
  },
];

// ─── Check for events ─────────────────────────────────────────────────────

export function getOwnerEvents(owner: OwnerProfile): OwnerEvent[] {
  return EVENT_TEMPLATES.filter(e => e.archetype === owner.archetype);
}

export function applyOwnerEvent(owner: OwnerProfile, event: OwnerEvent): OwnerProfile {
  return {
    ...owner,
    mood: Math.max(0, Math.min(100, owner.mood + event.mood)),
  };
}

export function getMoodLabel(mood: number): { label: string; color: string } {
  if (mood >= 80) return { label: 'Ecstatic', color: '#22c55e' };
  if (mood >= 60) return { label: 'Pleased', color: '#a3e635' };
  if (mood >= 40) return { label: 'Neutral', color: '#eab308' };
  if (mood >= 20) return { label: 'Frustrated', color: '#f97316' };
  return { label: 'Furious', color: '#ef4444' };
}

export function getFiringRisk(mood: number): { label: string; color: string; pct: number } {
  if (mood >= 60) return { label: 'None', color: '#22c55e', pct: 0 };
  if (mood >= 40) return { label: 'Low', color: '#eab308', pct: 10 };
  if (mood >= 25) return { label: 'Moderate', color: '#f97316', pct: 30 };
  if (mood >= 10) return { label: 'High', color: '#ef4444', pct: 60 };
  return { label: 'Imminent', color: '#dc2626', pct: 90 };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoOwner(): OwnerProfile {
  return {
    name: 'Charles Wellington III',
    archetype: 'win_now',
    mood: 62,
    tenureSeason: 3,
  };
}

export function generateDemoEventHistory(): OwnerEventResult[] {
  const owner = generateDemoOwner();
  const events = getOwnerEvents(owner);
  return events.map((e, i) => ({
    ...e,
    ownerName: owner.name,
    season: 2025,
    week: (i + 1) * 4,
  }));
}
