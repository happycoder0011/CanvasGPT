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

    addBlock('text', { x: 100, y: 150 }, '# Welcome to CanvasGPT!\n\nAn AI-powered **brainstorming canvas**. Double-click to edit blocks.\n\n- Double-click canvas to create blocks\n- Drag the **header bar** to move\n- Select a block → `Cmd+K` for AI editing\n- Supports $E = mc^2$ and $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$');

    addBlock('code', { x: 480, y: 150 }, 'function fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}');

    addBlock('note', { x: 100, y: 420 }, '**Pro tip:** Select a block → press `Cmd+K` → AI edits inline!\n\nSupports *markdown*, **bold**, ~~strikethrough~~');

    addBlock('diagram', { x: 480, y: 520 }, 'graph TD\n  A[User Input] --> B[Canvas]\n  B --> C[Block System]\n  C --> D[AI Engine]\n  D --> E[Inline Chat]\n  E --> C');

    addBlock('table', { x: 100, y: 680 });
  }, []);
}

function ProviderButton() {
  const provider = useSettingsStore((s) => s.provider);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);

  const isFree = provider === 'gemini-free';

  return (
    <button
      onClick={toggleSettings}
      className={cn(
        'absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
        isFree
          ? 'bg-canvas-surface/90 border-green-500/30 text-green-400 hover:bg-canvas-surface'
          : 'bg-canvas-surface/90 border-canvas-accent/30 text-canvas-accent hover:bg-canvas-surface',
      )}
    >
      <Key className="w-3.5 h-3.5" />
      {isFree ? 'Gemini Flash (Free)' : 'Claude (Pro)'}
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

      <ProviderButton />
      <Toolbar />
      <Canvas />
      <Inspector />
      <ApiKeyModal />
    </div>
  );
}
