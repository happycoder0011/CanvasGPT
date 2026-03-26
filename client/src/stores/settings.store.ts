import { create } from 'zustand';

const STORAGE_KEY = 'canvasgpt_api_key';

interface SettingsState {
  apiKey: string;
  showSettings: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  hasApiKey: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: localStorage.getItem(STORAGE_KEY) ?? '',
  showSettings: false,

  setApiKey: (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    set({ apiKey: key, showSettings: false });
  },

  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ apiKey: '' });
  },

  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  setShowSettings: (show: boolean) => set({ showSettings: show }),
  hasApiKey: () => get().apiKey.length > 0,
}));
