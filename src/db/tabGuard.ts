// ─── Multi-tab prevention via BroadcastChannel ───────────────────────────────
// Prevents two tabs from running the game simultaneously (save corruption).

const CHANNEL_NAME = 'mrbd-tab-guard';
const HEARTBEAT_INTERVAL = 2000;

let _channel: BroadcastChannel | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _isActive = false;

export type TabGuardStatus = 'ok' | 'conflict';

export async function acquireTabLock(): Promise<TabGuardStatus> {
  if (typeof BroadcastChannel === 'undefined') return 'ok'; // SSR / non-browser

  return new Promise(resolve => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    _channel = ch;

    let responded = false;

    // Listen for other tabs claiming ownership
    ch.onmessage = (e: MessageEvent<string>) => {
      if (e.data === 'alive') {
        if (!_isActive) {
          // Another tab responded — conflict
          if (!responded) {
            responded = true;
            ch.close();
            resolve('conflict');
          }
        }
      }
    };

    // Broadcast "are you there?"
    ch.postMessage('ping');

    // Give other tabs 300ms to respond
    setTimeout(() => {
      if (!responded) {
        responded = true;
        _isActive = true;

        // Start heartbeat
        _heartbeatTimer = setInterval(() => {
          ch.postMessage('alive');
        }, HEARTBEAT_INTERVAL);

        resolve('ok');
      }
    }, 300);
  });
}

export function releaseTabLock(): void {
  if (_heartbeatTimer) clearInterval(_heartbeatTimer);
  _channel?.close();
  _isActive = false;
}
