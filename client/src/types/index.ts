// ============================================
// BLOCK TYPES
// ============================================

export type BlockType = 'text' | 'code' | 'diagram' | 'table' | 'drawing' | 'note' | 'ai-generated';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SelectionRange {
  start: number;
  end: number;
}

export interface Block {
  id: string;
  type: BlockType;
  position: Position;
  size: Size;
  content: string;
  meta: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// INLINE CHAT
// ============================================

export type InlineChatStatus = 'idle' | 'prompting' | 'streaming' | 'done' | 'error';

export interface InlineChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface InlineChat {
  id: string;
  blockId: string;
  selectionRange: SelectionRange | null;
  selectedContent: string;
  messages: InlineChatMessage[];
  status: InlineChatStatus;
  position: Position;
}

// ============================================
// AI ACTIONS
// ============================================

export type AIActionType = 'replace' | 'append' | 'insert' | 'new_block' | 'annotate';

export interface AIAction {
  action: AIActionType;
  blockId: string;
  range?: SelectionRange;
  blockType?: BlockType;
  content: string;
  meta?: Record<string, unknown>;
}

// ============================================
// CANVAS
// ============================================

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export type ToolMode = 'select' | 'pan' | 'text' | 'code' | 'note' | 'diagram' | 'table' | 'drawing';

// ============================================
// AI REQUEST/RESPONSE
// ============================================

export interface AIRequest {
  prompt: string;
  blockId: string;
  selectedContent: string;
  selectionRange: SelectionRange | null;
  blockContent: string;
  blockType: BlockType;
  context?: string;
}

export interface AIStreamChunk {
  type: 'text_delta' | 'action' | 'done' | 'error';
  content?: string;
  action?: AIAction;
  error?: string;
}
