import type { ActivityDay } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";

/** Server-rendered SVG bar chart — zero client JS. */
export function ActivityChart({ data }: { data: ActivityDay[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const W = 600;
  const H = 160;
  const gap = 4;
  const bw = (W - gap * (data.length - 1)) / data.length;
  const total = data.reduce((s, d) => s + d.total, 0);
  const ticks = max % 2 === 0 ? [0, max / 2, max] : [0, max];

  return (
    <figure>
      <div className="flex items-baseline justify-between">
        <figcaption className="text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{total}</span> reviews in the last {data.length} days
        </figcaption>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-forest-700" />4–5★</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ember-500/70" />1–3★</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex h-40 flex-col justify-between pb-0 text-right text-[10px] text-ink-400">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="Reviews per day">
          {[0.5, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="#f1efe9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {data.map((d, i) => {
            const x = i * (bw + gap);
            const hTotal = (d.total / max) * (H - 4);
            const hPos = (d.positive / max) * (H - 4);
            return (
              <g key={d.day}>
                <title>{`${formatDate(d.day, { day: "numeric", month: "short" })}: ${d.total} review${d.total === 1 ? "" : "s"}`}</title>
                <rect x={x} y={0} width={bw} height={H} fill="transparent" />
                {d.total > 0 ? (
                  <>
                    <rect x={x} y={H - hTotal} width={bw} height={hTotal - hPos} rx={Math.min(3, bw / 2)} fill="#f97316" fillOpacity="0.7" />
                    <rect x={x} y={H - hPos} width={bw} height={hPos} rx={Math.min(3, bw / 2)} fill="#166047" />
                  </>
                ) : (
                  <rect x={x} y={H - 2} width={bw} height={2} rx={1} fill="#e8e6df" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between pl-6 text-[11px] text-ink-400">
        <span>{formatDate(data[0].day, { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </figure>
  );
}
