import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recomputeCost } from "@/lib/ghost";
import { z } from "zod";

const SEED_PROCESSES: Array<{
  name: string;
  description: string;
  category:
    | "Data Wrangling"
    | "Manual Reporting"
    | "Improvised Approval Workflow"
    | "Knowledge Retrieval"
    | "System Sync"
    | "Other";
  team: string;
  hours_per_occurrence: number;
  occurrences_per_month: number;
  people_involved: number;
  confidence: "low" | "medium" | "high";
  difficulty: number;
  recommendation: string;
  recommended_tools: string;
  implementation_days: number;
  evidence: Array<{ source: string; detail: string }>;
}> = [
  {
    name: "Tuesday 'Data Pull Sync' meeting",
    description:
      "Weekly 60-min meeting with no agenda or doc attached. Title contains 'sync' and attendees include data + ops. AI suspects this is a manual reporting handoff.",
    category: "Manual Reporting",
    team: "Operations",
    hours_per_occurrence: 1,
    occurrences_per_month: 4,
    people_involved: 8,
    confidence: "high",
    difficulty: 2,
    recommendation:
      "Replace with an automated Slack digest. Write a Python script that pulls the source dashboards into a Google Sheet and posts a Tuesday summary to #ops. Kill the meeting.",
    recommended_tools: "Python · Google Sheets API · Slack webhook",
    implementation_days: 1.5,
    evidence: [
      { source: "calendar", detail: "Recurring weekly · 8 attendees · no doc/agenda" },
      { source: "calendar", detail: "Title matches keywords: sync, pull" },
      { source: "drive", detail: "Spreadsheet 'ops-data-pull' edited 9am every Tue" },
    ],
  },
  {
    name: "Manual weekly board metrics report",
    description:
      "Spreadsheet edited every Friday afternoon, 4 editors, populates the board metrics deck. No system of record.",
    category: "Manual Reporting",
    team: "Finance",
    hours_per_occurrence: 4,
    occurrences_per_month: 4,
    people_involved: 2,
    confidence: "high",
    difficulty: 3,
    recommendation:
      "Move into a BI tool (Metabase / Looker Studio) sourced from the warehouse; auto-export to Slides on Friday morning.",
    recommended_tools: "Metabase · Google Slides API · scheduled job",
    implementation_days: 4,
    evidence: [
      { source: "drive", detail: "'Board Metrics Tracker' edited every Fri 14:00" },
      { source: "gmail", detail: "Recurring 'Board update' thread, Mon 9am, 14 replies/mo" },
    ],
  },
  {
    name: "Procurement approval email chain",
    description:
      "Long email threads (>12 replies) with attachments serve as an improvised approval workflow for vendor invoices.",
    category: "Improvised Approval Workflow",
    team: "Finance",
    hours_per_occurrence: 0.5,
    occurrences_per_month: 22,
    people_involved: 3,
    confidence: "high",
    difficulty: 2,
    recommendation:
      "Stand up a lightweight approval flow in Notion or an off-the-shelf tool (Pleo / Ramp). Email threads stop being load-bearing.",
    recommended_tools: "Notion + Form · Pleo · Ramp",
    implementation_days: 2,
    evidence: [
      { source: "gmail", detail: "'Vendor approval - $X' thread pattern, avg 14 replies" },
      { source: "gmail", detail: "PDF attachments on every other reply" },
    ],
  },
  {
    name: "Monday '#dev-help' repeat questions",
    description:
      "The same 5 questions about staging deploy access show up in #dev-help every Monday morning. Knowledge gap, not a question.",
    category: "Knowledge Retrieval",
    team: "Engineering",
    hours_per_occurrence: 0.25,
    occurrences_per_month: 30,
    people_involved: 4,
    confidence: "medium",
    difficulty: 1,
    recommendation:
      "Pin a one-page runbook in #dev-help and add a Slack workflow that replies to common phrases with the doc link.",
    recommended_tools: "Slack Workflow Builder · Notion runbook",
    implementation_days: 0.5,
    evidence: [
      { source: "slack", detail: "Phrase 'how do I deploy to staging' x14 in 30 days" },
      { source: "slack", detail: "Same answerer responds 80% of the time" },
    ],
  },
  {
    name: "CRM ↔ Billing manual sync",
    description:
      "Recurring calendar block 'Sync HubSpot/Stripe' every other Wednesday. Person manually exports CSVs and reconciles by hand.",
    category: "System Sync",
    team: "Sales",
    hours_per_occurrence: 3,
    occurrences_per_month: 2,
    people_involved: 1,
    confidence: "high",
    difficulty: 3,
    recommendation:
      "Build a Zapier/Make.com flow keyed on Stripe customer email → HubSpot deal stage. Daily, not bi-weekly.",
    recommended_tools: "Zapier · Make.com · HubSpot API",
    implementation_days: 2,
    evidence: [
      { source: "calendar", detail: "Bi-weekly block 'Sync HubSpot/Stripe', no doc" },
      { source: "drive", detail: "'crm-billing-recon.xlsx' edited every other Wed" },
    ],
  },
  {
    name: "Customer onboarding tracker spreadsheet",
    description:
      "Drive file 'Customer Onboarding Tracker' has 9 editors, no linked CRM record. Acts as a shadow CRM.",
    category: "Data Wrangling",
    team: "Customer Success",
    hours_per_occurrence: 0.4,
    occurrences_per_month: 40,
    people_involved: 5,
    confidence: "high",
    difficulty: 4,
    recommendation:
      "Adopt the existing CRM (HubSpot) as the system of record; build a CS pipeline view. Retire the spreadsheet.",
    recommended_tools: "HubSpot · Linear template · Notion DB",
    implementation_days: 8,
    evidence: [
      { source: "drive", detail: "9 editors, name contains 'tracker'" },
      { source: "drive", detail: "Edited 40+ times/month, no API integration" },
    ],
  },
  {
    name: "Friday 'send me the numbers' email",
    description:
      "Same exec sends the same Friday email asking for week's KPIs. Two analysts copy-paste from dashboards into a reply.",
    category: "Manual Reporting",
    team: "Operations",
    hours_per_occurrence: 1,
    occurrences_per_month: 4,
    people_involved: 2,
    confidence: "medium",
    difficulty: 1,
    recommendation:
      "Auto-email a templated KPI digest from the warehouse every Friday 8am.",
    recommended_tools: "Hex · Mode · scheduled email",
    implementation_days: 0.5,
    evidence: [
      { source: "gmail", detail: "Recurring 'Weekly numbers?' thread, Fri 16:00" },
    ],
  },
  {
    name: "Manual NPS export & tagging",
    description:
      "End-of-month: someone exports NPS survey CSV, opens in Sheets, tags responses by theme manually.",
    category: "Data Wrangling",
    team: "Product",
    hours_per_occurrence: 6,
    occurrences_per_month: 1,
    people_involved: 1,
    confidence: "medium",
    difficulty: 2,
    recommendation:
      "Use an LLM categorization step (Lovable AI) over the survey export; pipe into a dashboard.",
    recommended_tools: "Lovable AI · Google Sheets · scheduled job",
    implementation_days: 1.5,
    evidence: [
      { source: "drive", detail: "'NPS-tagged-MMM-YYYY' file created last day of month" },
    ],
  },
  {
    name: "PR review reminder DMs",
    description:
      "Engineers DM each other 'can you review my PR?' multiple times daily — no central queue.",
    category: "Knowledge Retrieval",
    team: "Engineering",
    hours_per_occurrence: 0.1,
    occurrences_per_month: 80,
    people_involved: 6,
    confidence: "medium",
    difficulty: 1,
    recommendation:
      "Adopt a rotation bot (Pull Panda, Slack Workflow) to surface stale PRs in a shared channel.",
    recommended_tools: "Pull Panda · Slack Workflow · GitHub Actions",
    implementation_days: 0.5,
    evidence: [
      { source: "slack", detail: "'can you review' DM phrase, 80+ instances/month" },
    ],
  },
  {
    name: "Quarterly comp review prep",
    description:
      "Once a quarter, People manually merges performance docs from Drive into a single sheet. 3 days of work.",
    category: "Data Wrangling",
    team: "People",
    hours_per_occurrence: 12,
    occurrences_per_month: 1 / 3,
    people_involved: 2,
    confidence: "low",
    difficulty: 4,
    recommendation:
      "Use Lattice / Leapsome compensation cycle module; eliminates the merge step.",
    recommended_tools: "Lattice · Leapsome",
    implementation_days: 6,
    evidence: [
      { source: "drive", detail: "'Comp-review-Q*' files; 2 editors, quarterly cadence" },
    ],
  },
  {
    name: "Marketing campaign launch checklist",
    description:
      "Pre-launch checklist lives in Slack DMs and emails. Things get missed every campaign.",
    category: "Improvised Approval Workflow",
    team: "Marketing",
    hours_per_occurrence: 2,
    occurrences_per_month: 4,
    people_involved: 4,
    confidence: "medium",
    difficulty: 2,
    recommendation:
      "Move to an Asana/Linear template with required fields and approvers.",
    recommended_tools: "Asana template · Linear · Notion DB",
    implementation_days: 1,
    evidence: [
      { source: "slack", detail: "'launch checklist?' phrase repeated in DMs" },
      { source: "gmail", detail: "Long thread 'Campaign X go/no-go' >10 replies" },
    ],
  },
  {
    name: "Daily standup notes copy-paste",
    description:
      "Manager copies standup notes from Slack into a Notion page every day.",
    category: "System Sync",
    team: "Engineering",
    hours_per_occurrence: 0.25,
    occurrences_per_month: 22,
    people_involved: 1,
    confidence: "high",
    difficulty: 1,
    recommendation:
      "Slack workflow → Notion API. One-time setup, eliminates the daily chore.",
    recommended_tools: "Slack Workflow · Notion API · Zapier",
    implementation_days: 0.5,
    evidence: [
      { source: "slack", detail: "Manager re-posts standup thread to Notion daily" },
    ],
  },
];

