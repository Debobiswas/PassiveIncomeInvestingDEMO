import { useSyncExternalStore } from 'react';
import { getRuntime } from './runtime';

export function useAuth() {
  const { store } = getRuntime();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
