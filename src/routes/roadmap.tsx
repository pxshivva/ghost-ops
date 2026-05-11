import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGhostProcesses, useSettings } from "@/lib/hooks";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  costColorClass,
  roiScore,
  paybackPeriodDays,
} from "@/lib/ghost";
import { Sparkles, Zap, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/roadmap")({
  component: Roadmap,
});

function Roadmap() {
  const { data: processes = [] } = useGhostProcesses();
  const { data: settings } = useSettings();
  const rate = Number(settings?.blended_hourly_rate ?? 75);

  const sorted = useMemo(
    () =>
      [...processes]
        .filter((p) => p.status !== "false_positive" && p.status !== "fixed")
        .sort(
          (a, b) =>
            roiScore({ annual_cost: Number(b.annual_cost), difficulty: b.difficulty }) -
            roiScore({ annual_cost: Number(a.annual_cost), difficulty: a.difficulty }),
        ),
    [processes],
  );

  const top5 = sorted.slice(0, 5);
  const top5Annual = top5.reduce((a, p) => a + Number(p.annual_cost), 0);
  const top5Q1 = top5Annual / 4;

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            automation roadmap
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Fix these in order
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prioritized by ROI per unit of implementation effort.
          </p>
        </div>

        {top5.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                If you fix these top {top5.length} ghost processes in order, you recover{" "}
                <span className="font-mono-tabular font-semibold text-success">
                  {formatMoney(top5Q1, { compact: true })}
                </span>{" "}
                in the first quarter and{" "}
                <span className="font-mono-tabular font-semibold text-success">
                  {formatMoney(top5Annual, { compact: true })}
                </span>{" "}
                annually. They're sequenced by cost-to-fix-effort ratio so the cheapest, highest-impact
                wins land first.
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {sorted.map((p, i) => {
            const payback = paybackPeriodDays({
              annual_cost: Number(p.annual_cost),
              implementation_days: Number(p.implementation_days ?? 3),
              rate,
            });
            const quickWin = (p.implementation_days ?? 3) <= 1;
            return (
              <Link
                to="/process/$id"
                params={{ id: p.id }}
                key={p.id}
                className="block animate-materialize"
              >
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="font-mono-tabular text-xl text-muted-foreground w-8 shrink-0">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-sm">{p.name}</div>
                          {quickWin && (
                            <Badge className="bg-warn/15 text-warn border-warn/30 text-[10px]">
                              <Zap className="h-3 w-3 mr-1" /> Quick win
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {p.category}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {p.recommendation}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:flex md:items-center gap-4 md:gap-6 text-right">
                      <Stat
                        label="Annual"
                        value={formatMoney(Number(p.annual_cost), { compact: true })}
                        toneClass={costColorClass(Number(p.annual_cost))}
                      />
                      <Stat label="Effort" value={`${p.implementation_days ?? 3}d`} />
                      <Stat
                        label="Payback"
                        value={payback ? `${payback}d` : "—"}
                      />
                      <ArrowUpRight className="hidden md:block h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {sorted.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No ghost processes to plan yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  toneClass = "",
}: {
  label: string;
  value: string;
  toneClass?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono-tabular text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
