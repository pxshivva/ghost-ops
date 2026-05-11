import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { submitGhostWork, getReportStats } from "@/lib/submissions.functions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TEAMS, formatMoney } from "@/lib/ghost";
import { toast } from "sonner";
import { Megaphone, Ghost } from "lucide-react";

export const Route = createFileRoute("/report")({
  component: Report,
});

function Report() {
  const submit = useServerFn(submitGhostWork);
  const stats = useServerFn(getReportStats);

  const [taskName, setTaskName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [hours, setHours] = useState(1);
  const [people, setPeople] = useState(1);
  const [missingTool, setMissingTool] = useState("");
  const [team, setTeam] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");

  const statsQ = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => stats(),
    refetchInterval: 5000,
  });

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          task_name: taskName,
          frequency: frequency as any,
          hours,
          people,
          missing_tool: missingTool,
          team,
          anonymous,
          reporter_name: name,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Reported. AI estimates ~${formatMoney(r.annual_cost, { compact: true })}/yr.`,
      );
      setTaskName("");
      setMissingTool("");
      setHours(1);
      setPeople(1);
      statsQ.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex h-10 w-10 rounded-full bg-primary/15 text-primary items-center justify-center mb-3 glow-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Report a manual task
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anonymous by default. We'll quantify the cost and roll it into the dashboard.
          </p>
        </div>

        {statsQ.data && (
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                reports
              </div>
              <div className="font-mono-tabular text-lg font-semibold flex items-center gap-1">
                <Ghost className="h-3.5 w-3.5 text-primary" />
                {statsQ.data.count}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                savings identified
              </div>
              <div className="font-mono-tabular text-lg font-semibold text-success">
                {formatMoney(statsQ.data.totalAnnual, { compact: true })}
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Task name</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Manually compile weekly KPI deck"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">I do this every…</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Day</SelectItem>
                    <SelectItem value="weekly">Week</SelectItem>
                    <SelectItem value="monthly">Month</SelectItem>
                    <SelectItem value="quarterly">Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Which team?</Label>
                <Select value={team} onValueChange={setTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hours per occurrence</Label>
                <Input
                  type="number"
                  step={0.25}
                  min={0.05}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">People involved</Label>
                <Input
                  type="number"
                  min={1}
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">What tool or system would fix this?</Label>
              <Textarea
                value={missingTool}
                onChange={(e) => setMissingTool(e.target.value)}
                placeholder="e.g. A scheduled Slack digest pulled from the warehouse"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                Stay anonymous
              </Label>
              {!anonymous && (
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-44"
                />
              )}
            </div>

            <Button
              className="w-full"
              disabled={!taskName.trim() || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Reporting…" : "Report ghost work"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
