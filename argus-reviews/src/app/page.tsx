import { ArrowRight, BarChart3, Check, Link2, MessageSquareHeart, QrCode, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { ArgusLogo } from "@/components/argus-logo";
import { BUSINESS_TYPES } from "@/lib/business-types";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@argusofficial.com";
const GET_STARTED = `mailto:${CONTACT}?subject=${encodeURIComponent("Get started with ARGUS")}`;

function Stars({ n = 5, className = "h-4 w-4" }: { n?: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= n ? "fill-ember-500 text-ember-500" : "fill-line text-line"}`} />
      ))}
    </span>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[280px] rounded-[44px] border-[10px] border-ink-900 bg-ink-900 shadow-lift sm:w-[300px]">
      <div className="overflow-hidden rounded-[34px] bg-paper px-5 pb-6 pt-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-forest-800 font-display text-lg font-semibold text-white shadow-soft">AR</div>
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-forest-800">ABC Restaurant</p>
        <p className="mt-1 text-center font-display text-lg font-semibold leading-tight text-ink-900">How was your dining experience?</p>
        <div className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-soft">
          <div className="flex justify-center"><Stars className="h-7 w-7" /></div>
          <p className="mt-1 text-center text-xs font-semibold text-forest-800">Excellent</p>
          <div className="mt-3 rounded-xl border border-line px-3 py-2.5 text-[11px] leading-relaxed text-ink-700">
            The kacchi biryani was perfect and the staff made our family dinner special!
          </div>
          <div className="mt-2 flex gap-1.5">
            {["Dining", "Service", "Staff"].map((c, i) => (
              <span key={c} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? "bg-forest-800 text-white" : "border border-line text-ink-500"}`}>{c}</span>
            ))}
          </div>
          <div className="mt-3 rounded-full bg-forest-800 py-2.5 text-center text-xs font-semibold text-white">Submit Feedback →</div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Link2, title: "Share one link", body: "Send your review link by WhatsApp, SMS or email — or print the QR code on tables, bills and room cards." },
  { icon: MessageSquareHeart, title: "Guests reply in 30 seconds", body: "Stars, a few words, an optional photo. No app, no sign-up, no password. Ever." },
  { icon: BarChart3, title: "Manage everything in one place", body: "Approve and feature the best reviews, follow up privately on lower ratings, and grow your guest list." },
];

