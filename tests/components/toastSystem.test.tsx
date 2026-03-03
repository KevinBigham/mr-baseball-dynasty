import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/store/uiStore';

describe('Toast System (store)', () => {
  beforeEach(() => {
    // Reset store state between tests
    useUIStore.setState({ toasts: [] });
  });

  it('addToast queues a new toast', () => {
    const { addToast } = useUIStore.getState();
    addToast('Test message', 'success');

    const { toasts } = useUIStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');
    expect(typeof toasts[0].id).toBe('number');
  });

  it('supports multiple concurrent toasts', () => {
    const { addToast } = useUIStore.getState();
    addToast('First', 'info');
    addToast('Second', 'error');
    addToast('Third', 'success');

    const { toasts } = useUIStore.getState();
    expect(toasts).toHaveLength(3);
    expect(toasts[0].message).toBe('First');
    expect(toasts[1].message).toBe('Second');
    expect(toasts[2].message).toBe('Third');
  });

  it('removeToast dequeues a specific toast', () => {
    const { addToast } = useUIStore.getState();
    addToast('Keep me', 'info');
    addToast('Remove me', 'error');

    const toastsBefore = useUIStore.getState().toasts;
    expect(toastsBefore).toHaveLength(2);

    const removeId = toastsBefore[1].id;
    useUIStore.getState().removeToast(removeId);

    const toastsAfter = useUIStore.getState().toasts;
    expect(toastsAfter).toHaveLength(1);
    expect(toastsAfter[0].message).toBe('Keep me');
  });

  it('each toast has a unique id', () => {
    const { addToast } = useUIStore.getState();
    addToast('A', 'info');
    addToast('B', 'error');
    addToast('C', 'success');

    const ids = useUIStore.getState().toasts.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
});
