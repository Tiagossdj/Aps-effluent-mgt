import { cn } from "@/lib/utils";
import type { ParamKey } from "@/lib/types";

export type ParameterCardItem = {
  key: ParamKey;
  label: string;
  limitText: string;
  maxLabel: string;
  current: {
    formattedValue: string;
    compliant: boolean;
    percentOfLimit: number;
  } | null;
};

type Props = {
  items: ParameterCardItem[];
};

export function ParameterCards({ items }: Props) {
  return (
    <section>
      <h2 className="text-base font-bold">Resumo por parâmetro</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Valor mais recente do período em relação ao limite legal
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="panel p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Limite {item.limitText}
                </p>
              </div>
              {item.current && (
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase",
                    item.current.compliant
                      ? "border-primary/40 bg-primary/12 text-primary"
                      : "border-warning/40 bg-warning/12 text-warning",
                  )}
                >
                  {item.current.compliant ? "Conforme" : "Alerta"}
                </span>
              )}
            </div>

            {item.current ? (
              <>
                <p
                  className={cn(
                    "num mt-4 text-2xl font-bold",
                    item.current.compliant ? "text-foreground" : "text-warning",
                  )}
                >
                  {item.current.formattedValue}
                </p>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.current.compliant ? "bg-primary" : "bg-warning",
                    )}
                    style={{ width: `${item.current.percentOfLimit}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{item.current.percentOfLimit}% do limite</span>
                  <span className="num">máx. {item.maxLabel}</span>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Sem dados no período</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
