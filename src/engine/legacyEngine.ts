/**
 * legacyEngine.ts — Legacy Score, GM Skill Tree, Achievements
 *
 * Long-term progression systems that reward sustained dynasty play.
 * Pure functions, deterministic.
 */

import type { SeasonSummary } from '../store/leagueStore';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY SCORE
// ═══════════════════════════════════════════════════════════════════════════

export interface LegacyScoreBreakdown {
  championships: number;
  playoffAppearances: number;
  winPercentage: number;
  awardsEarned: number;
  consistency: number;       // bonus for sustained winning
  total: number;
}

/**
 * Calculate Legacy Score from franchise history.
 * Championships weighted most, but sustained excellence counts.
 */
export function calculateLegacyScore(history: SeasonSummary[]): LegacyScoreBreakdown {
  if (history.length === 0) {
    return { championships: 0, playoffAppearances: 0, winPercentage: 0, awardsEarned: 0, consistency: 0, total: 0 };
  }

  const champs = history.filter(h => h.playoffResult === 'Champion').length;
  const playoffs = history.filter(h => h.playoffResult !== null).length;
  const totalWins = history.reduce((s, h) => s + h.wins, 0);
  const totalGames = history.reduce((s, h) => s + h.wins + h.losses, 0);
  const pct = totalGames > 0 ? totalWins / totalGames : 0;
  const awards = history.reduce((s, h) => s + h.awardsWon.length, 0);

  // Consistency: consecutive winning seasons (81+ wins)
  let maxStreak = 0, currentStreak = 0;
  for (const h of [...history].reverse()) {
    if (h.wins >= 81) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else { currentStreak = 0; }
  }

  const champScore = champs * 250;
  const playoffScore = playoffs * 40;
  const pctScore = Math.round(pct * 200);
  const awardScore = Math.min(awards * 15, 150);  // cap
  const consistScore = maxStreak * 20;

  return {
    championships: champScore,
    playoffAppearances: playoffScore,
    winPercentage: pctScore,
    awardsEarned: awardScore,
    consistency: consistScore,
    total: champScore + playoffScore + pctScore + awardScore + consistScore,
  };
}

/**
 * Get legacy tier from score.
 */
export function getLegacyTier(score: number): { tier: string; color: string } {
  if (score >= 1000) return { tier: 'LEGENDARY', color: '#fbbf24' };
  if (score >= 600)  return { tier: 'ELITE', color: '#f97316' };
  if (score >= 350)  return { tier: 'ESTABLISHED', color: '#4ade80' };
  if (score >= 150)  return { tier: 'RISING', color: '#60a5fa' };
  if (score >= 50)   return { tier: 'ROOKIE GM', color: '#94a3b8' };
  return { tier: 'UNPROVEN', color: '#6b7280' };
}

// ═══════════════════════════════════════════════════════════════════════════
// GM SKILL TREE
// ═══════════════════════════════════════════════════════════════════════════

export interface GMSkill {
  id: string;
  name: string;
  category: 'scouting' | 'development' | 'negotiation' | 'analytics' | 'leadership';
  description: string;
  requirement: string;
  icon: string;
  unlocked: boolean;
}

export interface GMSkillProgress {
  tradesCompleted: number;
  prospectsPromoted: number;
  playoffAppearances: number;
  championships: number;
  seasonsManaged: number;
  awards: number;
  winStreakBest: number;
  divisionsWon: number;
  /** Low payroll wins (90+ wins with bottom-5 payroll) */
  moneyballSeasons: number;
}

