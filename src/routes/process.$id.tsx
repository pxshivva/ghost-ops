import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useGhostProcess, useSignals, useInvalidateGhost } from "@/lib/hooks";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { updateGhostProcess } from "@/lib/seed.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatMoney, costColorClass, STATUS_LABELS, type Status } from "@/lib/ghost";
import { ArrowLeft, Calendar, FileSpreadsheet, Mail, MessageSquare, User } from "lucide-react";

export const Route = createFileRoute("/process/$id")({
  component: ProcessDetail,
});

const STAGES: Status[] = ["detected", "acknowledged", "in_progress", "fixed"];

function ProcessDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: p, isLoading } = useGhostProcess(id);
  const { data: signals = [] } = useSignals(p?.signal_ids ?? []);
  const updateFn = useServerFn(updateGhostProcess);
  const invalidate = useInvalidateGhost();
  const [owner, setOwner] = useState("");

  const mut = useMutation({
    mutationFn: (patch: { status?: Status; owner?: string }) =>
      updateFn({ data: { id, ...patch } }),
    onSuccess: () => {
      invalidate();
      router.invalidate();
    },
  });

  if (isLoading)
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  if (!p)
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Not found.</div>
      </AppShell>
    );

  const currentStage = Math.max(0, STAGES.indexOf(p.status as Status));

  return (
    <AppShell>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {p.category} · {p.team ?? "—"}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">{p.name}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{p.description}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            annual cost
          </div>
          <div
            className={`text-3xl md:text-4xl font-mono-tabular font-semibold ${costColorClass(Number(p.annual_cost))}`}
          >
            {formatMoney(Number(p.annual_cost))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => mut.mutate({ status: s })}
                      className={`flex-1 rounded-md border px-3 py-2 text-xs text-left transition-colors ${
                        i <= currentStage
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent/40"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">step {i + 1}</div>
                      <div className="font-medium">{STATUS_LABELS[s]}</div>
                    </button>
                    {i < STAGES.length - 1 && (
                      <div className="h-px w-2 bg-border" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  placeholder={p.owner ?? "Assign owner…"}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!owner.trim()}
                  onClick={() => {
                    mut.mutate({ owner: owner.trim() });
                    setOwner("");
                  }}
                >
                  <User className="h-3.5 w-3.5 mr-1.5" /> Assign
                </Button>
                {p.owner && (
                  <Badge variant="outline" className="text-[10px]">
                    Owner: {p.owner}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recommended fix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{p.recommendation}</p>
              {p.recommended_tools && (
                <div className="flex flex-wrap gap-1.5">
                  {p.recommended_tools.split("·").map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] font-normal">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Est. implementation: {p.implementation_days ?? 3} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Signal evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(p.evidence as Array<{ source: string; detail: string }>).map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-border bg-card/50 p-2.5 text-xs"
                >
                  <SourceIcon source={e.source} />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {e.source}
                    </div>
                    {e.detail}
                  </div>
                </div>
              ))}
              {signals.length > 0 && (
                <div className="text-[11px] text-muted-foreground pt-1">
                  Linked signals: {signals.map((s) => s.title).filter(Boolean).join(", ")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <Row k="Hours per occurrence" v={Number(p.hours_per_occurrence).toFixed(2)} />
            <Row k="Occurrences / month" v={Number(p.occurrences_per_month).toFixed(2)} />
            <Row k="People involved" v={p.people_involved.toString()} />
            <Row k="Monthly hours" v={Number(p.monthly_hours).toFixed(1)} />
            <div className="h-px bg-border my-2" />
            <Row k="Monthly cost" v={formatMoney(Number(p.monthly_cost))} />
            <Row k="Annual cost" v={formatMoney(Number(p.annual_cost))} highlight />
            <div className="h-px bg-border my-2" />
            <Row k="Confidence" v={p.confidence.toUpperCase()} />
            <Row k="Difficulty" v={`${p.difficulty}/5`} />
            <Row k="Source" v={p.source} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={`font-mono-tabular ${highlight ? "text-danger font-semibold" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}

function SourceIcon({ source }: { source: string }) {
  const Icon =
    source === "calendar"
      ? Calendar
      : source === "gmail"
        ? Mail
        : source === "drive"
          ? FileSpreadsheet
          : MessageSquare;
  return <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />;
}
