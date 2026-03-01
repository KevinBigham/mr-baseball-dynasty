import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';

interface Props {
  userTeamId: number;
  season: number;
  userWins: number;
  userLosses: number;
  onContinue: () => void;
}

interface DeadlineOffer {
  partnerTeamId: number;
  partnerAbbr: string;
  offeredName: string;
  offeredPos: string;
  offeredOvr: number;
  offeredId: number;
  requestedName: string;
  requestedPos: string;
  requestedOvr: number;
  requestedId: number;
  fairness: number;
}

export default function TradeDeadline({ userTeamId, season, userWins, userLosses, onContinue }: Props) {
  const [offers, setOffers] = useState<DeadlineOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  const isBuyer = userWins > userLosses;

  useEffect(() => {
    (async () => {
      try {
        const engine = getEngine();
        const tradeOffers = await engine.getTradeOffers();
        const mapped: DeadlineOffer[] = tradeOffers.slice(0, 3).map(offer => ({
          partnerTeamId: offer.partnerTeamId,
          partnerAbbr: offer.partnerTeamAbbr,
          offeredName: offer.offered[0]?.name ?? 'Unknown',
          offeredPos: offer.offered[0]?.position ?? 'UT',
          offeredOvr: offer.offered[0]?.overall ?? 0,
          offeredId: offer.offered[0]?.playerId ?? 0,
          requestedName: offer.requested[0]?.name ?? 'Unknown',
          requestedPos: offer.requested[0]?.position ?? 'UT',
          requestedOvr: offer.requested[0]?.overall ?? 0,
          requestedId: offer.requested[0]?.playerId ?? 0,
          fairness: offer.fairness,
        })).filter(o => o.offeredId > 0 && o.requestedId > 0);
        setOffers(mapped);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [userTeamId]);

  const handleAccept = async (index: number) => {
    const offer = offers[index];
    if (!offer) return;
    try {
      const engine = getEngine();
      await engine.acceptTradeOffer(
        offer.partnerTeamId,
        [offer.requestedId],
        [offer.offeredId],
      );
      setAccepted(prev => new Set(prev).add(index));
    } catch { /* silent */ }
  };

  const toScale = (ovr: number) => Math.round(20 + (ovr / 550) * 60);

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <span>TRADE DEADLINE — {season}</span>
        <span className={`text-xs font-bold ${isBuyer ? 'text-green-400' : 'text-red-400'}`}>
          {isBuyer ? 'BUYER MODE' : 'SELLER MODE'}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="text-center">
          <div className="text-orange-400 text-sm font-bold tracking-wider">
            JULY 31 TRADE DEADLINE
          </div>
          <div className="text-gray-600 text-xs mt-1">
            {isBuyer
              ? 'Your team is in contention. Teams are calling with offers to bolster your roster.'
              : 'Your team is out of contention. Consider selling rentals for prospects.'}
          </div>
        </div>

        {loading && (
          <div className="text-orange-400 text-xs animate-pulse text-center py-4">
            Phones ringing...
          </div>
        )}

        {!loading && offers.length === 0 && (
          <div className="text-gray-600 text-xs text-center py-4">
            No trade offers at this time. The phones are quiet.
          </div>
        )}

        {!loading && offers.map((offer, i) => (
          <div
            key={i}
            className="bloomberg-border bg-gray-900/50 px-4 py-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-xs font-bold">{offer.partnerAbbr} OFFERS</span>
              {accepted.has(i) && (
                <span className="text-green-400 text-xs font-bold">ACCEPTED</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-600">YOU RECEIVE</div>
                <div className="text-green-400 font-bold">{offer.offeredName}</div>
                <div className="text-gray-500">{offer.offeredPos} · OVR {toScale(offer.offeredOvr)}</div>
              </div>
              <div>
                <div className="text-gray-600">YOU SEND</div>
                <div className="text-red-400 font-bold">{offer.requestedName}</div>
                <div className="text-gray-500">{offer.requestedPos} · OVR {toScale(offer.requestedOvr)}</div>
              </div>
            </div>
            {!accepted.has(i) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(i)}
                  className="flex-1 bg-green-800 hover:bg-green-700 text-white font-bold text-xs py-2 uppercase tracking-widest"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => setOffers(prev => prev.filter((_, j) => j !== i))}
                  className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-2 uppercase tracking-widest"
                >
                  DECLINE
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={onContinue}
          className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
        >
          CONTINUE TO FINAL STRETCH
        </button>
      </div>
    </div>
  );
}
