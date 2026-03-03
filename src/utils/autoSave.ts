import { getEngine } from '../engine/engineClient';
import { saveGame } from '../db/schema';

/**
 * Auto-save current game state to IndexedDB.
 * Silent on failure — logs to console but does not throw.
 */
export async function autoSave(season: number, userTeamId: number): Promise<void> {
  try {
    const engine = getEngine();
    const state = await engine.getFullState();
    if (state) {
      await saveGame(state, `Auto-Save — S${season}`, `Team ${userTeamId}`);
    }
  } catch (err) {
    console.warn('[autoSave] failed:', err);
  }
}
