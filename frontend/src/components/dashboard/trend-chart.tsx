"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatLimitText, formatMaxLabel, formatParameterValue } from "@/lib/format";
import type { Days, ParamKey, Parameter } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SeriesChartPoint = {
  label: string;
  value: number;
  compliant: boolean;
};

type Props = {
  parameters: Parameter[];
  seriesByParam: Record<ParamKey, SeriesChartPoint[]>;
  initialParamKey: ParamKey;
  days: Days;
};

export function TrendChart({ parameters, seriesByParam, initialParamKey, days }: Props) {
  const [selectedKey, setSelectedKey] = useState<ParamKey>(initialParamKey);

  const selected = parameters.find((parameter) => parameter.key === selectedKey) ?? parameters[0];
  const data = seriesByParam[selected.key];
  const violations = data.filter((point) => !point.compliant).length;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">Evolução — {selected.label}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Limite {formatLimitText(selected)} · {violations} ponto(s) fora do limite
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground">
          {days} dias
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {parameters.map((parameter) => (
          <button
            key={parameter.key}
            onClick={() => setSelectedKey(parameter.key)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              parameter.key === selected.key
                ? "border-primary/50 bg-primary/12 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {parameter.label}
          </button>
        ))}
      </div>

      <div className="mt-6 h-[280px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-border)" }}
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-foreground)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(value) => [formatParameterValue(selected, Number(value)), selected.label]}
            />
            <ReferenceLine
              y={selected.max}
              stroke="var(--color-warning)"
              strokeDasharray="6 6"
              label={{
                value: `Limite ${formatMaxLabel(selected)}`,
                position: "insideTopRight",
                fill: "var(--color-warning)",
                fontSize: 11,
              }}
            />
            {selected.min !== null && (
              <ReferenceLine y={selected.min} stroke="var(--color-warning)" strokeDasharray="6 6" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={2.2}
              dot={(props) => {
                const { cx, cy, payload, index } = props as {
                  cx: number;
                  cy: number;
                  index: number;
                  payload: SeriesChartPoint;
                };
                return (
                  <Dot
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={payload.compliant ? 3 : 5}
                    fill={payload.compliant ? "var(--color-primary)" : "var(--color-destructive)"}
                    stroke="var(--color-surface)"
                    strokeWidth={payload.compliant ? 0 : 2}
                  />
                );
              }}
              activeDot={{ r: 6, fill: "var(--color-primary)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
