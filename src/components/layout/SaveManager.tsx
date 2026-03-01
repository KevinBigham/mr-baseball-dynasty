/**
 * SaveManager.tsx — Save/Load/Delete game manager modal
 *
 * Two tabs: SAVE (create new save) and LOAD (list/load/delete existing saves).
 * Uses Dexie backend from db/schema.ts which is already fully implemented.
 */

import { useState, useEffect, useCallback } from 'react';
import { listSaves, saveGame, loadGame, deleteSave, type SaveSlot } from '../../db/schema';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';

type Tab = 'save' | 'load';
type SaveMeta = Omit<SaveSlot, 'stateBlob'>;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SaveManager({ onClose }: { onClose: () => void }) {
  const { season, userTeamId, setGameStarted, setSeason, setUserTeamId } = useGameStore();
  const { resetAll: resetLeague } = useLeagueStore();
  const { setActiveTab } = useUIStore();

  const [tab, setTab] = useState<Tab>('load');
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveName, setSaveName] = useState(`Season ${season} Save`);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSaves = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSaves();
      setSaves(list);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { refreshSaves(); }, [refreshSaves]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const engine = getEngine();
      const state = await engine.getFullState();
      if (state) {
        await saveGame(state, saveName || `Season ${season}`, `Team ${userTeamId}`);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await refreshSaves();
      }
    } catch (e) {
      setError(String(e));
    }
    setSaving(false);
  };

  const handleLoad = async (id: number) => {
    setLoadingId(id);
    setError(null);
    try {
      const state = await loadGame(id);
      if (state) {
        const engine = getEngine();
        await engine.loadState(state);
        setGameStarted(true);
        setSeason(state.season ?? 1);
        setUserTeamId(state.userTeamId ?? 1);
        resetLeague();
        setActiveTab('dashboard');
        onClose();
      }
    } catch (e) {
      setError(String(e));
    }
    setLoadingId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSave(id);
      setDeleteConfirmId(null);
      await refreshSaves();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bloomberg-border bg-gray-900 w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="text-orange-500 font-bold text-xs tracking-widest">DYNASTY MANAGER</div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['save', 'load'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-colors',
                tab === t
                  ? 'text-orange-400 bg-orange-950/30 border-b-2 border-b-orange-500'
                  : 'text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {t === 'save' ? 'SAVE GAME' : 'LOAD GAME'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 text-red-400 text-xs bg-red-900/20 border border-red-800 rounded">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {tab === 'save' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-xs block mb-1">SAVE NAME</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm px-3 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="My Dynasty Save"
                />
              </div>

              <div className="text-gray-600 text-xs space-y-1">
                <div>Season: <span className="text-gray-400">{season}</span></div>
                <div>Team: <span className="text-gray-400">#{userTeamId}</span></div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="w-full bg-orange-700 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-xs py-3 uppercase tracking-widest transition-colors"
              >
                {saving ? 'SAVING…' : saveSuccess ? 'SAVED!' : 'SAVE GAME'}
              </button>

              {saves.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  <div className="text-gray-600 text-xs mb-2">RECENT SAVES</div>
                  {saves.slice(0, 3).map(s => (
                    <div key={s.id} className="text-xs text-gray-500 py-1 flex justify-between">
                      <span className="truncate">{s.name}</span>
                      <span className="text-gray-700 shrink-0 ml-2">{timeAgo(s.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'load' && (
            <div className="space-y-2">
              {loading && (
                <div className="text-orange-400 text-xs animate-pulse py-8 text-center">Loading saves…</div>
              )}

              {!loading && saves.length === 0 && (
                <div className="py-8 text-center">
                  <div className="text-gray-500 text-sm mb-2">No saves found.</div>
                  <div className="text-gray-600 text-xs">Save your game to continue later.</div>
                </div>
              )}

              {!loading && saves.map(s => (
                <div key={s.id}>
                  {/* Save card */}
                  <div
                    className="rounded px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-gray-800/50 cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => s.id != null && handleLoad(s.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 text-xs font-bold truncate">
                        {s.name}
                        {s.name.startsWith('Auto') && (
                          <span className="ml-1.5 text-gray-600 font-normal">AUTO</span>
                        )}
                      </div>
                      <div className="text-gray-600 text-xs mt-0.5">
                        {s.userTeamName} · Season {s.season} · {timeAgo(s.timestamp)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {loadingId === s.id && (
                        <span className="text-orange-400 text-xs animate-pulse">Loading…</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(s.id ?? null); }}
                        className="text-gray-700 hover:text-red-400 text-xs transition-colors px-1"
                      >
                        DEL
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirmId === s.id && (
                    <div className="ml-4 mt-1 flex items-center gap-2 text-xs">
                      <span className="text-red-400">Delete this save?</span>
                      <button
                        onClick={() => s.id != null && handleDelete(s.id)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-gray-500 hover:text-gray-400"
                      >
                        NO
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!loading && saves.length > 0 && (
                <div className="text-gray-700 text-xs text-center pt-2">
                  Click a save to load it. Narrative data (rivals, moments) will be reset.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
