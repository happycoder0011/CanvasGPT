import React, { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { useCanvasGestures } from '@/hooks/useCanvasGestures';
import { useInlineChatStore } from '@/stores/inline-chat.store';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { InlineChatBubble } from '@/components/inline-chat/InlineChatBubble';
import type { BlockType, Position } from '@/types';

export function Canvas() {
  const viewport = useCanvasStore((s) => s.viewport);
  const blocks = useCanvasStore((s) => s.blocks);
  const blockOrder = useCanvasStore((s) => s.blockOrder);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const addBlock = useCanvasStore((s) => s.addBlock);
  const deselectAll = useCanvasStore((s) => s.deselectAll);
  const chats = useInlineChatStore((s) => s.chats);

  const { onWheel, onPointerDown, onPointerMove, onPointerUp, screenToCanvas } = useCanvasGestures();

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    const toolToBlockType: Record<string, BlockType> = {
      text: 'text',
      code: 'code',
      note: 'note',
      diagram: 'diagram',
      table: 'table',
      drawing: 'drawing',
    };

    const blockType = toolToBlockType[activeTool] ?? 'text';
    addBlock(blockType, pos);
  }, [activeTool, addBlock, screenToCanvas]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      deselectAll();
    }
  }, [deselectAll]);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-canvas-bg"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      style={{ cursor: activeTool === 'pan' ? 'grab' : 'default', touchAction: 'none' }}
    >
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern
            id="grid"
            width={20 * viewport.zoom}
            height={20 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % (20 * viewport.zoom)}
            y={viewport.y % (20 * viewport.zoom)}
          >
            <circle cx="1" cy="1" r="1" fill="#533483" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Transform layer */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          willChange: 'transform',
        }}
      >
        {/* Blocks */}
        {blockOrder.map((id) => {
          const block = blocks[id];
          if (!block) return null;
          return <BlockRenderer key={id} block={block} />;
        })}
      </div>

      {/* Inline chats — rendered in screen space */}
      {Object.values(chats).map((chat) => (
        <InlineChatBubble key={chat.id} chat={chat} viewport={viewport} />
      ))}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-canvas-surface/80 backdrop-blur rounded-md text-canvas-muted text-xs font-mono">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
}
