import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { seedDemoData } from "@/lib/seed.functions";
import { useGhostProcesses, useInvalidateGhost } from "@/lib/hooks";
import { Radar, Calendar, Mail, FileSpreadsheet, MessageSquare } from "lucide-react";
import { formatMoney } from "@/lib/ghost";

export const Route = createFileRoute("/scan")({
  component: Scan,
});

const STAGES = [
  { src: "calendar", icon: Calendar, label: "Scanning Google Calendar" },
  { src: "gmail", icon: Mail, label: "Scanning Gmail metadata" },
  { src: "drive", icon: FileSpreadsheet, label: "Scanning Google Drive" },
  { src: "slack", icon: MessageSquare, label: "Scanning Slack channels" },
];

function Scan() {
  const navigate = useNavigate();
  const seedFn = useServerFn(seedDemoData);
  const invalidate = useInvalidateGhost();
  const { data: processes = [] } = useGhostProcesses();

  const [stage, setStage] = useState(0);
  const [signalsScanned, setSignalsScanned] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [costFound, setCostFound] = useState(0);
  const [done, setDone] = useState(false);

  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: {} }),
    onSuccess: () => invalidate(),
  });

  useEffect(() => {
    seedMut.mutate();
  }, []);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setSignalsScanned((s) => s + Math.floor(8 + Math.random() * 25));
      setStage((s) => (s + 1) % STAGES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (processes.length === 0) return;
    if (revealed >= processes.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      const next = processes[revealed];
      setCostFound((c) => c + Number(next.annual_cost));
      setRevealed((r) => r + 1);
    }, 350);
    return () => clearTimeout(t);
  }, [processes, revealed]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-primary/15 text-primary items-center justify-center mb-3 glow-primary">
            <Radar className="h-6 w-6 pulse-dot" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {done ? "Scan complete" : "Scanning your signals…"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {done
              ? "Here's what surfaced."
              : "Reading metadata from connected sources. Detecting ghost work patterns."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const active = !done && stage === i;
            const completed = done || stage > i;
            return (
              <Card
                key={s.src}
                className={`transition-colors ${
                  active ? "border-primary/60 bg-primary/5" : ""
                }`}
              >
                <CardContent className="py-3 flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${
                      completed ? "text-success" : active ? "text-primary pulse-dot" : "text-muted-foreground"
                    }`}
                  />
                  <div className="text-xs">
                    <div className="font-medium leading-tight">{s.label.replace("Scanning ", "")}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {completed ? "done" : active ? "scanning…" : "queued"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Signals analyzed" value={signalsScanned.toLocaleString()} />
          <Stat label="Ghost processes" value={revealed.toString()} accent />
          <Stat
            label="Annual cost found"
            value={formatMoney(costFound, { compact: true })}
            danger
          />
        </div>

        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              materializing…
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {processes.slice(0, revealed).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/50 p-2 text-xs animate-materialize"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono-tabular text-danger shrink-0">
                    {formatMoney(Number(p.annual_cost), { compact: true })}
                  </span>
                </div>
              ))}
              {revealed === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Waiting for first detection…
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {done && (
          <div className="text-center">
            <Button onClick={() => navigate({ to: "/" })}>
              Open dashboard →
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div
          className={`text-2xl font-mono-tabular font-semibold mt-1 ${
            danger ? "text-danger" : accent ? "text-primary" : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
