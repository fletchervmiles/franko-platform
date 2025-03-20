"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export function Markdown({ children }: { children: string }) {
  // Debug: Log the first 100 characters and check for problematic patterns
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 MARKDOWN INPUT:', 
      children?.substring(0, 100), 
      '\nContains \\n?', children?.includes('\\n'),
      '\nContains literal n?', children?.includes('\\\\n'),
      '\nActual newlines:', (children?.match(/\n/g) || []).length
    );
  }
  
  // Use standard Markdown rendering with essential plugins
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      // Keep minimal component customization for styling consistency
      components={{
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {children}
          </a>
        ),
        // Add proper list styling
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="mb-1">{children}</li>
        ),
        // Proper emphasis and strong styling
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        )
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
