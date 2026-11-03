import { useEffect, useSyncExternalStore } from "react";
import type { Category, Cycle, DisplayStatus } from "./subs";

export type Lang = "ar" | "en";
const KEY = "subvia.lang";
let lang: Lang | null = null;
const listeners = new Set<() => void>();

function get(): Lang {
  if (lang) return lang;
  try {
    lang = (localStorage.getItem(KEY) as Lang) || "ar";
  } catch {
    lang = "ar";
  }
  return lang;
}
export function setLang(l: Lang) {
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  listeners.forEach((f) => f());
}

const dict = {
  ar: {
    menu: "القائمة",
    dashboard: "الرئيسية",
    subscriptions: "اشتراكاتي",
    notifications: "التنبيهات",
    greeting: "مساء الخير",
    search: "ابحث في اشتراكاتك...",
    monthlyTotal: "إجمالي المصروفات الشهرية",
    yearlyTotal: "إجمالي المصروفات السنوية",
    activeSubs: "الاشتراكات النشطة",
    upcomingRenewals: "التجديدات القادمة",
    expiredSubs: "الاشتراكات المنتهية",
    trials: "الفترات التجريبية",
    activeShort: "اشتراكًا نشطًا",
    yearlyExpected: "متوقع سنويًا",
    monthlySpending: "المصروفات حسب الاشتراك",
    byCategory: "حسب الفئة",
    perMonth: "شهريًا",
    upcomingPayments: "المدفوعات القادمة",
    allRenewals: "كل التجديدات",
    needsAttention: "اشتراكات تحتاج انتباهك",
    viewAll: "عرض كل الاشتراكات",
    renewsThisWeek: "تجديدات خلال ٥ أيام",
    addSub: "إضافة اشتراك",
    editSub: "تعديل الاشتراك",
    table: "جدول",
    cards: "بطاقات",
    category: "الفئة",
    status: "الحالة",
    all: "الكل",
    service: "الخدمة",
    price: "السعر",
    billing: "دورة الفوترة",
    renewal: "تاريخ التجديد",
    manage: "إدارة",
    delete: "حذف",
    edit: "تعديل",
    name: "اسم الاشتراك",
    plan: "الخطة",
    nextRenewal: "التجديد القادم",
    notes: "ملاحظات (اختياري)",
    trialToggle: "هذا الاشتراك في فترة تجريبية مجانية",
    canceledToggle: "ألغيت هذا الاشتراك",
    save: "حفظ",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    deleteSub: "حذف الاشتراك",
    confirmDelete: "هل تريد حذف هذا الاشتراك؟",
    confirmDeleteBody: "سيتم حذفه نهائيًا من هذا المتصفح.",
    sortRenewal: "ترتيب: الأقرب تجديدًا",
    sortPrice: "ترتيب: الأعلى سعرًا",
    sortName: "ترتيب: الاسم",
    noResults: "لا توجد اشتراكات مطابقة",
    showing: (n: number, t: number) => `عرض ${n} من ${t} اشتراكًا`,
    monthlyTotalShort: "الإجمالي الشهري",
    subsCount: (n: number) => `${n} اشتراكًا`,
    rs: "ر.س",
    in: (d: number) => (d === 0 ? "اليوم" : d === 1 ? "خلال ٢٤ ساعة" : `بعد ${d} أيام`),
    ago: (d: number) => `منذ ${d} أيام`,
    renewAlert: (n: string) => `يتجدد ${n} قريبًا`,
    trialAlert: (n: string) => `تنتهي الفترة التجريبية لـ ${n}`,
    alertBody: (date: string, amt: string) => `سيُخصم ${amt} في ${date}`,
    noAlerts: "لا توجد تنبيهات حاليًا",
    dismiss: "إخفاء",
    alertsHint: "نذكّرك قبل التجديد بخمسة أيام وعند اقتراب نهاية الفترة التجريبية.",
    saved: "تم حفظ الاشتراك",
    deleted: "تم حذف الاشتراك",
    required: "هذا الحقل مطلوب",
    invalidPrice: "أدخل سعرًا صحيحًا",
    localNote: "بياناتك محفوظة في هذا المتصفح فقط",
    resetDemo: "استعادة البيانات التجريبية",
    trialBadge: "تجريبي",
  },
  en: {
    menu: "Menu",
    dashboard: "Dashboard",
    subscriptions: "My subscriptions",
    notifications: "Notifications",
    greeting: "Good evening",
    search: "Search subscriptions...",
    monthlyTotal: "Total monthly spending",
    yearlyTotal: "Total yearly spending",
    activeSubs: "Active subscriptions",
    upcomingRenewals: "Upcoming renewals",
    expiredSubs: "Expired subscriptions",
    trials: "Free trials",
    activeShort: "active",
    yearlyExpected: "expected yearly",
    monthlySpending: "Spending by subscription",
    byCategory: "By category",
    perMonth: "monthly",
    upcomingPayments: "Upcoming payments",
    allRenewals: "All renewals",
    needsAttention: "Needs your attention",
    viewAll: "View all subscriptions",
    renewsThisWeek: "renew within 5 days",
    addSub: "Add subscription",
    editSub: "Edit subscription",
    table: "Table",
    cards: "Cards",
    category: "Category",
    status: "Status",
    all: "All",
    service: "Service",
    price: "Price",
    billing: "Billing",
    renewal: "Renewal date",
    manage: "Manage",
    delete: "Delete",
    edit: "Edit",
    name: "Subscription name",
    plan: "Plan",
    nextRenewal: "Next renewal",
    notes: "Notes (optional)",
    trialToggle: "This subscription is on a free trial",
    canceledToggle: "I canceled this subscription",
    save: "Save",
    saveChanges: "Save changes",
    cancel: "Cancel",
    deleteSub: "Delete subscription",
    confirmDelete: "Delete this subscription?",
    confirmDeleteBody: "It will be removed from this browser permanently.",
    sortRenewal: "Sort: Next renewal",
    sortPrice: "Sort: Highest price",
    sortName: "Sort: Name",
    noResults: "No matching subscriptions",
    showing: (n: number, t: number) => `Showing ${n} of ${t} subscriptions`,
    monthlyTotalShort: "Monthly total",
    subsCount: (n: number) => `${n} subscriptions`,
    rs: "SAR",
    in: (d: number) => (d === 0 ? "today" : d === 1 ? "within 24 h" : `in ${d} days`),
    ago: (d: number) => `${d} days ago`,
    renewAlert: (n: string) => `${n} renews soon`,
    trialAlert: (n: string) => `${n} free trial is ending`,
    alertBody: (date: string, amt: string) => `${amt} will be charged on ${date}`,
    noAlerts: "No notifications right now",
    dismiss: "Dismiss",
    alertsHint: "We remind you 5 days before renewal and when a free trial is about to end.",
    saved: "Subscription saved",
    deleted: "Subscription deleted",
    required: "This field is required",
    invalidPrice: "Enter a valid price",
    localNote: "Your data is stored in this browser only",
    resetDemo: "Restore demo data",
    trialBadge: "Trial",
  },
};

