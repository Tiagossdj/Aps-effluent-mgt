export function AlertsFeedSkeleton() {
  return (
    <section aria-hidden="true" className="panel flex h-full flex-col p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="h-5 w-36 animate-pulse rounded-md bg-secondary" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded-md bg-secondary" />
        </div>
        <div className="h-6 w-8 shrink-0 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[76px] animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    </section>
  );
}
