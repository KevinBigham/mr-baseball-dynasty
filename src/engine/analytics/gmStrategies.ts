/**
 * GM Strategies — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's GM strategy system.
 * Three strategic postures that affect trade AI, free agency, and roster management:
 *   - Rebuild: Sell veterans, stockpile prospects + draft picks, maximize flexibility
 *   - Contend: Buy rentals, target high-OVR players, accept luxury tax pain for wins now
 *   - Balanced: No strong lean — evaluate opportunities case by case
 *
 * Each strategy auto-adjusts trade block status and influences AI behavior.
 */

import type { Player } from '../../types/player';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GMStrategyId = 'rebuild' | 'contend' | 'balanced';

export interface GMStrategy {
  id:            GMStrategyId;
  label:         string;
  desc:          string;
  tradePosture:  'seller' | 'buyer' | 'neutral';
  youthBias:     boolean;
  capMode:       'flexible' | 'aggressive' | 'balanced';
  icon:          string;
}

export interface GMStrategyEffect {
  tradeBlock:        number[];  // Player IDs to put on trade block
  protectedList:     number[];  // Player IDs to protect from trades
  faTargetMinOvr:    number;    // Minimum OVR for free agent targets
  draftPickValue:    number;    // Multiplier on draft pick value (1.0 = normal)
  prospectPremium:   number;    // Multiplier on prospect valuation
}

// ─── Strategy Definitions ─────────────────────────────────────────────────────

export const GM_STRATEGIES: Record<GMStrategyId, GMStrategy> = {
  rebuild: {
    id: 'rebuild',
    label: 'Rebuild Mode',
    desc: 'Shop veterans, favor youth + picks, maximize payroll flexibility',
    tradePosture: 'seller',
    youthBias: true,
    capMode: 'flexible',
    icon: '🔨',
  },
  contend: {
    id: 'contend',
    label: 'Contend Mode',
    desc: 'Buy rentals, favor high OVR, accept luxury tax pain for wins now',
    tradePosture: 'buyer',
    youthBias: false,
    capMode: 'aggressive',
    icon: '🏆',
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    desc: 'No strong lean — evaluate opportunities case by case',
    tradePosture: 'neutral',
    youthBias: false,
    capMode: 'balanced',
    icon: '⚖️',
  },
};

// ─── Apply Strategy ───────────────────────────────────────────────────────────

export function applyGMStrategy(
  strategyId: GMStrategyId,
  roster: Player[],
): GMStrategyEffect {
  const tradeBlock: number[] = [];
  const protectedList: number[] = [];

  switch (strategyId) {
    case 'rebuild': {
      // Trade block: veterans (28+) with decent OVR (can get value back)
      // Protect: young high-potential players
      for (const p of roster) {
        if (p.age >= 28 && p.overall >= 55) {
          tradeBlock.push(p.playerId);
        }
        if (p.age <= 25 && p.potential >= 60) {
          protectedList.push(p.playerId);
        }
      }
      return {
        tradeBlock,
        protectedList,
        faTargetMinOvr: 0,       // Don't target expensive FAs
        draftPickValue: 1.5,     // Value picks more
        prospectPremium: 1.4,    // Value prospects more
      };
    }
    case 'contend': {
      // Trade block: underperforming vets (expendable)
      // Protect: core high-OVR players
      for (const p of roster) {
        if (p.overall < 50 && p.age >= 27) {
          tradeBlock.push(p.playerId);
        }
        if (p.overall >= 65) {
          protectedList.push(p.playerId);
        }
      }
      return {
        tradeBlock,
        protectedList,
        faTargetMinOvr: 60,      // Target quality FAs
        draftPickValue: 0.7,     // Willing to trade picks
        prospectPremium: 0.8,    // Willing to trade prospects
      };
    }
    case 'balanced':
    default: {
      // No auto trade block; protect franchise cornerstones
      for (const p of roster) {
        if (p.overall >= 70) {
          protectedList.push(p.playerId);
        }
      }
      return {
        tradeBlock,
        protectedList,
        faTargetMinOvr: 50,
        draftPickValue: 1.0,
        prospectPremium: 1.0,
      };
    }
  }
}

// ─── Strategy Recommendation ──────────────────────────────────────────────────

export function recommendStrategy(
  wins: number,
  losses: number,
  avgOvr: number,
  avgAge: number,
  farmStrength: number,  // 0-100
): { recommended: GMStrategyId; reasoning: string } {
  const winPct = wins / Math.max(1, wins + losses);
  const total = wins + losses;

  // Strong team, winning — contend
  if (winPct >= 0.555 && avgOvr >= 58 && total >= 40) {
    return { recommended: 'contend', reasoning: 'Winning record with strong roster — push for a title.' };
  }

  // Poor record, aging roster, weak farm — rebuild
  if (winPct < 0.450 && avgAge >= 29 && total >= 40) {
    return { recommended: 'rebuild', reasoning: 'Losing record with aging roster — time to retool.' };
  }

  // Poor record but young team — also rebuild but for different reason
  if (winPct < 0.430 && farmStrength >= 55 && total >= 40) {
    return { recommended: 'rebuild', reasoning: 'Young core developing — sell veterans and build around the farm.' };
  }

  // Default to balanced
  return { recommended: 'balanced', reasoning: 'Competitive but not dominant — stay flexible and evaluate opportunities.' };
}
