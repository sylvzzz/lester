interface Props {
  onNewChat: () => void
}

export default function Header({ onNewChat }: Props) {
  return (
    <header className="relative z-10 border-b border-neon-pink/15 bg-vice-950/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-neon-pink/40 bg-gradient-to-br from-neon-pink/20 to-electric-purple/20 font-mono text-lg font-bold text-sunset-pink shadow-[0_0_16px_rgba(255,79,163,0.18)]">
          L
        </div>
        <div className="min-w-0">
          <h1 className="font-mono text-sm font-bold tracking-[0.28em] text-white">LESTER</h1>
          <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-sunset-pink/70 sm:text-[10px]">
            YOUR PERSONAL VICE CITY ASSISTANT
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-tropical-cyan">
            <span className="size-2 animate-pulse rounded-full bg-tropical-cyan shadow-[0_0_8px_#45ddeb]" />
            <span className="hidden sm:inline">Online</span>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New Chat"
            title="New Chat"
            className="flex items-center gap-1.5 rounded-lg border border-neon-pink/30 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-sunset-pink transition hover:border-neon-pink/60 hover:bg-neon-pink/10"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  )
}
