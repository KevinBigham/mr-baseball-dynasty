import { useUIStore } from '../store/uiStore';

export function useToast() {
  return useUIStore(s => s.addToast);
}
