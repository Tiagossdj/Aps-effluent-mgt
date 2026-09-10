import { cn } from "@/lib/utils";

export type AnalysisRow = {
  id: string;
  dateText: string;
  label: string;
  formattedValue: string;
  limitText: string;
  compliant: boolean;
};

type Props = {
  rows: AnalysisRow[];
};

export function AnalysesTable({ rows }: Props) {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="text-base font-bold">Análises recentes</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Resultados laboratoriais confrontados com os limites de lançamento
      </p>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-lg border border-border p-4 text-xs text-muted-foreground">
          Nenhuma análise registrada no período selecionado.
        </p>
      ) : (
        <div className="mt-5 -mx-1 max-h-[750px] overflow-auto px-1 pb-2">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 bg-surface border-b border-border text-left">
                {["Data", "Parâmetro", "Valor medido", "Limite", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="num whitespace-nowrap px-3 py-3 text-muted-foreground">
                    {row.dateText}
                  </td>
                  <td className="px-3 py-3 font-medium">{row.label}</td>
                  <td
                    className={cn(
                      "num px-3 py-3 font-semibold",
                      row.compliant ? "text-foreground" : "text-warning",
                    )}
                  >
                    {row.formattedValue}
                  </td>
                  <td className="num px-3 py-3 text-muted-foreground">{row.limitText}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold",
                        row.compliant
                          ? "border-primary/40 bg-primary/12 text-primary"
                          : "border-warning/40 bg-warning/12 text-warning",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          row.compliant ? "bg-primary" : "bg-warning",
                        )}
                      />
                      {row.compliant ? "Conforme" : "Não conforme"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
