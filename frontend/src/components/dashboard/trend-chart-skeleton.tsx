export function TrendChartSkeleton() {
  return (
    <section aria-hidden="true" className="panel p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="h-5 w-48 animate-pulse rounded-md bg-secondary" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded-md bg-secondary" />
        </div>
        <div className="h-6 w-16 shrink-0 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-7 w-20 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>

      <div className="mt-6 h-[280px] w-full animate-pulse rounded-lg bg-secondary sm:h-[320px]" />
    </section>
  );
}
