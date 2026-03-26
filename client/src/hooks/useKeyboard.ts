import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { useInlineChatStore } from '@/stores/inline-chat.store';

export function useKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const store = useCanvasStore.getState();
      const chatStore = useInlineChatStore.getState();

      // Cmd+K — Open inline AI chat
      if (meta && e.key === 'k') {
        e.preventDefault();

        const selectedIds = Array.from(store.selectedBlockIds);
        if (selectedIds.length !== 1) return;

        const blockId = selectedIds[0]!;
        const block = store.blocks[blockId];
        if (!block) return;

        // Get text selection if any
        const selection = window.getSelection();
        let selectionRange = null;
        let selectedContent = block.content;

        if (selection && selection.toString().length > 0) {
          selectedContent = selection.toString();
          // Approximate range from selection
          const text = block.content;
          const start = text.indexOf(selectedContent);
          if (start >= 0) {
            selectionRange = { start, end: start + selectedContent.length };
          }
        }

        // Position chat near block
        const chatPosition = {
          x: block.position.x + block.size.width + 16,
          y: block.position.y,
        };

        chatStore.openChat({
          blockId,
          selectionRange,
          selectedContent,
          position: chatPosition,
        });
      }

      // Escape — Close active chat or deselect
      if (e.key === 'Escape') {
        if (chatStore.activeChatId) {
          chatStore.closeChat(chatStore.activeChatId);
        } else {
          store.deselectAll();
        }
      }

      // Delete / Backspace — Remove selected blocks
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText()) {
        e.preventDefault();
        const selectedIds = Array.from(store.selectedBlockIds);
        selectedIds.forEach((id) => store.removeBlock(id));
      }

      // Cmd+D — Duplicate
      if (meta && e.key === 'd') {
        e.preventDefault();
        const selectedIds = Array.from(store.selectedBlockIds);
        selectedIds.forEach((id) => store.duplicateBlock(id));
      }

      // Cmd+A — Select all
      if (meta && e.key === 'a' && !isEditingText()) {
        e.preventDefault();
        store.selectMultiple(Object.keys(store.blocks));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function isEditingText(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable
  );
}
