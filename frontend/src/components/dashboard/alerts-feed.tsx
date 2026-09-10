import { TriangleAlert } from "lucide-react";

export type AlertFeedItem = {
  id: string;
  label: string;
  formattedValue: string;
  limitText: string;
  excessText: string;
  dateText: string;
};

type Props = {
  items: AlertFeedItem[];
};

export function AlertsFeed({ items }: Props) {
  return (
    <section className="panel flex h-full flex-col p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">Alertas recentes</h2>
          <p className="mt-1 text-xs text-muted-foreground">Não conformidades registradas</p>
        </div>
        <span className="shrink-0 rounded-md bg-warning/12 px-2 py-1 text-[11px] font-bold text-warning">
          {items.length}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[420px]">
        {items.length === 0 && (
          <li className="rounded-lg border border-border p-4 text-xs text-muted-foreground">
            Nenhuma não conformidade no período selecionado.
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-surface-2 p-3.5 transition-colors hover:border-warning/50"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-warning/12 text-warning">
                <TriangleAlert className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  <p className="num shrink-0 text-sm font-bold text-warning">
                    {item.formattedValue}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Limite {item.limitText} · excedido em{" "}
                  <span className="num text-foreground">{item.excessText}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.dateText}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
