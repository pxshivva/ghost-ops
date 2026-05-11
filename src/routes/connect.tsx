import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { seedDemoData } from "@/lib/seed.functions";
import { useInvalidateGhost } from "@/lib/hooks";
import { toast } from "sonner";
import { Calendar, Mail, FileSpreadsheet, MessageSquare, Sparkles, Check } from "lucide-react";

export const Route = createFileRoute("/connect")({
  component: Connect,
});

const SOURCES = [
  {
    id: "calendar",
    name: "Google Calendar",
    icon: Calendar,
    desc: "Detect recurring meetings with no agenda or doc — likely manual reporting handoffs.",
  },
  {
    id: "gmail",
    name: "Gmail (metadata)",
    icon: Mail,
    desc: "Find long email chains acting as approval workflows and scheduled report emails.",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: FileSpreadsheet,
    desc: "Spot 'tracker' spreadsheets edited on a schedule and shadow systems-of-record.",
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    desc: "Surface repeated questions and DM-based ticketing — the knowledge gaps.",
  },
];

function Connect() {
  const seedFn = useServerFn(seedDemoData);
  const invalidate = useInvalidateGhost();

  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: {} }),
    onSuccess: (r) => {
      toast.success(
        r.skipped ? "Demo data already loaded." : `Loaded ${r.inserted} ghost processes.`,
      );
      invalidate();
    },
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            data sources
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Connect signal sources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            GhostOps reads metadata only — never message bodies — to detect manual processes.
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <div className="font-medium">Try the demo first</div>
                <div className="text-xs text-muted-foreground">
                  Load 12 realistic ghost processes seeded across teams and categories.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
                Load demo data
              </Button>
              <Link to="/scan">
                <Button variant="outline">Run live scan →</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {s.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Not connected
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                  <Button size="sm" variant="outline" disabled className="w-full">
                    Connect (coming soon)
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="py-4 text-xs text-muted-foreground flex items-start gap-2">
            <Check className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
            <div>
              In this demo build, live OAuth connectors are stubbed out. The submission portal,
              detection engine, cost quantifier, dashboard, and roadmap all run end-to-end against
              seeded + employee-reported data.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
