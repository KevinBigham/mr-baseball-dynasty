/**
 * Opponent Scouting Dossier — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's dossier system.
 * Manages scouting intelligence on opponents:
 *   - Active scouting with confidence accumulation
 *   - Tells (tendencies discovered about opponents)
 *   - Weak spots (positional weaknesses to exploit)
 *   - Star players to game-plan around
 *   - Confidence decay for stale intel
 *   - Post-game verification (did the intel help?)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DossierEntry {
  oppTeamId:    number;
  oppName:      string;
  season:       number;
  confidence:   number;     // 0-95 — how reliable is our intel
  scoutCount:   number;     // Times scouted this season
  lastScouted:  number;     // Game number when last scouted
  tells:        string[];   // Things we've discovered about them
  weakSpots:    DossierWeakSpot[];
  stars:        DossierStar[];
  pitchingTendency: string; // e.g., "Relies on fastball-heavy approach"
  counterTip:   string;     // Strategic advice
}

export interface DossierWeakSpot {
  position:  string;
  avgOvr:    number;
  note:      string;
}

export interface DossierStar {
  name:      string;
  position:  string;
  overall:   number;
}

export interface ScoutReport {
  stars:           DossierStar[];
  weaknesses:      DossierWeakSpot[];
  pitchingNote?:   string;
  counterNote?:    string;
  injuredCount?:   number;
}

export interface VerifyResult {
  status: 'confirmed' | 'wrong_read';
  delta:  number;
}

// ─── Dossier Database ─────────────────────────────────────────────────────────

type DossierDB = Record<string, DossierEntry>;

function dossierKey(oppTeamId: number, season: number): string {
  return `${season}-${oppTeamId}`;
}

// ─── Get or create entry ──────────────────────────────────────────────────────

export function getDossierEntry(
  db: DossierDB,
  oppTeamId: number,
  oppName: string,
  season: number,
): DossierEntry {
  const key = dossierKey(oppTeamId, season);
  return db[key] ?? {
    oppTeamId,
    oppName,
    season,
    confidence: 0,
    scoutCount: 0,
    lastScouted: 0,
    tells: [],
    weakSpots: [],
    stars: [],
    pitchingTendency: '',
    counterTip: '',
  };
}

// ─── Scout an opponent ────────────────────────────────────────────────────────

export function scoutOpponent(
  db: DossierDB,
  oppTeamId: number,
  oppName: string,
  season: number,
  gameNum: number,
  report: ScoutReport,
  scoutQuality: number, // 0-100 (scout/coach quality)
): DossierEntry {
  const key = dossierKey(oppTeamId, season);
  const entry = getDossierEntry(db, oppTeamId, oppName, season);

  entry.scoutCount++;
  entry.lastScouted = gameNum;

  // Confidence gain based on scout quality
  const baseGain = 15;
  const qualityBonus = Math.min((scoutQuality - 50), 20);
  const repeatBonus = entry.scoutCount > 1 ? 10 : 0;
  entry.confidence = Math.min(95, entry.confidence + baseGain + qualityBonus + repeatBonus);

  // Update intel from report
  if (report.stars.length > 0) entry.stars = report.stars.slice(0, 3);
  if (report.weaknesses.length > 0) entry.weakSpots = report.weaknesses.slice(0, 3);
  if (report.pitchingNote) entry.pitchingTendency = report.pitchingNote;
  if (report.counterNote) entry.counterTip = report.counterNote;

  // Generate tells
  const newTells: string[] = [];
  for (const star of report.stars.slice(0, 1)) {
    if (star.overall >= 70) {
      newTells.push(`Must contain ${star.name} (${star.position} ${star.overall} OVR) — game-plan around them`);
    }
  }
  for (const weak of report.weaknesses.slice(0, 1)) {
    if (weak.avgOvr < 55) {
      newTells.push(`Weak at ${weak.position} (${weak.avgOvr} OVR) — exploit this matchup`);
    }
  }
  if (report.injuredCount && report.injuredCount > 0) {
    newTells.push(`${report.injuredCount} player${report.injuredCount > 1 ? 's' : ''} on IL — exploit the depth gaps`);
  }

  for (const tell of newTells) {
    if (!entry.tells.includes(tell)) {
      entry.tells.push(tell);
    }
  }
  if (entry.tells.length > 5) {
    entry.tells = entry.tells.slice(-5);
  }

  db[key] = entry;
  return entry;
}

// ─── Decay stale intel ────────────────────────────────────────────────────────

export function decayDossiers(
  db: DossierDB,
  season: number,
  currentGameNum: number,
  staleThreshold: number = 30, // Games since last scout before decay
): DossierDB {
  for (const key of Object.keys(db)) {
    const entry = db[key]!;
    if (entry.season === season && entry.lastScouted > 0 && (currentGameNum - entry.lastScouted) >= staleThreshold) {
      entry.confidence = Math.max(0, entry.confidence - 8);
      if (entry.confidence <= 0) {
        entry.tells = [];
        entry.weakSpots = [];
        entry.stars = [];
      }
    }
  }
  return db;
}

// ─── Verify intel after a game ────────────────────────────────────────────────

export function verifyDossier(
  db: DossierDB,
  oppTeamId: number,
  season: number,
  won: boolean,
): VerifyResult | null {
  const key = dossierKey(oppTeamId, season);
  const entry = db[key];
  if (!entry || entry.confidence <= 0) return null;

  if (won) {
    entry.confidence = Math.min(95, entry.confidence + 5);
    return { status: 'confirmed', delta: 5 };
  } else {
    entry.confidence = Math.max(10, entry.confidence - 10);
    return { status: 'wrong_read', delta: -10 };
  }
}

// ─── Confidence display helpers ───────────────────────────────────────────────

export function getConfidenceLevel(confidence: number): { label: string; color: string } {
  if (confidence >= 80) return { label: 'EXCELLENT', color: '#22c55e' };
  if (confidence >= 60) return { label: 'STRONG', color: '#3b82f6' };
  if (confidence >= 40) return { label: 'MODERATE', color: '#f59e0b' };
  if (confidence >= 20) return { label: 'WEAK', color: '#ef4444' };
  return { label: 'UNKNOWN', color: '#6b7280' };
}
