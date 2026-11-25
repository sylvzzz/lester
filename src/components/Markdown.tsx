import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  p: ({ children }) => <p className="my-2 text-sm leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-zinc-500">{children}</del>,
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 font-mono text-sm font-bold text-zinc-100 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 font-mono text-sm font-bold text-zinc-100 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 font-mono text-sm font-semibold text-zinc-100 first:mt-0">
      {children}
    </h3>
  ),
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed marker:text-tropical-cyan">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sunset-pink underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={
        className
          ? `font-mono ${className}`
          : 'rounded bg-vice-800/70 px-1 py-0.5 font-mono text-[12px] text-sunset-pink'
      }
    >
      {children}
    </code>
  ),
  img: () => null,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-electric-purple/25 bg-vice-950/70 p-3 text-xs">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-neon-pink/50 pl-3 text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-electric-purple/25" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-electric-purple/25">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-vice-800/70">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-electric-purple/25 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-tropical-cyan">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-electric-purple/25/50 px-3 py-2 align-top">{children}</td>
  ),
}

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown-body break-words text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
