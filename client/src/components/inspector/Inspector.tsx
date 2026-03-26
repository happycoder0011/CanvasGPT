import React from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { useInlineChatStore } from '@/stores/inline-chat.store';
import { Sparkles, Trash2, Copy, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

export function Inspector() {
  const selectedBlockIds = useCanvasStore((s) => s.selectedBlockIds);
  const blocks = useCanvasStore((s) => s.blocks);
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const duplicateBlock = useCanvasStore((s) => s.duplicateBlock);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const openChat = useInlineChatStore((s) => s.openChat);

  const selectedIds = Array.from(selectedBlockIds);

  if (selectedIds.length === 0) {
    return (
      <div className="absolute right-4 top-20 z-30 w-56 bg-canvas-surface/90 backdrop-blur-md border border-canvas-border rounded-xl p-4 shadow-lg">
        <p className="text-canvas-muted text-xs text-center">
          Select a block to inspect
        </p>
        <div className="mt-4 space-y-2 text-[10px] text-canvas-muted/70">
          <p>Double-click to create a block</p>
          <p>Cmd+K to open AI chat</p>
          <p>Shift+click to multi-select</p>
          <p>Scroll to zoom, Shift+drag to pan</p>
        </div>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="absolute right-4 top-20 z-30 w-56 bg-canvas-surface/90 backdrop-blur-md border border-canvas-border rounded-xl p-4 shadow-lg">
        <p className="text-canvas-text text-xs font-medium">{selectedIds.length} blocks selected</p>
      </div>
    );
  }

  const blockId = selectedIds[0]!;
  const block = blocks[blockId];
  if (!block) return null;

  const handleAIChat = () => {
    openChat({
      blockId: block.id,
      selectionRange: null,
      selectedContent: block.content,
      position: {
        x: block.position.x + block.size.width + 16,
        y: block.position.y,
      },
    });
  };

  return (
    <div className="absolute right-4 top-20 z-30 w-56 bg-canvas-surface/90 backdrop-blur-md border border-canvas-border rounded-xl shadow-lg overflow-hidden">
      {/* Block info */}
      <div className="p-3 border-b border-canvas-border/50">
        <div className="text-xs font-medium text-canvas-text capitalize">{block.type} Block</div>
        <div className="text-[10px] text-canvas-muted font-mono mt-1">{block.id.slice(0, 8)}</div>
      </div>

      {/* Position / Size */}
      <div className="p-3 border-b border-canvas-border/50 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-canvas-muted">X</label>
          <div className="text-xs text-canvas-text font-mono">{Math.round(block.position.x)}</div>
        </div>
        <div>
          <label className="text-[10px] text-canvas-muted">Y</label>
          <div className="text-xs text-canvas-text font-mono">{Math.round(block.position.y)}</div>
        </div>
        <div>
          <label className="text-[10px] text-canvas-muted">W</label>
          <div className="text-xs text-canvas-text font-mono">{Math.round(block.size.width)}</div>
        </div>
        <div>
          <label className="text-[10px] text-canvas-muted">H</label>
          <div className="text-xs text-canvas-text font-mono">{Math.round(block.size.height)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        <button
          onClick={handleAIChat}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-canvas-accent hover:bg-canvas-accent/10 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Edit (Cmd+K)
        </button>
        <button
          onClick={() => duplicateBlock(blockId)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>
        <button
          onClick={() => bringToFront(blockId)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
          Bring to front
        </button>
        <button
          onClick={() => sendToBack(blockId)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          Send to back
        </button>
        <button
          onClick={() => removeBlock(blockId)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
