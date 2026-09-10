import { ApiError, getKpis } from "@/lib/api-client";
import { formatLastCollection } from "@/lib/format";
import type { Days, KpisResponse } from "@/lib/types";
import { KpiCards } from "./kpi-cards";

type Props = {
  days: Days;
};

export async function KpiCardsSection({ days }: Props) {
  let kpis: KpisResponse;

  // O `await` fica isolado do JSX de retorno: a regra de lint
  // react-hooks/error-boundaries não permite construir JSX dentro de
  // try/catch (erro de renderização não seria pego por ele mesmo assim).
  try {
    kpis = await getKpis(days);
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Erro inesperado ao carregar os indicadores.";

    return (
      <div className="panel p-5 text-sm text-destructive" role="alert">
        {message}
      </div>
    );
  }

  return (
    <KpiCards
      total={kpis.totalAnalyses}
      compliancePct={kpis.complianceRate}
      alerts={kpis.parametersInAlert}
      lastCollection={formatLastCollection(kpis.lastCollectionAt)}
    />
  );
}
