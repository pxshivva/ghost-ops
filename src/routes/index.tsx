import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGhostProcesses, useSettings, useInvalidateGhost } from "@/lib/hooks";
import { setHourlyRate, updateGhostProcess, seedDemoData } from "@/lib/seed.functions";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import {
  formatMoney,
  costColorClass,
  costBgClass,
  STATUS_LABELS,
  CATEGORIES,
  roiScore,
  type Status,
} from "@/lib/ghost";
import type { GhostProcess } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Download,
  FileText,
  Ghost,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: processes = [], isLoading } = useGhostProcesses();
  const { data: settings } = useSettings();
  const invalidate = useInvalidateGhost();

  const setRateFn = useServerFn(setHourlyRate);
  const updateFn = useServerFn(updateGhostProcess);
  const seedFn = useServerFn(seedDemoData);

  const [filter, setFilter] = useState<string>("all");
  const [rate, setRate] = useState<number>(75);
  const [search, setSearch] = useState("");

  // Sync rate from server
  useMemo(() => {
    if (settings?.blended_hourly_rate) setRate(Number(settings.blended_hourly_rate));
  }, [settings?.blended_hourly_rate]);

  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: {} }),
    onSuccess: (r) => {
      toast.success(
        r.skipped ? "Demo data already loaded." : `Loaded ${r.inserted} ghost processes.`,
      );
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rateMut = useMutation({
    mutationFn: (r: number) => setRateFn({ data: { rate: r } }),
    onSuccess: () => {
      toast.success("Rate updated. Costs recalculated.");
      invalidate();
    },
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: Status }) =>
      updateFn({ data: { id: v.id, status: v.status } }),
    onSuccess: () => invalidate(),
  });

  const visible = useMemo(() => {
    let rows = processes.filter((p) => p.status !== "false_positive");
    if (filter !== "all") rows = rows.filter((p) => p.category === filter);
    if (search.trim())
      rows = rows.filter((p) =>
        (p.name + " " + (p.team ?? "") + " " + (p.description ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    return rows;
  }, [processes, filter, search]);

  const stats = useMemo(() => {
    const active = processes.filter((p) => p.status !== "false_positive");
    const totalAnnual = active.reduce((a, p) => a + Number(p.annual_cost), 0);
    const fixable = active
      .filter((p) => p.status !== "fixed")
      .reduce((a, p) => a + Number(p.annual_cost), 0);
    const highConf = active.filter((p) => p.confidence === "high").length;
    return {
      count: active.length,
      totalAnnual,
      potential: fixable,
      confidencePct: active.length
        ? Math.round((highConf / active.length) * 100)
        : 0,
    };
  }, [processes]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    processes.forEach((p) => p.team && set.add(p.team));
    return Array.from(set).sort();
  }, [processes]);

  const heatmap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const t of teams) map[t] = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    for (const p of processes) {
      if (!p.team) continue;
      if (!map[p.team]) map[p.team] = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
      map[p.team][p.category] = (map[p.team][p.category] ?? 0) + Number(p.annual_cost);
    }
    let max = 0;
    for (const t of Object.values(map))
      for (const v of Object.values(t)) if (v > max) max = v;
    return { map, max };
  }, [processes, teams]);

  const quickWins = useMemo(
    () =>
      [...processes]
        .filter((p) => p.status !== "false_positive" && p.status !== "fixed")
        .sort((a, b) => roiScore(toScore(b)) - roiScore(toScore(a)))
        .slice(0, 5),
    [processes],
  );

  function exportCSV() {
    const headers = [
      "name",
      "category",
      "team",
      "monthly_hours",
      "monthly_cost",
      "annual_cost",
      "confidence",
      "difficulty",
      "status",
    ];
    const rows = visible.map((p) =>
      [
        p.name,
        p.category,
        p.team ?? "",
        p.monthly_hours,
        p.monthly_cost,
        p.annual_cost,
        p.confidence,
        p.difficulty,
        p.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ghostops-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      {/* Hero stats */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
              ghost ops · mission control
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
              Hidden manual work in your org
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Detected from calendar, email, drive and Slack metadata, plus
              employee submissions. Quantified at your blended hourly rate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {processes.length === 0 && (
              <Button
                size="sm"
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Load demo data
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI
            label="Ghost processes"
            value={stats.count.toString()}
            icon={<Ghost className="h-4 w-4" />}
          />
          <KPI
            label="Total annual cost"
            value={formatMoney(stats.totalAnnual, { compact: true })}
            tone="danger"
            big
          />
          <KPI
            label="Potential savings"
            value={formatMoney(stats.potential, { compact: true })}
            tone="success"
            big
          />
          <KPI
            label="High confidence"
            value={`${stats.confidencePct}%`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Blended hourly rate</span>
              <Input
                type="number"
                value={rate}
                min={1}
                onChange={(e) => setRate(Number(e.target.value))}
                className="h-8 w-24 font-mono-tabular"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => rateMut.mutate(rate)}
                disabled={rateMut.isPending || rate === Number(settings?.blended_hourly_rate ?? 75)}
              >
                Apply
              </Button>
            </div>
            <div className="text-xs text-muted-foreground ml-auto">
              Costs auto-recalculate across all detected processes.
            </div>
          </CardContent>
        </Card>

        {/* Heatmap + quick wins */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Ghost work heat map
                <Badge variant="outline" className="text-[10px] font-normal">
                  team × category · annual cost
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Heatmap heatmap={heatmap} teams={teams} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-warn" /> Quick wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickWins.length === 0 && (
                <div className="text-xs text-muted-foreground">No data yet.</div>
              )}
              {quickWins.map((p) => (
                <Link
                  key={p.id}
                  to="/process/$id"
                  params={{ id: p.id }}
                  className="block rounded-md border border-border bg-card/50 hover:bg-accent/40 p-2.5 transition-colors animate-materialize"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium leading-tight">{p.name}</div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-muted-foreground">
                      {p.team ?? "—"} · diff {p.difficulty}/5
                    </span>
                    <span className={`font-mono-tabular font-semibold ${costColorClass(Number(p.annual_cost))}`}>
                      {formatMoney(Number(p.annual_cost), { compact: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium">All detected ghost processes</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-44"
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No ghost processes detected yet.{" "}
                <Link to="/connect" className="text-primary underline-offset-2 hover:underline">
                  Connect your sources
                </Link>{" "}
                or{" "}
                <button
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => seedMut.mutate()}
                >
                  load demo data
                </button>
                .
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Process</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Monthly hrs</TableHead>
                    <TableHead className="text-right">Annual cost</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow key={p.id} className="animate-materialize">
                      <TableCell className="font-medium max-w-[280px]">
                        <Link
                          to="/process/$id"
                          params={{ id: p.id }}
                          className="hover:text-primary"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {p.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{p.team ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono-tabular text-xs">
                        {Number(p.monthly_hours).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-mono-tabular ${costBgClass(Number(p.annual_cost))}`}
                        >
                          {formatMoney(Number(p.annual_cost), { compact: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge value={p.confidence} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={p.status}
                          onValueChange={(v) =>
                            statusMut.mutate({ id: p.id, status: v as Status })
                          }
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["detected", "acknowledged", "in_progress", "fixed", "false_positive"] as Status[]).map(
                              (s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {STATUS_LABELS[s]}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/process/$id"
                          params={{ id: p.id }}
                          className="text-primary text-xs hover:underline"
                        >
                          Open →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function toScore(p: GhostProcess) {
  return { annual_cost: Number(p.annual_cost), difficulty: p.difficulty };
}

function KPI({
  label,
  value,
  icon,
  tone,
  big,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "danger" | "success";
  big?: boolean;
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card className="animate-materialize">
      <CardContent className="py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
          {icon} {label}
        </div>
        <div
          className={`mt-1 font-mono-tabular font-semibold ${toneClass} ${big ? "text-3xl md:text-4xl" : "text-2xl"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    high: "bg-success/15 text-success border-success/30",
    medium: "bg-warn/15 text-warn border-warn/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[value] ?? map.low}`}
    >
      {value}
    </span>
  );
}

function Heatmap({
  heatmap,
  teams,
}: {
  heatmap: { map: Record<string, Record<string, number>>; max: number };
  teams: string[];
}) {
  if (teams.length === 0)
    return <div className="text-xs text-muted-foreground">No team data yet.</div>;

  return (
    <div className="min-w-[640px]">
      <div className="grid" style={{ gridTemplateColumns: `140px repeat(${CATEGORIES.length}, 1fr)` }}>
        <div></div>
        {CATEGORIES.map((c) => (
          <div
            key={c}
            className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-center"
          >
            {c.split(" ")[0]}
          </div>
        ))}
        {teams.map((t) => (
          <>
            <div key={t} className="text-xs font-medium p-2 flex items-center">
              {t}
            </div>
            {CATEGORIES.map((c) => {
              const v = heatmap.map[t]?.[c] ?? 0;
              const intensity = heatmap.max > 0 ? v / heatmap.max : 0;
              const bg =
                v === 0
                  ? "transparent"
                  : `color-mix(in oklab, var(--danger) ${10 + intensity * 70}%, transparent)`;
              return (
                <div
                  key={t + c}
                  className="m-0.5 rounded-md border border-border h-12 grid place-items-center text-[11px] font-mono-tabular"
                  style={{ backgroundColor: bg }}
                  title={`${t} · ${c} · ${formatMoney(v)}`}
                >
                  {v > 0 ? formatMoney(v, { compact: true }) : ""}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
