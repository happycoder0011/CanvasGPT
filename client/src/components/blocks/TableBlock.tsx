import React, { useCallback, useRef, useEffect } from 'react';
import type { Block } from '@/types';

interface TableBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function TableBlock({ block, onChange, isSelected }: TableBlockProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current && ref.current !== document.activeElement) {
      ref.current.value = block.content;
    }
  }, [block.content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-2 py-1 border-b border-canvas-border/50">
        <span className="text-[10px] font-mono text-cyan-400 uppercase">table (markdown)</span>
      </div>
      <textarea
        ref={ref}
        defaultValue={block.content}
        onChange={handleChange}
        className="flex-1 w-full bg-transparent text-cyan-300 font-mono text-xs leading-relaxed p-2 outline-none resize-none"
        placeholder="| Column 1 | Column 2 |&#10;|----------|----------|&#10;| Cell 1   | Cell 2   |"
        spellCheck={false}
      />
    </div>
  );
}
