import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Inbox,
  RotateCcw,
  Scale,
  X,
} from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  displayRating: number;
  letterGrade: string;
  rosterStatus: string;
  teamId: string;
  stats: Record<string, unknown> | null;
}

interface TradeAssetView {
  playerId: string;
  playerName: string;
  position: string;
}

interface TradeOfferView {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  fromTeamAbbreviation: string;
  toTeamId: string;
  toTeamName: string;
  toTeamAbbreviation: string;
  fairnessScore: number;
  message: string;
  createdAt: string;
  offeringPlayers: TradeAssetView[];
  requestingPlayers: TradeAssetView[];
}

interface TradeHistoryView {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  fromTeamAbbreviation: string;
  toTeamId: string;
  toTeamName: string;
  toTeamAbbreviation: string;
  fairnessScore: number;
  summary: string;
  timestamp: string;
  offeringPlayers: TradeAssetView[];
  requestingPlayers: TradeAssetView[];
}

interface TradeResult {
  status: 'accepted' | 'rejected' | 'counter' | 'declined';
  message: string;
}

const ALL_TEAMS = [
  { id: 'bal', name: 'Orioles', abbr: 'BAL' }, { id: 'bos', name: 'Red Sox', abbr: 'BOS' },
  { id: 'nyy', name: 'Yankees', abbr: 'NYY' }, { id: 'tb', name: 'Rays', abbr: 'TBR' },
  { id: 'tor', name: 'Blue Jays', abbr: 'TOR' }, { id: 'cws', name: 'White Sox', abbr: 'CWS' },
  { id: 'cle', name: 'Guardians', abbr: 'CLE' }, { id: 'det', name: 'Tigers', abbr: 'DET' },
  { id: 'kc', name: 'Royals', abbr: 'KCR' }, { id: 'min', name: 'Twins', abbr: 'MIN' },
  { id: 'hou', name: 'Astros', abbr: 'HOU' }, { id: 'laa', name: 'Angels', abbr: 'LAA' },
  { id: 'oak', name: 'Athletics', abbr: 'OAK' }, { id: 'sea', name: 'Mariners', abbr: 'SEA' },
  { id: 'tex', name: 'Rangers', abbr: 'TEX' }, { id: 'atl', name: 'Braves', abbr: 'ATL' },
  { id: 'mia', name: 'Marlins', abbr: 'MIA' }, { id: 'nym', name: 'Mets', abbr: 'NYM' },
  { id: 'phi', name: 'Phillies', abbr: 'PHI' }, { id: 'wsh', name: 'Nationals', abbr: 'WSH' },
  { id: 'chc', name: 'Cubs', abbr: 'CHC' }, { id: 'cin', name: 'Reds', abbr: 'CIN' },
  { id: 'mil', name: 'Brewers', abbr: 'MIL' }, { id: 'pit', name: 'Pirates', abbr: 'PIT' },
  { id: 'stl', name: 'Cardinals', abbr: 'STL' }, { id: 'ari', name: 'Diamondbacks', abbr: 'ARI' },
  { id: 'col', name: 'Rockies', abbr: 'COL' }, { id: 'lad', name: 'Dodgers', abbr: 'LAD' },
  { id: 'sd', name: 'Padres', abbr: 'SDP' }, { id: 'sf', name: 'Giants', abbr: 'SFG' },
  { id: 'mtl', name: 'Expos', abbr: 'MTL' }, { id: 'por', name: 'Evergreens', abbr: 'POR' },
];

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-accent-success/20 text-accent-success';
    case 'B': return 'bg-accent-info/20 text-accent-info';
    case 'C': return 'bg-accent-warning/20 text-accent-warning';
    case 'D': return 'bg-accent-danger/20 text-accent-danger';
    default: return 'bg-dynasty-border text-dynasty-muted';
  }
}

function estimateValue(player: PlayerDTO): number {
  const ageFactor = Math.max(0, 1 - (player.age - 24) * 0.04);
  return player.overallRating * (0.6 + ageFactor * 0.4);
}

