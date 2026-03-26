import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const plugins = useMemo(() => ({
    remarkPlugins: [remarkMath, remarkGfm],
    rehypePlugins: [rehypeKatex],
  }), []);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={plugins.remarkPlugins}
        rehypePlugins={plugins.rehypePlugins}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-canvas-text mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-canvas-text mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-canvas-text mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-canvas-text mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-canvas-text mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-canvas-text mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-canvas-text">{children}</li>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return <code className="px-1 py-0.5 rounded bg-canvas-bg/60 text-pink-400 text-xs font-mono">{children}</code>;
            }
            return (
              <pre className="bg-canvas-bg/60 rounded-lg p-3 mb-2 overflow-x-auto">
                <code className="text-xs font-mono text-green-400 leading-relaxed">{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-canvas-accent pl-3 mb-2 text-canvas-muted italic text-sm">{children}</blockquote>
          ),
          table: ({ children }) => (
            <table className="w-full text-xs border-collapse mb-2">{children}</table>
          ),
          thead: ({ children }) => (
            <thead className="bg-canvas-bg/40">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-canvas-border/40 px-2 py-1 text-left text-canvas-muted font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-canvas-border/40 px-2 py-1 text-canvas-text">{children}</td>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-canvas-accent underline hover:text-canvas-highlight" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          strong: ({ children }) => <strong className="font-bold text-canvas-text">{children}</strong>,
          em: ({ children }) => <em className="italic text-canvas-muted">{children}</em>,
          hr: () => <hr className="border-canvas-border/30 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
