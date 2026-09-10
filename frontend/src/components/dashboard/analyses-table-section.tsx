import { ApiError, getAnalyses, getParameters } from "@/lib/api-client";
import { formatAlertDateTime, formatLimitText, formatParameterValue } from "@/lib/format";
import type { Days, ParamKey, Parameter } from "@/lib/types";
import { AnalysesTable, type AnalysisRow } from "./analyses-table";

type Props = {
  days: Days;
};

export async function AnalysesTableSection({ days }: Props) {
  let rows: AnalysisRow[];

  // O `await` fica isolado do JSX de retorno: a regra de lint
  // react-hooks/error-boundaries não permite construir JSX dentro de
  // try/catch (erro de renderização não seria pego por ele mesmo assim).
  try {
    const [parameters, analyses] = await Promise.all([getParameters(), getAnalyses(days)]);

    const parameterByKey = new Map<ParamKey, Parameter>(
      parameters.map((parameter) => [parameter.key, parameter]),
    );

    rows = analyses.data.flatMap((analysis) => {
      const parameter = parameterByKey.get(analysis.paramKey);
      if (!parameter) {
        return [];
      }

      return [
        {
          id: analysis.id,
          dateText: formatAlertDateTime(analysis.date),
          label: parameter.label,
          formattedValue: formatParameterValue(parameter, analysis.value),
          limitText: formatLimitText(parameter),
          compliant: analysis.compliant,
        },
      ];
    });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Erro inesperado ao carregar as análises.";

    return (
      <div className="panel p-5 text-sm text-destructive" role="alert">
        {message}
      </div>
    );
  }

  return <AnalysesTable rows={rows} />;
}
