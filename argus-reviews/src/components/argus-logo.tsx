export function ArgusMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0b3b2c" />
      <path d="M16 7.5c-5.6 0-9.6 5.2-10.3 8.5.7 3.3 4.7 8.5 10.3 8.5s9.6-5.2 10.3-8.5C25.6 12.7 21.6 7.5 16 7.5z" fill="none" stroke="#dcf3e8" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4.2" fill="#f97316" />
      <circle cx="17.4" cy="14.6" r="1.2" fill="#fff" />
    </svg>
  );
}

export function ArgusLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <ArgusMark />
      <span className="text-[17px] font-bold tracking-[0.18em] text-forest-900">ARGUS</span>
    </span>
  );
}
