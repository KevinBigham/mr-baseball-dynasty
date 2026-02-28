/**
 * pitchReleasePoint.ts – Pitch release point analysis
 *
 * Tracks pitcher release point consistency, extension, vertical/horizontal
 * release positions, and deception metrics based on release point uniformity.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConsistencyGrade = 'elite' | 'plus' | 'avg' | 'below' | 'poor';

export interface PitchRelease {
  pitchType: string;
  pitchName: string;
  horzRelease: number;  // feet from center
  vertRelease: number;  // feet off ground
  extension: number;    // feet toward plate
  horzSpread: number;   // std dev horizontal inches
  vertSpread: number;   // std dev vertical inches
  usagePct: number;
}

export interface PitcherReleaseProfile {
  id: string;
  name: string;
  team: string;
  throws: 'L' | 'R';
  role: 'SP' | 'RP';
  overallConsistency: ConsistencyGrade;
  avgExtension: number;
  deceptionScore: number;    // 0-100
  tunnelScore: number;       // 0-100, how similar release points are across pitches
  pitches: PitchRelease[];
  notes: string;
}

export const CONSISTENCY_DISPLAY: Record<ConsistencyGrade, { label: string; color: string }> = {
  elite: { label: 'ELITE', color: '#22c55e' },
  plus: { label: 'PLUS', color: '#4ade80' },
  avg: { label: 'AVERAGE', color: '#facc15' },
  below: { label: 'BELOW', color: '#f97316' },
  poor: { label: 'POOR', color: '#ef4444' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface ReleasePointSummary {
  totalPitchers: number;
  bestDeception: string;
  avgExtension: number;
  avgTunnelScore: number;
  eliteConsistency: number;
}

export function getReleasePointSummary(pitchers: PitcherReleaseProfile[]): ReleasePointSummary {
  const bestDec = pitchers.reduce((a, b) => a.deceptionScore > b.deceptionScore ? a : b);
  const avgExt = pitchers.reduce((s, p) => s + p.avgExtension, 0) / pitchers.length;
  const avgTunnel = pitchers.reduce((s, p) => s + p.tunnelScore, 0) / pitchers.length;

  return {
    totalPitchers: pitchers.length,
    bestDeception: bestDec.name,
    avgExtension: Math.round(avgExt * 10) / 10,
    avgTunnelScore: Math.round(avgTunnel),
    eliteConsistency: pitchers.filter(p => p.overallConsistency === 'elite').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoPitchRelease(): PitcherReleaseProfile[] {
  const data: Omit<PitcherReleaseProfile, 'id'>[] = [
    {
      name: 'Marcus Webb', team: 'NYM', throws: 'R', role: 'SP', overallConsistency: 'elite',
      avgExtension: 6.8, deceptionScore: 92, tunnelScore: 95,
      pitches: [
        { pitchType: 'FF', pitchName: '4-Seam', horzRelease: -1.8, vertRelease: 5.9, extension: 6.9, horzSpread: 0.8, vertSpread: 0.6, usagePct: 42 },
        { pitchType: 'SL', pitchName: 'Slider', horzRelease: -1.7, vertRelease: 5.8, extension: 6.7, horzSpread: 1.0, vertSpread: 0.7, usagePct: 28 },
        { pitchType: 'CH', pitchName: 'Change', horzRelease: -1.9, vertRelease: 5.9, extension: 6.8, horzSpread: 0.9, vertSpread: 0.7, usagePct: 18 },
        { pitchType: 'CU', pitchName: 'Curve', horzRelease: -1.6, vertRelease: 6.0, extension: 6.5, horzSpread: 1.2, vertSpread: 0.9, usagePct: 12 },
      ],
      notes: 'Elite release point consistency. All pitches look identical out of the hand. Deception comes from uniform slot across 4 pitches.',
    },
    {
      name: 'Javier Ortiz', team: 'LAD', throws: 'L', role: 'SP', overallConsistency: 'plus',
      avgExtension: 6.5, deceptionScore: 88, tunnelScore: 90,
      pitches: [
        { pitchType: 'SI', pitchName: 'Sinker', horzRelease: 2.1, vertRelease: 5.5, extension: 6.6, horzSpread: 0.9, vertSpread: 0.7, usagePct: 38 },
        { pitchType: 'ST', pitchName: 'Sweeper', horzRelease: 2.0, vertRelease: 5.4, extension: 6.4, horzSpread: 1.1, vertSpread: 0.8, usagePct: 30 },
        { pitchType: 'CH', pitchName: 'Change', horzRelease: 2.2, vertRelease: 5.5, extension: 6.5, horzSpread: 1.0, vertSpread: 0.7, usagePct: 22 },
        { pitchType: 'FC', pitchName: 'Cutter', horzRelease: 1.9, vertRelease: 5.6, extension: 6.3, horzSpread: 1.3, vertSpread: 0.9, usagePct: 10 },
      ],
      notes: 'Plus release consistency from the left side. Low arm slot creates tough angle. Sweeper and sinker tunnel beautifully.',
    },
    {
      name: 'Derek Calloway', team: 'HOU', throws: 'R', role: 'SP', overallConsistency: 'plus',
      avgExtension: 7.1, deceptionScore: 85, tunnelScore: 88,
      pitches: [
        { pitchType: 'FF', pitchName: '4-Seam', horzRelease: -2.0, vertRelease: 6.2, extension: 7.2, horzSpread: 0.9, vertSpread: 0.6, usagePct: 50 },
        { pitchType: 'SL', pitchName: 'Slider', horzRelease: -1.8, vertRelease: 6.1, extension: 7.0, horzSpread: 1.1, vertSpread: 0.8, usagePct: 32 },
        { pitchType: 'CH', pitchName: 'Change', horzRelease: -2.1, vertRelease: 6.2, extension: 7.1, horzSpread: 1.0, vertSpread: 0.7, usagePct: 18 },
      ],
      notes: 'Elite extension makes pitches arrive faster than expected. High release creates natural downhill plane. Consistent across arsenal.',
    },
    {
      name: 'Ryan Kowalski', team: 'ATL', throws: 'R', role: 'RP', overallConsistency: 'elite',
      avgExtension: 6.9, deceptionScore: 94, tunnelScore: 97,
      pitches: [
        { pitchType: 'FF', pitchName: '4-Seam', horzRelease: -1.5, vertRelease: 6.0, extension: 7.0, horzSpread: 0.6, vertSpread: 0.5, usagePct: 55 },
        { pitchType: 'SL', pitchName: 'Slider', horzRelease: -1.4, vertRelease: 5.9, extension: 6.8, horzSpread: 0.7, vertSpread: 0.5, usagePct: 35 },
        { pitchType: 'CH', pitchName: 'Change', horzRelease: -1.6, vertRelease: 6.0, extension: 6.9, horzSpread: 0.8, vertSpread: 0.6, usagePct: 10 },
      ],
      notes: 'Tightest release point spread in the league. Two-pitch reliever where both pitches emerge from identical slot. Near-impossible to distinguish.',
    },
    {
      name: 'Terrence Miles', team: 'CWS', throws: 'R', role: 'SP', overallConsistency: 'below',
      avgExtension: 6.2, deceptionScore: 58, tunnelScore: 62,
      pitches: [
        { pitchType: 'FF', pitchName: '4-Seam', horzRelease: -2.2, vertRelease: 5.8, extension: 6.3, horzSpread: 1.8, vertSpread: 1.4, usagePct: 48 },
        { pitchType: 'SL', pitchName: 'Slider', horzRelease: -1.8, vertRelease: 5.5, extension: 6.1, horzSpread: 2.0, vertSpread: 1.5, usagePct: 25 },
        { pitchType: 'CU', pitchName: 'Curve', horzRelease: -1.5, vertRelease: 6.2, extension: 5.8, horzSpread: 2.2, vertSpread: 1.8, usagePct: 15 },
        { pitchType: 'CH', pitchName: 'Change', horzRelease: -2.4, vertRelease: 5.6, extension: 6.2, horzSpread: 1.9, vertSpread: 1.6, usagePct: 12 },
      ],
      notes: 'Inconsistent release point is the main issue. Curveball arm action tips the pitch. Needs mechanical work to tighten delivery.',
    },
    {
      name: 'Austin Pierce', team: 'BOS', throws: 'R', role: 'RP', overallConsistency: 'avg',
      avgExtension: 7.3, deceptionScore: 78, tunnelScore: 82,
      pitches: [
        { pitchType: 'FF', pitchName: '4-Seam', horzRelease: -1.2, vertRelease: 6.5, extension: 7.4, horzSpread: 1.2, vertSpread: 0.9, usagePct: 60 },
        { pitchType: 'FS', pitchName: 'Splitter', horzRelease: -1.3, vertRelease: 6.4, extension: 7.2, horzSpread: 1.4, vertSpread: 1.0, usagePct: 40 },
      ],
      notes: 'Great extension creates perceived velocity. Two-pitch mix tunnels well but splitter has slightly more spread. Elite extension compensates.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `rp-${i}` }));
}
