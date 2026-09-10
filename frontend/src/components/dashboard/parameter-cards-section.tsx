import { ApiError, getAnalyses, getParameters } from "@/lib/api-client";
import { formatLimitText, formatMaxLabel, formatParameterValue } from "@/lib/format";
import type { AnalysisDto, Days, ParamKey } from "@/lib/types";
import { ParameterCards, type ParameterCardItem } from "./parameter-cards";

type Props = {
  days: Days;
};

export async function ParameterCardsSection({ days }: Props) {
  let items: ParameterCardItem[];

  // O `await` fica isolado do JSX de retorno: a regra de lint
  // react-hooks/error-boundaries não permite construir JSX dentro de
  // try/catch (erro de renderização não seria pego por ele mesmo assim).
  try {
    const [parameters, analyses] = await Promise.all([getParameters(), getAnalyses(days)]);

    // `/analyses` vem ordenado por `date desc` — não existe endpoint dedicado
    // a "valor atual por parâmetro", então a primeira ocorrência de cada
    // `paramKey` na lista já é a análise mais recente do período.
    const latestByParam = new Map<ParamKey, AnalysisDto>();
    for (const analysis of analyses.data) {
      if (!latestByParam.has(analysis.paramKey)) {
        latestByParam.set(analysis.paramKey, analysis);
      }
    }

    items = parameters.map((parameter) => {
      const latest = latestByParam.get(parameter.key);

      return {
        key: parameter.key,
        label: parameter.label,
        limitText: formatLimitText(parameter),
        maxLabel: formatMaxLabel(parameter),
        current: latest
          ? {
              formattedValue: formatParameterValue(parameter, latest.value),
              compliant: latest.compliant,
              percentOfLimit: Math.min(100, Math.round((latest.value / parameter.max) * 100)),
            }
          : null,
      };
    });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Erro inesperado ao carregar os parâmetros.";

    return (
      <div className="panel p-5 text-sm text-destructive" role="alert">
        {message}
      </div>
    );
  }

  return <ParameterCards items={items} />;
}
