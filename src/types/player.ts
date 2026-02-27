export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP' | 'CL';

export type BatSide = 'L' | 'R' | 'S'; // Switch
export type ThrowSide = 'L' | 'R';

// ─── Hitter Attributes (0–550 internal; display as 20–80 scouting) ────────────
export interface HitterAttributes {
  contact: number;       // Peaks 27–29
  power: number;         // Peaks 27–30
  eye: number;           // Peaks 29–32
  speed: number;         // Peaks 23–26, fast decline
  baserunningIQ: number; // Peaks 28–32
  fielding: number;      // Position-dependent peak
  armStrength: number;   // Peaks 24–27
  durability: number;    // Slowly declines after 30
  platoonSensitivity: number; // -1.0 to 1.0, stable
  // Hidden attributes
  offensiveIQ: number;   // Peaks 30–32, very slow decline
  defensiveIQ: number;   // Peaks 28–30
  workEthic: number;     // 0–100, stable personality trait
  mentalToughness: number; // 0–100, increases with experience
}

// ─── Pitcher Attributes (0–550 internal) ─────────────────────────────────────
export interface PitcherAttributes {
  stuff: number;         // Peaks 25–28 (tied to velocity)
  movement: number;      // Peaks 27–30
  command: number;       // Peaks 29–33
  stamina: number;       // Declines after 30
  pitchArsenalCount: number; // 2–5, can increase via dev lab
  gbFbTendency: number;  // 0–100 (0 = extreme FB, 100 = extreme GB), stable
  holdRunners: number;   // 0–550, stable
  durability: number;    // Declines after 30
  recoveryRate: number;  // Declines after 28
  platoonTendency: number; // -1.0 to 1.0, stable
  pitchTypeMix: PitchTypeMix; // Can shift via development
  // Hidden attributes
  pitchingIQ: number;    // Peaks 30–34, very slow decline
  workEthic: number;     // 0–100, stable
  mentalToughness: number; // 0–100, increases with experience
}

export interface PitchTypeMix {
  fastball: number;  // 0–1, fraction of pitches
  breaking: number;
  offspeed: number;
}

// ─── Development data (for SDE engine) ───────────────────────────────────────
export interface DevelopmentData {
  theta: number;    // Current growth rate (Ornstein-Uhlenbeck baseline)
  sigma: number;    // Volatility of development
  phase: 'prospect' | 'ascent' | 'prime' | 'decline' | 'retirement';
}

// ─── Roster / contract data ───────────────────────────────────────────────────
export type RosterStatus =
  | 'MLB_ACTIVE'
  | 'MLB_IL_10'
  | 'MLB_IL_60'
  | 'MINORS_AAA'
  | 'MINORS_AA'
  | 'MINORS_APLUS'    // High-A
  | 'MINORS_AMINUS'   // Low-A
  | 'MINORS_ROOKIE'
  | 'MINORS_INTL'     // International (age 16–17, DSL/FCL)
  | 'DFA'
  | 'WAIVERS'
  | 'FREE_AGENT'
  | 'RETIRED'
  | 'DRAFT_ELIGIBLE';

export interface PlayerRosterData {
  rosterStatus: RosterStatus;
  isOn40Man: boolean;
  optionYearsRemaining: number;       // 0–3
  optionUsedThisSeason: boolean;
  minorLeagueDaysThisSeason: number;  // 20+ = option consumed
  demotionsThisSeason: number;        // Max 5 before outright waivers
  serviceTimeDays: number;            // Career total. 172 days = 1 year
  serviceTimeCurrentTeamDays: number; // For 10-and-5 rights
  dfaDate?: string;
  rule5Selected: boolean;
  rule5OriginalTeamId?: number;
  signedSeason: number;
  signedAge: number;
  contractYearsRemaining: number;
  salary: number;                     // Annual salary in dollars
  arbitrationEligible: boolean;
  freeAgentEligible: boolean;
  hasTenAndFive: boolean;
}

// ─── Full Player type ─────────────────────────────────────────────────────────
export interface Player {
  playerId: number;
  teamId: number;       // -1 = free agent
  name: string;
  age: number;
  position: Position;
  bats: BatSide;
  throws: ThrowSide;
  nationality: 'american' | 'latin' | 'asian';

  // Attributes: exactly one set populated based on isPitcher
  isPitcher: boolean;
  hitterAttributes: HitterAttributes | null;
  pitcherAttributes: PitcherAttributes | null;

  // Overall rating (computed from attributes; 0–550)
  overall: number;
  potential: number;    // Peak projection (0–550)

  development: DevelopmentData;
  rosterData: PlayerRosterData;
}

// ─── Per-season player stats ──────────────────────────────────────────────────
export interface PlayerGameStats {
  playerId: number;
  pa: number; ab: number; r: number; h: number;
  doubles: number; triples: number; hr: number;
  rbi: number; bb: number; k: number; hbp: number; sb: number; cs: number;
  // Per-game platoon splits
  vsLHP?: PlatoonSplitLine;
  vsRHP?: PlatoonSplitLine;
}

export interface PitcherGameStats {
  playerId: number;
  outs: number;   // stored as outs (18 = 6.0 IP)
  h: number; r: number; er: number; bb: number; k: number;
  hr: number; pitchCount: number;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
}

// ─── Platoon split stats (vs LHP / vs RHP) ──────────────────────────────────
export interface PlatoonSplitLine {
  pa: number; ab: number; h: number; hr: number;
  bb: number; k: number; doubles: number; triples: number;
}

export const BLANK_SPLIT: PlatoonSplitLine = {
  pa: 0, ab: 0, h: 0, hr: 0, bb: 0, k: 0, doubles: 0, triples: 0,
};

export interface PlayerSeasonStats {
  playerId: number;
  teamId: number;
  season: number;
  // Batting
  g: number; pa: number; ab: number; r: number; h: number;
  doubles: number; triples: number; hr: number;
  rbi: number; bb: number; k: number; sb: number; cs: number;
  hbp: number;
  // Pitching
  w: number; l: number; sv: number; hld: number; bs: number;
  gp: number; gs: number; outs: number; // outs pitched
  ha: number; ra: number; er: number; bba: number; ka: number; hra: number;
  pitchCount: number;
  // Platoon splits (optional, populated during simulation)
  vsLHP?: PlatoonSplitLine;
  vsRHP?: PlatoonSplitLine;
}
