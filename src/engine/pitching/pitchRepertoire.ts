/**
 * Pitch Repertoire Visualization Engine
 *
 * Provides detailed pitch arsenal breakdowns for pitchers including
 * pitch types, velocity ranges, usage percentages, and effectiveness
 * ratings. Original baseball-specific system.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type PitchType = 'FB' | 'SL' | 'CB' | 'CH' | 'CT' | 'SI' | 'SP' | 'KN';

export interface PitchInfo {
  label: string;
  color: string;
  icon: string;
  desc: string;
}

export interface PitchData {
  type: PitchType;
  velocity: number;         // avg mph
  velocityRange: [number, number]; // low-high
  usage: number;            // 0-100 %
  effectiveness: number;    // 0-100 rating
  whiffRate: number;        // 0-50 %
  zonePct: number;          // % in strike zone
}

export interface PitcherRepertoire {
  playerId: number;
  name: string;
  position: 'SP' | 'RP' | 'CL';
  overall: number;
  pitches: PitchData[];
  primaryPitch: PitchType;
  bestPitch: PitchType;
  arsenalGrade: string;     // A+ through F
}

// ── Pitch type config ───────────────────────────────────────────────────────

export const PITCH_INFO: Record<PitchType, PitchInfo> = {
  FB: { label: 'Fastball',     color: '#ef4444', icon: '🔥', desc: 'Four-seam fastball — velocity and backspin' },
  SL: { label: 'Slider',       color: '#3b82f6', icon: '💫', desc: 'Sharp lateral break, strikeout pitch' },
  CB: { label: 'Curveball',    color: '#a855f7', icon: '🌀', desc: 'Big looping break, changes eye level' },
  CH: { label: 'Changeup',     color: '#22c55e', icon: '🎯', desc: 'Speed differential, arm-side fade' },
  CT: { label: 'Cutter',       color: '#f97316', icon: '✂️', desc: 'Late movement, tight break' },
  SI: { label: 'Sinker',       color: '#eab308', icon: '⬇️', desc: 'Heavy sinking action, ground balls' },
  SP: { label: 'Splitter',     color: '#06b6d4', icon: '🪓', desc: 'Late drop, chase pitch' },
  KN: { label: 'Knuckleball',  color: '#94a3b8', icon: '🦋', desc: 'Unpredictable movement, slow' },
};

// ── Arsenal grading ─────────────────────────────────────────────────────────

export function gradeArsenal(pitches: PitchData[]): string {
  if (pitches.length === 0) return 'F';
  const avgEff = pitches.reduce((s, p) => s + p.effectiveness, 0) / pitches.length;
  const diversity = pitches.length;
  const score = avgEff * 0.7 + diversity * 5;

  if (score >= 85) return 'A+';
  if (score >= 78) return 'A';
  if (score >= 72) return 'A-';
  if (score >= 65) return 'B+';
  if (score >= 58) return 'B';
  if (score >= 52) return 'B-';
  if (score >= 45) return 'C+';
  if (score >= 38) return 'C';
  return 'C-';
}

// ── Demo generation ─────────────────────────────────────────────────────────

const VELO_RANGES: Record<PitchType, [number, number]> = {
  FB: [92, 98], SL: [82, 89], CB: [73, 82], CH: [83, 89],
  CT: [87, 93], SI: [90, 95], SP: [84, 90], KN: [70, 78],
};

export function generateRepertoire(
  playerId: number,
  name: string,
  position: 'SP' | 'RP' | 'CL',
  overall: number,
): PitcherRepertoire {
  // Always has a fastball
  const pitchTypes: PitchType[] = ['FB'];

  // Add 2-4 secondary pitches based on OVR
  const secondaries: PitchType[] = ['SL', 'CB', 'CH', 'CT', 'SI', 'SP'];
  const numSecondary = overall >= 75 ? 3 : overall >= 65 ? 2 : 1;
  const shuffled = secondaries.sort(() => Math.random() - 0.5);
  pitchTypes.push(...shuffled.slice(0, numSecondary));

  let usageLeft = 100;
  const pitches: PitchData[] = pitchTypes.map((type, i) => {
    const [lo, hi] = VELO_RANGES[type];
    const velo = Math.round(lo + Math.random() * (hi - lo));
    const usage = i === 0 ? Math.round(35 + Math.random() * 20) :
      i === pitchTypes.length - 1 ? usageLeft :
      Math.round(10 + Math.random() * 20);
    usageLeft -= usage;
    const effectiveness = Math.round(50 + (overall - 50) * 0.6 + (Math.random() * 20 - 10));
    const whiffRate = Math.round(10 + effectiveness * 0.3 + (Math.random() * 8 - 4));
    const zonePct = Math.round(35 + Math.random() * 25);

    return {
      type,
      velocity: velo,
      velocityRange: [velo - 2, velo + 2],
      usage: Math.max(5, usage),
      effectiveness: Math.min(99, Math.max(20, effectiveness)),
      whiffRate: Math.min(45, Math.max(5, whiffRate)),
      zonePct: Math.min(65, Math.max(25, zonePct)),
    };
  });

  // Normalize usage to 100%
  const totalUsage = pitches.reduce((s, p) => s + p.usage, 0);
  if (totalUsage !== 100) {
    const factor = 100 / totalUsage;
    pitches.forEach(p => { p.usage = Math.round(p.usage * factor); });
    const diff = 100 - pitches.reduce((s, p) => s + p.usage, 0);
    pitches[0].usage += diff;
  }

  const bestPitch = pitches.reduce((best, p) => p.effectiveness > best.effectiveness ? p : best).type;

  return {
    playerId,
    name,
    position,
    overall,
    pitches,
    primaryPitch: 'FB',
    bestPitch,
    arsenalGrade: gradeArsenal(pitches),
  };
}
