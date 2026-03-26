import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { Block } from '@/types';
import { Eraser } from 'lucide-react';

interface DrawingBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

interface Point {
  x: number;
  y: number;
}

export function DrawingBlock({ block, onChange, isSelected }: DrawingBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const [color, setColor] = useState('#e94560');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Load saved strokes from block content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Restore saved drawing
    if (block.content) {
      try {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = block.content;
      } catch {}
    }
  }, []);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const oldData = canvas.toDataURL();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      if (oldData) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
        };
        img.src = oldData;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const getPoint = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    isDrawing.current = true;
    lastPoint.current = getPoint(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = point;
  }, [color, strokeWidth]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;

    // Save canvas as data URL
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  }, [onChange]);

  const colors = ['#e94560', '#533483', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#eaeaea', '#64748b'];

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* Drawing toolbar */}
      <div className="flex items-center gap-1.5 px-1 py-1 border-b border-canvas-border/30 shrink-0">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-4 h-4 rounded-full border border-canvas-border/30 transition-transform"
            style={{
              backgroundColor: c,
              transform: color === c ? 'scale(1.3)' : 'scale(1)',
              boxShadow: color === c ? `0 0 0 2px ${c}40` : 'none',
            }}
          />
        ))}
        <div className="w-px h-3 bg-canvas-border/30 mx-0.5" />
        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="bg-transparent text-[10px] text-canvas-muted outline-none cursor-pointer"
        >
          <option value="1">1px</option>
          <option value="2">2px</option>
          <option value="4">4px</option>
          <option value="8">8px</option>
        </select>
        <button
          onClick={handleClear}
          className="ml-auto p-0.5 rounded text-canvas-muted hover:text-red-400 transition-colors"
          title="Clear"
        >
          <Eraser className="w-3 h-3" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
