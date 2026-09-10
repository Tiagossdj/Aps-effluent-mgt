import { ApiError, getAlerts, getParameters } from "@/lib/api-client";
import { formatAlertDateTime, formatLimitText, formatParameterValue } from "@/lib/format";
import type { Days, ParamKey, Parameter } from "@/lib/types";
import { AlertsFeed, type AlertFeedItem } from "./alerts-feed";

type Props = {
  days: Days;
};

export async function AlertsFeedSection({ days }: Props) {
  let items: AlertFeedItem[];

  // O `await` fica isolado do JSX de retorno: a regra de lint
  // react-hooks/error-boundaries não permite construir JSX dentro de
  // try/catch (erro de renderização não seria pego por ele mesmo assim).
  try {
    const [parameters, alerts] = await Promise.all([getParameters(), getAlerts(days)]);

    const parameterByKey = new Map<ParamKey, Parameter>(
      parameters.map((parameter) => [parameter.key, parameter]),
    );

    items = alerts.data.flatMap((alert) => {
      const parameter = parameterByKey.get(alert.paramKey);
      if (!parameter) {
        return [];
      }

      // Todo item de `/alerts` é não conforme por definição — o limite
      // excedido é o `min` (só pH tem) quando o valor ficou abaixo dele,
      // senão é sempre o `max`.
      const exceededLimit =
        parameter.min !== null && alert.value < parameter.min ? parameter.min : parameter.max;
      const excess = Math.abs(alert.value - exceededLimit);

      return [
        {
          id: alert.id,
          label: parameter.label,
          formattedValue: formatParameterValue(parameter, alert.value),
          limitText: formatLimitText(parameter),
          excessText: formatParameterValue(parameter, excess),
          dateText: formatAlertDateTime(alert.date),
        },
      ];
    });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Erro inesperado ao carregar os alertas.";

    return (
      <div className="panel p-5 text-sm text-destructive" role="alert">
        {message}
      </div>
    );
  }

  return <AlertsFeed items={items} />;
}
