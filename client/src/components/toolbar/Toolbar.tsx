import React from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import { cn } from '@/lib/utils';
import type { ToolMode } from '@/types';
import {
  MousePointer2,
  Hand,
  Type,
  Code2,
  StickyNote,
  GitBranch,
  Table,
  Pencil,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

const tools: { mode: ToolMode; icon: React.FC<{ className?: string }>; label: string }[] = [
  { mode: 'select', icon: MousePointer2, label: 'Select (V)' },
  { mode: 'pan', icon: Hand, label: 'Pan (Space)' },
  { mode: 'text', icon: Type, label: 'Text (T)' },
  { mode: 'code', icon: Code2, label: 'Code (C)' },
  { mode: 'note', icon: StickyNote, label: 'Note (N)' },
  { mode: 'diagram', icon: GitBranch, label: 'Diagram (D)' },
  { mode: 'table', icon: Table, label: 'Table' },
  { mode: 'drawing', icon: Pencil, label: 'Draw (P)' },
];

export function Toolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const zoom = useCanvasStore((s) => s.zoom);
  const setViewport = useCanvasStore((s) => s.setViewport);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-1.5 bg-canvas-surface/90 backdrop-blur-md border border-canvas-border rounded-xl shadow-lg">
      {tools.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'p-2 rounded-lg transition-all duration-150',
            activeTool === mode
              ? 'bg-canvas-accent text-white shadow-sm'
              : 'text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30',
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-6 bg-canvas-border mx-1" />

      <button
        onClick={() => zoom(1.15)}
        className="p-2 rounded-lg text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoom(0.85)}
        className="p-2 rounded-lg text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
        className="p-2 rounded-lg text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/30 transition-colors"
        title="Reset view"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
