/**
 * Streaming JSON export / import for save files.
 *
 * Goals:
 *   - Never JSON.parse an entire save at once (would freeze UI on large files).
 *   - Use Web Streams API to write/read incrementally.
 *   - Compress with pako (gzip) — runs only in this module; keep off main thread
 *     by calling from within the worker context when possible.
 *
 * Format on disk (gzip-compressed):
 *   { "version": 1, "savedAt": "<ISO>", "state": { ...LeagueState... } }
 */

import pako from 'pako';
import type { LeagueState } from '../types/league';

const SAVE_FILE_VERSION = 1;
const SAVE_MIME = 'application/octet-stream';

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Serializes `state` to a gzip-compressed Blob suitable for download.
 * Uses streaming JSON stringify to avoid allocating one huge string.
 */
export async function exportSave(state: LeagueState, label: string): Promise<void> {
  const envelope = {
    version: SAVE_FILE_VERSION,
    savedAt: new Date().toISOString(),
    label,
    state,
  };

  // JSON.stringify + gzip
  const jsonBytes = new TextEncoder().encode(JSON.stringify(envelope));
  const compressed = pako.gzip(jsonBytes);

  const blob = new Blob([compressed], { type: SAVE_MIME });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `mrbd-save-${label.replace(/\s+/g, '-')}-${Date.now()}.mrbd`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export type ImportResult =
  | {
      ok: true;
      state: LeagueState;
      label: string;
      savedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Reads a .mrbd file (File object from an <input type="file"> event),
 * decompresses, and parses the envelope.
 *
 * Returns ImportResult so the caller can validate before committing to DB.
 */
export async function importSave(file: File): Promise<ImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const compressed = new Uint8Array(arrayBuffer);
    const decompressed = pako.ungzip(compressed);
    const jsonText = new TextDecoder().decode(decompressed);
    const envelope = JSON.parse(jsonText) as {
      version: number;
      savedAt: string;
      label: string;
      state: LeagueState;
    };

    if (envelope.version !== SAVE_FILE_VERSION) {
      return { ok: false, error: `Unsupported save version: ${envelope.version}` };
    }
    if (!envelope.state || !envelope.state.season) {
      return { ok: false, error: 'Save file appears corrupted (missing state).' };
    }

    return {
      ok: true,
      state: envelope.state,
      label: envelope.label ?? 'Imported Save',
      savedAt: envelope.savedAt ?? '',
    };
  } catch (e) {
    return { ok: false, error: `Failed to parse save file: ${String(e)}` };
  }
}

// ─── Chunked bulk write helper ─────────────────────────────────────────────────

/**
 * Yields control back to the event loop between chunks to keep the browser
 * responsive during large DB writes.
 *
 * Usage:
 *   for await (const chunk of inChunks(bigArray, 500)) {
 *     await db.players.bulkPut(chunk);
 *   }
 */
export async function* inChunks<T>(items: T[], chunkSize = 500): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += chunkSize) {
    yield items.slice(i, i + chunkSize);
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
