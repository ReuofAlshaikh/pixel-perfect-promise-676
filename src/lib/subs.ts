import { useSyncExternalStore } from "react";

export type Category = "entertainment" | "productivity" | "music" | "cloud" | "education" | "other";
export type Cycle = "monthly" | "yearly";
export type Subscription = {
  id: string;
  name: string;
  plan: string;
  price: number;
  cycle: Cycle;
  nextRenewal: string; // YYYY-MM-DD
  category: Category;
  notes?: string;
  trial?: boolean;
  canceled?: boolean;
  color?: string;
};

export type DisplayStatus = "dueSoon" | "upcoming" | "active" | "expired" | "canceled";

export const CATEGORIES: Category[] = ["entertainment", "productivity", "music", "cloud", "education", "other"];
export const REMINDER_DAYS = 5;

const KEY = "subvia.subscriptions.v1";

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(n: number, base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysUntil(iso: string, today = new Date()) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - t) / 86400000);
}

export function displayStatus(s: Subscription, today = new Date()): DisplayStatus {
  if (s.canceled) return "canceled";
  const d = daysUntil(s.nextRenewal, today);
  if (d < 0) return "expired";
  if (d <= 1) return "dueSoon";
  if (d <= REMINDER_DAYS) return "upcoming";
  return "active";
}

export function isActive(s: Subscription, today = new Date()) {
  const st = displayStatus(s, today);
  return st !== "canceled" && st !== "expired";
}

export function monthlyCost(s: Subscription) {
  return s.cycle === "yearly" ? s.price / 12 : s.price;
}

export function totals(list: Subscription[], today = new Date()) {
  const active = list.filter((s) => isActive(s, today));
  const monthly = active.reduce((a, s) => a + monthlyCost(s), 0);
  return {
    monthly,
    yearly: monthly * 12,
    activeCount: active.length,
    trials: active.filter((s) => s.trial).length,
    expired: list.filter((s) => displayStatus(s, today) === "expired").length,
    upcoming: active.filter((s) => daysUntil(s.nextRenewal, today) <= REMINDER_DAYS).length,
  };
}

export type Alert = { id: string; kind: "renewal" | "trial"; sub: Subscription; days: number };

/** Renewal alerts fire within REMINDER_DAYS days; trial alerts for trials ending within REMINDER_DAYS. */
export function alerts(list: Subscription[], today = new Date()): Alert[] {
  return list
    .filter((s) => isActive(s, today))
    .map((s) => ({ s, days: daysUntil(s.nextRenewal, today) }))
    .filter(({ days }) => days >= 0 && days <= REMINDER_DAYS)
    .sort((a, b) => a.days - b.days)
    .map(({ s, days }) => ({ id: `${s.trial ? "trial" : "renewal"}-${s.id}`, kind: s.trial ? "trial" : "renewal", sub: s, days }));
}

export function byCategory(list: Subscription[], today = new Date()) {
  const map = new Map<Category, number>();
  list.filter((s) => isActive(s, today)).forEach((s) => map.set(s.category, (map.get(s.category) ?? 0) + monthlyCost(s)));
  return CATEGORIES.map((c) => ({ category: c, value: map.get(c) ?? 0 })).filter((x) => x.value > 0);
}

export function seed(): Subscription[] {
  return [
    { id: "1", name: "Netflix", plan: "Premium", price: 49.99, cycle: "monthly", nextRenewal: addDays(1), category: "entertainment", color: "#E50914" },
    { id: "2", name: "Canva Pro", plan: "Free trial", price: 44.99, cycle: "monthly", nextRenewal: addDays(2), category: "productivity", trial: true, color: "#7D2AE8" },
    { id: "3", name: "Spotify", plan: "Family", price: 32.99, cycle: "monthly", nextRenewal: addDays(4), category: "music", color: "#1DB954" },
    { id: "4", name: "YouTube", plan: "Individual", price: 26.99, cycle: "monthly", nextRenewal: addDays(8), category: "entertainment", color: "#FF0033" },
    { id: "5", name: "iCloud+", plan: "200 GB", price: 10.99, cycle: "monthly", nextRenewal: addDays(11), category: "cloud", color: "#3B8FF0" },
    { id: "6", name: "Shahid VIP", plan: "VIP", price: 30, cycle: "monthly", nextRenewal: addDays(17), category: "entertainment", color: "#0FA39A" },
    { id: "7", name: "ChatGPT Plus", plan: "Plus", price: 75, cycle: "monthly", nextRenewal: addDays(19), category: "productivity", color: "#10A37F" },
    { id: "8", name: "Microsoft 365", plan: "Family", price: 449, cycle: "yearly", nextRenewal: addDays(122), category: "productivity", color: "#EA5A1C" },
    { id: "9", name: "Coursera Plus", plan: "Monthly", price: 27, cycle: "monthly", nextRenewal: addDays(24), category: "education", color: "#E0A800" },
    { id: "10", name: "Adobe CC", plan: "All Apps", price: 219, cycle: "monthly", nextRenewal: addDays(-4), category: "productivity", color: "#FA0F00" },
    { id: "11", name: "OSN+", plan: "Monthly", price: 35, cycle: "monthly", nextRenewal: addDays(-18), category: "entertainment", canceled: true, color: "#111111" },
  ];
}

// ---- store ----
let state: Subscription[] | null = null;
const SERVER: Subscription[] = seed();
const listeners = new Set<() => void>();

function load(): Subscription[] {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as Subscription[]) : seed();
  } catch {
    state = seed();
  }
  return state;
}
function save(next: Subscription[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const subsStore = {
  add(s: Omit<Subscription, "id">) {
    save([{ ...s, id: crypto.randomUUID() }, ...load()]);
  },
  update(id: string, patch: Partial<Subscription>) {
    save(load().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  },
  remove(id: string) {
    save(load().filter((s) => s.id !== id));
  },
  reset() {
    save(seed());
  },
};

export function useSubscriptions() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => SERVER,
  );
}
