/**
 * WaiversPanel — Display waiver wire results (DFA resolution).
 *
 * Read-only: shows which players were claimed, outrighted, or released.
 */

import type { WaiverClaim } from '../../engine/waivers';

interface Props {
  claims: WaiverClaim[];
  onComplete: () => void;
}

const OUTCOME_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  claimed:    { label: 'CLAIMED',    color: 'text-green-400', bg: 'bg-green-900/30' },
  outrighted: { label: 'OUTRIGHTED', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  released:   { label: 'RELEASED',   color: 'text-red-400',   bg: 'bg-red-900/30' },
};

export default function WaiversPanel({ claims, onComplete }: Props) {
  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-orange-500 font-bold text-xs tracking-widest">
              WAIVER WIRE
            </span>
            <span className="text-gray-500 text-xs ml-3">
              {claims.length} transaction{claims.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onComplete}
            className="bg-orange-600 hover:bg-orange-500 text-black font-bold px-4 py-1 text-xs tracking-widest"
          >
            ADVANCE TO AMATEUR DRAFT →
          </button>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="bloomberg-border bg-gray-900 p-6 text-center text-gray-400 text-sm">
          No waiver transactions this offseason.
        </div>
      ) : (
        <div className="bloomberg-border bg-gray-900 divide-y divide-gray-800">
          {claims.map((claim, i) => {
            const style = OUTCOME_STYLE[claim.outcome] || OUTCOME_STYLE.released;
            return (
              <div key={`${claim.playerId}-${i}`} className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs px-2 py-0.5 ${style.bg} ${style.color} tracking-widest`}>
                    {style.label}
                  </span>
                  <div>
                    <span className="text-gray-200 text-sm font-bold">{claim.playerName}</span>
                    <span className="text-gray-500 text-xs ml-2">{claim.position}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {claim.outcome === 'claimed' && (
                    <span className="text-green-400">→ {claim.claimingTeamAbbr}</span>
                  )}
                  {claim.outcome !== 'claimed' && (
                    <span className="text-gray-500">{claim.reason}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
