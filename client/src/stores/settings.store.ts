import { create } from 'zustand';

const API_KEY_STORAGE = 'canvasgpt_api_key';
const PROVIDER_STORAGE = 'canvasgpt_provider';

export type AIProvider = 'gemini-free' | 'anthropic';

interface SettingsState {
  apiKey: string;
  provider: AIProvider;
  showSettings: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setProvider: (provider: AIProvider) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: localStorage.getItem(API_KEY_STORAGE) ?? '',
  provider: (localStorage.getItem(PROVIDER_STORAGE) as AIProvider) ?? 'gemini-free',
  showSettings: false,

  setApiKey: (key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    set({ apiKey: key });
  },

  clearApiKey: () => {
    localStorage.removeItem(API_KEY_STORAGE);
    set({ apiKey: '' });
  },

  setProvider: (provider: AIProvider) => {
    localStorage.setItem(PROVIDER_STORAGE, provider);
    set({ provider });
  },

  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  setShowSettings: (show: boolean) => set({ showSettings: show }),
}));