function fairnessRatio(offerValue: number, requestValue: number): number {
  const total = offerValue + requestValue;
  if (total === 0) return 0.5;
  return offerValue / total;
}

function fairnessLabel(ratio: number): { text: string; color: string } {
  if (ratio < 0.3) return { text: 'Heavily favors you', color: 'text-accent-danger' };
  if (ratio < 0.45) return { text: 'Slightly favors you', color: 'text-accent-warning' };
  if (ratio <= 0.55) return { text: 'Fair trade', color: 'text-accent-success' };
  if (ratio <= 0.7) return { text: 'Slightly favors them', color: 'text-accent-warning' };
  return { text: 'Heavily favors them', color: 'text-accent-danger' };
}

function fairnessText(score: number, fromTeam: string, toTeam: string): string {
  if (Math.abs(score) <= 10) return 'Balanced';
  return score > 0 ? `Favored ${fromTeam}` : `Favored ${toTeam}`;
}

function PlayerRow({
  player,
  selected,
  disabled,
  onClick,
}: {
  player: PlayerDTO;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`border-b border-dynasty-border/50 text-sm transition-colors ${
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer'
      } ${selected ? 'bg-accent-primary/15' : disabled ? '' : 'hover:bg-dynasty-elevated'}`}
    >
      <td className="px-3 py-1.5 font-heading font-medium text-dynasty-text">
        {player.firstName} {player.lastName}
      </td>
      <td className="px-2 py-1.5 font-data text-dynasty-muted">{player.position}</td>
      <td className="px-2 py-1.5 text-right font-data text-dynasty-text">{player.displayRating}</td>
      <td className="px-2 py-1.5 text-center">
        <span className={`inline-block w-6 rounded text-center font-data text-xs font-bold ${gradeColor(player.letterGrade)}`}>
          {player.letterGrade}
        </span>
      </td>
      <td className="px-2 py-1.5 text-right font-data text-dynasty-muted">{player.age}</td>
    </tr>
  );
}

