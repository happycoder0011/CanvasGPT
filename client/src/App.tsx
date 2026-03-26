import React from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Inspector } from '@/components/inspector/Inspector';
import { ApiKeyModal } from '@/components/toolbar/ApiKeyModal';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useCanvasStore } from '@/stores/canvas.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Sparkles, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function ApiKeyButton() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);
  const hasKey = apiKey.length > 0;

  return (
    <button
      onClick={toggleSettings}
      className={cn(
        'absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
        hasKey
          ? 'bg-canvas-surface/90 border-green-500/30 text-green-400 hover:bg-canvas-surface'
          : 'bg-canvas-highlight/20 border-canvas-highlight/50 text-canvas-highlight hover:bg-canvas-highlight/30 animate-pulse',
      )}
    >
      <Key className="w-3.5 h-3.5" />
      {hasKey ? 'API Key Set' : 'Add API Key'}
    </button>
  );
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

      <ApiKeyButton />
      <Toolbar />
      <Canvas />
      <Inspector />
      <ApiKeyModal />
    </div>
  );
}
