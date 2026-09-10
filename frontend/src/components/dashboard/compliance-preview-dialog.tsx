"use client";

import { useEffect, useState } from "react";
import {
  Check,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  TriangleAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, getParameters, postCompliancePreview } from "@/lib/api-client";
import { formatLimitText } from "@/lib/format";
import type { ParamKey, Parameter, PreviewComplianceResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RowResult =
  | { status: "ok"; value: string; data: PreviewComplianceResponse }
  | { status: "error"; value: string; message: string };

// Só formatação de entrada — a conformidade em si vem sempre de
// `POST /compliance/preview` (ver frontend/CLAUDE.md, "Modo de demonstração
// pública"). Nada aqui decide se um valor está ou não em conformidade.
function parseValue(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw.replace(",", "."));
  return Number.isNaN(value) ? null : value;
}

// Gera um valor de exemplo dentro (ou levemente fora) do limite real do
// parâmetro, só para poupar o usuário de digitar — não é dado fictício
// aplicado ao dashboard, é só um ponto de partida para o teste.
function randomValueFor(parameter: Parameter): string {
  if (parameter.min !== null) {
    const value = parameter.min + Math.random() * (parameter.max - parameter.min);
    return value.toFixed(2);
  }
  const value = parameter.max * (0.6 + Math.random() * 0.5);
  return value.toFixed(1);
}

export function CompliancePreviewDialog({ open, onOpenChange }: Props) {
  const [parameters, setParameters] = useState<Parameter[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Partial<Record<ParamKey, string>>>({});
  const [results, setResults] = useState<Partial<Record<ParamKey, RowResult>>>({});
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (!open || parameters !== null || loadError !== null) return;

    let cancelled = false;
    getParameters()
      .then((data) => {
        if (!cancelled) setParameters(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError ? error.message : "Erro inesperado ao carregar os parâmetros.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [open, parameters, loadError]);

  function setValue(key: ParamKey, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw }));
  }

  function handleShuffle() {
    if (!parameters) return;
    setValues(Object.fromEntries(parameters.map((p) => [p.key, randomValueFor(p)])));
  }

  function handleClear() {
    setValues({});
  }

  async function handleEvaluateAll() {
    if (!parameters) return;

    const targets = parameters
      .map((parameter) => ({ parameter, value: parseValue(values[parameter.key] ?? "") }))
      .filter((entry): entry is { parameter: Parameter; value: number } => entry.value !== null);

    if (targets.length === 0) return;

    setEvaluating(true);
    const settled = await Promise.allSettled(
      targets.map(({ parameter, value }) =>
        postCompliancePreview({ paramKey: parameter.key, value }),
      ),
    );

    setResults((prev) => {
      const next = { ...prev };
      settled.forEach((outcome, index) => {
        const { parameter } = targets[index]!;
        const rawValue = values[parameter.key] ?? "";
        next[parameter.key] =
          outcome.status === "fulfilled"
            ? { status: "ok", value: rawValue, data: outcome.value }
            : {
                status: "error",
                value: rawValue,
                message:
                  outcome.reason instanceof ApiError
                    ? outcome.reason.message
                    : "Erro inesperado ao avaliar este parâmetro.",
              };
      });
      return next;
    });
    setEvaluating(false);
  }

  const rows = (parameters ?? []).map((parameter) => {
    const raw = values[parameter.key] ?? "";
    const result = results[parameter.key];
    const stale = result !== undefined && result.value !== raw;

    return { parameter, raw, result: stale ? undefined : result };
  });

  const filledCount = rows.filter((row) => parseValue(row.raw) !== null).length;
  const evaluatedRows = rows.filter((row) => row.result?.status === "ok");
  const erroredRows = rows.filter((row) => row.result?.status === "error");
  const nonCompliantRows = evaluatedRows.filter(
    (row) => row.result?.status === "ok" && !row.result.data.compliant,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4.5 w-4.5 text-primary" />
            Testar valores
          </DialogTitle>
          <DialogDescription>
            Informe valores hipotéticos e avalie contra os limites da Resolução CONAMA
            430/2011. O resultado aparece só aqui — os dados do painel não são alterados.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : parameters === null ? (
          <p className="text-sm text-muted-foreground">Carregando parâmetros…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleShuffle}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              >
                <Shuffle className="h-3.5 w-3.5" /> Gerar valores de exemplo
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Limpar
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {rows.map(({ parameter, raw, result }) => (
                <div
                  key={parameter.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{parameter.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      Limite: {formatLimitText(parameter)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      inputMode="decimal"
                      value={raw}
                      onChange={(e) => setValue(parameter.key, e.target.value)}
                      placeholder={parameter.unit || "—"}
                      className="num w-24 rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                    />
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        result === undefined
                          ? "bg-muted-foreground/40"
                          : result.status === "error"
                            ? "bg-destructive"
                            : result.data.compliant
                              ? "bg-primary"
                              : "bg-warning",
                      )}
                      title={
                        result === undefined
                          ? undefined
                          : result.status === "error"
                            ? result.message
                            : result.data.compliant
                              ? "Conforme"
                              : "Fora do limite"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-3 text-sm font-semibold",
                erroredRows.length > 0
                  ? "border-destructive/40 bg-destructive/12 text-destructive"
                  : evaluatedRows.length === 0
                    ? "border-border bg-surface-2 text-muted-foreground"
                    : nonCompliantRows.length === 0
                      ? "border-primary/40 bg-primary/12 text-primary"
                      : "border-warning/40 bg-warning/12 text-warning",
              )}
            >
              {erroredRows.length > 0 ? (
                <TriangleAlert className="h-4 w-4 shrink-0" />
              ) : evaluatedRows.length === 0 ? null : nonCompliantRows.length === 0 ? (
                <ShieldCheck className="h-4 w-4 shrink-0" />
              ) : (
                <TriangleAlert className="h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0">
                {erroredRows.length > 0
                  ? `Falha ao avaliar ${erroredRows.length} parâmetro(s). Tente novamente.`
                  : evaluatedRows.length === 0
                    ? "Preencha ao menos um parâmetro e clique em Avaliar."
                    : nonCompliantRows.length === 0
                      ? `${evaluatedRows.length} parâmetro(s) avaliado(s) — todos em conformidade.`
                      : `${nonCompliantRows.length} de ${evaluatedRows.length} fora do limite: ${nonCompliantRows
                          .map((row) => row.parameter.label)
                          .join(", ")}.`}
              </span>
            </div>

            <button
              onClick={handleEvaluateAll}
              disabled={filledCount === 0 || evaluating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {evaluating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Avaliar tudo
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
