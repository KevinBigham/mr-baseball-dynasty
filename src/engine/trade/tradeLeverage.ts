/**
 * tradeLeverage.ts – Trade leverage index analysis
 *
 * Tracks negotiation leverage for trade partners based on
 * roster needs urgency, financial flexibility, prospect depth,
 * competitive window, and deadline pressure.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type LeverageGrade = 'strong' | 'moderate' | 'neutral' | 'weak' | 'desperate';

export interface LeverageFactor {
  factor: string;
  yourScore: number;     // 0-100
  theirScore: number;    // 0-100
  advantage: 'you' | 'them' | 'even';
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface TradePartnerLeverage {
  id: string;
  partnerTeam: string;
  partnerRecord: string;
  yourTeam: string;
  yourRecord: string;
  targetPlayer: string;
  targetPos: string;
  targetWAR: number;
  yourLeverage: LeverageGrade;
  theirLeverage: LeverageGrade;
  overallAdvantage: 'you' | 'them' | 'even';
  leverageScore: number;  // -50 to +50 (positive = your advantage)
  factors: LeverageFactor[];
  suggestedApproach: string;
  dealLikelihood: number; // 0-100
  notes: string;
}

export const LEVERAGE_GRADE_DISPLAY: Record<LeverageGrade, { label: string; color: string }> = {
  strong:    { label: 'Strong',    color: '#22c55e' },
  moderate:  { label: 'Moderate',  color: '#4ade80' },
  neutral:   { label: 'Neutral',   color: '#f59e0b' },
  weak:      { label: 'Weak',      color: '#f97316' },
  desperate: { label: 'Desperate', color: '#ef4444' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface TradeLeverageSummary {
  totalPartners: number;
  advantageCount: number;
  disadvantageCount: number;
  avgLeverageScore: number;
  bestTarget: string;
  bestTargetTeam: string;
}

export function getTradeLeverageSummary(partners: TradePartnerLeverage[]): TradeLeverageSummary {
  const advCount = partners.filter(p => p.overallAdvantage === 'you').length;
  const disCount = partners.filter(p => p.overallAdvantage === 'them').length;
  const avgScore = Math.round(partners.reduce((s, p) => s + p.leverageScore, 0) / partners.length);
  const best = partners.reduce((a, b) => a.leverageScore > b.leverageScore ? a : b, partners[0]);
  return {
    totalPartners: partners.length,
    advantageCount: advCount,
    disadvantageCount: disCount,
    avgLeverageScore: avgScore,
    bestTarget: best.targetPlayer,
    bestTargetTeam: best.partnerTeam,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const FACTOR_TEMPLATES: Array<{ factor: string; impact: 'high' | 'medium' | 'low' }> = [
  { factor: 'Roster Need Urgency', impact: 'high' },
  { factor: 'Financial Flexibility', impact: 'high' },
  { factor: 'Prospect Depth', impact: 'medium' },
  { factor: 'Competitive Window', impact: 'high' },
  { factor: 'Deadline Pressure', impact: 'medium' },
  { factor: 'Market Alternatives', impact: 'medium' },
  { factor: 'Contract Control', impact: 'low' },
];

const PARTNERS = [
  { team: 'CIN', record: '28-38', target: 'Jonathan India', pos: '2B', war: 2.8 },
  { team: 'OAK', record: '25-41', target: 'Mason Miller', pos: 'CL', war: 1.5 },
  { team: 'MIA', record: '30-36', target: 'Jazz Chisholm', pos: 'SS', war: 3.2 },
  { team: 'COL', record: '24-42', target: 'Ryan McMahon', pos: '3B', war: 2.5 },
  { team: 'CHW', record: '22-44', target: 'Garrett Crochet', pos: 'SP', war: 3.8 },
  { team: 'WSH', record: '31-35', target: 'CJ Abrams', pos: 'SS', war: 3.0 },
  { team: 'PIT', record: '29-37', target: 'Bryan Reynolds', pos: 'CF', war: 2.9 },
  { team: 'KC', record: '34-32', target: 'Brady Singer', pos: 'SP', war: 2.2 },
];

function makeGrade(score: number): LeverageGrade {
  if (score >= 75) return 'strong';
  if (score >= 55) return 'moderate';
  if (score >= 40) return 'neutral';
  if (score >= 25) return 'weak';
  return 'desperate';
}

export function generateDemoTradeLeverage(): TradePartnerLeverage[] {
  return PARTNERS.map((p, i) => {
    const factors: LeverageFactor[] = FACTOR_TEMPLATES.map((ft, j) => {
      const yours = 40 + ((i + j * 7) % 45);
      const theirs = 30 + ((i * 3 + j * 11) % 50);
      return {
        factor: ft.factor,
        yourScore: yours,
        theirScore: theirs,
        advantage: yours > theirs + 10 ? 'you' as const : theirs > yours + 10 ? 'them' as const : 'even' as const,
        impact: ft.impact,
        description: yours > theirs ? `You have the advantage in ${ft.factor.toLowerCase()}.` : `They hold the edge in ${ft.factor.toLowerCase()}.`,
      };
    });

    const leverageScore = Math.round(factors.reduce((s, f) => {
      const diff = f.yourScore - f.theirScore;
      const mult = f.impact === 'high' ? 1.5 : f.impact === 'medium' ? 1.0 : 0.5;
      return s + diff * mult / factors.length;
    }, 0));

    const yourGrade = makeGrade(60 + leverageScore);
    const theirGrade = makeGrade(60 - leverageScore);
    const advantage = leverageScore > 5 ? 'you' as const : leverageScore < -5 ? 'them' as const : 'even' as const;

    return {
      id: `tl-${i}`,
      partnerTeam: p.team,
      partnerRecord: p.record,
      yourTeam: 'NYY',
      yourRecord: '42-24',
      targetPlayer: p.target,
      targetPos: p.pos,
      targetWAR: p.war,
      yourLeverage: yourGrade,
      theirLeverage: theirGrade,
      overallAdvantage: advantage,
      leverageScore,
      factors,
      suggestedApproach: leverageScore > 10 ? 'Lowball initial offer. They need to sell.' :
                         leverageScore > 0 ? 'Fair offer with slight discount. You have modest leverage.' :
                         leverageScore > -10 ? 'Competitive offer needed. Leverage is balanced.' :
                         'Premium package required. They hold the cards.',
      dealLikelihood: 35 + ((i * 11) % 40),
      notes: `${p.target} is ${p.war >= 3 ? 'a premium target' : 'a solid target'} from ${p.team}. ${advantage === 'you' ? 'Favorable negotiating position.' : advantage === 'them' ? 'Challenging negotiation ahead.' : 'Even leverage — expect fair market value.'}`,
    };
  });
}
