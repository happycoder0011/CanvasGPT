import React, { useCallback, useRef, useEffect } from 'react';
import type { Block } from '@/types';

interface NoteBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function NoteBlock({ block, onChange, isSelected }: NoteBlockProps) {
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
    <textarea
      ref={ref}
      defaultValue={block.content}
      onChange={handleChange}
      className="w-full h-full bg-yellow-500/5 text-yellow-200 text-sm leading-relaxed p-1 outline-none resize-none rounded"
      placeholder="Quick note..."
      spellCheck={false}
    />
  );
}
