import React from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Inspector } from '@/components/inspector/Inspector';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useCanvasStore } from '@/stores/canvas.store';
import { Sparkles } from 'lucide-react';

// Seed some example blocks on first load
function useSeedBlocks() {
  const addBlock = useCanvasStore((s) => s.addBlock);
  const blocks = useCanvasStore((s) => s.blocks);

  React.useEffect(() => {
    if (Object.keys(blocks).length > 0) return;

    addBlock('text', { x: 100, y: 150 }, 'Welcome to CanvasGPT!\n\nThis is an AI-powered brainstorming canvas. You can:\n\n- Double-click to create blocks\n- Drag blocks to move them\n- Select a block and press Cmd+K for inline AI editing\n- Use the toolbar to switch block types');

    addBlock('code', { x: 480, y: 150 }, 'function fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}');

    addBlock('note', { x: 100, y: 420 }, 'Pro tip: Select text inside a block, then press Cmd+K to edit just that selection with AI!');

    addBlock('diagram', { x: 480, y: 520 }, 'graph TD\n  A[User Input] --> B[Canvas]\n  B --> C[Block System]\n  C --> D[AI Engine]\n  D --> E[Inline Chat]\n  E --> C');
  }, []);
}

export default function App() {
  useKeyboard();
  useSeedBlocks();

  return (
    <div className="w-screen h-screen bg-canvas-bg relative overflow-hidden">
      {/* Logo */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-canvas-accent to-canvas-highlight flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-canvas-text text-sm font-semibold tracking-tight">CanvasGPT</span>
      </div>

      <Toolbar />
      <Canvas />
      <Inspector />
    </div>
  );
}
