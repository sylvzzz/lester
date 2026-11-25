type Props = {
  label?: string
}

export default function ThinkingIndicator({ label = 'Lester is working' }: Props) {
  return (
    <div className="flex justify-start" role="status" aria-label={label}>
      <div className="flex items-center gap-3 rounded-2xl border border-electric-purple/25 bg-vice-900/80 px-4 py-3">
        <span className="flex gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-neon-pink" />
          <span className="size-1.5 animate-pulse rounded-full bg-sunset-pink [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-tropical-cyan [animation-delay:300ms]" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </span>
      </div>
    </div>
  )
}
