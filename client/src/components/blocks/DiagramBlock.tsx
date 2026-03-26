import React, { useCallback, useRef, useEffect } from 'react';
import type { Block } from '@/types';

interface DiagramBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function DiagramBlock({ block, onChange, isSelected }: DiagramBlockProps) {
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
        <span className="text-[10px] font-mono text-purple-400 uppercase">diagram (mermaid)</span>
      </div>
      <textarea
        ref={ref}
        defaultValue={block.content}
        onChange={handleChange}
        className="flex-1 w-full bg-transparent text-purple-300 font-mono text-xs leading-relaxed p-2 outline-none resize-none"
        placeholder="graph TD&#10;  A --> B&#10;  B --> C"
        spellCheck={false}
      />
    </div>
  );
}
