export default function ViceBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="vice-sky absolute inset-0" />
      <div className="vice-sun absolute left-1/2 -top-36 size-72 -translate-x-1/2 rounded-full sm:size-[26rem]" />
      <div className="vice-horizon absolute inset-x-0 top-[62%] h-24" />
      <div className="vice-water absolute inset-x-0 bottom-0 h-1/3" />

      <svg
        viewBox="0 0 220 300"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="absolute -left-10 bottom-0 h-[42vh] w-56 text-[#0d0619] opacity-50 sm:h-[60vh] sm:w-80"
      >
        <path d="M126 300C120 236 122 178 134 120C139 96 145 74 146 52" strokeWidth="11" />
        <path d="M146 52C126 28 96 16 60 18" strokeWidth="8" />
        <path d="M146 52C126 36 102 34 74 42" strokeWidth="5" />
        <path d="M146 52C160 24 190 12 218 20" strokeWidth="8" />
        <path d="M146 52C166 34 190 34 214 44" strokeWidth="5" />
        <path d="M146 52C144 24 154 8 174 0" strokeWidth="7" />
        <path d="M146 52C120 48 96 58 72 78" strokeWidth="6" />
        <path d="M146 52C172 48 194 62 212 84" strokeWidth="6" />
        <path d="M146 52C146 74 134 92 116 104" strokeWidth="5" />
        <circle cx="140" cy="62" r="5" fill="currentColor" stroke="none" />
        <circle cx="154" cy="62" r="4" fill="currentColor" stroke="none" />
      </svg>

      <svg
        viewBox="0 0 220 300"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="absolute -right-12 bottom-0 h-52 w-48 -scale-x-100 text-[#0d0619] opacity-30 sm:h-72 sm:w-72"
      >
        <path d="M126 300C120 236 122 178 134 120C139 96 145 74 146 52" strokeWidth="11" />
        <path d="M146 52C126 28 96 16 60 18" strokeWidth="8" />
        <path d="M146 52C126 36 102 34 74 42" strokeWidth="5" />
        <path d="M146 52C160 24 190 12 218 20" strokeWidth="8" />
        <path d="M146 52C166 34 190 34 214 44" strokeWidth="5" />
        <path d="M146 52C144 24 154 8 174 0" strokeWidth="7" />
        <path d="M146 52C120 48 96 58 72 78" strokeWidth="6" />
        <path d="M146 52C172 48 194 62 212 84" strokeWidth="6" />
        <path d="M146 52C146 74 134 92 116 104" strokeWidth="5" />
      </svg>

      <div className="vice-grain absolute inset-0" />
    </div>
  )
}
