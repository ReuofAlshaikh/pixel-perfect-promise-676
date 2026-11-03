import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, Sparkles } from "lucide-react";
import { AppShell } from "@/components/subvia/AppShell";
import { ServiceLogo } from "@/components/subvia/bits";
import { SubscriptionDialog } from "@/components/subvia/SubscriptionDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { alerts, useSubscriptions, type Subscription } from "@/lib/subs";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Subvia — التنبيهات | Notifications" },
      { name: "description", content: "Reminders 5 days before each renewal and before free trials end." },
      { property: "og:title", content: "Subvia — Notifications" },
      { property: "og:description", content: "Renewal and free-trial reminders for your subscriptions." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { t, money, date } = useI18n();
  const list = alerts(useSubscriptions());
  const [editing, setEditing] = useState<Subscription | null>(null);

  return (
    <AppShell title={t.notifications} subtitle={t.alertsHint}>
      <div className="mx-auto max-w-3xl space-y-3">
        {list.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">{t.noAlerts}</div>}
        {list.map((a) => (
          <article key={a.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${a.kind === "trial" ? "border-warning bg-warning-soft" : "border-border bg-card"}`}>
            <span className={`inline-flex size-10 items-center justify-center rounded-full ${a.kind === "trial" ? "bg-card text-warning-foreground" : "bg-accent text-accent-foreground"}`}>
              {a.kind === "trial" ? <Sparkles className="size-5" /> : <BellRing className="size-5" />}
            </span>
            <ServiceLogo sub={a.sub} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.kind === "trial" ? t.trialAlert(a.sub.name) : t.renewAlert(a.sub.name)} · {t.in(a.days)}</p>
              <p className="text-sm text-muted-foreground">{t.alertBody(date(a.sub.nextRenewal), money(a.sub.price))}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(a.sub)}>{t.manage}</Button>
          </article>
        ))}
      </div>
      <SubscriptionDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} editing={editing} />
    </AppShell>
  );
}
