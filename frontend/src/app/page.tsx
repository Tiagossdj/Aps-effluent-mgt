import { Suspense } from "react";
import { redirect } from "next/navigation";
import { KpiCardsSection } from "@/components/dashboard/kpi-cards-section";
import { KpiCardsSkeleton } from "@/components/dashboard/kpi-cards-skeleton";
import { ParameterCardsSection } from "@/components/dashboard/parameter-cards-section";
import { ParameterCardsSkeleton } from "@/components/dashboard/parameter-cards-skeleton";
import { Topbar } from "@/components/dashboard/topbar";
import { DEFAULT_DAYS, parseDaysParam } from "@/lib/days";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/">) {
  const { days: rawDays } = await searchParams;
  const days = parseDaysParam(rawDays);

  // `days` é a fonte da verdade do período selecionado e precisa estar
  // sempre explícito na URL (link público, sobrevive a reload) — nunca
  // assumido silenciosamente no cliente.
  if (days === null) {
    redirect(`/?days=${DEFAULT_DAYS}`);
  }

  return (
    <div className="min-h-screen bg-background lg:pl-60">
      <Topbar days={days} />

      <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiCardsSection days={days} />
        </Suspense>

        <Suspense fallback={<ParameterCardsSkeleton />}>
          <ParameterCardsSection days={days} />
        </Suspense>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Dados de demonstração · Limites de lançamento conforme Resolução CONAMA nº 430/2011
        </footer>
      </main>
    </div>
  );
}