const cats: Record<Lang, Record<Category, string>> = {
  ar: { entertainment: "ترفيه", productivity: "إنتاجية", music: "موسيقى", cloud: "تخزين سحابي", education: "تعليم", other: "أخرى" },
  en: { entertainment: "Entertainment", productivity: "Productivity", music: "Music", cloud: "Cloud storage", education: "Education", other: "Other" },
};
const statuses: Record<Lang, Record<DisplayStatus, string>> = {
  ar: { dueSoon: "تجديد وشيك", upcoming: "قارب على التجديد", active: "نشط", expired: "منتهي", canceled: "ملغى" },
  en: { dueSoon: "Due soon", upcoming: "Upcoming renewal", active: "Active", expired: "Expired", canceled: "Canceled" },
};
const cycles: Record<Lang, Record<Cycle, string>> = {
  ar: { monthly: "شهري", yearly: "سنوي" },
  en: { monthly: "Monthly", yearly: "Yearly" },
};

export function useI18n() {
  const l = useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    get,
    () => "ar" as Lang,
  );
  const locale = l === "ar" ? "ar-SA-u-nu-arab-ca-gregory" : "en-GB";
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfInt = new Intl.NumberFormat(locale);
  const t = dict[l];
  return {
    lang: l,
    dir: l === "ar" ? "rtl" : "ltr",
    t,
    cat: (c: Category) => cats[l][c],
    status: (s: DisplayStatus) => statuses[l][s],
    cycle: (c: Cycle) => cycles[l][c],
    num: (n: number) => nfInt.format(n),
    money: (n: number) => (l === "ar" ? `${nf.format(n)} ${t.rs}` : `${t.rs} ${nf.format(n)}`),
    date: (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
      const [y, m, d] = iso.split("-").map(Number);
      return new Intl.DateTimeFormat(locale, opts).format(new Date(y, m - 1, d));
    },
  };
}

export function useDocumentDir() {
  const { lang, dir } = useI18n();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
}