const SEED_SIGNALS = [
  { source: "calendar" as const, signal_type: "recurring_meeting", title: "Data Pull Sync (weekly)" },
  { source: "calendar" as const, signal_type: "recurring_meeting", title: "Sync HubSpot/Stripe" },
  { source: "calendar" as const, signal_type: "recurring_meeting", title: "Board update prep" },
  { source: "gmail" as const, signal_type: "long_thread", title: "Vendor approval - Acme Corp" },
  { source: "gmail" as const, signal_type: "long_thread", title: "Campaign Q3 go/no-go" },
  { source: "gmail" as const, signal_type: "scheduled_attachment", title: "Weekly KPIs - Friday" },
  { source: "drive" as const, signal_type: "recurring_edit", title: "Board Metrics Tracker.xlsx" },
  { source: "drive" as const, signal_type: "many_editors", title: "Customer Onboarding Tracker" },
  { source: "drive" as const, signal_type: "recurring_edit", title: "ops-data-pull.gsheet" },
  { source: "drive" as const, signal_type: "recurring_edit", title: "crm-billing-recon.xlsx" },
  { source: "slack" as const, signal_type: "repeated_question", title: "#dev-help 'how do I deploy'" },
  { source: "slack" as const, signal_type: "repeated_question", title: "DM 'can you review my PR'" },
];

