/**
 * Fan Engagement System
 *
 * Tracks attendance, merchandise sales, social media following,
 * and overall fan satisfaction. Performance, star power, and
 * marketing decisions drive fan engagement.
 *
 * Original baseball-specific system.
 */

export interface FanMetrics {
  attendance: number;        // avg per game
  attendancePct: number;     // % of capacity
  merchSales: number;        // $M per season
  socialFollowers: number;   // thousands
  satisfaction: number;      // 0-100
  seasonTickets: number;     // thousands
  tvRatings: number;         // 0-10 scale
  marketRank: number;        // 1-30
}

export interface FanEvent {
  label: string;
  icon: string;
  delta: number;
  category: 'attendance' | 'merch' | 'social' | 'satisfaction';
}

export interface FanPromotion {
  id: string;
  label: string;
  icon: string;
  cost: number;
  attendanceBoost: number;
  merchBoost: number;
  socialBoost: number;
  desc: string;
}

export const PROMOTIONS: FanPromotion[] = [
  { id: 'bobblehead',  label: 'Bobblehead Night',     icon: '🧸', cost: 0.2, attendanceBoost: 8, merchBoost: 3, socialBoost: 2, desc: 'Star player bobblehead giveaway' },
  { id: 'fireworks',   label: 'Fireworks Night',       icon: '🎆', cost: 0.1, attendanceBoost: 10, merchBoost: 1, socialBoost: 3, desc: 'Post-game fireworks show' },
  { id: 'jersey',      label: 'Free Jersey Night',     icon: '👕', cost: 0.5, attendanceBoost: 12, merchBoost: 5, socialBoost: 4, desc: 'Replica jersey for first 20,000 fans' },
  { id: 'dollar_dog',  label: 'Dollar Dog Night',      icon: '🌭', cost: 0.05, attendanceBoost: 6, merchBoost: 0, socialBoost: 1, desc: '$1 hot dogs all game' },
  { id: 'alumni',      label: 'Alumni Weekend',        icon: '🎖️', cost: 0.3, attendanceBoost: 7, merchBoost: 4, socialBoost: 5, desc: 'Franchise legends return for a weekend' },
  { id: 'social_day',  label: 'Social Media Day',      icon: '📱', cost: 0.1, attendanceBoost: 3, merchBoost: 2, socialBoost: 8, desc: 'Fan takeovers, live streams, giveaways' },
  { id: 'youth',       label: 'Youth Baseball Clinic', icon: '⚾', cost: 0.15, attendanceBoost: 4, merchBoost: 2, socialBoost: 3, desc: 'Free clinic before the game' },
  { id: 'retro',       label: 'Throwback Jersey Night', icon: '🕰️', cost: 0.4, attendanceBoost: 9, merchBoost: 6, socialBoost: 4, desc: 'Team wears vintage uniforms' },
];

export function initFanMetrics(): FanMetrics {
  return {
    attendance: 28000,
    attendancePct: 68,
    merchSales: 12,
    socialFollowers: 450,
    satisfaction: 55,
    seasonTickets: 18,
    tvRatings: 4.5,
    marketRank: 15,
  };
}

export function updateFanMetrics(
  metrics: FanMetrics,
  winPct: number,
  starPower: number,
  isPlayoffContender: boolean,
): FanMetrics {
  const updated = { ...metrics };

  // Win percentage drives satisfaction
  const targetSat = Math.min(95, Math.max(20, winPct * 120 + starPower * 2));
  updated.satisfaction = Math.round(updated.satisfaction + (targetSat - updated.satisfaction) * 0.3);

  // Attendance follows satisfaction
  const baseCap = 42000;
  updated.attendancePct = Math.min(100, Math.max(40, updated.satisfaction + (isPlayoffContender ? 10 : 0)));
  updated.attendance = Math.round(baseCap * updated.attendancePct / 100);

  // Merch follows star power and winning
  updated.merchSales = Math.round((8 + starPower * 0.5 + winPct * 15) * 10) / 10;

  // Social follows everything
  updated.socialFollowers = Math.round(300 + updated.satisfaction * 5 + starPower * 10);

  // Season tickets
  updated.seasonTickets = Math.round(10 + updated.satisfaction * 0.2);

  // TV ratings
  updated.tvRatings = Math.round((2 + winPct * 5 + starPower * 0.3) * 10) / 10;

  return updated;
}

export function applyPromotion(metrics: FanMetrics, promo: FanPromotion): FanMetrics {
  return {
    ...metrics,
    attendancePct: Math.min(100, metrics.attendancePct + promo.attendanceBoost),
    attendance: Math.round(42000 * Math.min(100, metrics.attendancePct + promo.attendanceBoost) / 100),
    merchSales: Math.round((metrics.merchSales + promo.merchBoost * 0.5) * 10) / 10,
    socialFollowers: metrics.socialFollowers + promo.socialBoost * 10,
  };
}

export function getFanSummary(metrics: FanMetrics) {
  const tier = metrics.satisfaction >= 80 ? 'Electric' :
    metrics.satisfaction >= 60 ? 'Engaged' :
    metrics.satisfaction >= 40 ? 'Lukewarm' : 'Apathetic';

  const tierColor = metrics.satisfaction >= 80 ? '#22c55e' :
    metrics.satisfaction >= 60 ? '#eab308' :
    metrics.satisfaction >= 40 ? '#f97316' : '#ef4444';

  return { tier, tierColor };
}
