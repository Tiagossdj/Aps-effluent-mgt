"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FlaskConical,
  History,
  FileBarChart,
  Settings,
  Droplets,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Análises", icon: FlaskConical },
  { label: "Histórico", icon: History },
  { label: "Relatórios", icon: FileBarChart },
  { label: "Configurações", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const [active, setActive] = useState("Dashboard");
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const isActive = active === item.label;
        return (
          <button
            key={item.label}
            onClick={() => {
              setActive(item.label);
              onNavigate?.();
            }}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-primary")} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
}

function subscribeNever() {
  return () => {};
}

// `false` no servidor/primeira renderização de hidratação, `true` depois —
// evita mismatch de hidratação sem precisar de setState em useEffect.
function useMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Droplets className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">HidroCompliance</p>
        <p className="truncate text-[11px] text-muted-foreground">CONAMA 430/2011</p>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const [open, setOpen] = useState(false);
  // O <header> pai (Topbar) usa `backdrop-blur`, que cria um containing
  // block para descendentes `fixed` — sem portal para `document.body`, a
  // aside e o drawer abaixo ficariam presos ao retângulo do header (fixed
  // "left-0" vira relativo ao header, não à viewport) em vez de ocupar a
  // borda esquerda da tela inteira.
  const mounted = useMounted();

  // Fecha o drawer ao chegar no breakpoint desktop, onde a sidebar fixa aparece.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && setOpen(false);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Trava o scroll do corpo enquanto o drawer estiver aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const desktopAside = (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
      <Brand />
      <NavList />
      <div className="mt-auto p-4">
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Dados de demonstração. Limites conforme Resolução CONAMA 430/2011.
          </p>
        </div>
      </div>
    </aside>
  );

  const mobileDrawer = open && (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside
        className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-border shadow-lift"
        style={{ backgroundColor: "var(--sidebar)" }}
      >
        <Brand />
        <button
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <NavList onNavigate={() => setOpen(false)} />
        <div className="mt-auto p-4">
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Dados de demonstração. Limites conforme Resolução CONAMA 430/2011.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      {mounted && createPortal(desktopAside, document.body)}

      {/* Trigger mobile/tablet — alterna abrir/fechar */}
      <button
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors lg:hidden",
          open
            ? "border-primary/50 bg-primary/15 text-primary"
            : "border-border bg-surface text-foreground hover:border-primary/50",
        )}
      >
        {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
      </button>

      {mounted && createPortal(mobileDrawer, document.body)}
    </>
  );
}
