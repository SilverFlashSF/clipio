import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClipItem {
  id: string;
  type: 'text' | 'image';
  content: string;       // text string OR local file URI for images
  preview: string;       // first 120 chars for text, same URI for images
  timestamp: number;
  pinned: boolean;
}

interface ClipboardStore {
  items: ClipItem[];
  lastSeen: string | null;
  isLoaded: boolean;

  // Actions
  loadFromStorage: () => Promise<void>;
  addItem: (content: string, type?: 'text' | 'image') => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  clearUnpinned: () => void;
  togglePin: (id: string) => void;
  setLastSeen: (value: string | null) => void;
}

const STORAGE_KEY = '@clipboard_history';
const MAX_ITEMS = 50;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const persist = async (items: ClipItem[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
};

export const useClipboardStore = create<ClipboardStore>((set, get) => ({
  items: [],
  lastSeen: null,
  isLoaded: false,

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ClipItem[] = JSON.parse(raw);
        set({ items: parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (_) {
      set({ isLoaded: true });
    }
  },

  addItem: (content: string, type: 'text' | 'image' = 'text') => {
    const { items } = get();

    // Deduplicate — skip if same as top unpinned item
    const unpinned = items.filter((i) => !i.pinned);
    if (unpinned.length > 0 && unpinned[0].content === content) return;

    const newItem: ClipItem = {
      id: generateId(),
      type,
      content,
      preview: type === 'text' ? content.slice(0, 200) : content,
      timestamp: Date.now(),
      pinned: false,
    };

    // Pinned stay at top, then new item, then rest, trimmed to MAX_ITEMS
    const pinned = items.filter((i) => i.pinned);
    const rest = items.filter((i) => !i.pinned);
    const combined = [...pinned, newItem, ...rest].slice(0, MAX_ITEMS + pinned.length);

    // Enforce max on unpinned only
    const newPinned = combined.filter((i) => i.pinned);
    const newUnpinned = combined.filter((i) => !i.pinned).slice(0, MAX_ITEMS);
    const final = [...newPinned, ...newUnpinned];

    set({ items: final });
    persist(final);
  },

  removeItem: (id: string) => {
    const items = get().items.filter((i) => i.id !== id);
    set({ items });
    persist(items);
  },

  clearAll: () => {
    set({ items: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },

  clearUnpinned: () => {
    const items = get().items.filter((i) => i.pinned);
    set({ items });
    persist(items);
  },

  togglePin: (id: string) => {
    const items = get().items.map((i) =>
      i.id === id ? { ...i, pinned: !i.pinned } : i
    );
    // Re-sort: pinned first
    const pinned = items.filter((i) => i.pinned);
    const unpinned = items.filter((i) => !i.pinned);
    const sorted = [...pinned, ...unpinned];
    set({ items: sorted });
    persist(sorted);
  },

  setLastSeen: (value) => set({ lastSeen: value }),
}));
