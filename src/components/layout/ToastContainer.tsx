import { useEffect, useRef } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import { useUIStore, type ToastItem } from '../../store/uiStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { ensureAudioResumed, setMasterVolume, getAudioContext, getMasterGain } from '../../audio/audioEngine';

/** Play a toast-type-specific notification sound. */
function playToastSound(type: ToastItem['type']): void {
  const prefs = usePreferencesStore.getState();
  if (!prefs.soundEnabled) return;

  void ensureAudioResumed().then(() => {
    setMasterVolume(prefs.masterVolume);
    const ctx = getAudioContext();
    const master = getMasterGain();
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'error' ? 220 : type === 'success' ? 660 : 440, ctx.currentTime);
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(g);
    g.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  });
}

/** Bridge: watches Zustand toast store and forwards new toasts to Sonner. */
function SonnerBridge() {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);
  const shownIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    for (const t of toasts) {
      if (shownIdsRef.current.has(t.id)) continue;
      shownIdsRef.current.add(t.id);

      // Play audio notification
      playToastSound(t.type);

      // Map to Sonner
      const opts = {
        duration: t.duration ?? 3000,
        description: undefined as string | undefined,
        onDismiss: () => removeToast(t.id),
        onAutoClose: () => removeToast(t.id),
      };

      const message = `${t.icon ? t.icon + ' ' : ''}${t.message}`;

      if (t.type === 'success') {
        sonnerToast.success(message, opts);
      } else if (t.type === 'error') {
        sonnerToast.error(message, opts);
      } else {
        sonnerToast(message, opts);
      }
    }

    // Cleanup shown IDs for removed toasts
    const currentIds = new Set(toasts.map(t => t.id));
    for (const id of shownIdsRef.current) {
      if (!currentIds.has(id)) {
        shownIdsRef.current.delete(id);
      }
    }
  }, [toasts, removeToast]);

  return null;
}

export default function ToastContainer() {
  return (
    <>
      <SonnerBridge />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F1930',
            border: '1px solid #1E2A4A',
            color: '#E2E8F0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          },
          className: 'mbd-toast',
        }}
        theme="dark"
        richColors
        closeButton
        visibleToasts={5}
      />
    </>
  );
}
