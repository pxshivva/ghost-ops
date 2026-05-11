import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { recomputeCost, frequencyToOccurrences } from "@/lib/ghost";

export const submitGhostWork = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        task_name: z.string().trim().min(2).max(200),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
        hours: z.number().min(0.05).max(200),
        people: z.number().int().min(1).max(500),
        missing_tool: z.string().max(500).optional().default(""),
        team: z.string().max(80).optional().default(""),
        anonymous: z.boolean().default(true),
        reporter_name: z.string().max(120).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = supabaseAdmin;
    const { data: settings } = await sb
      .from("settings")
      .select("blended_hourly_rate")
      .eq("id", 1)
      .maybeSingle();
    const rate = Number(settings?.blended_hourly_rate ?? 75);

    const occ = frequencyToOccurrences(data.frequency);
    const { monthly_cost, annual_cost } = recomputeCost({
      hours_per_occurrence: data.hours,
      occurrences_per_month: occ,
      people_involved: data.people,
      rate,
    });

    const { data: gp, error: gpErr } = await sb
      .from("ghost_processes")
      .insert({
        name: data.task_name,
        description: data.missing_tool
          ? `Reported by employee. Missing tool: ${data.missing_tool}`
          : "Reported by employee.",
        category: "Other",
        team: data.team || null,
        hours_per_occurrence: data.hours,
        occurrences_per_month: occ,
        people_involved: data.people,
        monthly_cost,
        annual_cost,
        confidence: "medium",
        difficulty: 3,
        recommendation: data.missing_tool
          ? `Build/adopt: ${data.missing_tool}`
          : "Investigate and design an automated solution.",
        recommended_tools: data.missing_tool || null,
        implementation_days: 3,
        status: "detected",
        source: "reported",
        evidence: [{ source: "manual", detail: "Employee submission" }],
        signal_ids: [],
      })
      .select("id")
      .single();
    if (gpErr) throw new Error(gpErr.message);

    const { error: subErr } = await sb.from("submissions").insert({
      task_name: data.task_name,
      frequency: data.frequency,
      hours: data.hours,
      people: data.people,
      missing_tool: data.missing_tool || null,
      team: data.team || null,
      anonymous: data.anonymous,
      reporter_name: data.anonymous ? null : data.reporter_name || null,
      ghost_process_id: gp!.id,
    });
    if (subErr) throw new Error(subErr.message);

    return { ok: true, annual_cost };
  });

export const getReportStats = createServerFn({ method: "GET" }).handler(async () => {
  const sb = supabaseAdmin;
  const { count } = await sb
    .from("submissions")
    .select("*", { count: "exact", head: true });
  const { data: rows } = await sb
    .from("ghost_processes")
    .select("annual_cost")
    .eq("source", "reported");
  const total = (rows ?? []).reduce((a, r) => a + Number(r.annual_cost ?? 0), 0);
  return { count: count ?? 0, totalAnnual: total };
});
