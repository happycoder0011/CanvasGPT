import React, { useCallback, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { TextBlock } from './TextBlock';
import { CodeBlock } from './CodeBlock';
import { NoteBlock } from './NoteBlock';
import { DiagramBlock } from './DiagramBlock';
import { TableBlock } from './TableBlock';
import { cn } from '@/lib/utils';
import type { Block, Position, Size } from '@/types';

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const selectedBlockIds = useCanvasStore((s) => s.selectedBlockIds);
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const moveBlock = useCanvasStore((s) => s.moveBlock);
  const resizeBlock = useCanvasStore((s) => s.resizeBlock);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  const isSelected = selectedBlockIds.has(block.id);
  const dragStart = useRef<{ mouse: Position; block: Position } | null>(null);
  const resizeStart = useRef<{ mouse: Position; size: Size } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    selectBlock(block.id, e.shiftKey);
    bringToFront(block.id);

    dragStart.current = {
      mouse: { x: e.clientX, y: e.clientY },
      block: { ...block.position },
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [block.id, block.position, selectBlock, bringToFront]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isResizing) return;

    if (dragStart.current) {
      const zoom = useCanvasStore.getState().viewport.zoom;
      const dx = (e.clientX - dragStart.current.mouse.x) / zoom;
      const dy = (e.clientY - dragStart.current.mouse.y) / zoom;

      moveBlock(block.id, {
        x: dragStart.current.block.x + dx,
        y: dragStart.current.block.y + dy,
      });
    }
  }, [block.id, moveBlock, isResizing]);

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // Resize handle
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      mouse: { x: e.clientX, y: e.clientY },
      size: { ...block.size },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [block.size]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeStart.current) return;
    const zoom = useCanvasStore.getState().viewport.zoom;
    const dx = (e.clientX - resizeStart.current.mouse.x) / zoom;
    const dy = (e.clientY - resizeStart.current.mouse.y) / zoom;

    resizeBlock(block.id, {
      width: resizeStart.current.size.width + dx,
      height: resizeStart.current.size.height + dy,
    });
  }, [block.id, resizeBlock]);

  const handleResizePointerUp = useCallback(() => {
    resizeStart.current = null;
    setIsResizing(false);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    updateBlock(block.id, { content });
  }, [block.id, updateBlock]);

  const renderContent = () => {
    const props = { block, onChange: handleContentChange, isSelected };

    switch (block.type) {
      case 'text':
      case 'ai-generated':
        return <TextBlock {...props} />;
      case 'code':
        return <CodeBlock {...props} />;
      case 'note':
        return <NoteBlock {...props} />;
      case 'diagram':
        return <DiagramBlock {...props} />;
      case 'table':
        return <TableBlock {...props} />;
      case 'drawing':
        return <TextBlock {...props} />;
      default:
        return <TextBlock {...props} />;
    }
  };

  const typeColors: Record<string, string> = {
    text: 'border-blue-500/30',
    code: 'border-green-500/30',
    note: 'border-yellow-500/30',
    diagram: 'border-purple-500/30',
    table: 'border-cyan-500/30',
    drawing: 'border-pink-500/30',
    'ai-generated': 'border-canvas-highlight/30',
  };

  return (
    <div
      className={cn(
        'absolute rounded-lg border bg-canvas-surface transition-shadow duration-150',
        typeColors[block.type] ?? 'border-canvas-border',
        isSelected ? 'shadow-block-selected ring-1 ring-canvas-accent/50' : 'shadow-block',
      )}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.size.width,
        height: block.size.height,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Block type label */}
      <div className="absolute -top-5 left-2 text-[10px] font-mono text-canvas-muted uppercase tracking-wider">
        {block.type}
      </div>

      {/* Content area */}
      <div className="w-full h-full overflow-auto p-3 no-scrollbar">
        {renderContent()}
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full text-canvas-muted">
            <path d="M14 14L8 14L14 8Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
