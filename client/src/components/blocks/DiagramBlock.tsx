import React, { useCallback, useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid';
import type { Block } from '@/types';

interface DiagramBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#533483',
    primaryTextColor: '#eaeaea',
    primaryBorderColor: '#0f3460',
    lineColor: '#8892a4',
    secondaryColor: '#16213e',
    tertiaryColor: '#1a1a2e',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '12px',
  },
});

let renderCounter = 0;

export function DiagramBlock({ block, onChange, isSelected }: DiagramBlockProps) {
  const [editing, setEditing] = useState(false);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Render mermaid diagram
  useEffect(() => {
    if (editing || !block.content.trim()) {
      setSvg('');
      setError('');
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const id = `mermaid-${block.id}-${++renderCounter}`;
        const { svg: result } = await mermaid.render(id, block.content.trim());
        if (!cancelled) {
          setSvg(result);
          setError('');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Invalid diagram syntax');
          setSvg('');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [block.content, block.id, editing]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.value = block.content;
    }
  }, [editing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }, []);

  if (editing) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="px-2 py-1 border-b border-canvas-border/30 shrink-0">
          <span className="text-[10px] font-mono text-purple-400 uppercase">editing diagram</span>
        </div>
        <textarea
          ref={textareaRef}
          defaultValue={block.content}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 w-full bg-transparent text-purple-300 font-mono text-xs leading-relaxed p-2 outline-none resize-none"
          placeholder={"graph TD\n  A --> B\n  B --> C"}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="w-full h-full flex flex-col cursor-pointer"
    >
      {svg ? (
        <div
          className="flex-1 flex items-center justify-center overflow-auto p-2 [&_svg]:max-w-full [&_svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
          <p className="text-red-400 text-xs text-center">{error}</p>
          <p className="text-canvas-muted/50 text-[10px]">Double-click to edit</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-canvas-muted/50 text-sm italic">Double-click to add diagram...</p>
        </div>
      )}
    </div>
  );
}
