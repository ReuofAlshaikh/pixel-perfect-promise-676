import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, subsStore, toISO, type Category, type Cycle, type Subscription } from "@/lib/subs";
import { ServiceLogo } from "./bits";

const PALETTE = ["#7C3AED", "#E50914", "#1DB954", "#3B8FF0", "#EA5A1C", "#0FA39A", "#E0A800", "#DB2777"];

type Form = { name: string; plan: string; price: string; cycle: Cycle; nextRenewal: string; category: Category; notes: string; trial: boolean; canceled: boolean };

function blank(): Form {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return { name: "", plan: "", price: "", cycle: "monthly", nextRenewal: toISO(d), category: "entertainment", notes: "", trial: false, canceled: false };
}

export function SubscriptionDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Subscription | null }) {
  const { t, cat, cycle } = useI18n();
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(
      editing
        ? { name: editing.name, plan: editing.plan, price: String(editing.price), cycle: editing.cycle, nextRenewal: editing.nextRenewal, category: editing.category, notes: editing.notes ?? "", trial: !!editing.trial, canceled: !!editing.canceled }
        : blank(),
    );
  }, [open, editing]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    const price = Number(f.price.replace(",", "."));
    if (!f.name.trim()) errs.name = t.required;
    if (!f.price || !Number.isFinite(price) || price < 0) errs.price = t.invalidPrice;
    if (!f.nextRenewal) errs.nextRenewal = t.required;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data = { name: f.name.trim(), plan: f.plan.trim(), price, cycle: f.cycle, nextRenewal: f.nextRenewal, category: f.category, notes: f.notes.trim() || undefined, trial: f.trial, canceled: f.canceled };
    if (editing) subsStore.update(editing.id, data);
    else subsStore.add({ ...data, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
    toast.success(t.saved);
    onOpenChange(false);
  }

  const preview: Subscription = { id: "p", name: f.name || "?", plan: "", price: 0, cycle: "monthly", nextRenewal: "", category: f.category, color: editing?.color };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>{editing ? t.editSub : t.addSub}</DialogTitle>
            <DialogDescription>{t.localNote}</DialogDescription>
          </DialogHeader>
          <form id="sub-form" onSubmit={submit} className="space-y-4">
            <div className="flex items-end gap-3">
              <ServiceLogo sub={preview} size="lg" />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="name">{t.name}</Label>
                <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Netflix" />
              </div>
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan">{t.plan}</Label>
                <Input id="plan" value={f.plan} onChange={(e) => set("plan", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.category}</Label>
                <Select value={f.category} onValueChange={(v) => set("category", v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{cat(c)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">{t.price} ({t.rs})</Label>
                <Input id="price" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t.billing}</Label>
                <Select value={f.cycle} onValueChange={(v) => set("cycle", v as Cycle)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{cycle("monthly")}</SelectItem>
                    <SelectItem value="yearly">{cycle("yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="date">{t.nextRenewal}</Label>
                <Input id="date" type="date" value={f.nextRenewal} onChange={(e) => set("nextRenewal", e.target.value)} />
                {errors.nextRenewal && <p className="text-xs text-destructive">{errors.nextRenewal}</p>}
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
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea id="notes" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </form>
          <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
            {editing ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirm(true)}>
                <Trash2 className="size-4" /> {t.deleteSub}
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
              <Button type="submit" form="sub-form">{editing ? t.saveChanges : t.save}</Button>
            </div>
          </DialogFooter>
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