const SKILL_DEFINITIONS: Omit<GMSkill, 'unlocked'>[] = [
  // Scouting
  { id: 'eagle_eye', name: 'Eagle Eye', category: 'scouting', description: '+5% scouting accuracy', requirement: 'Manage 3 seasons', icon: '🔍' },
  { id: 'hidden_gems', name: 'Hidden Gems', category: 'scouting', description: 'See one extra trait per prospect', requirement: 'Promote 5 prospects to MLB', icon: '💎' },
  { id: 'intl_network', name: 'Intl Network', category: 'scouting', description: 'Better international scouting', requirement: 'Manage 5 seasons', icon: '🌎' },
  // Development
  { id: 'prospect_whisperer', name: 'Prospect Whisperer', category: 'development', description: '+3% development speed', requirement: 'Promote 10 MLB-ready prospects', icon: '🌱' },
  { id: 'fast_track', name: 'Fast Track', category: 'development', description: 'Aggressive promo risk reduced', requirement: '3 playoff appearances', icon: '🚀' },
  { id: 'iron_pipeline', name: 'Iron Pipeline', category: 'development', description: '+5% dev program effectiveness', requirement: 'Win a championship', icon: '⚙️' },
  // Negotiation
  { id: 'trade_shark', name: 'Trade Shark', category: 'negotiation', description: '+5% trade offer quality', requirement: 'Complete 10 trades', icon: '🦈' },
  { id: 'closer', name: 'The Closer', category: 'negotiation', description: 'Better FA negotiation outcomes', requirement: 'Complete 20 trades', icon: '🤝' },
  { id: 'dealmaker', name: 'Dealmaker', category: 'negotiation', description: 'Unlock multi-team trades', requirement: '5 playoff appearances', icon: '📞' },
  // Analytics
  { id: 'moneyball', name: 'Moneyball', category: 'analytics', description: 'Unlock advanced projections', requirement: 'Win division with bottom-5 payroll', icon: '📊' },
  { id: 'edge_finder', name: 'Edge Finder', category: 'analytics', description: 'See WAR projections in trades', requirement: 'Manage 5 seasons', icon: '📈' },
  { id: 'market_maker', name: 'Market Maker', category: 'analytics', description: 'Better FA market intelligence', requirement: 'Win 3 awards', icon: '💹' },
  // Leadership
  { id: 'players_manager', name: "Player's Manager", category: 'leadership', description: '+10% morale boost', requirement: 'Win 2 championships', icon: '🧢' },
  { id: 'culture_builder', name: 'Culture Builder', category: 'leadership', description: 'Higher chemistry ceiling', requirement: '5 winning seasons in a row', icon: '🏛️' },
  { id: 'dynasty_architect', name: 'Dynasty Architect', category: 'leadership', description: 'Unlock franchise milestones', requirement: 'Win 3 championships', icon: '👑' },
];

/**
 * Evaluate which GM skills are unlocked based on progress.
 */
