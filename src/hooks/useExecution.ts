import { useSyncExternalStore } from 'react';
import { executionStore } from '../stores/executionStore';
import type { ExecutionState } from '../stores/executionStore';

export function useExecutionStore<T>(selector: (state: ExecutionState) => T): T {
  return useSyncExternalStore(
    executionStore.subscribe,
    () => selector(executionStore.getState()),
    () => selector(executionStore.getState())
  );
}
