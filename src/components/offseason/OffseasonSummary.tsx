import type { AISigningRecord } from '../../engine/freeAgency';
import type { ArbitrationCase } from '../../engine/finances';
import type { WaiverClaim } from '../../engine/waivers';
import type { Rule5Selection } from '../../engine/draft/rule5Draft';
import { formatSalary } from '../../utils/format';

export interface UserTransaction {
  type: 'signing' | 'trade';
  description: string;
}

interface Props {
  userTransactions: UserTransaction[];
  aiSignings: AISigningRecord[];
  arbitrationCases?: ArbitrationCase[];
  waiverClaims?: WaiverClaim[];
  draftedCount?: number;
  rule5Selections?: Rule5Selection[];
  onContinue: () => void;
  season: number;
}

export default function OffseasonSummary({
  userTransactions, aiSignings, onContinue, season,
  arbitrationCases = [], waiverClaims = [], draftedCount = 0, rule5Selections = [],
}: Props) {
  const notableSignings = [...aiSignings]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10);

  // Group AI signings by team
  const byTeam = new Map<string, AISigningRecord[]>();
  for (const s of aiSignings) {
    const existing = byTeam.get(s.teamAbbr) ?? [];
    existing.push(s);
    byTeam.set(s.teamAbbr, existing);
  }

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 text-center">
        OFFSEASON COMPLETE — ENTERING {season}
      </div>

      <div className="p-4 space-y-4">
        {/* Your moves */}
        <div>
          <div className="text-orange-500 text-xs font-bold tracking-widest mb-2">YOUR MOVES</div>
          {userTransactions.length === 0 ? (
            <div className="text-gray-600 text-xs">No transactions made this offseason.</div>
          ) : (
            <div className="space-y-1">
              {userTransactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-800/50 last:border-0">
                  <span className={`font-bold ${tx.type === 'signing' ? 'text-green-400' : 'text-blue-400'}`}>
                    {tx.type === 'signing' ? 'SIGN' : 'TRADE'}
                  </span>
                  <span className="text-gray-300">{tx.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notable signings */}
        {notableSignings.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">
              NOTABLE FREE AGENT SIGNINGS ({aiSignings.length} total)
            </div>
            <div className="space-y-0.5">
              {notableSignings.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-5 text-right tabular-nums">{s.overall}</span>
                    <span className="text-gray-500 w-6">{s.position}</span>
                    <span className="text-gray-300 font-bold">{s.playerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400">{s.teamAbbr}</span>
                    <span className="text-gray-500 tabular-nums">{s.years}yr / {formatSalary(s.salary)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* League activity summary */}
        {byTeam.size > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">LEAGUE ACTIVITY</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(byTeam.entries())
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 12)
                .map(([abbr, signings]) => (
                  <div key={abbr} className="bg-gray-800/50 px-2 py-1 text-xs">
                    <span className="text-orange-400 font-bold">{abbr}</span>
                    <span className="text-gray-500 ml-1">+{signings.length}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Arbitration results */}
        {arbitrationCases.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">
              ARBITRATION RESULTS ({arbitrationCases.length})
            </div>
            <div className="space-y-0.5">
              {arbitrationCases.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-6">{c.position}</span>
                    <span className="text-gray-300 font-bold">{c.playerName}</span>
                  </div>
                  <span className="text-gray-500 tabular-nums">{formatSalary(c.hearingResult)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiver wire */}
        {waiverClaims.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">
              WAIVER WIRE ({waiverClaims.length})
            </div>
            <div className="space-y-0.5">
              {waiverClaims.map((claim, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      claim.outcome === 'claimed' ? 'text-green-400' :
                      claim.outcome === 'outrighted' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {claim.outcome.toUpperCase()}
                    </span>
                    <span className="text-gray-300">{claim.playerName}</span>
                  </div>
                  {claim.outcome === 'claimed' && (
                    <span className="text-green-400">→ {claim.claimingTeamAbbr}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amateur Draft */}
        {draftedCount > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">AMATEUR DRAFT</div>
            <div className="text-gray-500 text-xs">{draftedCount} players drafted across all teams.</div>
          </div>
        )}

        {/* Rule 5 */}
        {rule5Selections.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">
              RULE 5 SELECTIONS ({rule5Selections.length})
            </div>
            <div className="space-y-0.5">
              {rule5Selections.map((sel, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-6">{sel.position}</span>
                    <span className="text-gray-300 font-bold">{sel.playerName}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">{sel.originalTeamAbbr}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-green-400">{sel.selectingTeamAbbr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-3 uppercase tracking-widest transition-colors mt-4"
        >
          PROCEED TO {season} SPRING TRAINING →
        </button>
      </div>
    </div>
  );
}
