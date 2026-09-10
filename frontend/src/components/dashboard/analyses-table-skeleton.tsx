export function AnalysesTableSkeleton() {
  return (
    <section aria-hidden="true" className="panel p-5 sm:p-6">
      <div className="h-5 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="mt-2 h-3 w-64 animate-pulse rounded-md bg-secondary" />

      <div className="mt-5 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-secondary" />
        ))}
      </div>
    </section>
  );
}
