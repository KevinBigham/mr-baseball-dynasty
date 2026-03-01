import { useLeagueStore, type SeasonSummary } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function finishBadge(s: SeasonSummary) {
  if (s.playoffResult === 'Champion') return { text: 'CHAMPION', color: 'text-yellow-400 bg-yellow-900/30' };
  if (s.playoffResult === 'WS') return { text: 'WORLD SERIES', color: 'text-orange-400 bg-orange-900/30' };
  if (s.playoffResult === 'CS') return { text: 'CHAMP SERIES', color: 'text-blue-400 bg-blue-900/30' };
  if (s.playoffResult === 'DS') return { text: 'DIV SERIES', color: 'text-blue-300 bg-blue-900/20' };
  if (s.playoffResult === 'WC') return { text: 'WILD CARD', color: 'text-cyan-400 bg-cyan-900/20' };
  return null;
}

function rowBg(s: SeasonSummary): string {
  if (s.playoffResult === 'Champion') return 'bg-yellow-900/10 border-l-2 border-l-yellow-500';
  if (s.playoffResult) return 'bg-orange-900/5 border-l-2 border-l-orange-700';
  if (s.wins >= 81) return 'border-l-2 border-l-green-800';
  return 'border-l-2 border-l-gray-800 opacity-70';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryView() {
  const { franchiseHistory } = useLeagueStore();
  const { seasonsManaged } = useGameStore();

  // History is stored newest-first; display newest-first
  const history = franchiseHistory;

  // Compute career totals
  const totalWins = history.reduce((s, h) => s + h.wins, 0);
  const totalLosses = history.reduce((s, h) => s + h.losses, 0);
  const totalGames = totalWins + totalLosses;
  const careerPct = totalGames > 0 ? (totalWins / totalGames) : 0;
  const playoffAppearances = history.filter(h => h.playoffResult !== null).length;
  const championships = history.filter(h => h.playoffResult === 'Champion').length;
  const allAwards = history.flatMap(h => h.awardsWon);

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">FRANCHISE ARCHIVE</div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="bloomberg-border bg-gray-900 px-6 py-12 text-center">
          <div className="text-gray-500 text-sm mb-2">Your dynasty story begins now.</div>
          <div className="text-gray-600 text-xs">
            Simulate your first season to start building your franchise legacy.
          </div>
        </div>
      )}

      {/* Career summary cards */}
      {history.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <SummaryCard label="SEASONS" value={String(seasonsManaged)} sub="managed" />
            <SummaryCard
              label="CAREER RECORD"
              value={`${totalWins}-${totalLosses}`}
              sub={`${careerPct.toFixed(3)} PCT`}
            />
            <SummaryCard
              label="PLAYOFFS"
              value={String(playoffAppearances)}
              sub={`of ${history.length} seasons`}
              highlight={playoffAppearances > 0}
            />
            <SummaryCard
              label="CHAMPIONSHIPS"
              value={String(championships)}
              sub={championships > 0 ? 'DYNASTY STATUS' : 'ring(s)'}
              highlight={championships > 0}
              gold={championships > 0}
            />
          </div>

          {/* Award tally */}
          {allAwards.length > 0 && (
            <div className="bloomberg-border bg-gray-900 mb-4">
              <div className="bloomberg-header px-4">AWARD CABINET</div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {allAwards.map((award, i) => (
                  <span key={i} className="text-xs bg-orange-900/30 text-orange-400 px-2 py-0.5 border border-orange-800">
                    {award}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Season-by-season table */}
          <div className="bloomberg-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800">
                  <th className="text-left px-3 py-1.5">SEASON</th>
                  <th className="text-right px-3 py-1.5">W</th>
                  <th className="text-right px-3 py-1.5">L</th>
                  <th className="text-right px-3 py-1.5">PCT</th>
                  <th className="text-left px-3 py-1.5">FINISH</th>
                  <th className="text-left px-3 py-1.5">AWARDS</th>
                  <th className="text-left px-3 py-1.5">KEY MOMENT</th>
                </tr>
              </thead>
              <tbody>
                {history.map(s => {
                  const badge = finishBadge(s);
                  return (
                    <tr key={s.season} className={`text-xs border-b border-gray-800/50 ${rowBg(s)}`}>
                      <td className="px-3 py-2 text-gray-400 font-bold tabular-nums">{s.season}</td>
                      <td className="text-right px-3 py-2 text-gray-300 tabular-nums font-bold">{s.wins}</td>
                      <td className="text-right px-3 py-2 text-gray-500 tabular-nums">{s.losses}</td>
                      <td className="text-right px-3 py-2 tabular-nums text-gray-400">{s.pct.toFixed(3)}</td>
                      <td className="px-3 py-2">
                        {badge ? (
                          <span className={`text-xs px-1.5 py-0.5 font-bold ${badge.color}`}>
                            {badge.text}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">
                        {s.awardsWon.length > 0 ? s.awardsWon.join(', ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[300px] truncate">
                        {s.keyMoment}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr className="text-xs border-t-2 border-gray-700 font-bold">
                  <td className="px-3 py-2 text-orange-500">CAREER</td>
                  <td className="text-right px-3 py-2 text-orange-400 tabular-nums">{totalWins}</td>
                  <td className="text-right px-3 py-2 text-gray-500 tabular-nums">{totalLosses}</td>
                  <td className="text-right px-3 py-2 text-orange-400 tabular-nums">{careerPct.toFixed(3)}</td>
                  <td className="px-3 py-2 text-orange-400">{playoffAppearances} PO</td>
                  <td className="px-3 py-2 text-orange-400">{allAwards.length} awards</td>
                  <td className="px-3 py-2 text-orange-400">{championships} rings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, highlight, gold }: {
  label: string; value: string; sub: string; highlight?: boolean; gold?: boolean;
}) {
  return (
    <div className={`bloomberg-border bg-gray-900 px-4 py-3 ${gold ? 'border-yellow-700' : ''}`}>
      <div className="text-gray-600 text-xs">{label}</div>
      <div className={`text-2xl font-black tabular-nums mt-0.5 ${
        gold ? 'text-yellow-400' : highlight ? 'text-orange-400' : 'text-gray-200'
      }`}>
        {value}
      </div>
      <div className={`text-xs mt-0.5 ${gold ? 'text-yellow-600' : 'text-gray-600'}`}>{sub}</div>
    </div>
  );
}
