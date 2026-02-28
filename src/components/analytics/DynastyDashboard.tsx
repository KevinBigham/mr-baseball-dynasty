import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import {
  calcDynastyIndex,
  calcPeakPower,
  calcLongevity,
  buildHallOfSeasons,
  generateEraCards,
  type SeasonHistoryEntry,
  type HallOfSeasonEntry,
  type EraCard,
  type PeakPowerWindow,
  type LongevityProfile,
} from '../../engine/analytics/dynastyAnalytics';

function TierBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: color + '33', color }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="text-orange-400 font-bold text-xl tabular-nums">{value}</div>
      {sub && <div className="text-gray-600 text-[10px]">{sub}</div>}
    </div>
  );
}

function GradeBar({ value, max = 400 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-500' : pct >= 25 ? 'bg-blue-500' : 'bg-gray-600';
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DynastyDashboard() {
  const { gameStarted, userTeamId } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [dynastyIndex, setDynastyIndex] = useState(0);
  const [peakPower, setPeakPower] = useState<PeakPowerWindow>({ score: 0, startYear: 0, endYear: 0 });
  const [longevity, setLongevity] = useState<LongevityProfile>({ score: 0, winningSeasons: 0, playoffAppearances: 0, consistency: 0 });
  const [hallOfSeasons, setHallOfSeasons] = useState<HallOfSeasonEntry[]>([]);
  const [eraCards, setEraCards] = useState<EraCard[]>([]);
  const [history, setHistory] = useState<SeasonHistoryEntry[]>([]);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);

    // Build dynasty data from available sources
    Promise.all([
      getEngine().getChampionHistory(),
      getEngine().getAwardHistory(),
      getEngine().getStandings(),
    ]).then(([champions, awards, standings]) => {
      // Build a simplified history from available data
      const seasonMap = new Map<number, SeasonHistoryEntry>();

      // Process champion history
      for (const c of champions) {
        if (!seasonMap.has(c.season)) {
          seasonMap.set(c.season, {
            year: c.season,
            championId: c.teamId ?? null,
            teamRecords: [],
          });
        }
        const entry = seasonMap.get(c.season)!;
        entry.championId = c.teamId ?? null;
      }

      // Process award history
      for (const a of awards) {
        if (!seasonMap.has(a.season)) {
          seasonMap.set(a.season, { year: a.season, championId: null, teamRecords: [] });
        }
        const entry = seasonMap.get(a.season)!;
        if (a.award.includes('MVP') && a.award.includes('AL')) {
          entry.mvpAL = { name: a.name, teamAbbr: a.teamAbbr ?? '', position: a.position };
        }
        if (a.award.includes('MVP') && a.award.includes('NL')) {
          entry.mvpNL = { name: a.name, teamAbbr: a.teamAbbr ?? '', position: a.position };
        }
        if (a.award.includes('Cy Young') && a.award.includes('AL')) {
          entry.cyAL = { name: a.name, teamAbbr: a.teamAbbr ?? '' };
        }
        if (a.award.includes('Cy Young') && a.award.includes('NL')) {
          entry.cyNL = { name: a.name, teamAbbr: a.teamAbbr ?? '' };
        }
      }

      // Add current standings as team records for the current season
      if (standings) {
        const rows = (standings as any).rows ?? standings;
        if (Array.isArray(rows)) {
          // Group by season (just current)
          for (const r of rows) {
            const season = r.season ?? 1;
            if (!seasonMap.has(season)) {
              seasonMap.set(season, { year: season, championId: null, teamRecords: [] });
            }
            const entry = seasonMap.get(season)!;
            entry.teamRecords.push({
              teamId: r.teamId,
              abbr: r.abbreviation ?? r.abbr ?? `T${r.teamId}`,
              name: r.name ?? `Team ${r.teamId}`,
              wins: r.wins ?? 0,
              losses: r.losses ?? 0,
              runsScored: r.runsScored ?? 0,
              runsAllowed: r.runsAllowed ?? 0,
              playoffWins: r.playoffWins ?? 0,
              offenseRank: r.offenseRank ?? 15,
              pitchingRank: r.pitchingRank ?? 15,
              farmRank: r.farmRank ?? 15,
            });
          }
        }
      }

      const historyArr = [...seasonMap.values()].sort((a, b) => a.year - b.year);
      setHistory(historyArr);

      // Calculate dynasty metrics
      const titles = champions.filter((c: any) => c.teamId === userTeamId).length;
      const mvps = awards.filter((a: any) => (a.teamId === userTeamId || a.teamAbbr === '') && a.award.includes('MVP')).length;
      const cys = awards.filter((a: any) => (a.teamId === userTeamId || a.teamAbbr === '') && a.award.includes('Cy Young')).length;

      const idx = calcDynastyIndex({
        seasons: historyArr.length,
        wins: 0, losses: 0,
        titles, playoffWins: 0,
        mvps, cyYoungs: cys,
        rivalryDominance: 0,
      });
      setDynastyIndex(idx);
      setPeakPower(calcPeakPower(historyArr, userTeamId));
      setLongevity(calcLongevity(historyArr, userTeamId));
      setHallOfSeasons(buildHallOfSeasons(historyArr));
      setEraCards(generateEraCards(historyArr));
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading dynasty data...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">DYNASTY ANALYTICS</div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="DYNASTY INDEX" value={dynastyIndex} />
        <StatCard label="PEAK POWER" value={peakPower.score} sub={peakPower.startYear ? `${peakPower.startYear}–${peakPower.endYear}` : '—'} />
        <StatCard label="LONGEVITY" value={longevity.score} sub={`${longevity.consistency}% consistency`} />
        <StatCard label="WINNING SEASONS" value={longevity.winningSeasons} />
        <StatCard label="PLAYOFF APPS" value={longevity.playoffAppearances} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Hall of Seasons */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header text-yellow-400">HALL OF SEASONS — TOP 20 ALL-TIME</div>
          <div className="max-h-[28rem] overflow-y-auto">
            {hallOfSeasons.length === 0 ? (
              <div className="px-4 py-8 text-gray-600 text-xs text-center">Play more seasons to build the Hall of Seasons.</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="text-gray-500 text-[10px]">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">TEAM</th>
                    <th className="px-2 py-1 text-left">YEAR</th>
                    <th className="px-2 py-1 text-right">W-L</th>
                    <th className="px-2 py-1 text-right">DOM</th>
                    <th className="px-2 py-1 text-left">TAGS</th>
                  </tr>
                </thead>
                <tbody>
                  {hallOfSeasons.map((s, i) => (
                    <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                      <td className="px-2 py-1.5 text-gray-600 tabular-nums">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <span className="text-orange-300 font-bold">{s.abbr}</span>
                        {s.isChampion && <span className="ml-1 text-yellow-400 text-[10px]">WS</span>}
                      </td>
                      <td className="px-2 py-1.5 text-gray-400 tabular-nums">{s.year}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{s.wins}-{s.losses}</td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={`font-bold tabular-nums ${s.dominance >= 300 ? 'text-yellow-400' : s.dominance >= 200 ? 'text-green-400' : 'text-gray-400'}`}>
                          {s.dominance}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1 flex-wrap">
                          {s.identityTags.map((t, j) => (
                            <TierBadge key={j} label={t.label} color={t.color} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Era Cards sidebar */}
        <div className="space-y-4">
          <div className="bloomberg-border">
            <div className="bloomberg-header text-orange-400">DYNASTY ERAS</div>
            <div className="max-h-[20rem] overflow-y-auto">
              {eraCards.length === 0 ? (
                <div className="px-4 py-6 text-gray-600 text-xs text-center">No dynasty eras yet.</div>
              ) : (
                eraCards.map((era, i) => (
                  <div key={i} className="px-3 py-2 border-b border-gray-800/30 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-orange-300 font-bold text-sm">{era.abbr}</span>
                      <span className="text-gray-600 text-[10px] tabular-nums">{era.startYear}–{era.endYear}</span>
                    </div>
                    <div className="text-gray-400 text-[10px] mb-1">{era.teamName}</div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="text-center">
                        <div className="text-gray-600">W-L</div>
                        <div className="text-gray-300 font-bold tabular-nums">{era.wins}-{era.losses}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">TITLES</div>
                        <div className="text-yellow-400 font-bold tabular-nums">{era.titles}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">DOM</div>
                        <div className="text-green-400 font-bold tabular-nums">{era.avgDominance}</div>
                      </div>
                    </div>
                    <GradeBar value={era.totalDominance} max={2000} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dynasty index breakdown */}
          <div className="bloomberg-border">
            <div className="bloomberg-header text-gray-500">INDEX BREAKDOWN</div>
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Seasons Played</span>
                <span className="text-gray-300 tabular-nums">{history.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peak Power Score</span>
                <span className="text-orange-400 font-bold tabular-nums">{peakPower.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peak Window</span>
                <span className="text-gray-300 tabular-nums">
                  {peakPower.startYear ? `${peakPower.startYear}–${peakPower.endYear}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Longevity Score</span>
                <span className="text-green-400 font-bold tabular-nums">{longevity.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Consistency</span>
                <span className="text-gray-300 tabular-nums">{longevity.consistency}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
