import type { SeasonResult } from '../../types/league';
import type { PlayerSeasonStats } from '../../types/player';

interface Props {
  result: SeasonResult;
  userTeamId: number;
}

interface Highlight {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export default function SeasonHighlights({ result, userTeamId }: Props) {
  const highlights = computeHighlights(result, userTeamId);

  if (highlights.length === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4">SEASON HIGHLIGHTS</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-800">
        {highlights.map(h => (
          <div key={h.label} className="bg-gray-900 px-3 py-3">
            <div className="text-gray-600 text-[10px] uppercase tracking-wider">{h.label}</div>
            <div className={`font-bold text-sm mt-0.5 ${h.color}`}>{h.value}</div>
            <div className="text-gray-600 text-[10px] mt-0.5">{h.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeHighlights(result: SeasonResult, userTeamId: number): Highlight[] {
  const highlights: Highlight[] = [];

  // User team record
  const userTeam = result.teamSeasons.find(t => t.teamId === userTeamId);
  if (userTeam) {
    const w = userTeam.record.wins;
    const l = userTeam.record.losses;
    highlights.push({
      label: 'YOUR RECORD',
      value: `${w}-${l}`,
      sub: w >= 95 ? 'Elite season' : w >= 85 ? 'Winning season' : w >= 75 ? 'Competitive' : 'Rebuilding year',
      color: w >= 90 ? 'text-green-400' : w >= 81 ? 'text-blue-400' : 'text-gray-400',
    });
  }

  // Team MVP (best OPS hitter on user team)
  const userHitters = result.playerSeasons.filter(
    p => !isLikelyPitcher(p) && p.teamId === userTeamId && p.pa >= 100,
  );
  if (userHitters.length > 0) {
    const best = userHitters.reduce((a, b) => computeOPS(a) > computeOPS(b) ? a : b);
    const ops = computeOPS(best);
    highlights.push({
      label: 'TEAM MVP',
      value: ops.toFixed(3) + ' OPS',
      sub: `Player #${best.playerId}`,
      color: ops >= .900 ? 'text-green-400' : 'text-orange-400',
    });
  }

  // HR king (league-wide)
  const allHitters = result.playerSeasons.filter(p => !isLikelyPitcher(p) && p.pa >= 100);
  if (allHitters.length > 0) {
    const hrKing = allHitters.reduce((a, b) => a.hr > b.hr ? a : b);
    highlights.push({
      label: 'HR KING',
      value: `${hrKing.hr} HR`,
      sub: `Player #${hrKing.playerId}`,
      color: 'text-orange-400',
    });
  }

  // K king (pitchers)
  const allPitchers = result.playerSeasons.filter(p => isLikelyPitcher(p) && p.outs >= 60);
  if (allPitchers.length > 0) {
    const kKing = allPitchers.reduce((a, b) => a.ka > b.ka ? a : b);
    highlights.push({
      label: 'K KING',
      value: `${kKing.ka} K`,
      sub: `Player #${kKing.playerId}`,
      color: 'text-blue-400',
    });
  }

  // Tightest division race
  const divisions = new Map<string, { wins: number[] }>();
  for (const ts of result.teamSeasons) {
    // We don't have division info in teamSeasons, so use win spread
    const key = `team-${ts.teamId}`;
    if (!divisions.has(key)) divisions.set(key, { wins: [] });
  }
  // Biggest surprise team (most wins above .500)
  const surpriseTeam = result.teamSeasons.reduce((a, b) => {
    const aDiff = a.record.wins - 81;
    const bDiff = b.record.wins - 81;
    return aDiff > bDiff ? a : b;
  });
  if (surpriseTeam.record.wins > 0) {
    highlights.push({
      label: 'BEST RECORD',
      value: `${surpriseTeam.record.wins}-${surpriseTeam.record.losses}`,
      sub: `Team #${surpriseTeam.teamId}`,
      color: 'text-yellow-400',
    });
  }

  return highlights;
}

function isLikelyPitcher(s: PlayerSeasonStats): boolean {
  return s.gp > 0 && s.outs > 0 && s.gs >= 0;
}

function computeOPS(s: PlayerSeasonStats): number {
  const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const tb = s.h + s.doubles + s.triples * 2 + s.hr * 3;
  const slg = s.ab > 0 ? tb / s.ab : 0;
  return obp + slg;
}
