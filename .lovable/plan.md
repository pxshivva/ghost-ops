## GhostOps — Build Plan

An internal AI tool that ingests signals from Google Calendar, Gmail, Drive, and Slack (plus a public submission form), detects "ghost work," quantifies its cost, and generates a prioritized automation roadmap.

### Stack
- TanStack Start + Tailwind + shadcn (already scaffolded)
- Lovable Cloud (Postgres) for storage
- Lovable AI Gateway (`google/gemini-3-flash-preview`) for detection + roadmap narrative
- Lovable connectors: Google Calendar, Gmail, Google Drive, Slack (builder account)
- Recharts for visualizations
- No auth — single demo workspace

---

### Step 1 — Backend foundation
- Enable Lovable Cloud.
- Create tables:
  - `signals` (source, type, raw JSON metadata, fetched_at)
  - `ghost_processes` (name, category, description, monthly_hours, monthly_cost, annual_cost, confidence, difficulty, recommendation, status, owner, source: detected/reported, evidence JSON)
  - `submissions` (task_name, frequency, hours, people, missing_tool, team, anonymous, name, created_at)
  - `settings` (singleton: blended_hourly_rate)
- Connect Google Calendar, Gmail, Drive, Slack via `standard_connectors--connect`.

### Step 2 — Connector ingestion (server functions)
One file per source under `src/lib/connectors/`:
- `calendar.functions.ts` — list events ±90d, extract recurring series, attendees, agenda/doc links.
- `gmail.functions.ts` — list threads, group by subject, count replies, detect attachment cadence (metadata only).
- `drive.functions.ts` — list files, modifiedTime history, editor count, name keywords.
- `slack.functions.ts` — list channels, sample recent messages, detect repeated questions and "can you send/pull/update" phrases.
- Each returns normalized `Signal[]` and persists to `signals`.
- One `runScan()` orchestrator runs all four in parallel and returns a stream of progress events.

### Step 3 — Detection engine
`src/lib/detect/` with two layers:
1. **Rule-based detectors** (pure TS): the 5 hard-coded rules from the spec produce candidate ghost processes with evidence + confidence.
2. **AI synthesis pass** (Lovable AI Gateway, structured `Output.object` with Zod schema): receives normalized signals + rule candidates, returns the 7 fields per ghost process (name, signals, hours, cost, category, recommendation, difficulty).
Merge AI + rule outputs, dedupe overlaps with submissions, write to `ghost_processes`.

### Step 4 — Cost quantifier
- Pure function applied at write + on rate change: `monthly_cost = hours_per_occurrence × occurrences_per_month × people × rate`; annual = ×12.
- Confidence = bucket on signal count (1=low, 2=medium, 3+=high).

### Step 5 — Submission portal
Public route `/report` (no auth):
- Form with all spec fields + anonymous toggle.
- Live counter: "X reports • $Y identified."
- Submissions feed `ghost_processes` as `source='reported'` and merge with detected items via fuzzy name/category match.

### Step 6 — Dashboard (`/`)
- Hero stats bar (4 KPIs, monospace cost numbers).
- Heat map (Recharts): teams × categories, color = cost.
- Quick Wins panel (top 5 by cost÷difficulty).
- Cost trend (mock series until multiple scans exist).
- Sortable table of all ghost processes with cost badges (red/orange/yellow), filters, "false positive" + "being fixed" actions.
- Hourly rate input (updates settings, recalculates).
- Export PDF (print stylesheet) + CSV.

### Step 7 — Roadmap (`/roadmap`)
- Sorted by ROI/effort.
- Each item: cost, recommendation, est. implementation time, payback period, Quick Win badge.
- AI-generated narrative paragraph at top ("If you fix these top 5...").

### Step 8 — Process detail (`/process/$id`)
- Evidence list (linked signals).
- AI description, cost breakdown, recommendation steps.
- Status tracker: Detected → Acknowledged → In Progress → Fixed.
- Assign owner.

### Step 9 — Connect + Scan flow (`/connect`, `/scan`)
- `/connect`: cards for each source showing connected/not-connected, OAuth buttons (trigger connector tool).
- `/scan`: animated mission-control screen — live counter of signals processed and ghost processes "materializing" as the orchestrator streams progress, then redirects to dashboard.

### Step 10 — Design system + polish
- Update `src/styles.css` tokens: bg `#0a0a0f`, accent electric blue, semantic cost colors (danger/warn/ok), monospace font for numbers.
- Subtle materialize animation on cards.
- Seed script: insert ~12 realistic demo ghost processes + signals so the demo works even before connectors finish.

---

### Routes summary
```
/              dashboard
/connect       data sources
/scan          live scan view
/roadmap       prioritized fixes
/process/$id   detail page
/report        public submission portal (no auth)
```

### Out of scope (stretch, not built now)
Slack proactive bot, Jira/Linear ticket creation, Fix-It wizard, weekly digest emails, industry benchmarks.

I'll build this in the order above so the demo flow (Connect → Scan → Dashboard → Roadmap → Detail → Report) is walkable end-to-end as early as possible.
