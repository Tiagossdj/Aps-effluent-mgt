import { ApiError, getParameters, getSeries } from "@/lib/api-client";
import { formatSeriesDate } from "@/lib/format";
import type { Days, ParamKey, Parameter } from "@/lib/types";
import { TrendChart, type SeriesChartPoint } from "./trend-chart";

type Props = {
  days: Days;
};

export async function TrendChartSection({ days }: Props) {
  let parameters: Parameter[];
  let seriesByParam: Record<ParamKey, SeriesChartPoint[]>;

  // O `await` fica isolado do JSX de retorno: a regra de lint
  // react-hooks/error-boundaries não permite construir JSX dentro de
  // try/catch (erro de renderização não seria pego por ele mesmo assim).
  try {
    parameters = await getParameters();

    // Busca as séries dos 6 parâmetros de uma vez — a troca de parâmetro
    // selecionado no gráfico é só troca de estado no client, sem novo
    // request (ver decisão registrada na Fase 4).
    const series = await Promise.all(
      parameters.map((parameter) => getSeries(parameter.key, days)),
    );

    seriesByParam = Object.fromEntries(
      series.map((response) => [
        response.param,
        response.points.map((point) => ({
          label: formatSeriesDate(point.date),
          value: point.value,
          compliant: point.compliant,
        })),
      ]),
    ) as Record<ParamKey, SeriesChartPoint[]>;
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Erro inesperado ao carregar a evolução.";

    return (
      <div className="panel p-5 text-sm text-destructive" role="alert">
        {message}
      </div>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="panel p-5 text-sm text-muted-foreground" role="status">
        Nenhum parâmetro cadastrado.
      </div>
    );
  }

  return (
    <TrendChart
      parameters={parameters}
      seriesByParam={seriesByParam}
      initialParamKey={parameters[0].key}
      days={days}
    />
  );
}
