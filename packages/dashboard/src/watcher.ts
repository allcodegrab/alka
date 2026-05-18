import { watch } from 'node:fs';
import { join } from 'node:path';
import { loadDashboardState, type DashboardState } from './state.js';

export function watchDashboard(
  projectRoot: string,
  onChange: (state: DashboardState) => void,
): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const watchers: ReturnType<typeof watch>[] = [];

  const reload = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const state = await loadDashboardState(projectRoot);
        onChange(state);
      } catch {
        // silently ignore reload errors
      }
    }, 100);
  };

  // Watch missions directory
  try {
    const missionsDir = join(projectRoot, '.claude', 'missions');
    const w = watch(missionsDir, { recursive: true }, reload);
    watchers.push(w);
  } catch {
    // directory might not exist yet
  }

  // Watch inbox directory
  try {
    const inboxDir = join(projectRoot, '.forge', 'inbox');
    const w = watch(inboxDir, { recursive: true }, reload);
    watchers.push(w);
  } catch {
    // directory might not exist yet
  }

  // Return cleanup function
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    for (const w of watchers) {
      w.close();
    }
  };
}
