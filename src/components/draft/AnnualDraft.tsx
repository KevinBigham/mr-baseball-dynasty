import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import type { DraftPick } from '../../engine/draft/draftAI';
import type { DraftBoardEntry } from '../../engine/draft';
import type { DraftBoardListing } from '../../engine/worker';
import { useSort, compareSortValues } from '../../hooks/useSort';
import { SortSpan } from '../shared/SortHeader';

type PosFilter = 'ALL' | 'HITTERS' | 'PITCHERS';
type DraftSortKey = 'rank' | 'name' | 'position' | 'age' | 'ovr' | 'pot';

function getDraftSortValue(p: DraftBoardEntry, key: DraftSortKey): string | number {
  switch (key) {
    case 'rank': return p.rank;
    case 'name': return p.name.toLowerCase();
    case 'position': return p.position;
    case 'age': return p.age;
    case 'ovr': return p.scoutedOvr;
    case 'pot': return p.scoutedPot;
    default: return 0;
  }
}

interface Props {
  season: number;
  userTeamId: number;
  onComplete: (draftedCount: number) => void;
}

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 70 ? '#4ade80' : ovr >= 55 ? '#fbbf24' : '#94a3b8';
  return <span className="font-black tabular-nums text-sm" style={{ color }}>{ovr}</span>;
}

function MiniPickRow({ pick, isUser }: { pick: DraftPick; isUser: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-0.5 text-xs"
      style={{
        background: isUser ? 'rgba(234,88,12,0.1)' : 'transparent',
      }}
    >
      <span className="text-gray-500 tabular-nums w-7">#{pick.pickNumber}</span>
      <span className={`font-bold w-7 ${isUser ? 'text-orange-400' : 'text-gray-500'}`}>
        {pick.teamAbbr}
      </span>
      <span className="text-gray-500 w-5">{pick.position}</span>
      <span className="text-gray-300 flex-1 truncate">{pick.playerName}</span>
      <OvrBadge ovr={pick.scoutedOvr} />
    </div>
  );
}

