/**
 * Season Award Predictor
 *
 * Predicts end-of-season award winners with probability distributions.
 * Covers MVP, Cy Young, ROY, Gold Glove, Silver Slugger, and
 * Reliever of the Year across both leagues.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type AwardType = 'mvp' | 'cy_young' | 'roy' | 'gold_glove' | 'silver_slugger' | 'reliever_of_year';

export type Trend = 'rising' | 'falling' | 'steady';

export const AWARD_TYPE_DISPLAY: Record<AwardType, { label: string; color: string }> = {
  mvp:              { label: 'MVP',                color: '#eab308' },
  cy_young:         { label: 'Cy Young',           color: '#3b82f6' },
  roy:              { label: 'Rookie of the Year', color: '#22c55e' },
  gold_glove:       { label: 'Gold Glove',         color: '#f97316' },
  silver_slugger:   { label: 'Silver Slugger',     color: '#a855f7' },
  reliever_of_year: { label: 'Reliever of Year',  color: '#ef4444' },
};

export const TREND_DISPLAY: Record<Trend, { label: string; symbol: string; color: string }> = {
  rising:  { label: 'Rising',  symbol: '▲', color: '#22c55e' },
  falling: { label: 'Falling', symbol: '▼', color: '#ef4444' },
  steady:  { label: 'Steady',  symbol: '—', color: '#6b7280' },
};

export interface AwardCandidate {
  playerId: number;
  name: string;
  team: string;
  position: string;
  probability: number;       // 0-100
  keyStats: { label: string; value: string }[];
  trend: Trend;
}

export interface AwardPrediction {
  award: AwardType;
  league: 'AL' | 'NL';
  candidates: AwardCandidate[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getTopCandidate(prediction: AwardPrediction): AwardCandidate | null {
  if (prediction.candidates.length === 0) return null;
  return prediction.candidates.reduce((best, c) => c.probability > best.probability ? c : best);
}

export function isCloseRace(prediction: AwardPrediction): boolean {
  if (prediction.candidates.length < 2) return false;
  const sorted = [...prediction.candidates].sort((a, b) => b.probability - a.probability);
  return sorted[0].probability - sorted[1].probability < 10;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoAwardPredictions(): AwardPrediction[] {
  return [
    // AL MVP
    {
      award: 'mvp', league: 'AL',
      candidates: [
        {
          playerId: 300, name: 'Aaron Judge', team: 'NYY', position: 'RF', probability: 38,
          keyStats: [{ label: 'HR', value: '42' }, { label: 'RBI', value: '105' }, { label: 'OPS', value: '.985' }, { label: 'WAR', value: '7.2' }],
          trend: 'steady',
        },
        {
          playerId: 301, name: 'Yordan Alvarez', team: 'HOU', position: 'DH', probability: 25,
          keyStats: [{ label: 'HR', value: '35' }, { label: 'RBI', value: '98' }, { label: 'OPS', value: '.945' }, { label: 'WAR', value: '5.8' }],
          trend: 'rising',
        },
        {
          playerId: 302, name: 'Marcus Semien', team: 'TEX', position: '2B', probability: 18,
          keyStats: [{ label: 'HR', value: '28' }, { label: 'RBI', value: '85' }, { label: 'OPS', value: '.870' }, { label: 'WAR', value: '6.5' }],
          trend: 'falling',
        },
        {
          playerId: 303, name: 'Gunnar Henderson', team: 'BAL', position: 'SS', probability: 12,
          keyStats: [{ label: 'HR', value: '30' }, { label: 'RBI', value: '88' }, { label: 'OPS', value: '.895' }, { label: 'WAR', value: '6.0' }],
          trend: 'rising',
        },
        {
          playerId: 304, name: 'Vladimir Guerrero Jr.', team: 'TOR', position: '1B', probability: 7,
          keyStats: [{ label: 'HR', value: '26' }, { label: 'RBI', value: '92' }, { label: 'OPS', value: '.875' }, { label: 'WAR', value: '4.5' }],
          trend: 'steady',
        },
      ],
    },
    // NL MVP
    {
      award: 'mvp', league: 'NL',
      candidates: [
        {
          playerId: 310, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', probability: 45,
          keyStats: [{ label: 'HR', value: '48' }, { label: 'RBI', value: '112' }, { label: 'OPS', value: '1.020' }, { label: 'WAR', value: '8.5' }],
          trend: 'steady',
        },
        {
          playerId: 311, name: 'Mookie Betts', team: 'LAD', position: 'SS', probability: 22,
          keyStats: [{ label: 'HR', value: '25' }, { label: 'RBI', value: '82' }, { label: 'OPS', value: '.910' }, { label: 'WAR', value: '7.0' }],
          trend: 'rising',
        },
        {
          playerId: 312, name: 'Ronald Acuna Jr.', team: 'ATL', position: 'RF', probability: 15,
          keyStats: [{ label: 'HR', value: '28' }, { label: 'RBI', value: '78' }, { label: 'OPS', value: '.920' }, { label: 'WAR', value: '5.5' }],
          trend: 'falling',
        },
        {
          playerId: 313, name: 'Freddie Freeman', team: 'LAD', position: '1B', probability: 10,
          keyStats: [{ label: 'HR', value: '22' }, { label: 'RBI', value: '95' }, { label: 'OPS', value: '.890' }, { label: 'WAR', value: '5.8' }],
          trend: 'steady',
        },
        {
          playerId: 314, name: 'Elly De La Cruz', team: 'CIN', position: 'SS', probability: 8,
          keyStats: [{ label: 'HR', value: '26' }, { label: 'SB', value: '58' }, { label: 'OPS', value: '.845' }, { label: 'WAR', value: '5.2' }],
          trend: 'rising',
        },
      ],
    },
    // AL Cy Young
    {
      award: 'cy_young', league: 'AL',
      candidates: [
        {
          playerId: 320, name: 'Tarik Skubal', team: 'DET', position: 'SP', probability: 35,
          keyStats: [{ label: 'W-L', value: '15-4' }, { label: 'ERA', value: '2.45' }, { label: 'K', value: '205' }, { label: 'WHIP', value: '0.98' }],
          trend: 'steady',
        },
        {
          playerId: 321, name: 'Cole Ragans', team: 'KC', position: 'SP', probability: 28,
          keyStats: [{ label: 'W-L', value: '13-6' }, { label: 'ERA', value: '2.72' }, { label: 'K', value: '215' }, { label: 'WHIP', value: '1.02' }],
          trend: 'rising',
        },
        {
          playerId: 322, name: 'Seth Lugo', team: 'KC', position: 'SP', probability: 18,
          keyStats: [{ label: 'W-L', value: '14-5' }, { label: 'ERA', value: '2.88' }, { label: 'K', value: '178' }, { label: 'WHIP', value: '1.08' }],
          trend: 'falling',
        },
        {
          playerId: 323, name: 'Garrett Crochet', team: 'CWS', position: 'SP', probability: 12,
          keyStats: [{ label: 'W-L', value: '10-8' }, { label: 'ERA', value: '3.05' }, { label: 'K', value: '228' }, { label: 'WHIP', value: '1.10' }],
          trend: 'steady',
        },
        {
          playerId: 324, name: 'Logan Gilbert', team: 'SEA', position: 'SP', probability: 7,
          keyStats: [{ label: 'W-L', value: '12-5' }, { label: 'ERA', value: '3.12' }, { label: 'K', value: '185' }, { label: 'WHIP', value: '1.05' }],
          trend: 'steady',
        },
      ],
    },
    // NL Cy Young
    {
      award: 'cy_young', league: 'NL',
      candidates: [
        {
          playerId: 330, name: 'Zack Wheeler', team: 'PHI', position: 'SP', probability: 32,
          keyStats: [{ label: 'W-L', value: '14-5' }, { label: 'ERA', value: '2.55' }, { label: 'K', value: '198' }, { label: 'WHIP', value: '0.95' }],
          trend: 'rising',
        },
        {
          playerId: 331, name: 'Spencer Strider', team: 'ATL', position: 'SP', probability: 28,
          keyStats: [{ label: 'W-L', value: '13-4' }, { label: 'ERA', value: '2.68' }, { label: 'K', value: '245' }, { label: 'WHIP', value: '1.00' }],
          trend: 'steady',
        },
        {
          playerId: 332, name: 'Dylan Cease', team: 'SD', position: 'SP', probability: 20,
          keyStats: [{ label: 'W-L', value: '12-7' }, { label: 'ERA', value: '2.90' }, { label: 'K', value: '210' }, { label: 'WHIP', value: '1.12' }],
          trend: 'falling',
        },
        {
          playerId: 333, name: 'Ranger Suarez', team: 'PHI', position: 'SP', probability: 12,
          keyStats: [{ label: 'W-L', value: '11-5' }, { label: 'ERA', value: '3.05' }, { label: 'K', value: '165' }, { label: 'WHIP', value: '1.08' }],
          trend: 'steady',
        },
        {
          playerId: 334, name: 'Logan Webb', team: 'SF', position: 'SP', probability: 8,
          keyStats: [{ label: 'W-L', value: '13-6' }, { label: 'ERA', value: '3.18' }, { label: 'K', value: '155' }, { label: 'WHIP', value: '1.10' }],
          trend: 'steady',
        },
      ],
    },
    // AL ROY
    {
      award: 'roy', league: 'AL',
      candidates: [
        {
          playerId: 340, name: 'Colton Cowser', team: 'BAL', position: 'CF', probability: 40,
          keyStats: [{ label: 'AVG', value: '.278' }, { label: 'HR', value: '18' }, { label: 'OPS', value: '.825' }, { label: 'WAR', value: '3.2' }],
          trend: 'rising',
        },
        {
          playerId: 341, name: 'Ceddanne Rafaela', team: 'BOS', position: 'SS', probability: 30,
          keyStats: [{ label: 'AVG', value: '.265' }, { label: 'HR', value: '14' }, { label: 'OPS', value: '.780' }, { label: 'DRS', value: '+12' }],
          trend: 'steady',
        },
        {
          playerId: 342, name: 'Austin Wells', team: 'NYY', position: 'C', probability: 18,
          keyStats: [{ label: 'AVG', value: '.258' }, { label: 'HR', value: '16' }, { label: 'OPS', value: '.795' }, { label: 'WAR', value: '2.5' }],
          trend: 'falling',
        },
        {
          playerId: 343, name: 'Ben Kudrna', team: 'KC', position: 'SP', probability: 12,
          keyStats: [{ label: 'W-L', value: '8-3' }, { label: 'ERA', value: '3.25' }, { label: 'K', value: '110' }, { label: 'WHIP', value: '1.15' }],
          trend: 'rising',
        },
      ],
    },
    // NL ROY
    {
      award: 'roy', league: 'NL',
      candidates: [
        {
          playerId: 350, name: 'Jackson Merrill', team: 'SD', position: 'CF', probability: 42,
          keyStats: [{ label: 'AVG', value: '.285' }, { label: 'HR', value: '15' }, { label: 'OPS', value: '.810' }, { label: 'WAR', value: '3.0' }],
          trend: 'steady',
        },
        {
          playerId: 351, name: 'Paul Skenes', team: 'PIT', position: 'SP', probability: 35,
          keyStats: [{ label: 'W-L', value: '9-2' }, { label: 'ERA', value: '2.50' }, { label: 'K', value: '140' }, { label: 'WHIP', value: '0.95' }],
          trend: 'rising',
        },
        {
          playerId: 352, name: 'Jackson Chourio', team: 'MIL', position: 'RF', probability: 15,
          keyStats: [{ label: 'AVG', value: '.260' }, { label: 'HR', value: '16' }, { label: 'OPS', value: '.770' }, { label: 'WAR', value: '2.2' }],
          trend: 'steady',
        },
        {
          playerId: 353, name: 'Hurston Waldrep', team: 'ATL', position: 'SP', probability: 8,
          keyStats: [{ label: 'W-L', value: '6-4' }, { label: 'ERA', value: '3.45' }, { label: 'K', value: '95' }, { label: 'WHIP', value: '1.18' }],
          trend: 'falling',
        },
      ],
    },
    // AL Gold Glove
    {
      award: 'gold_glove', league: 'AL',
      candidates: [
        {
          playerId: 360, name: 'Andres Gimenez', team: 'CLE', position: '2B', probability: 55,
          keyStats: [{ label: 'FLD%', value: '.990' }, { label: 'DRS', value: '+18' }, { label: 'OAA', value: '+14' }, { label: 'UZR', value: '12.5' }],
          trend: 'steady',
        },
        {
          playerId: 361, name: 'Carlos Correa', team: 'MIN', position: 'SS', probability: 28,
          keyStats: [{ label: 'FLD%', value: '.985' }, { label: 'DRS', value: '+12' }, { label: 'OAA', value: '+10' }, { label: 'UZR', value: '8.2' }],
          trend: 'rising',
        },
        {
          playerId: 362, name: 'Matt Chapman', team: 'TOR', position: '3B', probability: 17,
          keyStats: [{ label: 'FLD%', value: '.978' }, { label: 'DRS', value: '+15' }, { label: 'OAA', value: '+11' }, { label: 'UZR', value: '10.1' }],
          trend: 'steady',
        },
      ],
    },
    // NL Silver Slugger
    {
      award: 'silver_slugger', league: 'NL',
      candidates: [
        {
          playerId: 370, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', probability: 60,
          keyStats: [{ label: 'AVG', value: '.295' }, { label: 'HR', value: '48' }, { label: 'RBI', value: '112' }, { label: 'SLG', value: '.625' }],
          trend: 'steady',
        },
        {
          playerId: 371, name: 'Freddie Freeman', team: 'LAD', position: '1B', probability: 25,
          keyStats: [{ label: 'AVG', value: '.305' }, { label: 'HR', value: '22' }, { label: 'RBI', value: '95' }, { label: 'SLG', value: '.515' }],
          trend: 'steady',
        },
        {
          playerId: 372, name: 'Elly De La Cruz', team: 'CIN', position: 'SS', probability: 15,
          keyStats: [{ label: 'AVG', value: '.270' }, { label: 'HR', value: '26' }, { label: 'SB', value: '58' }, { label: 'SLG', value: '.495' }],
          trend: 'rising',
        },
      ],
    },
    // AL Reliever of Year
    {
      award: 'reliever_of_year', league: 'AL',
      candidates: [
        {
          playerId: 380, name: 'Emmanuel Clase', team: 'CLE', position: 'RP', probability: 48,
          keyStats: [{ label: 'SV', value: '42' }, { label: 'ERA', value: '1.15' }, { label: 'WHIP', value: '0.82' }, { label: 'K', value: '65' }],
          trend: 'steady',
        },
        {
          playerId: 381, name: 'Mason Miller', team: 'OAK', position: 'RP', probability: 30,
          keyStats: [{ label: 'SV', value: '28' }, { label: 'ERA', value: '1.80' }, { label: 'WHIP', value: '0.88' }, { label: 'K', value: '85' }],
          trend: 'rising',
        },
        {
          playerId: 382, name: 'Kirby Yates', team: 'TEX', position: 'RP', probability: 14,
          keyStats: [{ label: 'SV', value: '32' }, { label: 'ERA', value: '2.25' }, { label: 'WHIP', value: '0.95' }, { label: 'K', value: '72' }],
          trend: 'falling',
        },
        {
          playerId: 383, name: 'Clay Holmes', team: 'NYY', position: 'RP', probability: 8,
          keyStats: [{ label: 'SV', value: '25' }, { label: 'ERA', value: '2.55' }, { label: 'WHIP', value: '1.05' }, { label: 'K', value: '58' }],
          trend: 'steady',
        },
      ],
    },
    // NL Reliever of Year
    {
      award: 'reliever_of_year', league: 'NL',
      candidates: [
        {
          playerId: 390, name: 'Ryan Helsley', team: 'STL', position: 'RP', probability: 42,
          keyStats: [{ label: 'SV', value: '38' }, { label: 'ERA', value: '1.55' }, { label: 'WHIP', value: '0.85' }, { label: 'K', value: '78' }],
          trend: 'steady',
        },
        {
          playerId: 391, name: 'Devin Williams', team: 'MIL', position: 'RP', probability: 32,
          keyStats: [{ label: 'SV', value: '30' }, { label: 'ERA', value: '1.72' }, { label: 'WHIP', value: '0.92' }, { label: 'K', value: '95' }],
          trend: 'rising',
        },
        {
          playerId: 392, name: 'Robert Suarez', team: 'SD', position: 'RP', probability: 16,
          keyStats: [{ label: 'SV', value: '34' }, { label: 'ERA', value: '2.10' }, { label: 'WHIP', value: '0.98' }, { label: 'K', value: '65' }],
          trend: 'steady',
        },
        {
          playerId: 393, name: 'Alexis Diaz', team: 'CIN', position: 'RP', probability: 10,
          keyStats: [{ label: 'SV', value: '28' }, { label: 'ERA', value: '2.35' }, { label: 'WHIP', value: '1.02' }, { label: 'K', value: '82' }],
          trend: 'falling',
        },
      ],
    },
  ];
}
