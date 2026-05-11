// Pure helpers used in both UI and server.

export const CATEGORIES = [
  "Data Wrangling",
  "Manual Reporting",
  "Improvised Approval Workflow",
  "Knowledge Retrieval",
  "System Sync",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = [
  "detected",
  "acknowledged",
  "in_progress",
  "fixed",
  "false_positive",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  detected: "Detected",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  fixed: "Fixed",
  false_positive: "False Positive",
};

export const TEAMS = [
  "Engineering",
  "Operations",
  "Finance",
  "Marketing",
  "Sales",
  "People",
  "Customer Success",
  "Product",
] as const;

export type Confidence = "low" | "medium" | "high";

export function formatMoney(n: number, opts: { compact?: boolean } = {}) {
  if (n == null || isNaN(n)) return "$0";
  if (opts.compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000)
      return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${(n / 1000).toFixed(1)}k`;
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function costTier(annual: number): "high" | "mid" | "low" {
  if (annual >= 50_000) return "high";
  if (annual >= 10_000) return "mid";
  return "low";
}

export function costColorClass(annual: number) {
  const t = costTier(annual);
  if (t === "high") return "text-danger";
  if (t === "mid") return "text-warn";
  return "text-success";
}

export function costBgClass(annual: number) {
  const t = costTier(annual);
  if (t === "high") return "bg-danger/15 text-danger border border-danger/30";
  if (t === "mid") return "bg-warn/15 text-warn border border-warn/30";
  return "bg-success/15 text-success border border-success/30";
}

export function recomputeCost(p: {
  hours_per_occurrence: number;
  occurrences_per_month: number;
  people_involved: number;
  rate: number;
}) {
  const monthly =
    Number(p.hours_per_occurrence) *
    Number(p.occurrences_per_month) *
    Number(p.people_involved) *
    Number(p.rate);
  return { monthly_cost: monthly, annual_cost: monthly * 12 };
}

export function roiScore(p: { annual_cost: number; difficulty: number }) {
  return p.annual_cost / Math.max(1, p.difficulty);
}

export function paybackPeriodDays(p: {
  annual_cost: number;
  implementation_days: number | null;
  rate: number;
}) {
  // Cost to fix = implementation_days * 8h * rate
  const fixCost = (p.implementation_days ?? 3) * 8 * p.rate;
  const dailySavings = p.annual_cost / 365;
  if (dailySavings <= 0) return null;
  return Math.ceil(fixCost / dailySavings);
}

export function frequencyToOccurrences(freq: string): number {
  switch (freq) {
    case "daily":
      return 22;
    case "weekly":
      return 4;
    case "monthly":
      return 1;
    case "quarterly":
      return 1 / 3;
    default:
      return 4;
  }
}
