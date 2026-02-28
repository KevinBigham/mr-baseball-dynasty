import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { PowerRanking } from '../../engine/analytics/powerRankings';

function RatingBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-16">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function PowerRankings() {
  const { gameStarted } = useGameStore();
  const [rankings, setRankings] = useState<PowerRanking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getPowerRankings()
      .then(setRankings)
      .finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Computing rankings…</div>;

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">POWER RANKINGS</div>

      <div className="bloomberg-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="px-2 py-1 text-right w-8">#</th>
              <th className="px-2 py-1 text-left">TEAM</th>
              <th className="px-2 py-1 text-right">RTG</th>
              <th className="px-2 py-1 text-center">OFF</th>
              <th className="px-2 py-1 text-center">ROT</th>
              <th className="px-2 py-1 text-center">PEN</th>
              <th className="px-2 py-1 text-center">FARM</th>
              <th className="px-2 py-1 text-right">TREND</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(r => (
              <tr key={r.teamId} className="bloomberg-row">
                <td className="px-2 py-1 text-right tabular-nums text-gray-600">{r.rank}</td>
                <td className="px-2 py-1 font-bold text-orange-300">{r.abbreviation}</td>
                <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{r.rating}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="tabular-nums text-gray-400 w-6 text-right">{r.offenseRating}</span>
                    <RatingBar value={r.offenseRating} color="bg-green-500" />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="tabular-nums text-gray-400 w-6 text-right">{r.rotationRating}</span>
                    <RatingBar value={r.rotationRating} color="bg-blue-500" />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="tabular-nums text-gray-400 w-6 text-right">{r.bullpenRating}</span>
                    <RatingBar value={r.bullpenRating} color="bg-purple-500" />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="tabular-nums text-gray-400 w-6 text-right">{r.farmRating}</span>
                    <RatingBar value={r.farmRating} color="bg-yellow-500" />
                  </div>
                </td>
                <td className="px-2 py-1 text-right tabular-nums">
                  <span className={r.trend > 0 ? 'text-green-400' : r.trend < 0 ? 'text-red-400' : 'text-gray-500'}>
                    {r.trend > 0 ? '+' : ''}{(r.trend * 100).toFixed(0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