export const seedDemoData = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () => {
    const sb = supabaseAdmin;

    // Skip if data already present
    const { count } = await sb
      .from("ghost_processes")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { inserted: 0, skipped: true };

    // Insert signals
    const sigPayload = SEED_SIGNALS.map((s) => ({
      ...s,
      metadata: {},
      fetched_at: new Date().toISOString(),
    }));
    const { data: insertedSignals } = await sb
      .from("signals")
      .insert(sigPayload)
      .select("id, source, title");

    // Get rate
    const { data: settings } = await sb
      .from("settings")
      .select("blended_hourly_rate")
      .eq("id", 1)
      .maybeSingle();
    const rate = Number(settings?.blended_hourly_rate ?? 75);

    // Map signal titles to ids for evidence linking
    const sigByTitle = new Map(
      (insertedSignals ?? []).map((s) => [s.title ?? "", s.id]),
    );

    const procPayload = SEED_PROCESSES.map((p) => {
      const { monthly_cost, annual_cost } = recomputeCost({
        hours_per_occurrence: p.hours_per_occurrence,
        occurrences_per_month: p.occurrences_per_month,
        people_involved: p.people_involved,
        rate,
      });
      // best-effort signal_ids
      const sids: string[] = [];
      for (const e of p.evidence) {
        for (const [t, id] of sigByTitle) {
          if (t && (e.detail.includes(t.split(" ")[0]) || t.toLowerCase().includes(e.source))) {
            sids.push(id);
          }
        }
      }
      return {
        name: p.name,
        description: p.description,
        category: p.category,
        team: p.team,
        hours_per_occurrence: p.hours_per_occurrence,
        occurrences_per_month: p.occurrences_per_month,
        people_involved: p.people_involved,
        monthly_cost,
        annual_cost,
        confidence: p.confidence,
        difficulty: p.difficulty,
        recommendation: p.recommendation,
        recommended_tools: p.recommended_tools,
        implementation_days: p.implementation_days,
        status: "detected" as const,
        source: "detected" as const,
        evidence: p.evidence,
        signal_ids: Array.from(new Set(sids)),
      };
    });

    const { error } = await sb.from("ghost_processes").insert(procPayload);
    if (error) throw new Error(error.message);
    return { inserted: procPayload.length, skipped: false };
  });

export const setHourlyRate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ rate: z.number().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const sb = supabaseAdmin;
    // Update settings
    await sb.from("settings").update({ blended_hourly_rate: data.rate }).eq("id", 1);

    // Recompute all costs
    const { data: rows } = await sb
      .from("ghost_processes")
      .select("id, hours_per_occurrence, occurrences_per_month, people_involved");
    if (!rows) return { updated: 0 };
    for (const r of rows) {
      const c = recomputeCost({
        hours_per_occurrence: Number(r.hours_per_occurrence),
        occurrences_per_month: Number(r.occurrences_per_month),
        people_involved: Number(r.people_involved),
        rate: data.rate,
      });
      await sb
        .from("ghost_processes")
        .update({ monthly_cost: c.monthly_cost, annual_cost: c.annual_cost })
        .eq("id", r.id);
    }
    return { updated: rows.length };
  });

export const updateGhostProcess = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum(["detected", "acknowledged", "in_progress", "fixed", "false_positive"])
          .optional(),
        owner: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("ghost_processes")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
