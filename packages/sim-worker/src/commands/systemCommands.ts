/**
 * @module systemCommands
 * Worker-level system commands (health checks, diagnostics).
 */

export const systemCommands = {
  ping(): { pong: true; timestamp: number } {
    return { pong: true, timestamp: Date.now() };
  },
};
