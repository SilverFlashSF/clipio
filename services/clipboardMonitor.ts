import * as Clipboard from 'expo-clipboard';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, AppStateStatus } from 'react-native';
import { useClipboardStore } from '../store/clipboardStore';

export const CLIPBOARD_TASK = 'CLIPBOARD_BACKGROUND_FETCH';

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: any = null;

// ─── Background task registration ────────────────────────────────────────────
TaskManager.defineTask(CLIPBOARD_TASK, async () => {
  try {
    const text = await Clipboard.getStringAsync();
    if (text && text.trim().length > 0) {
      const store = useClipboardStore.getState();
      const { items, lastSeen } = store;
      if (text !== lastSeen) {
        store.setLastSeen(text);
        store.addItem(text, 'text');
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Register background fetch ────────────────────────────────────────────────
export async function registerBackgroundFetch() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    const isRegistered = await TaskManager.isTaskRegisteredAsync(CLIPBOARD_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(CLIPBOARD_TASK, {
        minimumInterval: 60 * 15, // 15 minutes (Android minimum)
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (_) {}
}

// ─── Foreground polling ───────────────────────────────────────────────────────
async function pollClipboard() {
  try {
    const text = await Clipboard.getStringAsync();
    if (!text || text.trim().length === 0) return;

    const store = useClipboardStore.getState();
    if (text !== store.lastSeen) {
      store.setLastSeen(text);
      store.addItem(text, 'text');
    }
  } catch (_) {}
}

function startPolling() {
  if (pollingInterval) return;
  pollingInterval = setInterval(pollClipboard, 1500);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// ─── AppState listener ────────────────────────────────────────────────────────
export function startClipboardMonitor() {
  // Immediately poll once on start
  pollClipboard();
  startPolling();

  appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        pollClipboard();
        startPolling();
      } else {
        stopPolling();
      }
    }
  );
}

export function stopClipboardMonitor() {
  stopPolling();
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
