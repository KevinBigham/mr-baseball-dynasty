import { useState, useEffect, useCallback, useRef } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import { useSound } from '../../hooks/useSound';
import type { DraftPick } from '../../engine/draft/draftAI';
import type { DraftBoardEntry } from '../../engine/draft';
import type { DraftBoardListing } from '../../engine/worker';
import {
  getBestValueDraftTarget,
  getHighestPotentialDraftTarget,
  getRecommendedDraftTarget,
} from '../../engine/draft/recommendations';
import AnalystReaction from './AnalystReaction';
import DraftGradeReport from './DraftGradeReport';
import CoachTip from '../shared/CoachTip';

type PosFilter = 'ALL' | 'HITTERS' | 'PITCHERS';

interface QuickTarget {
  id: 'recommended' | 'best-value' | 'highest-potential';
  label: string;
  detail: string;
  player: DraftBoardEntry;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 70 ? '#4ade80' : ovr >= 55 ? '#fbbf24' : '#94a3b8';
  return (
    <span className="font-black tabular-nums text-sm" style={{ color }}>
      {ovr}
    </span>
  );
}

function PickLogEntry({ pick, isUser }: { pick: DraftPick; isUser: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 text-xs rounded"
      style={{
        background: isUser ? 'rgba(234,88,12,0.12)' : 'rgba(255,255,255,0.03)',
        border: isUser ? '1px solid rgba(234,88,12,0.3)' : '1px solid transparent',
      }}
    >
      <span className="text-gray-500 tabular-nums w-8">#{pick.pickNumber}</span>
      <span className={`font-bold w-8 ${isUser ? 'text-orange-400' : 'text-gray-400'}`}>
        {pick.teamAbbr}
      </span>
      <span className="text-gray-500 w-6">{pick.position}</span>
      <span className="text-gray-300 flex-1 truncate">{pick.playerName}</span>
      <OvrBadge ovr={pick.scoutedOvr} />
    </div>
  );
}

