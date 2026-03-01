import type { SeasonResult } from '../../types/league';

interface Props {
  result: SeasonResult;
  season: number;
  onContinue: () => void;
}

export default function AllStarBreak({ result, season, onContinue }: Props) {
  // Top hitters by OPS proxy
  const topHitters = result.playerSeasons
    .filter(p => p.pa > 200)
    .map(p => ({
      ...p,
      avg: p.ab > 0 ? p.h / p.ab : 0,
      ops: p.pa > 0 ? ((p.h + p.bb + p.hr * 3) / p.pa) : 0,
    }))
    .sort((a, b) => b.ops - a.ops)
    .slice(0, 6);

  // Top pitchers by ERA
  const topPitchers = result.playerSeasons
    .filter(p => p.outs > 100)
    .map(p => ({
      ...p,
      era: p.outs > 0 ? (p.er / p.outs) * 27 : 99,
    }))
    .sort((a, b) => a.era - b.era)
    .slice(0, 4);

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <span>ALL-STAR BREAK — {season}</span>
        <span className="text-gray-600 font-normal text-xs">Mid-Season Report</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="text-center">
          <div className="text-orange-400 text-sm font-bold tracking-wider">
            MR. BASEBALL MIDSUMMER CLASSIC
          </div>
          <div className="text-gray-600 text-xs mt-1">
            The top performers at the halfway mark
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Top Hitters */}
          <div className="space-y-2">
            <div className="text-blue-400 text-xs font-bold tracking-wider border-b border-blue-900 pb-1">
              TOP HITTERS
            </div>
            {topHitters.map((h, i) => (
              <div key={i} className="text-xs flex justify-between items-center">
                <span className="text-gray-300">#{h.playerId}</span>
                <span className="text-gray-500 tabular-nums">
                  .{h.avg.toFixed(3).slice(2)} / {h.hr} HR / {h.rbi} RBI
                </span>
              </div>
            ))}
          </div>

          {/* Top Pitchers */}
          <div className="space-y-2">
            <div className="text-red-400 text-xs font-bold tracking-wider border-b border-red-900 pb-1">
              TOP PITCHERS
            </div>
            {topPitchers.map((p, i) => (
              <div key={i} className="text-xs flex justify-between items-center">
                <span className="text-gray-300">#{p.playerId}</span>
                <span className="text-gray-500 tabular-nums">
                  {p.era.toFixed(2)} ERA / {p.ka} K
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
        >
          RESUME SEASON
        </button>
      </div>
    </div>
  );
}
