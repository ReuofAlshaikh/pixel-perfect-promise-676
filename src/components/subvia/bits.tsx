import { Clapperboard, Briefcase, Music, Cloud, GraduationCap, Shapes } from "lucide-react";
import type { Category, DisplayStatus, Subscription } from "@/lib/subs";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ServiceLogo({ sub, size = "md" }: { sub: Subscription; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "size-11 text-base" : size === "sm" ? "size-7 text-xs" : "size-9 text-sm";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-primary-foreground", dim)}
      style={{ backgroundColor: sub.color ?? "var(--primary)" }}
      aria-hidden
    >
      {sub.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export const categoryIcon: Record<Category, typeof Music> = {
  entertainment: Clapperboard,
  productivity: Briefcase,
  music: Music,
  cloud: Cloud,
  education: GraduationCap,
  other: Shapes,
};

const catTone: Record<Category, string> = {
  entertainment: "text-chart-1 bg-chart-1/10",
  productivity: "text-chart-2 bg-chart-2/10",
  music: "text-success bg-success-soft",
  cloud: "text-chart-4 bg-chart-4/10",
  education: "text-warning-foreground bg-warning-soft",
  other: "text-muted-foreground bg-muted",
};

export function CategoryBadge({ category }: { category: Category }) {
  const { cat } = useI18n();
  const Icon = categoryIcon[category];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", catTone[category])}>
      <Icon className="size-3" />
      {cat(category)}
    </span>
  );
}

const statusTone: Record<DisplayStatus, { box: string; dot: string }> = {
  dueSoon: { box: "bg-warning-soft text-warning-foreground", dot: "bg-warning" },
  upcoming: { box: "bg-warning-soft text-warning-foreground", dot: "bg-warning" },
  active: { box: "bg-success-soft text-success", dot: "bg-success" },
  expired: { box: "bg-destructive-soft text-destructive", dot: "bg-destructive" },
  canceled: { box: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const { status: label } = useI18n();
  const tone = statusTone[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", tone.box)}>
      <span className={cn("size-1.5 rounded-full", tone.dot)} />
      {label(status)}
    </span>
  );
}

export const categoryChartVar: Record<Category, string> = {
  entertainment: "var(--chart-1)",
  productivity: "var(--chart-2)",
  music: "var(--chart-3)",
  cloud: "var(--chart-4)",
  education: "var(--chart-5)",
  other: "var(--chart-6)",
};