function OfferCard({
  offer,
  onAccept,
  onCounter,
  onDecline,
}: {
  offer: TradeOfferView;
  onAccept: () => void;
  onCounter: () => void;
  onDecline: () => void;
}) {
  const evaluation = fairnessText(-offer.fairnessScore, 'Them', 'You');

  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold text-dynasty-textBright">{offer.fromTeamName}</p>
          <p className="mt-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
            {offer.createdAt} · {evaluation}
          </p>
        </div>
        <span className="rounded border border-dynasty-border bg-dynasty-elevated px-2 py-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
          {offer.fromTeamAbbreviation}
        </span>
      </div>

      <p className="mt-3 font-heading text-sm text-dynasty-text">{offer.message}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-dynasty-border bg-dynasty-elevated px-3 py-2">
          <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-accent-success">They Offer</p>
          <div className="mt-2 space-y-1">
            {offer.offeringPlayers.map((asset) => (
              <p key={asset.playerId} className="font-data text-xs text-dynasty-text">
                {asset.playerName} · {asset.position}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded border border-dynasty-border bg-dynasty-elevated px-3 py-2">
          <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-accent-warning">They Want</p>
          <div className="mt-2 space-y-1">
            {offer.requestingPlayers.map((asset) => (
              <p key={asset.playerId} className="font-data text-xs text-dynasty-text">
                {asset.playerName} · {asset.position}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onAccept}
          className="inline-flex items-center gap-2 rounded-md bg-accent-success px-3 py-2 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-accent-success/80"
        >
          <Check className="h-4 w-4" /> Accept
        </button>
        <button
          onClick={onCounter}
          className="inline-flex items-center gap-2 rounded-md border border-dynasty-border px-3 py-2 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-dynasty-text transition-colors hover:border-accent-info hover:text-accent-info"
        >
          <ArrowLeftRight className="h-4 w-4" /> Counter
        </button>
        <button
          onClick={onDecline}
          className="inline-flex items-center gap-2 rounded-md border border-dynasty-border px-3 py-2 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-dynasty-muted transition-colors hover:border-accent-danger hover:text-accent-danger"
        >
          <X className="h-4 w-4" /> Decline
        </button>
      </div>
    </div>
  );
}

function HistoryCard({ trade }: { trade: TradeHistoryView }) {
  const evaluation = fairnessText(trade.fairnessScore, trade.fromTeamAbbreviation, trade.toTeamAbbreviation);
  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold text-dynasty-textBright">
            {trade.fromTeamAbbreviation} ↔ {trade.toTeamAbbreviation}
          </p>
          <p className="mt-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
            {trade.timestamp} · {evaluation}
          </p>
        </div>
        <span className="rounded border border-dynasty-border bg-dynasty-elevated px-2 py-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
          {trade.offeringPlayers.length + trade.requestingPlayers.length} assets
        </span>
      </div>
      <p className="mt-3 font-heading text-sm text-dynasty-text">{trade.summary}</p>
    </div>
  );
}

export default function TradePage() {
  const worker = useWorker();
  const {
    getTeamRoster,
    getTradeOffers,
    getTradeHistory,
    proposeTrade,
    respondToTradeOffer,
  } = worker;
  const { userTeamId, isInitialized, day, season, phase } = useGameStore();

  const [selectedTeam, setSelectedTeam] = useState('');
  const [yourRoster, setYourRoster] = useState<PlayerDTO[]>([]);
  const [targetRoster, setTargetRoster] = useState<PlayerDTO[]>([]);
  const [offering, setOffering] = useState<string[]>([]);
  const [requesting, setRequesting] = useState<string[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<TradeOfferView[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryView[]>([]);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [proposing, setProposing] = useState(false);
  const [activeCounterOfferId, setActiveCounterOfferId] = useState<string | null>(null);

  const workerReady = worker.isReady;
  const otherTeams = ALL_TEAMS.filter((team) => team.id !== userTeamId);
  const tradeMarketOpen = phase === 'regular' && day <= 120;
  const daysUntilDeadline = Math.max(0, 120 - day);

  const loadUserRoster = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    const data = await getTeamRoster(userTeamId);
    setYourRoster((data as PlayerDTO[]) ?? []);
  }, [getTeamRoster, isInitialized, userTeamId, workerReady]);

  const loadTargetRoster = useCallback(async () => {
    if (!selectedTeam || !isInitialized || !workerReady) {
      setTargetRoster([]);
      return;
    }
    const data = await getTeamRoster(selectedTeam);
    setTargetRoster((data as PlayerDTO[]) ?? []);
  }, [getTeamRoster, isInitialized, selectedTeam, workerReady]);

  const loadTradeActivity = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    const [offers, history] = await Promise.all([
      getTradeOffers(),
      getTradeHistory(),
    ]);
    setIncomingOffers((offers as TradeOfferView[]) ?? []);
    setTradeHistory((history as TradeHistoryView[]) ?? []);
  }, [getTradeHistory, getTradeOffers, isInitialized, workerReady]);

  useEffect(() => {
    void loadUserRoster();
  }, [loadUserRoster, day, season, phase]);

  useEffect(() => {
    void loadTargetRoster();
  }, [loadTargetRoster, day, season, phase]);

  useEffect(() => {
    void loadTradeActivity();
  }, [loadTradeActivity, day, season, phase]);

  const toggleOffer = (id: string) => {
    setTradeResult(null);
    setOffering((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleRequest = (id: string) => {
    setTradeResult(null);
    setRequesting((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const resetBuilder = () => {
    setOffering([]);
    setRequesting([]);
    setActiveCounterOfferId(null);
  };

  const clearTrade = () => {
    resetBuilder();
    setTradeResult(null);
  };

  const playerById = (id: string) =>
    yourRoster.find((player) => player.id === id) ?? targetRoster.find((player) => player.id === id);

  const offerTotal = offering.reduce((sum, id) => sum + estimateValue(playerById(id)!), 0);
  const requestTotal = requesting.reduce((sum, id) => sum + estimateValue(playerById(id)!), 0);
  const packageFairness = fairnessLabel(fairnessRatio(offerTotal, requestTotal));

  const submitTrade = async () => {
    if (!selectedTeam || offering.length === 0 || requesting.length === 0 || !tradeMarketOpen) return;
    setProposing(true);
    try {
      if (activeCounterOfferId) {
        const result = await respondToTradeOffer(activeCounterOfferId, 'counter', {
          offeringPlayerIds: offering,
          requestingPlayerIds: requesting,
        });
        const response = result as { decision: 'accepted' | 'rejected' | 'countered' | 'declined'; message: string };
        setTradeResult({
          status: response.decision === 'accepted'
            ? 'accepted'
            : response.decision === 'countered'
              ? 'counter'
              : 'rejected',
          message: response.message,
        });
        resetBuilder();
      } else {
        const result = await proposeTrade(offering, requesting, selectedTeam);
        const response = result as { decision: 'accepted' | 'rejected' | 'countered'; reason: string };
        setTradeResult({
          status: response.decision === 'accepted'
            ? 'accepted'
            : response.decision === 'countered'
              ? 'counter'
              : 'rejected',
          message: response.reason,
        });
        if (response.decision === 'accepted') {
          resetBuilder();
        }
      }

      await Promise.all([loadUserRoster(), loadTargetRoster(), loadTradeActivity()]);
    } finally {
      setProposing(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setProposing(true);
    try {
      const result = await respondToTradeOffer(offerId, 'accept');
      const response = result as { decision: 'accepted' | 'rejected'; message: string };
      setTradeResult({
        status: response.decision === 'accepted' ? 'accepted' : 'rejected',
        message: response.message,
      });
      await Promise.all([loadUserRoster(), loadTargetRoster(), loadTradeActivity()]);
    } finally {
      setProposing(false);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    setProposing(true);
    try {
      const result = await respondToTradeOffer(offerId, 'decline');
      const response = result as { message: string };
      setTradeResult({ status: 'declined', message: response.message });
      await loadTradeActivity();
    } finally {
      setProposing(false);
    }
  };

  const handleCounterOffer = (offer: TradeOfferView) => {
    setSelectedTeam(offer.fromTeamId);
    setOffering(offer.requestingPlayers.map((asset) => asset.playerId));
    setRequesting(offer.offeringPlayers.map((asset) => asset.playerId));
    setActiveCounterOfferId(offer.id);
    setTradeResult(null);
  };

  const marketMessage = useMemo(() => {
    if (phase !== 'regular') {
      return 'Trade market closed — reopens in offseason';
    }
    if (!tradeMarketOpen) {
      return 'Trade market closed — reopens in offseason';
    }
    return `${daysUntilDeadline} days until trade deadline`;
  }, [daysUntilDeadline, phase, tradeMarketOpen]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">Trade Center</h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Deadline pressure, incoming offers, and every deal from around the league.
        </p>
      </div>

      <div className={`rounded-lg border px-4 py-3 ${
        tradeMarketOpen
          ? 'border-accent-warning/30 bg-accent-warning/10'
          : 'border-dynasty-border bg-dynasty-surface'
      }`}>
        <p className={`font-heading text-sm ${tradeMarketOpen ? 'text-accent-warning' : 'text-dynasty-text'}`}>
          {marketMessage}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="flex items-center gap-2 border-b border-dynasty-border px-4 py-3">
              <Inbox className="h-4 w-4 text-dynasty-muted" />
              <div>
                <h2 className="font-heading text-sm font-semibold text-dynasty-text">Trade Inbox</h2>
                <p className="mt-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
                  {incomingOffers.length} active conversations
                </p>
              </div>
            </div>
            <div className="space-y-3 px-3 py-3">
              {incomingOffers.length === 0 ? (
                <p className="rounded border border-dynasty-border bg-dynasty-elevated px-4 py-6 text-center font-heading text-sm text-dynasty-muted">
                  No active trade offers.
                </p>
              ) : (
                incomingOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={() => void handleAcceptOffer(offer.id)}
                    onCounter={() => handleCounterOffer(offer)}
                    onDecline={() => void handleDeclineOffer(offer.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="flex items-center gap-2 border-b border-dynasty-border px-4 py-3">
              <ArrowLeftRight className="h-4 w-4 text-dynasty-muted" />
              <div>
                <h2 className="font-heading text-sm font-semibold text-dynasty-text">Trade History</h2>
                <p className="mt-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
                  Season {season} ledger
                </p>
              </div>
            </div>
            <div className="space-y-3 px-3 py-3">
              {tradeHistory.length === 0 ? (
                <p className="rounded border border-dynasty-border bg-dynasty-elevated px-4 py-6 text-center font-heading text-sm text-dynasty-muted">
                  No trades completed yet this season.
                </p>
              ) : (
                tradeHistory.map((trade) => (
                  <HistoryCard key={trade.id} trade={trade} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-sm font-semibold text-dynasty-text">
                  {activeCounterOfferId ? 'Counter Offer Builder' : 'Trade Builder'}
                </h2>
                <p className="mt-1 font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
                  {activeCounterOfferId ? 'Loaded from trade inbox' : 'Direct proposal to another front office'}
                </p>
              </div>
              <select
                value={selectedTeam}
                onChange={(event) => {
                  setSelectedTeam(event.target.value);
                  setRequesting([]);
                  setTradeResult(null);
                  setActiveCounterOfferId(null);
                }}
                className="rounded border border-dynasty-border bg-dynasty-elevated px-3 py-2 font-heading text-sm text-dynasty-text focus:border-accent-primary focus:outline-none"
              >
                <option value="">Select a team...</option>
                {otherTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.abbr} - {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-dynasty-border bg-dynasty-elevated">
                <div className="border-b border-dynasty-border px-4 py-3">
                  <h3 className="font-heading text-sm font-semibold text-dynasty-text">Your Assets</h3>
                </div>
                <div className="max-h-[22rem] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-dynasty-elevated">
                      <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                        <th className="px-3 py-2 text-left font-heading">Player</th>
                        <th className="px-2 py-2 text-left font-heading">POS</th>
                        <th className="px-2 py-2 text-right font-data">OVR</th>
                        <th className="px-2 py-2 text-center font-heading">GRD</th>
                        <th className="px-2 py-2 text-right font-data">AGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yourRoster.map((player) => (
                        <PlayerRow
                          key={player.id}
                          player={player}
                          selected={offering.includes(player.id)}
                          disabled={!tradeMarketOpen}
                          onClick={() => toggleOffer(player.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-dynasty-border bg-dynasty-elevated">
                <div className="border-b border-dynasty-border px-4 py-3">
                  <h3 className="font-heading text-sm font-semibold text-dynasty-text">Target Roster</h3>
                </div>
                <div className="max-h-[22rem] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-dynasty-elevated">
                      <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                        <th className="px-3 py-2 text-left font-heading">Player</th>
                        <th className="px-2 py-2 text-left font-heading">POS</th>
                        <th className="px-2 py-2 text-right font-data">OVR</th>
                        <th className="px-2 py-2 text-center font-heading">GRD</th>
                        <th className="px-2 py-2 text-right font-data">AGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetRoster.map((player) => (
                        <PlayerRow
                          key={player.id}
                          player={player}
                          selected={requesting.includes(player.id)}
                          disabled={!tradeMarketOpen}
                          onClick={() => toggleRequest(player.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dynasty-border bg-dynasty-elevated p-4">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-dynasty-muted" />
                <h3 className="font-heading text-sm font-semibold text-dynasty-text">Package Evaluation</h3>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div>
                  <p className="mb-2 font-heading text-[11px] uppercase tracking-[0.18em] text-accent-primary">Offering</p>
                  <div className="flex flex-wrap gap-1.5">
                    {offering.length === 0 ? (
                      <span className="font-heading text-xs text-dynasty-muted">Select players from your roster</span>
                    ) : (
                      offering.map((id) => {
                        const player = playerById(id);
                        if (!player) return null;
                        return (
                          <button
                            key={id}
                            onClick={() => toggleOffer(id)}
                            className="rounded border border-dynasty-border bg-dynasty-surface px-2 py-1 font-data text-xs text-dynasty-text"
                          >
                            {player.firstName[0]}. {player.lastName} · {player.position}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                  <ArrowRight className="h-5 w-5 text-dynasty-muted" />
                </div>

                <div>
                  <p className="mb-2 font-heading text-[11px] uppercase tracking-[0.18em] text-accent-info">Requesting</p>
                  <div className="flex flex-wrap gap-1.5">
                    {requesting.length === 0 ? (
                      <span className="font-heading text-xs text-dynasty-muted">Select players from the target roster</span>
                    ) : (
                      requesting.map((id) => {
                        const player = playerById(id);
                        if (!player) return null;
                        return (
                          <button
                            key={id}
                            onClick={() => toggleRequest(id)}
                            className="rounded border border-dynasty-border bg-dynasty-surface px-2 py-1 font-data text-xs text-dynasty-text"
                          >
                            {player.firstName[0]}. {player.lastName} · {player.position}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {(offering.length > 0 || requesting.length > 0) && (
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-dynasty-border">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(fairnessRatio(offerTotal, requestTotal) * 100)}%`,
                        background: fairnessRatio(offerTotal, requestTotal) >= 0.4 && fairnessRatio(offerTotal, requestTotal) <= 0.6
                          ? 'rgb(34 197 94)'
                          : fairnessRatio(offerTotal, requestTotal) >= 0.3 && fairnessRatio(offerTotal, requestTotal) <= 0.7
                            ? 'rgb(245 158 11)'
                            : 'rgb(244 63 94)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-data text-xs">
                    <span className="text-dynasty-muted">Favors you</span>
                    <span className={packageFairness.color}>{packageFairness.text}</span>
                    <span className="text-dynasty-muted">Favors them</span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void submitTrade()}
                  disabled={!tradeMarketOpen || !selectedTeam || offering.length === 0 || requesting.length === 0 || proposing}
                  className="inline-flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" />
                  {activeCounterOfferId ? 'Send Counter Offer' : 'Propose Trade'}
                </button>
                {(offering.length > 0 || requesting.length > 0 || activeCounterOfferId) && (
                  <button
                    onClick={clearTrade}
                    className="inline-flex items-center gap-2 rounded-md border border-dynasty-border px-4 py-2 font-heading text-sm text-dynasty-muted transition-colors hover:text-dynasty-text"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {tradeResult && (
            <div className={`rounded-lg border p-4 ${
              tradeResult.status === 'accepted'
                ? 'border-accent-success/40 bg-accent-success/10'
                : tradeResult.status === 'counter'
                  ? 'border-accent-warning/40 bg-accent-warning/10'
                  : 'border-accent-danger/40 bg-accent-danger/10'
            }`}>
              <div className="flex items-center gap-2">
                {tradeResult.status === 'accepted' && <Check className="h-5 w-5 text-accent-success" />}
                {tradeResult.status !== 'accepted' && <AlertTriangle className="h-5 w-5 text-accent-warning" />}
                <h3 className="font-heading text-sm font-semibold text-dynasty-text">
                  {tradeResult.status === 'accepted'
                    ? 'Deal Completed'
                    : tradeResult.status === 'counter'
                      ? 'Trade Talks Continue'
                      : 'Talks Broke Down'}
                </h3>
              </div>
              <p className="mt-2 font-heading text-sm text-dynasty-text">{tradeResult.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
