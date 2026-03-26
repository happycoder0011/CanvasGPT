import React, { useCallback, useRef, useEffect, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Block } from '@/types';

interface NoteBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function NoteBlock({ block, onChange, isSelected }: NoteBlockProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <textarea
        ref={textareaRef}
        defaultValue={block.content}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full h-full bg-yellow-500/5 text-yellow-200 text-sm leading-relaxed p-1 outline-none resize-none rounded"
        placeholder="Quick note..."
        spellCheck={false}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="w-full h-full cursor-text"
    >
      {block.content ? (
        <MarkdownRenderer
          content={block.content}
          className="[&_p]:text-yellow-200 [&_h1]:text-yellow-100 [&_h2]:text-yellow-100 [&_h3]:text-yellow-100 [&_li]:text-yellow-200"
        />
      ) : (
        <p className="text-yellow-500/40 text-sm italic">Double-click to edit...</p>
      )}
    </div>
  );
}
