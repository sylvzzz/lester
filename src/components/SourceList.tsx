import type { Source } from '../../types.ts'

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-4 border-t border-electric-purple/25 pt-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-tropical-cyan/80">
        Sources // {sources.length}
      </div>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={`${source.number}-${source.url}`}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-2 rounded-md px-1 py-1 transition hover:bg-vice-800/60"
            >
              <span className="shrink-0 font-mono text-[11px] text-neon-pink/80">
                [{source.number}]
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-zinc-300 group-hover:text-sunset-pink">
                  {source.title}
                </span>
                <span className="block truncate font-mono text-[10px] text-zinc-500">
                  {source.site} · {source.url}
                </span>
              </span>
              <span className="shrink-0 text-xs text-zinc-500 group-hover:text-tropical-cyan" aria-hidden>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
