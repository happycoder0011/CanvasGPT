import React, { useState } from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Inspector } from '@/components/inspector/Inspector';
import { ApiKeyModal } from '@/components/toolbar/ApiKeyModal';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useCanvasStore } from '@/stores/canvas.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Sparkles, Key, MessageSquare, X, Send, ExternalLink } from 'lucide-react';
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

function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent('CanvasGPT Feedback');
    const body = encodeURIComponent(message);
    window.open(`mailto:sheetalsinghnew@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage('');
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-canvas-surface/90 border border-canvas-border text-canvas-muted text-xs hover:text-canvas-text hover:border-canvas-accent/30 transition-all"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-start p-4 sm:pl-4 sm:pb-16 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[360px] bg-canvas-surface border border-canvas-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-canvas-accent" />
                <span className="text-sm font-medium text-canvas-text">Send Feedback</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-canvas-border/30 text-canvas-muted hover:text-canvas-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {sent ? (
                <div className="text-center py-6">
                  <p className="text-green-400 text-sm font-medium">Opening your email client...</p>
                  <p className="text-canvas-muted text-xs mt-1">Thanks for your feedback!</p>
                </div>
              ) : (
                <>
                  <textarea
                    autoFocus
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Bug report, feature request, or just say hi..."
                    className="w-full h-28 bg-canvas-bg/50 text-canvas-text text-sm rounded-lg px-3 py-2.5 outline-none border border-canvas-border/50 focus:border-canvas-accent/50 placeholder:text-canvas-muted/40 resize-none"
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-canvas-muted/50">Sends via email to the creator</span>
                    <button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas-accent text-white text-xs font-medium hover:bg-canvas-accent/90 transition-colors disabled:opacity-30"
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 text-[10px] text-canvas-muted/40">
      <span>Built by</span>
      <a
        href="https://sheetal.me"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-canvas-muted/60 hover:text-canvas-accent transition-colors underline underline-offset-2"
      >
        Sheetal
        <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </div>
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
      <FeedbackButton />
      <Footer />
    </div>
  );
}
