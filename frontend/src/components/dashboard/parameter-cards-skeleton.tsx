export function ParameterCardsSkeleton() {
  return (
    <section aria-hidden="true">
      <h2 className="text-base font-bold">Resumo por parâmetro</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Valor mais recente do período em relação ao limite legal
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="panel h-[168px] animate-pulse p-5" />
        ))}
      </div>
    </section>
  );
}
