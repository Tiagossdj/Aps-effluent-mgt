"use client";

import { usePathname, useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { VALID_DAYS } from "@/lib/days";
import type { Days } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  days: Days;
};

export function Topbar({ days }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleDaysChange(value: Days) {
    router.replace(`${pathname}?days=${value}`, { scroll: false });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarNav />
          <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/70 text-primary sm:grid">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold sm:text-lg">ETE Vale do Rio Claro</h1>
            <p className="truncate text-xs text-muted-foreground">
              Estação de tratamento de efluentes · Unidade Industrial II
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center rounded-lg border border-border bg-surface p-1 sm:flex">
            {VALID_DAYS.map((value) => (
              <button
                key={value}
                onClick={() => handleDaysChange(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  days === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value} dias
              </button>
            ))}
          </div>

          <select
            aria-label="Selecionar período"
            value={days}
            onChange={(e) => handleDaysChange(Number(e.target.value) as Days)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-semibold text-foreground sm:hidden"
          >
            {VALID_DAYS.map((value) => (
              <option key={value} value={value}>
                Últimos {value} dias
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