export default function AnnualDraft({ season, userTeamId, onComplete }: Props) {
  const [board, setBoard] = useState<DraftBoardListing | null>(null);
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const pickLogRef = useRef<HTMLDivElement>(null);

  // Initialize the annual draft
  useEffect(() => {
    (async () => {
      try {
        const engine = getEngine();
        const state = await engine.startAnnualDraft();
        setBoard(state);
        setLoading(false);

        // Auto-advance if not user's turn
        if (!state.isUserTurn && !state.isComplete) {
          setAdvancing(true);
          const updated = await engine.autoAdvanceDraft();
          setBoard(updated);
          setAdvancing(false);
        }
      } catch (e) {
        console.error('Annual draft error:', e);
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pickLogRef.current) {
      pickLogRef.current.scrollTop = pickLogRef.current.scrollHeight;
    }
  }, [board?.picks.length]);

  const handlePick = useCallback(async () => {
    if (!selectedId || !board?.isUserTurn) return;
    setAdvancing(true);
    try {
      const engine = getEngine();
      const result = await engine.makeDraftPick(selectedId);
      if (!result.ok || !result.board) {
        return;
      }

      let updated = result.board;
      setBoard(updated);
      setSelectedId(null);

      if (!updated.isComplete && !updated.isUserTurn) {
        updated = await engine.autoAdvanceDraft();
        setBoard(updated);
      }
    } finally {
      setAdvancing(false);
    }
  }, [selectedId, board]);

  const handleAutoPick = useCallback(async () => {
    if (!board?.isUserTurn) return;
    setAdvancing(true);
    try {
      const engine = getEngine();
      let updated = await engine.autoPickForUser();
      setBoard(updated);
      setSelectedId(null);

      if (!updated.isComplete && !updated.isUserTurn) {
        updated = await engine.autoAdvanceDraft();
        setBoard(updated);
      }
    } finally {
      setAdvancing(false);
    }
  }, [board]);

  const handleComplete = useCallback(async () => {
    setLoading(true);
    const engine = getEngine();
    const result = await engine.completeAnnualDraft();
    onComplete(result.draftedCount);
  }, [onComplete]);

  if (loading) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center">
        <div className="text-orange-400 font-bold text-sm animate-pulse tracking-widest">
          GENERATING DRAFT CLASS...
        </div>
      </div>
    );
  }

  if (!board) return null;

  const filteredAvailable = (board.available ?? []).filter((p: DraftBoardEntry) => {
    if (posFilter === 'HITTERS') return !p.isPitcher;
    if (posFilter === 'PITCHERS') return p.isPitcher;
    return true;
  });

  const { sort: draftSort, toggle: toggleDraftSort } = useSort<DraftSortKey>('rank', 'asc');

  const sortedAvailable = useMemo(() => {
    return [...filteredAvailable].sort((a, b) =>
      compareSortValues(getDraftSortValue(a, draftSort.key), getDraftSortValue(b, draftSort.key), draftSort.dir)
    );
  }, [filteredAvailable, draftSort]);

  const userPicks = (board.picks ?? []).filter((p: DraftPick) => p.teamId === userTeamId);

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-black text-xs tracking-widest">
            {season} AMATEUR DRAFT
          </span>
          <span className="text-gray-500 text-xs">{board.totalRounds} Rounds</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs tabular-nums">
            Rd {board.currentRound}/{board.totalRounds}
          </span>
          <span className="text-gray-500 text-xs tabular-nums">
            Pick {board.overallPick}/{board.totalRounds * board.draftOrder.length}
          </span>
          {board.isComplete && (
            <button
              onClick={handleComplete}
              className="px-4 py-1 font-bold text-xs uppercase tracking-widest rounded"
              style={{ background: '#4ade80', color: '#000' }}
            >
              FINALIZE DRAFT
            </button>
          )}
        </div>
      </div>

      {/* On the clock banner */}
      {!board.isComplete && (
        <div
          className="px-4 py-1 text-xs font-bold tracking-widest"
          style={{
            background: board.isUserTurn ? 'rgba(234,88,12,0.15)' : 'rgba(255,255,255,0.03)',
            color: board.isUserTurn ? '#fb923c' : '#6b7280',
          }}
        >
          {advancing ? 'AI PICKING...' : board.isUserTurn ? 'YOUR PICK' : `${board.pickingTeamAbbr} ON THE CLOCK`}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_280px] divide-x divide-gray-800" style={{ height: '400px' }}>
        {/* Left: Available prospects */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1 border-b border-gray-800">
            <span className="text-gray-500 text-xs font-bold">AVAILABLE</span>
            {(['ALL', 'HITTERS', 'PITCHERS'] as PosFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setPosFilter(f)}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: posFilter === f ? 'rgba(234,88,12,0.2)' : 'transparent',
                  color: posFilter === f ? '#fb923c' : '#6b7280',
                }}
              >
                {f}
              </button>
            ))}
            {board.isUserTurn && !board.isComplete && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handlePick}
                  disabled={!selectedId || advancing}
                  className="text-xs px-3 py-0.5 rounded font-bold disabled:opacity-30"
                  style={{ background: 'rgba(234,88,12,0.8)', color: '#fff' }}
                >
                  DRAFT
                </button>
                <button
                  onClick={handleAutoPick}
                  disabled={advancing}
                  className="text-xs px-3 py-0.5 rounded text-gray-400 border border-gray-700"
                >
                  AUTO
                </button>
              </div>
            )}
          </div>
          <div className="overflow-y-auto flex-1 px-1 py-1" style={{ fontSize: '11px' }}>
            {/* Column headers — sortable */}
            <div className="flex items-center gap-3 px-3 py-1 text-gray-500 text-xs border-b border-gray-800">
              <SortSpan className="w-8" label="RK" sortKey="rank" currentSort={draftSort} onSort={toggleDraftSort} />
              <SortSpan className="flex-1" label="NAME" sortKey="name" currentSort={draftSort} onSort={toggleDraftSort} />
              <SortSpan className="w-6 text-center" label="POS" sortKey="position" currentSort={draftSort} onSort={toggleDraftSort} />
              <SortSpan className="w-6 text-center" label="AGE" sortKey="age" currentSort={draftSort} onSort={toggleDraftSort} />
              <span className="w-6">B/T</span>
              <SortSpan className="w-10 text-right" label="OVR" sortKey="ovr" currentSort={draftSort} onSort={toggleDraftSort} />
              <SortSpan className="w-10 text-right" label="POT" sortKey="pot" currentSort={draftSort} onSort={toggleDraftSort} />
            </div>
            {sortedAvailable.slice(0, 100).map((p: DraftBoardEntry) => (
              <div
                key={p.playerId}
                onClick={() => setSelectedId(p.playerId)}
                className="flex items-center gap-3 px-3 py-1 cursor-pointer rounded"
                style={{
                  background: selectedId === p.playerId ? 'rgba(234,88,12,0.15)' : 'transparent',
                  border: selectedId === p.playerId ? '1px solid rgba(234,88,12,0.4)' : '1px solid transparent',
                }}
              >
                <span className="text-gray-500 tabular-nums w-8">#{p.rank}</span>
                <span className="text-gray-300 flex-1 truncate">{p.name}</span>
                <span className="text-gray-500 w-6 text-center">{p.position}</span>
                <span className="text-gray-500 w-6 text-center tabular-nums">{p.age}</span>
                <span className="text-gray-500 w-6">{p.bats}/{p.throws}</span>
                <span className="w-10 text-right"><OvrBadge ovr={p.scoutedOvr} /></span>
                <span className="w-10 text-right text-xs tabular-nums" style={{ color: '#818cf8' }}>
                  {p.scoutedPot}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pick log + your picks */}
        <div className="flex flex-col">
          <div className="px-3 py-1 border-b border-gray-800">
            <span className="text-gray-500 text-xs font-bold">PICK LOG</span>
          </div>
          <div ref={pickLogRef} className="overflow-y-auto flex-1">
            {board.picks.map((pick: DraftPick, i: number) => (
              <MiniPickRow key={i} pick={pick} isUser={pick.teamId === userTeamId} />
            ))}
          </div>
          {userPicks.length > 0 && (
            <div className="border-t border-gray-800 px-3 py-1">
              <div className="text-orange-500 text-xs font-bold mb-1">YOUR PICKS ({userPicks.length})</div>
              {userPicks.map((pick: DraftPick, i: number) => (
                <div key={i} className="text-xs text-gray-400 flex gap-2">
                  <span className="text-gray-500">Rd{pick.round}</span>
                  <span className="text-gray-300">{pick.playerName}</span>
                  <span className="text-gray-500">{pick.position}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
