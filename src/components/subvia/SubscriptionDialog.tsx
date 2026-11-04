import { useEffect, useState, type ReactNode } from "react";
import { Globe, Info, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, REMINDER_DAYS, subsStore, toISO, type Category, type Cycle, type Subscription } from "@/lib/subs";
import { ServiceLogo } from "./bits";

const PALETTE = ["#7C3AED", "#E50914", "#1DB954", "#3B8FF0", "#EA5A1C", "#0FA39A", "#E0A800", "#DB2777"];
const REMIND_OPTIONS = [1, 3, 5, 7];

type Form = {
  name: string; plan: string; price: string; cycle: Cycle; startDate: string; nextRenewal: string; category: Category;
  notes: string; trial: boolean; canceled: boolean; remind: boolean; remindDays: number; manageUrl: string;
};

/** Next renewal = first cycle boundary from start date that is today or later. */
function nextFrom(start: string, cycle: Cycle) {
  if (!start) return "";
  const [y = 0, m = 1, d = 1] = start.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let guard = 0;
  while (date < today && guard++ < 1000) {
    if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
  }
  return toISO(date);
}

function blank(): Form {
  const start = toISO(new Date());
  return { name: "", plan: "", price: "", cycle: "monthly", startDate: start, nextRenewal: nextFrom(start, "monthly"), category: "entertainment", notes: "", trial: false, canceled: false, remind: true, remindDays: REMINDER_DAYS, manageUrl: "" };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold text-primary">{title}</p>
      {children}
    </section>
  );
}

export function SubscriptionDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Subscription | null }) {
  const { t, cat, cycle, num } = useI18n();
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(
      editing
        ? {
            name: editing.name, plan: editing.plan, price: String(editing.price), cycle: editing.cycle, startDate: editing.startDate ?? "",
            nextRenewal: editing.nextRenewal, category: editing.category, notes: editing.notes ?? "", trial: !!editing.trial, canceled: !!editing.canceled,
            remind: editing.remind !== false, remindDays: editing.remindDays ?? REMINDER_DAYS, manageUrl: editing.manageUrl ?? "",
          }
        : blank(),
    );
  }, [open, editing]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const setStartOrCycle = (patch: Partial<Form>) =>
    setF((p) => {
      const n = { ...p, ...patch };
      return n.startDate ? { ...n, nextRenewal: nextFrom(n.startDate, n.cycle) } : n;
    });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    const price = Number(f.price.replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[,٫]/, "."));
    if (!f.name.trim()) errs.name = t.required;
    if (!f.price || !Number.isFinite(price) || price < 0) errs.price = t.invalidPrice;
    if (!f.nextRenewal) errs.nextRenewal = t.required;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data = {
      name: f.name.trim(), plan: f.plan.trim(), price, cycle: f.cycle, nextRenewal: f.nextRenewal, category: f.category,
      notes: f.notes.trim() || undefined, trial: f.trial, canceled: f.canceled, startDate: f.startDate || undefined,
      remind: f.remind, remindDays: f.remindDays, manageUrl: f.manageUrl.trim() || undefined,
    };
    if (editing) subsStore.update(editing.id, data);
    else subsStore.add({ ...data, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
    toast.success(t.saved);
    onOpenChange(false);
  }

  const preview: Subscription = { id: "p", name: f.name || "?", plan: "", price: 0, cycle: "monthly", nextRenewal: "", category: f.category, color: editing?.color };
  const url = f.manageUrl.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border px-6 py-5 text-start sm:text-start">
            <DialogTitle className="text-xl">{editing ? t.editSub : t.addSubTitle}</DialogTitle>
            <DialogDescription>{editing ? t.localNote : t.newSubHint}</DialogDescription>
          </DialogHeader>
          <form id="sub-form" onSubmit={submit} className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <Section title={t.secService}>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t.serviceName}</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" className="h-11 ps-9" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Netflix" />
                  </div>
                  <ServiceLogo sub={preview} size="lg" />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plan">{t.plan}</Label>
                  <Input id="plan" className="h-11" value={f.plan} onChange={(e) => set("plan", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.category}</Label>
                  <Select value={f.category} onValueChange={(v) => set("category", v as Category)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{cat(c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title={t.secBilling}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">{t.price}</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 text-xs text-muted-foreground">{t.rs}</span>
                    <Input id="price" className="h-11 pe-14" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
                  </div>
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>{t.billing}</Label>
                  <Select value={f.cycle} onValueChange={(v) => setStartOrCycle({ cycle: v as Cycle })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{cycle("monthly")}</SelectItem>
                      <SelectItem value="yearly">{cycle("yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start">{t.startDate}</Label>
                  <Input id="start" type="date" className="h-11" value={f.startDate} onChange={(e) => setStartOrCycle({ startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">{t.nextRenewal}</Label>
                  <Input id="date" type="date" className="h-11" value={f.nextRenewal} onChange={(e) => set("nextRenewal", e.target.value)} />
                  {errors.nextRenewal ? <p className="text-xs text-destructive">{errors.nextRenewal}</p> : (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Info className="size-3" />{t.autoCalc}</p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={f.trial} onCheckedChange={(v) => set("trial", !!v)} /> {t.trialToggle}
              </label>
              {editing && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.canceled} onCheckedChange={(v) => set("canceled", !!v)} /> {t.canceledToggle}
                </label>
              )}
            </Section>

            <Section title={t.secReminders}>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={f.remind} onCheckedChange={(v) => set("remind", v)} /> {t.remindMe}
                </label>
                <Select value={String(f.remindDays)} onValueChange={(v) => set("remindDays", Number(v))} disabled={!f.remind}>
                  <SelectTrigger className="h-11 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{REMIND_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{t.before(num(d))}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Section>

            <Section title={t.secManage}>
              <div className="space-y-1.5">
                <Label htmlFor="url">{t.manageUrl}</Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="url" dir="ltr" className="h-11 ps-9 text-start" value={f.manageUrl} onChange={(e) => set("manageUrl", e.target.value)} placeholder="netflix.com/account" />
                </div>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Info className="size-3" />{t.manageUrlHint}</p>
                {url && (
                  <a href={/^https?:\/\//.test(url) ? url : `https://${url}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">{t.openManage}</a>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea id="notes" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </Section>
          </form>
          <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-6 py-4">
            <Button type="submit" form="sub-form">{editing ? t.saveChanges : t.save}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            {editing && (
              <Button type="button" variant="ghost" className="ms-auto text-destructive hover:text-destructive" onClick={() => setConfirm(true)}>
                <Trash2 className="size-4" /> {t.deleteSub}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {editing && (
        <DeleteConfirm open={confirm} onOpenChange={setConfirm} onConfirm={() => { subsStore.remove(editing.id); toast.success(t.deleted); onOpenChange(false); }} />
      )}
    </>
  );
}

export function DeleteConfirm({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-start sm:text-start">
          <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
          <AlertDialogDescription>{t.confirmDeleteBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{t.delete}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
