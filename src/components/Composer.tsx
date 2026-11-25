import { useRef, useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function Composer({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`
  }

  function submit() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    resize()
  }

  return (
    <div className="relative z-10 border-t border-neon-pink/15 bg-vice-950/80 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-4 sm:px-6"
      >
        <div className="flex flex-1 items-end rounded-2xl border border-electric-purple/30 bg-vice-900/80 px-3 py-2 transition focus-within:border-neon-pink/60 focus-within:shadow-[0_0_18px_rgba(255,79,163,0.12)]">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              resize()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder="Ask Lester about Vice City..."
            aria-label="Message Lester"
            className="max-h-40 min-h-6 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon-pink to-electric-purple text-white shadow-[0_0_18px_rgba(255,79,163,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-vice-800 disabled:to-vice-800 disabled:text-zinc-500 disabled:shadow-none"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
            <path
              d="M4 12h15m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p className="mx-auto max-w-3xl px-4 pb-3 text-center font-mono text-[10px] text-zinc-500 sm:px-6">
        Enter to send · Shift + Enter for a new line · verify before you believe
      </p>
    </div>
  )
}
