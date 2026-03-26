import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas.store';
import type { Position } from '@/types';

export function useCanvasGestures() {
  const lastPointer = useRef<Position | null>(null);
  const isPanning = useRef(false);

  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    const { viewport } = useCanvasStore.getState();
    return {
      x: (screenX - viewport.x) / viewport.zoom,
      y: (screenY - viewport.y) / viewport.zoom,
    };
  }, []);

  const canvasToScreen = useCallback((canvasX: number, canvasY: number): Position => {
    const { viewport } = useCanvasStore.getState();
    return {
      x: canvasX * viewport.zoom + viewport.x,
      y: canvasY * viewport.zoom + viewport.y,
    };
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const store = useCanvasStore.getState();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      store.zoom(factor, { x: e.clientX, y: e.clientY });
    } else {
      // Pan
      store.pan(-e.deltaX, -e.deltaY);
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const store = useCanvasStore.getState();

    if (e.button === 1 || (e.button === 0 && store.activeTool === 'pan') || e.shiftKey) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current && lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      useCanvasStore.getState().pan(dx, dy);
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
    lastPointer.current = null;
  }, []);

  return {
    screenToCanvas,
    canvasToScreen,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
