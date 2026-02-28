// ─── Stadium Upgrades ─────────────────────────────────────────────────────
// Ballpark features, revenue modifiers, and fan experience improvements.

export interface StadiumUpgrade {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  cost: number;        // $M
  revenueBoost: number; // $M per season
  fanBoost: number;     // satisfaction points
  category: UpgradeCategory;
  tier: 1 | 2 | 3;
}

export type UpgradeCategory = 'seating' | 'concessions' | 'technology' | 'entertainment' | 'facilities';

export const CATEGORY_DISPLAY: Record<UpgradeCategory, { label: string; color: string; emoji: string }> = {
  seating:       { label: 'Seating', color: '#3b82f6', emoji: '💺' },
  concessions:   { label: 'Concessions', color: '#f97316', emoji: '🍔' },
  technology:    { label: 'Technology', color: '#a855f7', emoji: '📱' },
  entertainment: { label: 'Entertainment', color: '#22c55e', emoji: '🎵' },
  facilities:    { label: 'Facilities', color: '#eab308', emoji: '🏗️' },
};

export const UPGRADES: StadiumUpgrade[] = [
  // Seating
  { id: 'luxury_suites', label: 'Luxury Suites', emoji: '🏢', desc: 'Premium seating with catering service', cost: 25, revenueBoost: 5, fanBoost: 3, category: 'seating', tier: 2 },
  { id: 'rooftop_deck', label: 'Rooftop Deck', emoji: '🌇', desc: 'Open-air viewing with city skyline views', cost: 15, revenueBoost: 3, fanBoost: 5, category: 'seating', tier: 1 },
  { id: 'party_suites', label: 'Party Suites', emoji: '🎉', desc: 'Group-friendly premium sections', cost: 20, revenueBoost: 4, fanBoost: 4, category: 'seating', tier: 2 },
  { id: 'dugout_seats', label: 'Dugout Club Seats', emoji: '⚾', desc: 'Field-level premium experience', cost: 35, revenueBoost: 8, fanBoost: 3, category: 'seating', tier: 3 },

  // Concessions
  { id: 'craft_beer', label: 'Craft Beer Garden', emoji: '🍺', desc: 'Local brewery partnerships', cost: 8, revenueBoost: 2, fanBoost: 4, category: 'concessions', tier: 1 },
  { id: 'food_hall', label: 'Food Hall', emoji: '🍕', desc: 'Celebrity chef food court', cost: 12, revenueBoost: 3, fanBoost: 5, category: 'concessions', tier: 1 },
  { id: 'mobile_ordering', label: 'Mobile Ordering', emoji: '📲', desc: 'Skip-the-line app ordering', cost: 5, revenueBoost: 1, fanBoost: 6, category: 'concessions', tier: 1 },

  // Technology
  { id: 'video_board', label: 'HD Video Board', emoji: '📺', desc: 'State-of-the-art 4K display', cost: 30, revenueBoost: 4, fanBoost: 5, category: 'technology', tier: 2 },
  { id: 'wifi_upgrade', label: 'Stadium-Wide WiFi', emoji: '📶', desc: '5G connectivity throughout', cost: 10, revenueBoost: 1, fanBoost: 7, category: 'technology', tier: 1 },
  { id: 'ar_experience', label: 'AR Experience', emoji: '🥽', desc: 'Augmented reality stat overlays in-seat', cost: 20, revenueBoost: 2, fanBoost: 6, category: 'technology', tier: 2 },
  { id: 'replay_system', label: 'Multi-Angle Replay', emoji: '🎬', desc: 'Fan-controlled replay angles on personal device', cost: 15, revenueBoost: 1, fanBoost: 5, category: 'technology', tier: 2 },

  // Entertainment
  { id: 'kids_zone', label: 'Kids Zone', emoji: '🎡', desc: 'Family-friendly play area', cost: 8, revenueBoost: 2, fanBoost: 6, category: 'entertainment', tier: 1 },
  { id: 'mascot_hq', label: 'Mascot HQ', emoji: '🐻', desc: 'Interactive mascot experience', cost: 5, revenueBoost: 1, fanBoost: 4, category: 'entertainment', tier: 1 },
  { id: 'hall_of_fame', label: 'Team Museum', emoji: '🏛️', desc: 'Interactive franchise history museum', cost: 18, revenueBoost: 2, fanBoost: 8, category: 'entertainment', tier: 2 },

  // Facilities
  { id: 'clubhouse_upgrade', label: 'Clubhouse Upgrade', emoji: '🏠', desc: 'Modern player facilities', cost: 20, revenueBoost: 0, fanBoost: 2, category: 'facilities', tier: 2 },
  { id: 'training_center', label: 'Training Center', emoji: '🏋️', desc: 'World-class workout and recovery', cost: 25, revenueBoost: 0, fanBoost: 1, category: 'facilities', tier: 2 },
  { id: 'field_turf', label: 'Premium Playing Surface', emoji: '🌿', desc: 'State-of-the-art hybrid grass surface', cost: 12, revenueBoost: 0, fanBoost: 3, category: 'facilities', tier: 1 },
  { id: 'retractable_roof', label: 'Retractable Roof', emoji: '☂️', desc: 'Weather-proof the stadium', cost: 80, revenueBoost: 6, fanBoost: 8, category: 'facilities', tier: 3 },
];

export interface StadiumState {
  name: string;
  capacity: number;
  builtYear: number;
  level: number;
  installedUpgrades: string[];
  totalInvested: number;
  totalRevenueBoost: number;
  totalFanBoost: number;
}

export function initStadium(): StadiumState {
  return {
    name: 'Dynasty Field',
    capacity: 42000,
    builtYear: 2015,
    level: 1,
    installedUpgrades: [],
    totalInvested: 0,
    totalRevenueBoost: 0,
    totalFanBoost: 0,
  };
}

export function installUpgrade(state: StadiumState, upgrade: StadiumUpgrade): StadiumState {
  if (state.installedUpgrades.includes(upgrade.id)) return state;
  const newInstalled = [...state.installedUpgrades, upgrade.id];
  const level = Math.min(5, 1 + Math.floor(newInstalled.length / 3));
  return {
    ...state,
    installedUpgrades: newInstalled,
    totalInvested: state.totalInvested + upgrade.cost,
    totalRevenueBoost: state.totalRevenueBoost + upgrade.revenueBoost,
    totalFanBoost: state.totalFanBoost + upgrade.fanBoost,
    level,
  };
}

export function getStadiumLevel(state: StadiumState): { label: string; color: string } {
  const levels = [
    { label: 'Basic', color: '#94a3b8' },
    { label: 'Improved', color: '#22c55e' },
    { label: 'Modern', color: '#3b82f6' },
    { label: 'Premium', color: '#f59e0b' },
    { label: 'World-Class', color: '#ef4444' },
  ];
  return levels[Math.min(state.level - 1, levels.length - 1)];
}
