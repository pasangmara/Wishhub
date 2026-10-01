export default function ReviewLinkUnavailable() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="max-w-sm text-center animate-fade-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-forest-800">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
          Sorry, this review link is unavailable.
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          Please check the link you received, or ask the business for a new one.
        </p>
      </div>
    </main>
  );
}