function ProspectRow({
  prospect,
  selected,
  onSelect,
}: {
  prospect: DraftBoardEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-100 rounded"
      style={{
        background: selected ? 'rgba(234,88,12,0.15)' : 'rgba(255,255,255,0.02)',
        border: selected ? '1px solid rgba(234,88,12,0.5)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span className="text-gray-500 text-xs tabular-nums w-8">#{prospect.rank}</span>
      <span className="text-gray-300 font-bold text-sm flex-1 truncate">{prospect.name}</span>
      <span className="text-gray-500 text-xs w-6 text-center">{prospect.position}</span>
      <span className="text-gray-500 text-xs w-6 text-center tabular-nums">{prospect.age}</span>
      <span className="text-gray-500 text-xs w-6">{prospect.bats}/{prospect.throws}</span>
      <div className="text-right w-10">
        <OvrBadge ovr={prospect.scoutedOvr} />
      </div>
      <div className="text-right w-10">
        <span className="text-xs tabular-nums" style={{ color: '#818cf8' }}>
          {prospect.scoutedPot}
        </span>
      </div>
    </div>
  );
}

// ─── Main DraftRoom ──────────────────────────────────────────────────────────

export default function DraftRoom() {
  const { userTeamId, setGameStarted, setSeason, startMode } = useGameStore();
  const { setStandings } = useLeagueStore();
  const { setSelectedTeam } = useUIStore();

  const { play } = useSound();
  const [board, setBoard] = useState<DraftBoardListing | null>(null);
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickLogRef = useRef<HTMLDivElement>(null);

  // Load initial draft state
  useEffect(() => {
    (async () => {
      try {
        const engine = getEngine();
        const state = await engine.getDraftBoard();
        setBoard(state);
        setLoading(false);

        // If it's not the user's turn at start, auto-advance
        if (!state.isUserTurn && !state.isComplete) {
          setAdvancing(true);
          const updated = await engine.autoAdvanceDraft();
          setBoard(updated);
          setAdvancing(false);
        }
      } catch (e) {
        setError(String(e));
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll pick log to bottom when new picks are added
  useEffect(() => {
    if (pickLogRef.current) {
      pickLogRef.current.scrollTop = pickLogRef.current.scrollHeight;
    }
  }, [board?.picks.length]);

  // User makes a pick
  const handlePick = useCallback(async () => {
    if (!selectedPlayerId || !board?.isUserTurn) return;
    setAdvancing(true);
    try {
      const engine = getEngine();
      const pickedName = board.available.find(p => p.playerId === selectedPlayerId)?.name ?? 'Unknown';
      const result = await engine.makeDraftPick(selectedPlayerId);
      if (!result.ok || !result.board) {
        setError(result.reason ?? 'Failed to make draft pick.');
        return;
      }

      let updated = result.board;
      setBoard(updated);
      setSelectedPlayerId(null);

      void play('playDraftPick');
      useUIStore.getState().addToast(`📋 Drafted ${pickedName}!`, 'success', {
        accent: '#f97316', icon: '📋', duration: 3000,
      });

      // Auto-advance AI picks
      if (!updated.isComplete && !updated.isUserTurn) {
        updated = await engine.autoAdvanceDraft();
        setBoard(updated);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setAdvancing(false);
    }
  }, [selectedPlayerId, board, play]);

  // Auto-pick for user (best available)
  const handleAutoPick = useCallback(async () => {
    if (!board?.isUserTurn) return;
    setAdvancing(true);
    try {
      const engine = getEngine();
      let updated = await engine.autoPickForUser();
      setBoard(updated);
      setSelectedPlayerId(null);

      if (!updated.isComplete && !updated.isUserTurn) {
        updated = await engine.autoAdvanceDraft();
        setBoard(updated);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setAdvancing(false);
    }
  }, [board]);

  // Finish draft
  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      const engine = getEngine();
      await engine.completeDraft();
      setSelectedTeam(userTeamId);
      setSeason(2026);
      const standings = await engine.getStandings();
      setStandings(standings);
      setGameStarted(true);
      useUIStore.getState().addToast('🎓 Draft complete! Your new class is ready to compete.', 'success', {
        accent: '#22c55e', icon: '🎓', duration: 5000,
      });
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }, [userTeamId, setSelectedTeam, setSeason, setStandings, setGameStarted]);

  // Filter available prospects
  const filteredAvailable = (board?.available ?? []).filter(p => {
    if (posFilter === 'HITTERS') return !p.isPitcher;
    if (posFilter === 'PITCHERS') return p.isPitcher;
    return true;
  });

  // User's draft picks
  const userPicks = (board?.picks ?? []).filter(p => p.teamId === userTeamId);
  const recommendedTarget = board
    ? getRecommendedDraftTarget(board.available, userPicks, board.currentRound)
    : null;
  const bestValueTarget = board
    ? getBestValueDraftTarget(board.available, board.overallPick)
    : null;
  const highestPotentialTarget = board
    ? getHighestPotentialDraftTarget(board.available)
    : null;
  const quickTargets: QuickTarget[] = [];

  if (recommendedTarget) {
    quickTargets.push({
      id: 'recommended',
      label: 'Recommended Player',
      detail: 'Fit-adjusted pick for your current roster build.',
      player: recommendedTarget,
    });
  }

  if (bestValueTarget) {
    quickTargets.push({
      id: 'best-value',
      label: 'Best Value',
      detail: `Still available ${Math.max(0, (board?.overallPick ?? 0) - bestValueTarget.rank)} picks past consensus.`,
      player: bestValueTarget,
    });
  }

  if (highestPotentialTarget) {
    quickTargets.push({
      id: 'highest-potential',
      label: 'Highest Potential',
      detail: 'Top ceiling remaining on the board.',
      player: highestPotentialTarget,
    });
  }
  const selectedPlayer = board?.available.find((player) => player.playerId === selectedPlayerId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="text-orange-400 font-black text-xl tracking-widest animate-pulse">
          SETTING UP DRAFT...
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400">{error ?? 'Failed to load draft'}</div>
      </div>
    );
  }

  const draftComplete = board.isComplete;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050a0f' }}>
      <CoachTip section="draft" />
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(234,88,12,0.3)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-black text-sm tracking-widest">FRANCHISE DRAFT</span>
          <span className="text-gray-500 text-xs">
            {startMode === 'snake10' ? '10 Rounds' : startMode === 'snake25' ? '25 Rounds' : '26 Rounds'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs tabular-nums">
            Round {board.currentRound}/{board.totalRounds}
          </span>
          <span className="text-gray-500 text-xs tabular-nums">
            Pick {board.overallPick}/{board.totalRounds * board.draftOrder.length}
          </span>
        </div>
        {draftComplete && (
          <button
            onClick={handleComplete}
            className="px-6 py-2 font-black text-sm uppercase tracking-widest rounded"
            style={{ background: '#4ade80', color: '#000' }}
          >
            START DYNASTY
          </button>
        )}
      </div>

      {/* ON THE CLOCK banner */}
      {board.isUserTurn && !draftComplete && (
        <div
          className="text-center py-2 animate-pulse"
          style={{ background: 'rgba(234,88,12,0.15)', borderBottom: '2px solid #ea580c' }}
        >
          <span className="text-orange-400 font-black text-sm tracking-widest">
            YOU ARE ON THE CLOCK — PICK #{board.overallPick}
          </span>
        </div>
      )}

      {/* Advancing indicator */}
      {advancing && !board.isUserTurn && (
        <div
          className="text-center py-2"
          style={{ background: 'rgba(100,100,100,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="text-gray-400 text-xs animate-pulse">
            {board.pickingTeamAbbr} is picking...
          </span>
        </div>
      )}

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Draft log */}
        <div
          className="w-64 shrink-0 flex flex-col border-r"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="px-3 py-2 text-xs font-bold text-gray-500 tracking-widest uppercase"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            DRAFT LOG ({board.picks.length} picks)
          </div>
          <div ref={pickLogRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {board.picks.map(pick => (
              <PickLogEntry
                key={pick.pickNumber}
                pick={pick}
                isUser={pick.teamId === userTeamId}
              />
            ))}
            {board.picks.length === 0 && (
              <div className="text-gray-700 text-xs text-center py-8">No picks yet</div>
            )}
          </div>

          {/* Analyst Reaction for latest pick */}
          {board.picks.length > 0 && (() => {
            const lastPick = board.picks[board.picks.length - 1];
            return (
              <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <AnalystReaction
                  pickNumber={lastPick.pickNumber}
                  round={lastPick.round}
                  playerName={lastPick.playerName}
                  position={lastPick.position}
                  scoutedOvr={lastPick.scoutedOvr}
                  totalPicks={board.draftOrder.length * board.totalRounds}
                />
              </div>
            );
          })()}
        </div>

        {/* Center: Available players */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filter bar */}
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">AVAILABLE</span>
            <span className="text-xs text-gray-500 tabular-nums">({filteredAvailable.length})</span>
            <div className="flex gap-1 ml-auto">
              {(['ALL', 'HITTERS', 'PITCHERS'] as PosFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setPosFilter(f)}
                  className="px-2 py-0.5 text-xs font-bold rounded transition-colors"
                  style={{
                    background: posFilter === f ? 'rgba(234,88,12,0.2)' : 'transparent',
                    color: posFilter === f ? '#f97316' : '#6b7280',
                    border: posFilter === f ? '1px solid rgba(234,88,12,0.4)' : '1px solid transparent',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div
            className="flex items-center gap-3 px-3 py-1 text-xs text-gray-500 font-bold"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="w-8">RNK</span>
            <span className="flex-1">NAME</span>
            <span className="w-6 text-center">POS</span>
            <span className="w-6 text-center">AGE</span>
            <span className="w-6">B/T</span>
            <span className="w-10 text-right">OVR</span>
            <span className="w-10 text-right">POT</span>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto">
            {filteredAvailable.slice(0, 200).map(p => (
              <ProspectRow
                key={p.playerId}
                prospect={p}
                selected={selectedPlayerId === p.playerId}
                onSelect={() => setSelectedPlayerId(p.playerId)}
              />
            ))}
          </div>
        </div>

        {/* Right: User's team panel */}
        <div
          className="w-72 shrink-0 flex flex-col border-l"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="shrink-0 p-3 space-y-2"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: '#050a0f',
              position: 'sticky',
              top: 0,
              zIndex: 3,
            }}
          >
            {board.isUserTurn && !draftComplete && (
              <>
                {selectedPlayer && (
                  <div
                    className="rounded px-3 py-2 text-xs"
                    style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.22)' }}
                  >
                    <div className="text-[11px] font-black uppercase tracking-widest text-orange-400">
                      Selected Player
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-gray-200 truncate flex-1">{selectedPlayer.name}</span>
                      <span className="text-gray-500">{selectedPlayer.position}</span>
                      <span className="text-gray-400 tabular-nums">{selectedPlayer.scoutedOvr}/{selectedPlayer.scoutedPot}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handlePick}
                  disabled={!selectedPlayerId || advancing}
                  className="w-full py-3 font-black text-sm uppercase tracking-widest rounded transition-colors disabled:opacity-40"
                  style={{ background: selectedPlayerId ? '#ea580c' : '#374151', color: '#000' }}
                >
                  {selectedPlayerId ? 'DRAFT PLAYER' : 'SELECT A PLAYER'}
                </button>
                <button
                  onClick={handleAutoPick}
                  disabled={advancing}
                  className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-300 rounded transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  AUTO-PICK RECOMMENDED
                </button>
                {quickTargets.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {quickTargets.map((target) => (
                      <button
                        key={target.id}
                        onClick={() => setSelectedPlayerId(target.player.playerId)}
                        className="w-full rounded px-3 py-2 text-left transition-colors"
                        style={{
                          background: selectedPlayerId === target.player.playerId
                            ? 'rgba(234,88,12,0.14)'
                            : 'rgba(255,255,255,0.03)',
                          border: selectedPlayerId === target.player.playerId
                            ? '1px solid rgba(234,88,12,0.45)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="text-[11px] font-black uppercase tracking-widest text-orange-400">
                          {target.label}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <span className="font-bold text-gray-200 truncate flex-1">{target.player.name}</span>
                          <span className="text-gray-500">{target.player.position}</span>
                          <span className="text-gray-400 tabular-nums">{target.player.scoutedOvr}/{target.player.scoutedPot}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {target.detail}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {draftComplete && (
              <div className="text-center space-y-3">
                <div className="text-green-400 font-black text-sm mb-2">DRAFT COMPLETE</div>
                <DraftGradeReport
                  userPicks={board.picks.filter(p => p.teamId === userTeamId)}
                  totalPicksInDraft={board.draftOrder.length * board.totalRounds}
                />
                <button
                  onClick={handleComplete}
                  className="w-full py-3 font-black text-sm uppercase tracking-widest rounded"
                  style={{ background: '#4ade80', color: '#000' }}
                >
                  START DYNASTY
                </button>
              </div>
            )}
          </div>

          <div className="px-3 py-2 text-xs font-bold tracking-widest uppercase"
            style={{ color: '#f97316', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            YOUR SELECTIONS ({userPicks.length})
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {userPicks.map(pick => (
              <div
                key={pick.pickNumber}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)' }}
              >
                <span className="text-gray-500 tabular-nums w-6">R{pick.round}</span>
                <span className="text-gray-500 w-6">{pick.position}</span>
                <span className="text-gray-300 font-bold flex-1 truncate">{pick.playerName}</span>
                <OvrBadge ovr={pick.scoutedOvr} />
              </div>
            ))}
            {userPicks.length === 0 && (
              <div className="text-gray-700 text-xs text-center py-8">
                No selections yet
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-red-400 text-xs text-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