export function evaluateGMSkills(progress: GMSkillProgress): GMSkill[] {
  return SKILL_DEFINITIONS.map(def => {
    let unlocked = false;
    switch (def.id) {
      case 'eagle_eye': unlocked = progress.seasonsManaged >= 3; break;
      case 'hidden_gems': unlocked = progress.prospectsPromoted >= 5; break;
      case 'intl_network': unlocked = progress.seasonsManaged >= 5; break;
      case 'prospect_whisperer': unlocked = progress.prospectsPromoted >= 10; break;
      case 'fast_track': unlocked = progress.playoffAppearances >= 3; break;
      case 'iron_pipeline': unlocked = progress.championships >= 1; break;
      case 'trade_shark': unlocked = progress.tradesCompleted >= 10; break;
      case 'closer': unlocked = progress.tradesCompleted >= 20; break;
      case 'dealmaker': unlocked = progress.playoffAppearances >= 5; break;
      case 'moneyball': unlocked = progress.moneyballSeasons >= 1; break;
      case 'edge_finder': unlocked = progress.seasonsManaged >= 5; break;
      case 'market_maker': unlocked = progress.awards >= 3; break;
      case 'players_manager': unlocked = progress.championships >= 2; break;
      case 'culture_builder': unlocked = progress.winStreakBest >= 5; break;
      case 'dynasty_architect': unlocked = progress.championships >= 3; break;
    }
    return { ...def, unlocked };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'dynasty' | 'development' | 'transactions' | 'records' | 'special';
  earned: boolean;
  progress?: number;  // 0-1 for in-progress
  progressLabel?: string;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'earned' | 'progress' | 'progressLabel'>[] = [
  // Dynasty
  { id: 'first_ring', name: 'Ring Bearer', description: 'Win your first World Series', icon: '💍', category: 'dynasty' },
  { id: 'dynasty', name: 'Dynasty', description: 'Win 3 championships in 5 years', icon: '👑', category: 'dynasty' },
  { id: 'repeat', name: 'Back to Back', description: 'Win consecutive championships', icon: '🏆🏆', category: 'dynasty' },
  { id: 'century', name: 'Century Club', description: 'Win 100+ games in a season', icon: '💯', category: 'dynasty' },
  { id: 'playoff_streak', name: 'October Regular', description: 'Make playoffs 5 years in a row', icon: '🍂', category: 'dynasty' },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Win WS after a last-place finish', icon: '🔄', category: 'dynasty' },
  // Development
  { id: 'architect', name: 'Architect', description: 'Promote 10 homegrown MLB players', icon: '🏗️', category: 'development' },
  { id: 'prospect_guru', name: 'Prospect Guru', description: 'Develop a 70+ OVR prospect', icon: '⭐', category: 'development' },
  { id: 'pipeline_king', name: 'Pipeline King', description: 'Have 5 prospects rated 60+ simultaneously', icon: '🏭', category: 'development' },
  { id: 'golden_arm', name: 'Golden Arm', description: 'Develop a Cy Young winner', icon: '💪', category: 'development' },
  { id: 'slugger_factory', name: 'Slugger Factory', description: 'Develop a 40+ HR hitter', icon: '💥', category: 'development' },
  // Transactions
  { id: 'wheeler_dealer', name: 'Wheeler Dealer', description: 'Complete 25 trades', icon: '🤝', category: 'transactions' },
  { id: 'highway_robbery', name: 'Highway Robbery', description: 'Win a trade by 20+ fairness points', icon: '🏴‍☠️', category: 'transactions' },
  { id: 'moneyball_ach', name: 'Moneyball', description: 'Win 90+ games with bottom-3 payroll', icon: '💰', category: 'transactions' },
  { id: 'big_spender', name: 'Big Spender', description: 'Sign a $200M+ free agent contract', icon: '💸', category: 'transactions' },
  { id: 'fire_sale', name: 'Fire Sale', description: 'Trade 5+ players in one deadline', icon: '🔥', category: 'transactions' },
  // Records
  { id: 'iron_man', name: 'Iron Man', description: 'Manage 10 consecutive seasons', icon: '🦾', category: 'records' },
  { id: 'hall_of_fame', name: 'Hall of Fame', description: 'Induct a player to franchise HoF', icon: '🏛️', category: 'records' },
  { id: 'triple_crown', name: 'Triple Crown', description: 'Player wins batting triple crown', icon: '👑', category: 'records' },
  { id: 'perfect_month', name: 'Perfect Month', description: 'Go undefeated in a monthly advance', icon: '✨', category: 'records' },
  // Special
  { id: 'survivor', name: 'Survivor', description: 'Avoid being fired for 5 seasons', icon: '🛡️', category: 'special' },
  { id: 'hot_seat_hero', name: 'Hot Seat Hero', description: 'Win WS with owner patience below 20', icon: '🪑', category: 'special' },
  { id: 'rebuild_master', name: 'Rebuild Master', description: 'Go from last place to playoffs in 2 years', icon: '📈', category: 'special' },
  { id: 'award_collector', name: 'Award Collector', description: 'Win 10 individual player awards', icon: '🏅', category: 'special' },
  { id: 'consistency', name: 'Model Franchise', description: 'Never have a losing season in 5+ years', icon: '📐', category: 'special' },
];

/**
 * Evaluate which achievements are earned.
 */
export function evaluateAchievements(
  history: SeasonSummary[],
  seasonsManaged: number,
  tradesCompleted: number,
  prospectsPromoted: number,
  ownerPatience: number,
): Achievement[] {
  const champs = history.filter(h => h.playoffResult === 'Champion');
  const totalAwards = history.reduce((s, h) => s + h.awardsWon.length, 0);
  const reversed = [...history].reverse(); // chronological order

  // Check for consecutive championships
  let hasRepeat = false;
  for (let i = 1; i < reversed.length; i++) {
    if (reversed[i].playoffResult === 'Champion' && reversed[i-1].playoffResult === 'Champion') {
      hasRepeat = true; break;
    }
  }

  // Check for dynasty (3 in 5)
  let hasDynasty = false;
  for (let i = 0; i <= reversed.length - 5; i++) {
    const window = reversed.slice(i, i + 5);
    if (window.filter(h => h.playoffResult === 'Champion').length >= 3) {
      hasDynasty = true; break;
    }
  }

  // Consecutive playoff streak
  let maxPlayoffStreak = 0, curPlayoffStreak = 0;
  for (const h of reversed) {
    if (h.playoffResult) { curPlayoffStreak++; maxPlayoffStreak = Math.max(maxPlayoffStreak, curPlayoffStreak); }
    else { curPlayoffStreak = 0; }
  }

  // Consecutive winning streak
  let maxWinStreak = 0, curWinStreak = 0;
  for (const h of reversed) {
    if (h.wins >= 81) { curWinStreak++; maxWinStreak = Math.max(maxWinStreak, curWinStreak); }
    else { curWinStreak = 0; }
  }

  const has100 = history.some(h => h.wins >= 100);

  return ACHIEVEMENT_DEFS.map(def => {
    let earned = false;
    let progress: number | undefined;
    let progressLabel: string | undefined;

    switch (def.id) {
      case 'first_ring': earned = champs.length >= 1; break;
      case 'dynasty': earned = hasDynasty; progress = Math.min(1, champs.length / 3); progressLabel = `${champs.length}/3 rings`; break;
      case 'repeat': earned = hasRepeat; break;
      case 'century': earned = has100; break;
      case 'playoff_streak': earned = maxPlayoffStreak >= 5; progress = Math.min(1, maxPlayoffStreak / 5); progressLabel = `${maxPlayoffStreak}/5 consecutive`; break;
      case 'comeback_kid': {
        // check for last-place then champion within 2 years
        for (let i = 1; i < reversed.length; i++) {
          if (reversed[i].playoffResult === 'Champion' && reversed[i-1].wins <= 65) { earned = true; break; }
        }
        break;
      }
      case 'architect': earned = prospectsPromoted >= 10; progress = Math.min(1, prospectsPromoted / 10); progressLabel = `${prospectsPromoted}/10`; break;
      case 'wheeler_dealer': earned = tradesCompleted >= 25; progress = Math.min(1, tradesCompleted / 25); progressLabel = `${tradesCompleted}/25`; break;
      case 'iron_man': earned = seasonsManaged >= 10; progress = Math.min(1, seasonsManaged / 10); progressLabel = `${seasonsManaged}/10`; break;
      case 'survivor': earned = seasonsManaged >= 5; progress = Math.min(1, seasonsManaged / 5); progressLabel = `${seasonsManaged}/5`; break;
      case 'hot_seat_hero': earned = champs.length > 0 && ownerPatience < 20; break;
      case 'award_collector': earned = totalAwards >= 10; progress = Math.min(1, totalAwards / 10); progressLabel = `${totalAwards}/10`; break;
      case 'consistency': earned = maxWinStreak >= 5; progress = Math.min(1, maxWinStreak / 5); progressLabel = `${maxWinStreak}/5 winning seasons`; break;
      // Others require deeper game state — leave as unearned with progress tracking
      default: break;
    }

    return { ...def, earned, progress, progressLabel };
  });
}
