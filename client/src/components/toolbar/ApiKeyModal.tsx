import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/stores/settings.store';
import { Key, X, Eye, EyeOff, Check } from 'lucide-react';

export function ApiKeyModal() {
  const showSettings = useSettingsStore((s) => s.showSettings);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);

  const [draft, setDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSettings) {
      setDraft(apiKey);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSettings, apiKey]);

  if (!showSettings) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim()) {
      setApiKey(draft.trim());
    }
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 10) + '...' + apiKey.slice(-4)
    : '';

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
              <h2 className="text-sm font-semibold text-canvas-text">API Key</h2>
              <p className="text-[10px] text-canvas-muted">Stored locally in your browser</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="p-1.5 rounded-lg hover:bg-canvas-border/30 text-canvas-muted hover:text-canvas-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
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

          {/* Input */}
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

          {/* Info */}
          <p className="text-[10px] text-canvas-muted/60 leading-relaxed">
            Your key is stored in localStorage and sent directly to Anthropic via our edge proxy.
            It never touches a database. You can remove it anytime.
          </p>

          {/* Save */}
          <button
            type="submit"
            disabled={!draft.trim() || draft.trim() === apiKey}
            className="w-full py-2.5 rounded-lg bg-canvas-accent text-white text-xs font-medium hover:bg-canvas-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save Key
          </button>
        </form>
      </div>
    </div>
  );
}
