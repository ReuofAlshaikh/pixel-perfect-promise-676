import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, Clock, Layers, Sparkles, Wallet, XCircle, CalendarDays, X, Plus } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/subvia/AppShell";
import { CategoryBadge, categoryChartVar, ServiceLogo, StatusBadge } from "@/components/subvia/bits";
import { SubscriptionDialog } from "@/components/subvia/SubscriptionDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { alerts, byCategory, daysUntil, displayStatus, isActive, monthlyCost, totals, useSubscriptions, type Subscription } from "@/lib/subs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Subvia — لوحة التحكم | Subscription dashboard" },
      { name: "description", content: "See your monthly and yearly subscription costs, upcoming renewals and spending by category in one place." },
      { property: "og:title", content: "Subvia — Subscription dashboard" },
      { property: "og:description", content: "Track subscription costs and upcoming renewals in one place." },
    ],
  }),
  component: Dashboard,
});

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>{children}</section>;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`inline-flex size-8 items-center justify-center rounded-lg ${tone}`}><Icon className="size-4" /></span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

function Dashboard() {
  const { t, money, num, cat, date, lang, plan } = useI18n();
  const subs = useSubscriptions();
  const tot = totals(subs);
  const al = alerts(subs);
  const trialAlert = al.find((a) => a.kind === "trial");
  const [hidden, setHidden] = useState<string | null>(null);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [open, setOpen] = useState(false);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const cats = byCategory(subs);
  const active = subs.filter((s) => isActive(s));
  const bars = [...active].sort((a, b) => monthlyCost(b) - monthlyCost(a)).map((s) => ({ name: s.name, value: Number(monthlyCost(s).toFixed(2)) }));
  const upcoming = [...active].sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal)).slice(0, 5);
  const attention = subs.filter((s) => ["dueSoon", "upcoming", "expired"].includes(displayStatus(s)) || (s.trial && isActive(s))).slice(0, 6);

  const openEdit = (s: Subscription) => { setEditing(s); setOpen(true); };

  return (
    <AppShell title={`${t.greeting} 👋`} subtitle={date(new Date().toISOString().slice(0, 10), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}>
      <div className="mx-auto max-w-7xl space-y-5">
        {trialAlert && hidden !== trialAlert.id && (
          <div className="flex items-start gap-3 rounded-2xl border border-warning bg-warning-soft p-4">
            <Clock className="mt-0.5 size-5 text-warning-foreground" />
            <div className="flex-1">
              <p className="font-semibold">{t.trialAlert(trialAlert.sub.name)} · {t.in(trialAlert.days)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.alertBody(date(trialAlert.sub.nextRenewal), money(trialAlert.sub.price))}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => openEdit(trialAlert.sub)}>{t.manage}</Button>
              </div>
            </div>
            <button onClick={() => setHidden(trialAlert.id)} aria-label={t.dismiss} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-4">
          <section className="relative overflow-hidden rounded-2xl bg-hero p-6 text-primary-foreground lg:row-span-2">
            <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="size-4" /> {t.monthlyTotal}</div>
            <p className="mt-4 text-4xl font-bold">{money(tot.monthly)}</p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-primary-foreground/20 pt-4">
              <div><p className="text-xl font-bold">{num(tot.activeCount)}</p><p className="text-xs opacity-80">{t.activeShort}</p></div>
              <div><p className="text-xl font-bold">{money(tot.yearly)}</p><p className="text-xs opacity-80">{t.yearlyExpected}</p></div>
            </div>
            <Button variant="secondary" size="sm" className="mt-6 w-full" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> {t.addSub}</Button>
          </section>
          <Stat icon={CalendarDays} label={t.yearlyTotal} value={money(tot.yearly)} tone="bg-accent text-accent-foreground" />
          <Stat icon={Layers} label={t.activeSubs} value={num(tot.activeCount)} tone="bg-success-soft text-success" />
          <Stat icon={CalendarClock} label={t.upcomingRenewals} value={num(tot.upcoming)} tone="bg-warning-soft text-warning-foreground" />
          <Stat icon={Sparkles} label={t.trials} value={num(tot.trials)} tone="bg-accent text-accent-foreground" />
          <Stat icon={XCircle} label={t.expiredSubs} value={num(tot.expired)} tone="bg-destructive-soft text-destructive" />
          <Stat icon={Clock} label={t.renewsThisWeek} value={num(al.length)} tone="bg-warning-soft text-warning-foreground" />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <h2 className="font-bold">{t.monthlySpending}</h2>
            <div className="mt-4 h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lang === "ar" ? [...bars].reverse() : bars}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => num(v)} orientation={lang === "ar" ? "right" : "left"} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [money(v), t.perMonth]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h2 className="font-bold">{t.byCategory}</h2>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative size-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cats} dataKey="value" nameKey="category" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                      {cats.map((c) => <Cell key={c.category} fill={categoryChartVar[c.category]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold">{num(Math.round(tot.monthly))}</p>
                  <p className="text-xs text-muted-foreground">{t.rs} · {t.perMonth}</p>
                </div>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {cats.map((c) => (
                  <li key={c.category} className="flex items-center gap-2">
                    <span className="size-3 rounded" style={{ background: categoryChartVar[c.category] }} />
                    <span className="flex-1">{cat(c.category)}</span>
                    <span className="text-muted-foreground">{money(c.value)}</span>
                    <span className="w-10 text-end text-xs text-muted-foreground">{num(Math.round((c.value / tot.monthly) * 100))}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{t.upcomingPayments}</h2>
              <Link to="/subscriptions" search={{ q: undefined }} className="flex items-center gap-1 text-xs font-medium text-primary">{t.allRenewals} <Arrow className="size-3" /></Link>
            </div>
            <ul className="mt-4 space-y-3">
              {upcoming.map((s) => {
                const d = daysUntil(s.nextRenewal);
                return (
                  <li key={s.id}>
                    <button onClick={() => openEdit(s)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-start hover:bg-muted/50">
                      <div className="w-12 text-center">
                        <p className="text-lg font-bold">{date(s.nextRenewal, { day: "numeric" })}</p>
                        <p className="text-[11px] text-muted-foreground">{date(s.nextRenewal, { month: "short" })}</p>
                      </div>
                      <ServiceLogo sub={s} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{plan(s.plan)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${d <= 5 ? "bg-warning-soft text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{t.in(d)}</span>
                      <span className="w-24 text-end text-sm font-semibold">{money(s.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{t.needsAttention}</h2>
              <Link to="/subscriptions" search={{ q: undefined }} className="flex items-center gap-1 text-xs font-medium text-primary">{t.viewAll} <Arrow className="size-3" /></Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {attention.map((s) => (
                <button key={s.id} onClick={() => openEdit(s)} className="rounded-xl border border-border p-4 text-start hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ServiceLogo sub={s} />
                    <div className="min-w-0"><p className="truncate font-medium">{s.name}</p><p className="truncate text-xs text-muted-foreground">{plan(s.plan)}</p></div>
                  </div>
                  <p className="mt-3 text-lg font-bold">{money(s.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5"><CategoryBadge category={s.category} /><StatusBadge status={displayStatus(s)} /></div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <SubscriptionDialog open={open} onOpenChange={setOpen} editing={editing} />
    </AppShell>
  );
}
