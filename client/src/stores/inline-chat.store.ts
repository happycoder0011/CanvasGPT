import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InlineChat, InlineChatMessage, InlineChatStatus, Position, SelectionRange } from '@/types';
import { generateId } from '@/lib/utils';

interface InlineChatState {
  chats: Record<string, InlineChat>;
  activeChatId: string | null;

  openChat: (params: {
    blockId: string;
    selectionRange: SelectionRange | null;
    selectedContent: string;
    position: Position;
  }) => string;

  closeChat: (id: string) => void;
  closeAllChats: () => void;
  setActiveChat: (id: string | null) => void;

  addMessage: (chatId: string, message: Omit<InlineChatMessage, 'timestamp'>) => void;
  updateLastAssistantMessage: (chatId: string, content: string) => void;
  appendToLastAssistantMessage: (chatId: string, delta: string) => void;

  setStatus: (chatId: string, status: InlineChatStatus) => void;
  updatePosition: (chatId: string, position: Position) => void;
}

export const useInlineChatStore = create<InlineChatState>()(
  immer((set) => ({
    chats: {},
    activeChatId: null,

    openChat: ({ blockId, selectionRange, selectedContent, position }) => {
      const id = generateId();

      set((state) => {
        state.chats[id] = {
          id,
          blockId,
          selectionRange,
          selectedContent,
          messages: [],
          status: 'prompting',
          position,
        };
        state.activeChatId = id;
      });

      return id;
    },

    closeChat: (id) =>
      set((state) => {
        delete state.chats[id];
        if (state.activeChatId === id) {
          state.activeChatId = null;
        }
      }),

    closeAllChats: () =>
      set((state) => {
        state.chats = {};
        state.activeChatId = null;
      }),

    setActiveChat: (id) =>
      set((state) => {
        state.activeChatId = id;
      }),

    addMessage: (chatId, message) =>
      set((state) => {
        const chat = state.chats[chatId];
        if (chat) {
          chat.messages.push({ ...message, timestamp: Date.now() });
        }
      }),

    updateLastAssistantMessage: (chatId, content) =>
      set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return;
        const lastMsg = chat.messages[chat.messages.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.content = content;
        }
      }),

    appendToLastAssistantMessage: (chatId, delta) =>
      set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return;
        const lastMsg = chat.messages[chat.messages.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.content += delta;
        }
      }),

    setStatus: (chatId, status) =>
      set((state) => {
        const chat = state.chats[chatId];
        if (chat) {
          chat.status = status;
        }
      }),

    updatePosition: (chatId, position) =>
      set((state) => {
        const chat = state.chats[chatId];
        if (chat) {
          chat.position = position;
        }
      }),
  }))
);
