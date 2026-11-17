export function LogoBadge({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 shadow-lg shadow-brand-500/30 ring-1 ring-white/20"
      aria-hidden
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <path d="M5 4.5h8.5a5 5 0 0 1 0 10H9v5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18.5" cy="19" r="1.6" fill="white" />
      </svg>
    </div>
  );
}
