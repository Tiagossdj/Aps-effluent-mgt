import type { LucideIcon } from "lucide-react";
import { FlaskConical, ShieldCheck, TriangleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "accent" | "warning";
};

type Props = {
  total: number;
  compliancePct: number;
  alerts: number;
  lastCollection: string;
};

export function KpiCards({ total, compliancePct, alerts, lastCollection }: Props) {
  const kpis: Kpi[] = [
    {
      label: "Análises no período",
      value: String(total),
      hint: "Amostras laboratoriais registradas",
      icon: FlaskConical,
    },
    {
      label: "Conformidade geral",
      value: `${compliancePct}%`,
      hint: "Parâmetros dentro do limite legal",
      icon: ShieldCheck,
    },
    {
      label: "Parâmetros em alerta",
      value: String(alerts),
      hint: "Acima do limite CONAMA 430",
      icon: TriangleAlert,
      tone: "warning",
    },
    {
      label: "Última coleta",
      value: lastCollection,
      hint: "Ponto de lançamento P-02",
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {k.label}
            </p>
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                k.tone === "warning" ? "bg-warning/12 text-warning" : "bg-primary/12 text-primary",
              )}
            >
              <k.icon className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              "num mt-4 text-3xl font-bold leading-none",
              k.tone === "warning" ? "text-warning" : "text-foreground",
            )}
          >
            {k.value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{k.hint}</p>
        </div>
      ))}
    </div>
  );
}
