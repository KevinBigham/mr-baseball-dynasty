import { afterEach, describe, expect, it, vi } from 'vitest';
import * as bridge from '../../src/engine/bridge.ts';

describe('worker guard wrappers', () => {
  afterEach(() => {
    bridge.__setEngineForTests(null);
    vi.restoreAllMocks();
  });

  it('wraps saveGameToSlot success in RuntimeGuardResult', async () => {
    const engine = {
      saveGameToSlot: vi.fn().mockResolvedValue({ ok: true, manifest: { slotId: 'manual-1' } }),
    } as unknown as ReturnType<typeof bridge.getEngine>;

    bridge.__setEngineForTests(engine);
    const result = await bridge.saveGameToSlotSafe('manual-1', 'Alpha Save');

    expect(result.ok).toBe(true);
    expect((engine as unknown as { saveGameToSlot: ReturnType<typeof vi.fn> }).saveGameToSlot).toHaveBeenCalledWith('manual-1', 'Alpha Save');
  });

  it('wraps loadGameFromSlot failures with reason/code', async () => {
    const engine = {
      loadGameFromSlot: vi.fn().mockRejectedValue(new Error('load exploded')),
    } as unknown as ReturnType<typeof bridge.getEngine>;

    bridge.__setEngineForTests(engine);
    const result = await bridge.loadGameFromSlotSafe('manual-2');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('load-game-from-slot-failed');
      expect(result.reason).toContain('load exploded');
    }
  });

  it('wraps transaction failures with guard code', async () => {
    const engine = {
      submitRosterTransaction: vi.fn().mockRejectedValue(new Error('transaction blew up')),
    } as unknown as ReturnType<typeof bridge.getEngine>;

    bridge.__setEngineForTests(engine);
    const result = await bridge.submitRosterTransactionSafe(1, { type: 'CALL_UP', playerId: 77 }, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('submit-roster-transaction-failed');
      expect(result.reason).toContain('transaction blew up');
    }
  });
});
