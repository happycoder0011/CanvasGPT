import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Block, BlockType, CanvasViewport, Position, Size, ToolMode } from '@/types';
import { generateId } from '@/lib/utils';

interface CanvasState {
  // Viewport
  viewport: CanvasViewport;

  // Blocks
  blocks: Record<string, Block>;
  blockOrder: string[];

  // Selection
  selectedBlockIds: Set<string>;

  // Tool
  activeTool: ToolMode;

  // Drag state
  isDragging: boolean;
  dragOffset: Position | null;

  // Actions
  setViewport: (viewport: Partial<CanvasViewport>) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, center?: Position) => void;

  addBlock: (type: BlockType, position: Position, content?: string) => string;
  updateBlock: (id: string, updates: Partial<Pick<Block, 'content' | 'position' | 'size' | 'meta'>>) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => string | null;

  selectBlock: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  selectMultiple: (ids: string[]) => void;

  setActiveTool: (tool: ToolMode) => void;

  setDragging: (isDragging: boolean, offset?: Position) => void;
  moveBlock: (id: string, position: Position) => void;
  resizeBlock: (id: string, size: Size) => void;

  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

const DEFAULT_BLOCK_SIZES: Record<BlockType, Size> = {
  text: { width: 320, height: 200 },
  code: { width: 400, height: 300 },
  diagram: { width: 500, height: 400 },
  table: { width: 450, height: 300 },
  drawing: { width: 400, height: 300 },
  note: { width: 240, height: 180 },
  'ai-generated': { width: 320, height: 200 },
};

export const useCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    viewport: { x: 0, y: 0, zoom: 1 },
    blocks: {},
    blockOrder: [],
    selectedBlockIds: new Set(),
    activeTool: 'select',
    isDragging: false,
    dragOffset: null,

    setViewport: (viewport) =>
      set((state) => {
        Object.assign(state.viewport, viewport);
      }),

    pan: (dx, dy) =>
      set((state) => {
        state.viewport.x += dx;
        state.viewport.y += dy;
      }),

    zoom: (factor, center) =>
      set((state) => {
        const oldZoom = state.viewport.zoom;
        const newZoom = Math.min(Math.max(oldZoom * factor, 0.1), 5);

        if (center) {
          state.viewport.x = center.x - (center.x - state.viewport.x) * (newZoom / oldZoom);
          state.viewport.y = center.y - (center.y - state.viewport.y) * (newZoom / oldZoom);
        }

        state.viewport.zoom = newZoom;
      }),

    addBlock: (type, position, content) => {
      const id = generateId();
      const now = Date.now();
      const size = DEFAULT_BLOCK_SIZES[type];

      set((state) => {
        state.blocks[id] = {
          id,
          type,
          position,
          size,
          content: content ?? '',
          meta: {},
          createdAt: now,
          updatedAt: now,
        };
        state.blockOrder.push(id);
      });

      return id;
    },

    updateBlock: (id, updates) =>
      set((state) => {
        const block = state.blocks[id];
        if (!block) return;
        Object.assign(block, updates, { updatedAt: Date.now() });
      }),

    removeBlock: (id) =>
      set((state) => {
        delete state.blocks[id];
        state.blockOrder = state.blockOrder.filter((bid) => bid !== id);
        state.selectedBlockIds.delete(id);
      }),

    duplicateBlock: (id) => {
      const block = get().blocks[id];
      if (!block) return null;

      const newId = get().addBlock(block.type, {
        x: block.position.x + 30,
        y: block.position.y + 30,
      }, block.content);

      set((state) => {
        const newBlock = state.blocks[newId];
        if (newBlock) {
          newBlock.size = { ...block.size };
          newBlock.meta = { ...block.meta };
        }
      });

      return newId;
    },

    selectBlock: (id, additive) =>
      set((state) => {
        if (!additive) {
          state.selectedBlockIds = new Set([id]);
        } else {
          if (state.selectedBlockIds.has(id)) {
            state.selectedBlockIds.delete(id);
          } else {
            state.selectedBlockIds.add(id);
          }
        }
      }),

    deselectAll: () =>
      set((state) => {
        state.selectedBlockIds = new Set();
      }),

    selectMultiple: (ids) =>
      set((state) => {
        state.selectedBlockIds = new Set(ids);
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),

    setDragging: (isDragging, offset) =>
      set((state) => {
        state.isDragging = isDragging;
        state.dragOffset = offset ?? null;
      }),

    moveBlock: (id, position) =>
      set((state) => {
        const block = state.blocks[id];
        if (block) {
          block.position = position;
          block.updatedAt = Date.now();
        }
      }),

    resizeBlock: (id, size) =>
      set((state) => {
        const block = state.blocks[id];
        if (block) {
          block.size = { width: Math.max(size.width, 120), height: Math.max(size.height, 80) };
          block.updatedAt = Date.now();
        }
      }),

    bringToFront: (id) =>
      set((state) => {
        state.blockOrder = [...state.blockOrder.filter((bid) => bid !== id), id];
      }),

    sendToBack: (id) =>
      set((state) => {
        state.blockOrder = [id, ...state.blockOrder.filter((bid) => bid !== id)];
      }),
  }))
);
