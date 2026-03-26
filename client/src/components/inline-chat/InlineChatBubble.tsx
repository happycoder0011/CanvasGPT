import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useInlineChatStore } from '@/stores/inline-chat.store';
import { useCanvasStore } from '@/stores/canvas.store';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/lib/utils';
import type { InlineChat, CanvasViewport } from '@/types';
import { X, Send, Sparkles, Check, RotateCcw, Loader2 } from 'lucide-react';

interface InlineChatBubbleProps {
  chat: InlineChat;
  viewport: CanvasViewport;
}

export function InlineChatBubble({ chat, viewport }: InlineChatBubbleProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeChat = useInlineChatStore((s) => s.closeChat);
  const blocks = useCanvasStore((s) => s.blocks);
  const { streamAI, applyAction } = useAI();

  const block = blocks[chat.blockId];

  // Auto-focus input
  useEffect(() => {
    if (chat.status === 'prompting') {
      inputRef.current?.focus();
    }
  }, [chat.status]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // Screen position from canvas position
  const screenX = chat.position.x * viewport.zoom + viewport.x;
  const screenY = chat.position.y * viewport.zoom + viewport.y;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !block) return;

    const request = {
      prompt: prompt.trim(),
      blockId: chat.blockId,
      selectedContent: chat.selectedContent,
      selectionRange: chat.selectionRange,
      blockContent: block.content,
      blockType: block.type,
    };

    setPrompt('');
    await streamAI(chat.id, request);
  }, [prompt, block, chat, streamAI]);

  const handleApplyAndClose = useCallback(() => {
    // Content already applied via streaming action
    closeChat(chat.id);
  }, [chat.id, closeChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      closeChat(chat.id);
    }
  }, [chat.id, closeChat]);

  const quickActions = [
    { label: 'Improve writing', prompt: 'Improve the writing quality of this text' },
    { label: 'Make shorter', prompt: 'Make this more concise' },
    { label: 'Fix grammar', prompt: 'Fix any grammar or spelling errors' },
    { label: 'Brainstorm', prompt: 'Brainstorm related ideas and expand on this' },
    { label: 'To bullets', prompt: 'Convert this into bullet points' },
    { label: 'To diagram', prompt: 'Convert this into a mermaid diagram' },
  ];

  return (
    <div
      className={cn(
        'absolute z-50 w-[380px] bg-canvas-surface border border-canvas-border rounded-xl shadow-chat',
        'animate-in fade-in slide-in-from-left-2 duration-200',
      )}
      style={{
        left: screenX,
        top: screenY,
        maxHeight: '480px',
      }}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-canvas-accent" />
          <span className="text-xs font-medium text-canvas-text">AI Edit</span>
          {chat.selectedContent && (
            <span className="text-[10px] text-canvas-muted px-1.5 py-0.5 bg-canvas-accent/10 rounded">
              {chat.selectedContent.length > 40
                ? chat.selectedContent.slice(0, 40) + '...'
                : chat.selectedContent}
            </span>
          )}
        </div>
        <button
          onClick={() => closeChat(chat.id)}
          className="p-1 rounded hover:bg-canvas-border/50 text-canvas-muted hover:text-canvas-text transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      {chat.messages.length > 0 && (
        <div className="max-h-[280px] overflow-y-auto p-3 space-y-3 no-scrollbar">
          {chat.messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'text-canvas-muted'
                  : 'text-canvas-text whitespace-pre-wrap',
              )}
            >
              {msg.role === 'user' && (
                <span className="text-canvas-accent font-medium">You: </span>
              )}
              {msg.content}
              {chat.status === 'streaming' && msg.role === 'assistant' && i === chat.messages.length - 1 && (
                <span className="inline-block w-1.5 h-3.5 bg-canvas-accent animate-pulse ml-0.5" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick actions — show when no messages yet */}
      {chat.messages.length === 0 && (
        <div className="p-2 flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setPrompt(action.prompt);
                inputRef.current?.focus();
              }}
              className="text-[10px] px-2 py-1 rounded-md bg-canvas-accent/10 text-canvas-muted hover:text-canvas-text hover:bg-canvas-accent/20 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-canvas-border/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={chat.status === 'streaming' ? 'AI is thinking...' : 'Ask AI to edit...'}
            disabled={chat.status === 'streaming'}
            className="flex-1 bg-canvas-bg/50 text-canvas-text text-xs rounded-lg px-3 py-2 outline-none border border-canvas-border/50 focus:border-canvas-accent/50 placeholder:text-canvas-muted/50 disabled:opacity-50"
            onKeyDown={(e) => e.stopPropagation()}
          />
          {chat.status === 'streaming' ? (
            <Loader2 className="w-4 h-4 text-canvas-accent animate-spin" />
          ) : chat.status === 'done' ? (
            <button
              type="button"
              onClick={handleApplyAndClose}
              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              title="Accept & close"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="p-1.5 rounded-lg bg-canvas-accent/20 text-canvas-accent hover:bg-canvas-accent/30 transition-colors disabled:opacity-30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
