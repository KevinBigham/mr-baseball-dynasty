import type { SeasonSummary } from '../../store/leagueStore';

interface Props {
  franchiseHistory: SeasonSummary[];
  seasonsManaged: number;
}

function legacyGrade(history: SeasonSummary[]): { grade: string; color: string; label: string } {
  if (history.length === 0) return { grade: 'F', color: '#ef4444', label: 'FORGETTABLE' };

  const championships = history.filter(s => s.playoffResult === 'Champion').length;
  const playoffAppearances = history.filter(s => s.playoffResult !== null).length;
  const totalWins = history.reduce((sum, s) => sum + s.wins, 0);
  const totalLosses = history.reduce((sum, s) => sum + s.losses, 0);
  const avgPct = totalLosses + totalWins > 0 ? totalWins / (totalWins + totalLosses) : 0;

  let score = 0;
  score += championships * 30;
  score += playoffAppearances * 10;
  score += avgPct > .550 ? 15 : avgPct > .500 ? 8 : 0;
  score += history.length * 3;

  if (score >= 80) return { grade: 'A+', color: '#fbbf24', label: 'HALL OF FAME' };
  if (score >= 60) return { grade: 'A', color: '#4ade80', label: 'LEGENDARY' };
  if (score >= 45) return { grade: 'B+', color: '#4ade80', label: 'EXCELLENT' };
  if (score >= 30) return { grade: 'B', color: '#60a5fa', label: 'SOLID' };
  if (score >= 18) return { grade: 'C', color: '#fb923c', label: 'MEDIOCRE' };
  if (score >= 8)  return { grade: 'D', color: '#ef4444', label: 'DISAPPOINTING' };
  return { grade: 'F', color: '#ef4444', label: 'FORGETTABLE' };
}

export default function CareerSummary({ franchiseHistory, seasonsManaged }: Props) {
  const totalWins = franchiseHistory.reduce((s, h) => s + h.wins, 0);
  const totalLosses = franchiseHistory.reduce((s, h) => s + h.losses, 0);
  const championships = franchiseHistory.filter(s => s.playoffResult === 'Champion').length;
  const playoffAppearances = franchiseHistory.filter(s => s.playoffResult !== null).length;
  const bestRecord = franchiseHistory.length > 0
    ? franchiseHistory.reduce((best, s) => s.pct > best.pct ? s : best)
    : null;
  const legacy = legacyGrade(franchiseHistory);

  return (
    <div className="space-y-4">
      {/* Legacy Grade */}
      <div className="text-center py-4">
        <div className="text-gray-600 text-xs tracking-widest mb-2">LEGACY GRADE</div>
        <div
          className="text-6xl font-black tabular-nums"
          style={{ color: legacy.color }}
        >
          {legacy.grade}
        </div>
        <div
          className="text-sm font-bold tracking-widest mt-1"
          style={{ color: legacy.color }}
        >
          {legacy.label}
        </div>
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="SEASONS" value={String(seasonsManaged)} />
        <StatBox label="RECORD" value={`${totalWins}–${totalLosses}`} />
        <StatBox label="CHAMPIONSHIPS" value={String(championships)} highlight={championships > 0} />
        <StatBox label="PLAYOFF APPS" value={String(playoffAppearances)} />
      </div>

      {bestRecord && (
        <div className="bloomberg-border bg-gray-900/50">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-gray-500 text-xs">BEST SEASON</span>
            <span className="text-orange-400 font-bold text-sm">
              {bestRecord.season}: {bestRecord.wins}–{bestRecord.losses} ({bestRecord.pct.toFixed(3)})
            </span>
          </div>
        </div>
      )}

      {/* Season-by-Season */}
      {franchiseHistory.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON LOG</div>
          <div className="divide-y divide-gray-800/50">
            {franchiseHistory.map(s => (
              <div key={s.season} className="px-4 py-2 flex items-center justify-between text-xs">
                <span className="text-orange-400 font-bold w-12">{s.season}</span>
                <span className="text-gray-300 tabular-nums w-20">{s.wins}–{s.losses}</span>
                <span className="text-gray-400 tabular-nums w-12">{s.pct.toFixed(3)}</span>
                <span className={`w-24 text-right ${s.playoffResult ? 'text-green-400 font-bold' : 'text-gray-700'}`}>
                  {s.playoffResult ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bloomberg-border bg-gray-900/50 px-4 py-3 text-center">
      <div className="text-gray-600 text-xs">{label}</div>
      <div className={`font-bold text-lg tabular-nums ${highlight ? 'text-yellow-400' : 'text-gray-200'}`}>
        {value}
      </div>
    </div>
  );
}
