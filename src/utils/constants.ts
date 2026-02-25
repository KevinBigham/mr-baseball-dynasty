// ─── Simulation Tuning ────────────────────────────────────────────────────────

export const INNINGS_PER_GAME = 9;
export const OUTS_PER_INNING = 3;
export const GAMES_PER_SEASON = 162;
export const TEAMS_IN_LEAGUE = 30;

// ─── Attribute Scales ────────────────────────────────────────────────────────

export const ATTR_MIN = 0;
export const ATTR_MAX = 550;
export const ATTR_MLB_AVERAGE = 400;
export const ATTR_AAA_AVERAGE = 300;
export const SCOUT_MIN = 20;
export const SCOUT_MAX = 80;

// ─── Roster Rules ─────────────────────────────────────────────────────────────

export const ACTIVE_ROSTER_SIZE = 26;
export const EXPANDED_ROSTER_SIZE = 28; // Sept. expansion
export const FORTY_MAN_SIZE = 40;
export const MAX_OPTIONS = 3;

// Service time thresholds (in days, 172 days = 1 service year)
export const SERVICE_DAYS_PER_YEAR = 172;
export const ARBI_ELIGIBLE_YEARS = 3;
export const FA_ELIGIBLE_YEARS = 6;
export const SUPER_TWO_THRESHOLD = 2.13; // top 22% of 2-year players

// ─── Player Generation ────────────────────────────────────────────────────────

export const MIN_DRAFT_AGE = 18;
export const MAX_DRAFT_AGE = 22;
export const ROOKIE_AGE_MEAN = 24;
export const TYPICAL_PRIME_START = 26;
export const TYPICAL_PRIME_END = 31;
export const TYPICAL_RETIRE_AGE = 38;

// Nationality distribution
export const NATIONALITY_WEIGHTS = { american: 0.60, latin: 0.28, asian: 0.12 } as const;

// ─── Pitcher Thresholds ───────────────────────────────────────────────────────

export const MAX_STARTER_PITCHES = 110;
export const EARLY_HOOK_PITCHES = 75;    // hook if TTO >= 3 and this many pitches
export const TTO_HOOK_THRESHOLD = 3;     // times through order
export const RELIEVER_MAX_PITCHES = 35;
export const CLOSER_SAVE_INNING = 9;

// ─── Modifiers ────────────────────────────────────────────────────────────────

export const SQUASH_MAX_MAGNITUDE = 0.40;
export const GB_FB_INTERACTION_COEFF = 0.003;

// Platoon effect size (~50 OPS points total)
export const PLATOON_BASE_EFFECT = 0.025;

// TTO raw OPS penalties per times-through-order
export const TTO_PENALTIES = [0, 0.026, 0.066] as const;

// Fastball stress factor for fatigue
export const FASTBALL_STRESS_SCALE = 0.30;
// Pitches per "inning equivalent" for fatigue
export const PITCHES_PER_INNING = 15;

// ─── League Environment Anchors ───────────────────────────────────────────────

export const LEAGUE_ERA_TARGET = 4.10;
export const LEAGUE_BA_TARGET = 0.255;
export const LEAGUE_RPG_TARGET = 4.50;
export const LEAGUE_BABIP_TARGET = 0.295;

// Validation gate bounds (used in tests)
export const GATES = {
  leagueERA:          { min: 3.80, max: 4.40 },
  leagueBA:           { min: 0.245, max: 0.265 },
  leagueRPG:          { min: 4.2, max: 4.8 },
  teamWinsSD:         { min: 8, max: 12 },
  teamsOver100Wins:   { min: 1, max: 5 },
  teamsUnder60Wins:   { min: 0, max: 4 },
  playersWith40HR:    { min: 2, max: 8 },
  playersWith200K:    { min: 3, max: 10 },
  pitchersWith200IP:  { min: 5, max: 20 },
  pythagCorrelation:  { min: 0.85 },
  singleGameMs:       { max: 50 },
  fullSeasonMs:       { max: 5000 },
} as const;

// ─── Extras / Manfred Runner ─────────────────────────────────────────────────

export const EXTRA_INNINGS_START = 10;

// ─── Pythagorean Exponent ─────────────────────────────────────────────────────

export const PYTHAG_EXPONENT = 1.83;

// ─── Semi-Dynamic RE24 ────────────────────────────────────────────────────────

// Every N seasons, recalibrate: RE24_new = 0.70 * sim + 0.30 * MLB_anchor
export const RE24_RECALIBRATE_EVERY = 5;
export const RE24_SIM_WEIGHT = 0.70;
export const RE24_ANCHOR_WEIGHT = 0.30;

// ─── Database ─────────────────────────────────────────────────────────────────

// Tiered storage: hot (0-2 seasons old), warm (3-10), cold (11+)
export const HOT_TIER_SEASONS = 2;
export const WARM_TIER_SEASONS = 10;
export const DB_WRITE_CHUNK = 50_000; // rows per IndexedDB batch

// ─── UI ───────────────────────────────────────────────────────────────────────

export const LEADERBOARD_DEFAULT_LIMIT = 50;
export const PLAYER_TABLE_ROW_HEIGHT = 30; // px, for react-window
export const SIM_PROGRESS_REPORT_INTERVAL = 100; // games between progress updates
