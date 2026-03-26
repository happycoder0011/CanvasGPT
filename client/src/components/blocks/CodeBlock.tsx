import React, { useCallback, useRef, useEffect } from 'react';
import type { Block } from '@/types';

interface CodeBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function CodeBlock({ block, onChange, isSelected }: CodeBlockProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current && ref.current !== document.activeElement) {
      ref.current.value = block.content;
    }
  }, [block.content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      textarea.value = value.substring(0, start) + '  ' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      onChange(textarea.value);
    }
  }, [onChange]);

  const lang = (block.meta.language as string) ?? 'plaintext';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-canvas-border/50">
        <span className="text-[10px] font-mono text-canvas-muted uppercase">{lang}</span>
      </div>
      <textarea
        ref={ref}
        defaultValue={block.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full bg-transparent text-green-400 font-mono text-xs leading-relaxed p-2 outline-none resize-none"
        spellCheck={false}
      />
    </div>
  );
}
