/**
 * milbAffiliates.ts – Minor league affiliate dashboard
 *
 * Tracks team performance across all MiLB levels (AAA, AA, A+, A, Rk),
 * including W-L records, top performers, and development notes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type MiLBLevel = 'AAA' | 'AA' | 'A+' | 'A' | 'Rk';

export interface TopPerformer {
  name: string;
  pos: string;
  stat: string;      // e.g. ".312 / 22 HR" or "2.85 ERA / 145 K"
  prospect: boolean;  // is on prospect list
}

export interface AffiliateTeam {
  id: string;
  level: MiLBLevel;
  teamName: string;
  league: string;
  wins: number;
  losses: number;
  runDiff: number;
  playoffContender: boolean;
  topHitter: TopPerformer;
  topPitcher: TopPerformer;
  promotionsOut: number;   // players promoted up
  promotionsIn: number;    // players demoted/assigned in
  devScore: number;        // 0-100 development effectiveness
  notes: string;
}

export interface MiLBAffiliateSummary {
  totalWins: number;
  totalLosses: number;
  bestLevel: string;
  playoffTeams: number;
  promotionActivity: number;
  avgDevScore: number;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export function getMiLBSummary(affiliates: AffiliateTeam[]): MiLBAffiliateSummary {
  const totalW = affiliates.reduce((s, a) => s + a.wins, 0);
  const totalL = affiliates.reduce((s, a) => s + a.losses, 0);
  const best = affiliates.reduce((a, b) => {
    const aPct = a.wins / (a.wins + a.losses);
    const bPct = b.wins / (b.wins + b.losses);
    return aPct > bPct ? a : b;
  });
  const playoffs = affiliates.filter(a => a.playoffContender).length;
  const promos = affiliates.reduce((s, a) => s + a.promotionsOut + a.promotionsIn, 0);
  const avgDev = affiliates.reduce((s, a) => s + a.devScore, 0) / affiliates.length;

  return {
    totalWins: totalW,
    totalLosses: totalL,
    bestLevel: best.level,
    playoffTeams: playoffs,
    promotionActivity: promos,
    avgDevScore: Math.round(avgDev),
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoMiLBAffiliates(): AffiliateTeam[] {
  return [
    {
      id: 'aaa', level: 'AAA', teamName: 'Syracuse Mets', league: 'International League',
      wins: 72, losses: 58, runDiff: 45, playoffContender: true,
      topHitter: { name: 'Brett Baty', pos: '3B', stat: '.295 / 18 HR / 72 RBI', prospect: true },
      topPitcher: { name: 'Jose Butto', pos: 'RHP', stat: '3.28 ERA / 142 K / 155 IP', prospect: true },
      promotionsOut: 8, promotionsIn: 5, devScore: 82,
      notes: 'Strong affiliate season. Multiple MLB-ready arms. Baty and Butto leading the charge. Playoff contender.',
    },
    {
      id: 'aa', level: 'AA', teamName: 'Binghamton Rumble Ponies', league: 'Eastern League',
      wins: 68, losses: 62, runDiff: 22, playoffContender: true,
      topHitter: { name: 'Drew Gilbert', pos: 'OF', stat: '.282 / 15 HR / 58 RBI', prospect: true },
      topPitcher: { name: 'Brandon Sproat', pos: 'RHP', stat: '3.45 ERA / 128 K / 138 IP', prospect: true },
      promotionsOut: 6, promotionsIn: 4, devScore: 78,
      notes: 'Solid development level. Gilbert showing everyday CF potential. Sproat projecting as mid-rotation arm.',
    },
    {
      id: 'aplus', level: 'A+', teamName: 'Brooklyn Cyclones', league: 'South Atlantic League',
      wins: 75, losses: 55, runDiff: 62, playoffContender: true,
      topHitter: { name: 'Jett Williams', pos: 'SS', stat: '.305 / 12 HR / 65 RBI', prospect: true },
      topPitcher: { name: 'Blade Tidwell', pos: 'RHP', stat: '2.95 ERA / 155 K / 145 IP', prospect: true },
      promotionsOut: 7, promotionsIn: 3, devScore: 88,
      notes: 'Best affiliate. Williams is a future star. Tidwell dominating his level. Elite development environment.',
    },
    {
      id: 'a', level: 'A', teamName: 'St. Lucie Mets', league: 'Florida State League',
      wins: 58, losses: 72, runDiff: -28, playoffContender: false,
      topHitter: { name: 'Marco Vargas', pos: 'SS', stat: '.265 / 8 HR / 45 RBI', prospect: false },
      topPitcher: { name: 'Dom Hamel', pos: 'LHP', stat: '3.82 ERA / 118 K / 125 IP', prospect: true },
      promotionsOut: 4, promotionsIn: 6, devScore: 65,
      notes: 'Rebuilding year at Low-A. Focus is on development, not wins. Hamel showing flashes but inconsistent.',
    },
    {
      id: 'rk', level: 'Rk', teamName: 'FCL Mets', league: 'Florida Complex League',
      wins: 32, losses: 28, runDiff: 15, playoffContender: false,
      topHitter: { name: 'Kevin Parada', pos: 'C', stat: '.278 / 5 HR / 28 RBI', prospect: true },
      topPitcher: { name: 'Christian Scott', pos: 'RHP', stat: '2.45 ERA / 62 K / 52 IP', prospect: true },
      promotionsOut: 3, promotionsIn: 8, devScore: 75,
      notes: 'Entry-level affiliate doing well. Parada adjusting to pro ball. Scott cruising through early looks.',
    },
  ];
}