const FAQ = [
  ["Do my guests need to create an account?", "No. Guests simply open your link and leave feedback. There is no sign-up, login, password or app — it takes less than 30 seconds."],
  ["Does ARGUS hide negative reviews from Google?", "We never block anyone. Happy guests (4–5★) are invited to also share on Google, while lower ratings come to you first so you can follow up and make it right. Guests can always review you anywhere they like."],
  ["Can I use it for a hotel or a café?", "Yes. ARGUS works for restaurants, cafés, hotels and resorts — questions and options adapt to your business type automatically."],
  ["Can I use reviews on my website and social media?", "Only when the guest ticks the consent box. Consented reviews can be featured and turned into ready-to-post images in one click."],
  ["Can it connect to my other tools?", "Yes. Every new review can be sent instantly to n8n — from there to Google Sheets, WhatsApp notifications, or your social publishing workflow."],
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-paper">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="ARGUS home"><ArgusLogo /></Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-500 hover:text-ink-900 md:inline">How it works</a>
            <a href="#pricing" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-500 hover:text-ink-900 md:inline">Pricing</a>
            <Link href="/admin/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-700 hover:text-ink-900">Sign in</Link>
            <a href={GET_STARTED} className="hidden rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 sm:inline">Get Started</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate">
          <div aria-hidden className="absolute -right-40 -top-24 -z-10 h-[520px] w-[520px] rounded-full bg-emerald-brand opacity-[0.10] blur-3xl" />
          <div aria-hidden className="absolute -left-40 top-40 -z-10 h-[420px] w-[420px] rounded-full bg-ember-500 opacity-[0.08] blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-forest-800 shadow-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-brand" /> For restaurants, cafés, hotels & resorts
              </span>
              <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
                Turn Guest Feedback <span className="text-forest-700">Into Growth.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
                Give every guest a simple way to share their experience — and manage every review from one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={GET_STARTED} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-forest-900 px-7 text-[15px] font-semibold text-white shadow-soft transition hover:bg-forest-800 active:scale-[0.98]">
                  Get Started <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/r/abc-restaurant" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-line bg-white px-7 text-[15px] font-semibold text-ink-900 transition hover:border-ink-400 active:scale-[0.98]">
                  See Demo
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
                {["No customer sign-up", "Live in 10 minutes", "Works on any phone"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-brand" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="relative animate-fade-in">
              <PhoneMock />
              <div className="absolute -left-2 bottom-2 hidden w-52 rounded-2xl border border-line bg-white p-3.5 shadow-lift sm:block lg:-left-10">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-ink-900">Rahim A.</span><Stars n={5} className="h-3 w-3" /></div>
                <p className="mt-1 text-[11px] leading-snug text-ink-500">“Excellent food and service…”</p>
                <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Featured</span>
              </div>
              <div className="absolute -right-2 top-10 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-lift sm:block lg:-right-6">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Average</p>
                <p className="text-2xl font-bold text-ink-900">4.8 <span className="text-ember-500">★</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-line bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-forest-700">How it works</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">One link. No customer login. One simple review.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="rounded-3xl border border-line bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-900 text-white"><Icon className="h-5 w-5" /></span>
                    <span className="font-display text-3xl font-semibold text-line">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For restaurants / hotels */}
        <section className="py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
            {[
              { key: "restaurant" as const, title: "For Restaurants", lead: "Capture feedback while the meal is still fresh — from the table QR, the bill, or a WhatsApp thank-you.", tone: "bg-forest-900 text-white", chip: "bg-white/10 text-white ring-white/15" },
              { key: "hotel" as const, title: "For Hotels", lead: "Hear about every stay — rooms, breakfast, housekeeping — and resolve issues before guests post publicly.", tone: "bg-white text-ink-900 border border-line", chip: "bg-paper text-ink-700 ring-line" },
            ].map((v) => (
              <div key={v.key} className={`rounded-[28px] p-7 sm:p-9 ${v.tone}`}>
                <h2 className="font-display text-3xl font-semibold">{v.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed opacity-80">{v.lead}</p>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] opacity-60">“{BUSINESS_TYPES[v.key].headline}”</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BUSINESS_TYPES[v.key].serviceOptions.map((s) => (
                    <span key={s} className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${v.chip}`}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Review link + dashboard + Google */}
        <section className="border-y border-line bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-line bg-paper p-6">
              <QrCode className="h-6 w-6 text-forest-700" />
              <h3 className="mt-4 text-lg font-semibold text-ink-900">Your review link</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">A branded page at your own link. Copy it, share it on WhatsApp or email, or print the QR code.</p>
              <p className="mt-4 truncate rounded-xl bg-white px-3 py-2 font-mono text-xs text-ink-700 ring-1 ring-line">review.argusofficial.com/r/your-business</p>
            </div>
            <div className="rounded-3xl border border-line bg-paper p-6">
              <BarChart3 className="h-6 w-6 text-forest-700" />
              <h3 className="mt-4 text-lg font-semibold text-ink-900">A simple dashboard</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">See every review, your average rating and who needs a follow-up. Approve, feature or reply in a tap.</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["124", "Reviews"], ["4.8", "Average"], ["6", "Follow-up"]].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white py-2 ring-1 ring-line"><p className="text-lg font-bold text-ink-900">{v}</p><p className="text-[10px] font-semibold uppercase text-ink-400">{l}</p></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-line bg-paper p-6">
              <ShieldCheck className="h-6 w-6 text-forest-700" />
              <h3 className="mt-4 text-lg font-semibold text-ink-900">More Google reviews, honestly</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">Guests who loved their visit are invited to share on Google. Lower ratings reach you privately first, so you can make it right.</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-ink-900 ring-1 ring-line">
                <Stars n={5} className="h-3.5 w-3.5" /> <span className="ml-auto">Review us on Google →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Simple pricing</h2>
            <p className="mt-2 text-center text-ink-500">Start with Basic. Add photos when you&apos;re ready.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                { name: "Basic", desc: "Everything you need to collect and manage reviews.", items: ["Branded review page & link", "QR code, WhatsApp & email sharing", "Review dashboard & follow-ups", "Customer list", "Google Review invitations"], featured: false },
                { name: "Premium", desc: "For businesses that want visual, shareable reviews.", items: ["Everything in Basic", "Guest photo uploads", "Social post creatives", "n8n automation & API", "Priority support"], featured: true },
              ].map((p) => (
                <div key={p.name} className={`rounded-[28px] p-7 ${p.featured ? "bg-forest-900 text-white shadow-lift" : "border border-line bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    {p.featured ? <span className="rounded-full bg-ember-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Popular</span> : null}
                  </div>
                  <p className={`mt-2 text-sm ${p.featured ? "text-white/70" : "text-ink-500"}`}>{p.desc}</p>
                  <ul className="mt-6 space-y-2.5">
                    {p.items.map((i) => (
                      <li key={i} className="flex items-center gap-2 text-[15px]"><Check className={`h-4 w-4 ${p.featured ? "text-emerald-brand" : "text-forest-700"}`} />{i}</li>
                    ))}
                  </ul>
                  <a href={GET_STARTED} className={`mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition ${p.featured ? "bg-white text-forest-900 hover:bg-mint-50" : "bg-forest-900 text-white hover:bg-forest-800"}`}>
                    Talk to us
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-line bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Questions</h2>
            <div className="mt-8 divide-y divide-line rounded-3xl border border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group px-5 py-4 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink-900">
                    {q}
                    <span className="text-xl text-ink-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20 sm:px-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-forest-900 px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-brand opacity-20 blur-3xl" />
            <h2 className="relative font-display text-3xl font-semibold sm:text-4xl">Collect feedback. Build relationships. Grow.</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/70">Your review link can be live today.</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={GET_STARTED} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-forest-900 hover:bg-mint-50">Get Started <ArrowRight className="h-4 w-4" /></a>
              <Link href="/r/abc-restaurant" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/25 px-7 font-semibold text-white hover:bg-white/10">See Demo</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-ink-400 sm:flex-row sm:px-6">
          <ArgusLogo />
          <p>© {new Date().getFullYear()} ARGUS · {CONTACT}</p>
        </div>
      </footer>
    </div>
  );
}
