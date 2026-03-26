import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore, type AIProvider } from '@/stores/settings.store';
import { Key, X, Eye, EyeOff, Check, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ApiKeyModal() {
  const showSettings = useSettingsStore((s) => s.showSettings);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const provider = useSettingsStore((s) => s.provider);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);

  const [draft, setDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSettings) {
      setDraft(apiKey);
    }
  }, [showSettings, apiKey]);

  useEffect(() => {
    if (showSettings && provider === 'anthropic') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSettings, provider]);

  if (!showSettings) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim()) {
      setApiKey(draft.trim());
      setShowSettings(false);
    }
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 10) + '...' + apiKey.slice(-4)
    : '';

  const providers: { id: AIProvider; label: string; desc: string; icon: React.FC<{ className?: string }>; badge: string; badgeColor: string }[] = [
    {
      id: 'gemini-free',
      label: 'Gemini Flash',
      desc: 'Free tier — no key needed',
      icon: Zap,
      badge: 'FREE',
      badgeColor: 'bg-green-500/20 text-green-400',
    },
    {
      id: 'anthropic',
      label: 'Claude (Anthropic)',
      desc: 'Bring your own API key',
      icon: Crown,
      badge: 'PRO',
      badgeColor: 'bg-canvas-accent/20 text-canvas-accent',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setShowSettings(false)}
    >
      <div
        className="w-[440px] bg-canvas-surface border border-canvas-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && setShowSettings(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-canvas-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-canvas-accent/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-canvas-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-canvas-text">AI Settings</h2>
              <p className="text-[10px] text-canvas-muted">Choose your AI provider</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="p-1.5 rounded-lg hover:bg-canvas-border/30 text-canvas-muted hover:text-canvas-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Provider toggle */}
          <div className="space-y-2">
            {providers.map(({ id, label, desc, icon: Icon, badge, badgeColor }) => (
              <button
                key={id}
                type="button"
                onClick={() => setProvider(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                  provider === id
                    ? 'border-canvas-accent/50 bg-canvas-accent/5'
                    : 'border-canvas-border/30 hover:border-canvas-border/60 bg-transparent',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  provider === id ? 'bg-canvas-accent/20' : 'bg-canvas-border/20',
                )}>
                  <Icon className={cn('w-4 h-4', provider === id ? 'text-canvas-accent' : 'text-canvas-muted')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-medium', provider === id ? 'text-canvas-text' : 'text-canvas-muted')}>{label}</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', badgeColor)}>{badge}</span>
                  </div>
                  <p className="text-[10px] text-canvas-muted/70 mt-0.5">{desc}</p>
                </div>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                  provider === id ? 'border-canvas-accent' : 'border-canvas-border',
                )}>
                  {provider === id && <div className="w-2 h-2 rounded-full bg-canvas-accent" />}
                </div>
              </button>
            ))}
          </div>

          {/* Anthropic key input — only shown when anthropic is selected */}
          {provider === 'anthropic' && (
            <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-canvas-border/30">
              {/* Current key status */}
              {apiKey && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-mono">{maskedKey}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearApiKey}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs text-canvas-muted mb-1.5">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showKey ? 'text' : 'password'}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-canvas-bg/50 text-canvas-text text-sm rounded-lg px-3 py-2.5 pr-10 outline-none border border-canvas-border/50 focus:border-canvas-accent/50 placeholder:text-canvas-muted/40 font-mono"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-canvas-muted hover:text-canvas-text transition-colors"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-canvas-muted/60 leading-relaxed">
                Your key is stored in localStorage and proxied through our edge function.
                It never touches a database.
              </p>

              <button
                type="submit"
                disabled={!draft.trim() || draft.trim() === apiKey}
                className="w-full py-2.5 rounded-lg bg-canvas-accent text-white text-xs font-medium hover:bg-canvas-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save Key
              </button>
            </form>
          )}

          {/* Gemini info */}
          {provider === 'gemini-free' && (
            <div className="pt-2 border-t border-canvas-border/30">
              <p className="text-[10px] text-canvas-muted/60 leading-relaxed">
                Uses Google Gemini 2.0 Flash via a shared server key. Free with rate limits (15 req/min).
                For unlimited usage, switch to Claude with your own key.
              </p>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-full mt-3 py-2.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
              >
                Ready to go!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
