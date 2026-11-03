import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Home, Layers, Search, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { setLang, useI18n } from "@/lib/i18n";
import { alerts, subsStore, useSubscriptions } from "@/lib/subs";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-hero text-primary-foreground">
        <Bell className="size-4" />
      </span>
      <span className="text-xl font-bold tracking-tight">Subvia</span>
    </div>
  );
}

export function LangSwitch() {
  const { lang } = useI18n();
  return (
    <div className="flex rounded-lg bg-muted p-1 text-sm">
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-md px-3 py-1 transition-colors",
            lang === l ? "bg-card font-medium text-primary shadow-card" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "ar" ? "العربية" : "English"}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ title, subtitle, children, onSearch }: { title: string; subtitle?: string; children: ReactNode; onSearch?: (q: string) => void }) {
  const { t } = useI18n();
  const subs = useSubscriptions();
  const count = alerts(subs).length;
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const nav = [
    { to: "/" as const, label: t.dashboard, icon: Home },
    { to: "/subscriptions" as const, label: t.subscriptions, icon: Layers },
    { to: "/notifications" as const, label: t.notifications, icon: Bell, badge: count },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-sidebar-border bg-sidebar p-4 md:flex">
        <Logo />
        <p className="mt-8 px-3 text-xs text-muted-foreground">{t.menu}</p>
        <nav className="mt-2 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-medium text-sidebar-accent-foreground" }}
            >
              <n.icon className="size-4" />
              <span className="flex-1">{n.label}</span>
              {!!n.badge && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{n.badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <p className="px-2 text-xs text-muted-foreground">{t.localNote}</p>
          <button onClick={() => subsStore.reset()} className="flex items-center gap-2 px-2 text-xs text-primary hover:underline">
            <RotateCcw className="size-3" /> {t.resetDemo}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <form
            className="relative hidden w-72 lg:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (onSearch) onSearch(q);
              else navigate({ to: "/subscriptions", search: { q } });
            }}
          >
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder={t.search}
              className="h-9 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm outline-none focus:border-ring"
            />
          </form>
          <LangSwitch />
          <Link to="/notifications" className="relative inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-muted" aria-label={t.notifications}>
            <Bell className="size-4" />
            {count > 0 && <span className="absolute end-2 top-2 size-2 rounded-full bg-destructive" />}
          </Link>
        </header>

        <nav className="flex gap-1 border-b border-border bg-card px-4 py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs" activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}>
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
