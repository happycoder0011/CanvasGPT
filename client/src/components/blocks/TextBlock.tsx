import React, { useCallback, useRef, useEffect } from 'react';
import type { Block } from '@/types';

interface TextBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function TextBlock({ block, onChange, isSelected }: TextBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (ref.current && !isInternalChange.current) {
      if (ref.current.textContent !== block.content) {
        ref.current.textContent = block.content;
      }
    }
    isInternalChange.current = false;
  }, [block.content]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      isInternalChange.current = true;
      onChange(ref.current.textContent ?? '');
    }
  }, [onChange]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="w-full h-full text-canvas-text text-sm leading-relaxed outline-none whitespace-pre-wrap break-words"
      onInput={handleInput}
      spellCheck={false}
    />
  );
}
