/**
 * Subtle loading skeleton mimicking the result bus card layout so the
 * grid doesn't reflow while data is fetching or language is switching.
 */
export function BusCardSkeleton() {
  return (
    <div className="bg-card-gradient border border-border/60 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex">
        <div className="w-24 sm:w-32 md:w-40 bg-secondary/60 shrink-0 animate-pulse" />
        <div className="p-5 sm:p-6 flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start gap-2">
            <div className="h-5 sm:h-6 w-3/4 rounded bg-secondary/70 animate-pulse" />
            <div className="w-7 h-7 rounded-full bg-secondary/70 animate-pulse shrink-0" />
          </div>
          <div className="h-3 w-1/3 rounded bg-secondary/60 animate-pulse" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-2/3 rounded bg-secondary/60 animate-pulse" />
            <div className="h-3.5 w-1/2 rounded bg-secondary/60 animate-pulse" />
          </div>
          <div className="h-3 w-1/4 rounded bg-secondary/60 animate-pulse" />
          <div className="h-3.5 w-2/5 rounded bg-secondary/60 animate-pulse" />
        </div>
      </div>
      <div className="border-t border-border/40 bg-secondary/30 px-4 sm:px-5 py-3 sm:py-4 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-3/4 rounded bg-secondary/70 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-secondary/70 animate-pulse" />
        </div>
        <div className="space-y-1.5 items-end flex flex-col">
          <div className="h-2.5 w-3/4 rounded bg-secondary/70 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-secondary/70 animate-pulse" />
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3 border-t border-border/40 flex gap-2">
        <div className="h-8 flex-1 rounded-md bg-secondary/60 animate-pulse" />
        <div className="h-8 flex-1 rounded-md bg-secondary/70 animate-pulse" />
      </div>
    </div>
  );
}

export function BusCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <BusCardSkeleton key={i} />
      ))}
    </div>
  );
}
