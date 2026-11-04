import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Clock, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/subvia/AppShell";
import { CategoryBadge, ServiceLogo, StatusBadge } from "@/components/subvia/bits";
import { DeleteConfirm, SubscriptionDialog } from "@/components/subvia/SubscriptionDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, sortSubs, daysUntil, displayStatus, subsStore, totals, useSubscriptions, type Category, type Subscription } from "@/lib/subs";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "trial" | "canceled";

export const Route = createFileRoute("/subscriptions")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Subvia — اشتراكاتي | My subscriptions" },
      { name: "description", content: "Search, filter, edit and delete all your digital subscriptions in a table or card view." },
      { property: "og:title", content: "Subvia — My subscriptions" },
      { property: "og:description", content: "Manage every subscription, price and renewal date in one list." },
    ],
  }),
  component: Subscriptions,
});

function Subscriptions() {
  const { t, money, num, cat, cycle, date, plan } = useI18n();
  const subs = useSubscriptions();
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [category, setCategory] = useState<Category | "all">("all");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState("renewal");
  const [view, setView] = useState<"table" | "cards">("table");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [toDelete, setToDelete] = useState<Subscription | null>(null);
  const tot = totals(subs);

  const matchTab = (s: Subscription, tb: Tab) => {
    const st = displayStatus(s);
    if (tb === "active") return st !== "canceled" && st !== "expired" && !s.trial;
    if (tb === "trial") return !!s.trial && st !== "canceled";
    if (tb === "canceled") return st === "canceled" || st === "expired";
    return true;
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = subs.filter(
      (s) => (category === "all" || s.category === category) && matchTab(s, tab) && (!needle || s.name.toLowerCase().includes(needle) || s.plan.toLowerCase().includes(needle)),
    );
    return sortSubs(list, sort);
  }, [subs, q, category, tab, sort]);

  const openEdit = (s: Subscription | null) => { setEditing(s); setOpen(true); };
  const relative = (s: Subscription) => {
    const d = daysUntil(s.nextRenewal);
    return d < 0 ? t.ago(-d) : t.in(d);
  };

  const Actions = ({ s, label }: { s: Subscription; label?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {label ? (
          <button className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">{t.manage} <MoreHorizontal className="size-4" /></button>
        ) : (
          <button className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={t.manage}><MoreHorizontal className="size-4" /></button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="size-4" /> {t.edit}</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(s)}><Trash2 className="size-4" /> {t.delete}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const tabs: Tab[] = ["all", "active", "trial", "canceled"];
  const tabLabel: Record<Tab, string> = { all: t.all, active: t.status === "Status" ? "Active" : "النشطة", trial: t.status === "Status" ? "Trials" : "التجريبية", canceled: t.status === "Status" ? "Ended" : "الملغاة والمنتهية" };

  return (
    <AppShell title={t.subscriptions} subtitle={`${t.subsCount(num(subs.length))} · ${money(tot.monthly)} ${t.perMonth}`} onSearch={setQ}>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="h-10 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm outline-none focus:border-ring" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-48 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="renewal">{t.sortRenewal}</SelectItem>
              <SelectItem value="price">{t.sortPrice}</SelectItem>
              <SelectItem value="name">{t.sortName}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg bg-muted p-1">
            {(["table", "cards"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm", view === v ? "bg-card font-medium shadow-card" : "text-muted-foreground")}>
                {v === "table" ? <List className="size-4" /> : <LayoutGrid className="size-4" />} {v === "table" ? t.table : t.cards}
              </button>
            ))}
          </div>
          <Button className="h-10" onClick={() => openEdit(null)}><Plus className="size-4" /> {t.addSub}</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", ...CATEGORIES] as const).map((c) => {
            const n = c === "all" ? subs.length : subs.filter((s) => s.category === c).length;
            if (!n) return null;
            const on = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm", on ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-foreground hover:bg-muted")}>
                {on && <Check className="size-3.5" />} {c === "all" ? t.all : cat(c)} <span className="text-xs text-muted-foreground">{num(n)}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-5 border-b border-border">
          {tabs.map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} className={cn("-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-sm", tab === tb ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground")}>
              {tabLabel[tb]} <span className="rounded bg-muted px-1.5 text-xs">{num(subs.filter((s) => matchTab(s, tb)).length)}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">{t.noResults}</div>
        ) : view === "table" ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>{[t.service, t.category, t.price, t.billing, t.renewal, t.status, t.manage].map((h, i) => <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><ServiceLogo sub={s} /><div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{plan(s.plan)}</p></div></div></td>
                    <td className="px-4 py-3"><CategoryBadge category={s.category} /></td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{money(s.price)}</td>
                    <td className="px-4 py-3">{cycle(s.cycle)}</td>
                    <td className="px-4 py-3"><p className="whitespace-nowrap">{date(s.nextRenewal)}</p><p className="text-xs text-muted-foreground">{relative(s)}</p></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><StatusBadge status={displayStatus(s)} />{s.trial && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{t.trialBadge}</span>}</div></td>
                    <td className="px-4 py-3"><Actions s={s} label /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{t.showing(num(filtered.length), num(subs.length))} · {t.monthlyTotalShort} {money(tot.monthly)}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <article key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <ServiceLogo sub={s} size="lg" />
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{s.name}</p><p className="truncate text-xs text-muted-foreground">{plan(s.plan)}</p></div>
                  <Actions s={s} />
                </div>
                <p className="mt-4 text-2xl font-bold">{money(s.price)} <span className="text-sm font-normal text-muted-foreground">/ {cycle(s.cycle)}</span></p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <CategoryBadge category={s.category} />
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"><Clock className="size-3" />{relative(s)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <StatusBadge status={displayStatus(s)} />
                  <span>{date(s.nextRenewal)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SubscriptionDialog open={open} onOpenChange={setOpen} editing={editing} />
      <DeleteConfirm open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} onConfirm={() => { if (toDelete) { subsStore.remove(toDelete.id); toast.success(t.deleted); } setToDelete(null); }} />
    </AppShell>
  );
}
