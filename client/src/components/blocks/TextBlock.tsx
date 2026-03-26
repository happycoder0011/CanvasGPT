import React, { useCallback, useRef, useEffect, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Block } from '@/types';

interface TextBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

export function TextBlock({ block, onChange, isSelected }: TextBlockProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.value = block.content;
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  // Sync external content changes while not editing
  useEffect(() => {
    if (!editing && textareaRef.current) {
      textareaRef.current.value = block.content;
    }
  }, [block.content, editing]);

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
        className="w-full h-full bg-transparent text-canvas-text text-sm leading-relaxed outline-none resize-none"
        placeholder="Type markdown here... (supports **bold**, *italic*, `code`, $math$, tables, etc.)"
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
        <MarkdownRenderer content={block.content} />
      ) : (
        <p className="text-canvas-muted/50 text-sm italic">Double-click to edit...</p>
      )}
    </div>
  );
}
