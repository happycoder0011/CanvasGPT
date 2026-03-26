import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { useInlineChatStore } from '@/stores/inline-chat.store';
import { useSettingsStore } from '@/stores/settings.store';
import type { AIRequest, AIAction, AIStreamChunk } from '@/types';

export function useAI() {
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const addBlock = useCanvasStore((s) => s.addBlock);
  const { addMessage, appendToLastAssistantMessage, setStatus } = useInlineChatStore.getState();

  const streamAI = useCallback(async (chatId: string, request: AIRequest) => {
    const { apiKey } = useSettingsStore.getState();

    if (!apiKey) {
      useSettingsStore.getState().setShowSettings(true);
      return;
    }

    // Add user message
    addMessage(chatId, { role: 'user', content: request.prompt });

    // Add empty assistant message for streaming
    addMessage(chatId, { role: 'assistant', content: '' });
    setStatus(chatId, 'streaming');

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('AI request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const chunk: AIStreamChunk = JSON.parse(line.slice(6));

            switch (chunk.type) {
              case 'text_delta':
                if (chunk.content) {
                  appendToLastAssistantMessage(chatId, chunk.content);
                }
                break;

              case 'action':
                if (chunk.action) {
                  applyAction(chunk.action);
                }
                break;

              case 'done':
                setStatus(chatId, 'done');
                break;

              case 'error':
                setStatus(chatId, 'error');
                break;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (error) {
      setStatus(chatId, 'error');
      appendToLastAssistantMessage(chatId, '\n\n[Error: Failed to get AI response]');
    }
  }, [addMessage, appendToLastAssistantMessage, setStatus]);

  const applyAction = useCallback((action: AIAction) => {
    const { blocks } = useCanvasStore.getState();
    const block = blocks[action.blockId];

    switch (action.action) {
      case 'replace': {
        if (block && action.range) {
          const before = block.content.slice(0, action.range.start);
          const after = block.content.slice(action.range.end);
          updateBlock(action.blockId, { content: before + action.content + after });
        } else if (block) {
          updateBlock(action.blockId, { content: action.content });
        }
        break;
      }

      case 'append': {
        if (block) {
          updateBlock(action.blockId, { content: block.content + '\n' + action.content });
        }
        break;
      }

      case 'insert': {
        if (block && action.range) {
          const before = block.content.slice(0, action.range.start);
          const after = block.content.slice(action.range.start);
          updateBlock(action.blockId, { content: before + action.content + after });
        }
        break;
      }

      case 'new_block': {
        const pos = block
          ? { x: block.position.x + block.size.width + 40, y: block.position.y }
          : { x: 100, y: 100 };
        addBlock(action.blockType ?? 'text', pos, action.content);
        break;
      }

      case 'annotate': {
        if (block) {
          const annotations = (block.meta.annotations as string[] | undefined) ?? [];
          updateBlock(action.blockId, {
            meta: { ...block.meta, annotations: [...annotations, action.content] },
          });
        }
        break;
      }
    }
  }, [updateBlock, addBlock]);

  return { streamAI, applyAction };
}
