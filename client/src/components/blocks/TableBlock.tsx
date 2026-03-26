import React, { useCallback, useMemo, useState } from 'react';
import type { Block } from '@/types';
import { Plus, Minus } from 'lucide-react';

interface TableBlockProps {
  block: Block;
  onChange: (content: string) => void;
  isSelected: boolean;
}

type TableData = string[][];

function parseTable(content: string): TableData {
  if (!content.trim()) {
    return [
      ['Column 1', 'Column 2', 'Column 3'],
      ['', '', ''],
      ['', '', ''],
    ];
  }

  // Try JSON first (our native format)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}

  // Parse markdown table
  const lines = content.trim().split('\n').filter((l) => l.trim());
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip separator rows like |---|---|
    if (/^\|?[\s\-:|]+\|?$/.test(trimmed)) continue;

    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length === 0) {
    return [
      ['Column 1', 'Column 2', 'Column 3'],
      ['', '', ''],
    ];
  }

  // Normalize column count
  const maxCols = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });
}

function serializeTable(data: TableData): string {
  return JSON.stringify(data);
}

export function TableBlock({ block, onChange, isSelected }: TableBlockProps) {
  const data = useMemo(() => parseTable(block.content), [block.content]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    const newData = data.map((r) => [...r]);
    if (newData[row]) {
      newData[row]![col] = value;
      onChange(serializeTable(newData));
    }
  }, [data, onChange]);

  const addRow = useCallback(() => {
    const cols = data[0]?.length ?? 3;
    const newData = [...data.map((r) => [...r]), new Array(cols).fill('')];
    onChange(serializeTable(newData));
  }, [data, onChange]);

  const removeRow = useCallback(() => {
    if (data.length <= 1) return;
    const newData = data.slice(0, -1).map((r) => [...r]);
    onChange(serializeTable(newData));
  }, [data, onChange]);

  const addColumn = useCallback(() => {
    const newData = data.map((r, i) => [...r, i === 0 ? `Col ${r.length + 1}` : '']);
    onChange(serializeTable(newData));
  }, [data, onChange]);

  const removeColumn = useCallback(() => {
    if ((data[0]?.length ?? 0) <= 1) return;
    const newData = data.map((r) => r.slice(0, -1));
    onChange(serializeTable(newData));
  }, [data, onChange]);

  const numCols = data[0]?.length ?? 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table controls */}
      {isSelected && (
        <div className="flex items-center gap-2 px-2 py-1 border-b border-canvas-border/30 shrink-0">
          <span className="text-[10px] text-canvas-muted">Rows:</span>
          <button onClick={addRow} className="p-0.5 rounded hover:bg-canvas-border/30 text-cyan-400" title="Add row">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={removeRow} className="p-0.5 rounded hover:bg-canvas-border/30 text-canvas-muted" title="Remove row">
            <Minus className="w-3 h-3" />
          </button>
          <div className="w-px h-3 bg-canvas-border/30" />
          <span className="text-[10px] text-canvas-muted">Cols:</span>
          <button onClick={addColumn} className="p-0.5 rounded hover:bg-canvas-border/30 text-cyan-400" title="Add column">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={removeColumn} className="p-0.5 rounded hover:bg-canvas-border/30 text-canvas-muted" title="Remove column">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-canvas-muted/50 ml-auto">{data.length}x{numCols}</span>
        </div>
      )}

      {/* Table grid */}
      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => {
                  const isHeader = rowIdx === 0;
                  const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

                  return (
                    <td
                      key={colIdx}
                      className={`border border-canvas-border/30 px-2 py-1.5 ${
                        isHeader
                          ? 'bg-canvas-bg/40 text-cyan-400 font-medium'
                          : 'text-canvas-text'
                      }`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingCell({ row: rowIdx, col: colIdx });
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          defaultValue={cell}
                          className="w-full bg-transparent outline-none text-xs"
                          onBlur={(e) => {
                            updateCell(rowIdx, colIdx, e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              e.preventDefault();
                              updateCell(rowIdx, colIdx, (e.target as HTMLInputElement).value);
                              // Move to next cell
                              if (e.key === 'Tab') {
                                const nextCol = colIdx + 1 < numCols ? colIdx + 1 : 0;
                                const nextRow = nextCol === 0 ? rowIdx + 1 : rowIdx;
                                if (nextRow < data.length) {
                                  setEditingCell({ row: nextRow, col: nextCol });
                                } else {
                                  setEditingCell(null);
                                }
                              } else {
                                const nextRow = rowIdx + 1;
                                if (nextRow < data.length) {
                                  setEditingCell({ row: nextRow, col: colIdx });
                                } else {
                                  setEditingCell(null);
                                }
                              }
                            }
                            if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="cursor-text select-text">{cell || '\u00A0'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
