import React, { useCallback, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { TextBlock } from './TextBlock';
import { CodeBlock } from './CodeBlock';
import { NoteBlock } from './NoteBlock';
import { DiagramBlock } from './DiagramBlock';
import { TableBlock } from './TableBlock';
import { DrawingBlock } from './DrawingBlock';
import { cn } from '@/lib/utils';
import type { Block, Position, Size } from '@/types';
import { GripHorizontal } from 'lucide-react';

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

  const isSelected = selectedBlockIds.includes(block.id);
  const dragStart = useRef<{ mouse: Position; block: Position } | null>(null);
  const resizeStart = useRef<{ mouse: Position; size: Size } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ── Drag: only from the header bar ──
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    selectBlock(block.id, e.shiftKey);
    bringToFront(block.id);

    dragStart.current = {
      mouse: { x: e.clientX, y: e.clientY },
      block: { ...block.position },
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [block.id, block.position, selectBlock, bringToFront]);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const zoom = useCanvasStore.getState().viewport.zoom;
    const dx = (e.clientX - dragStart.current.mouse.x) / zoom;
    const dy = (e.clientY - dragStart.current.mouse.y) / zoom;

    moveBlock(block.id, {
      x: dragStart.current.block.x + dx,
      y: dragStart.current.block.y + dy,
    });
  }, [block.id, moveBlock]);

  const handleDragPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // ── Resize handle ──
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  }, []);

  // ── Select on content click (without starting drag) ──
  const handleContentPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); // don't trigger canvas pan
    selectBlock(block.id, e.shiftKey);
    bringToFront(block.id);
    setIsEditing(true);
  }, [block.id, selectBlock, bringToFront]);

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
        return <DrawingBlock {...props} />;
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
        'absolute rounded-lg border bg-canvas-surface transition-shadow duration-150 flex flex-col',
        typeColors[block.type] ?? 'border-canvas-border',
        isSelected ? 'shadow-block-selected ring-1 ring-canvas-accent/50' : 'shadow-block',
      )}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.size.width,
        height: block.size.height,
      }}
    >
      {/* ── Drag handle header ── */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 border-b border-canvas-border/30 cursor-grab active:cursor-grabbing select-none shrink-0"
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
      >
        <GripHorizontal className="w-3 h-3 text-canvas-muted/50" />
        <span className="text-[10px] font-mono text-canvas-muted uppercase tracking-wider">
          {block.type}
        </span>
      </div>

      {/* ── Content area — fully interactive ── */}
      <div
        className="flex-1 overflow-auto p-3 no-scrollbar min-h-0"
        onPointerDown={handleContentPointerDown}
      >
        {renderContent()}
      </div>

      {/* ── Resize handle ── */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10"
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
