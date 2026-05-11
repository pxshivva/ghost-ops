import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LayoutDashboard, Plug, Radar, Map, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/connect", label: "Sources", icon: Plug },
  { to: "/scan", label: "Scan", icon: Radar },
  { to: "/report", label: "Report Ghost Work", icon: Megaphone },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative h-7 w-7 rounded-md bg-primary/15 grid place-items-center glow-primary">
              <Activity className="h-4 w-4 text-primary" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary pulse-dot" />
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight">GhostOps</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ops intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active =
                l.to === "/" ? path === "/" : path.startsWith(l.to);
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            live
          </div>
        </div>

        <nav className="md:hidden border-t border-border overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-2">
            {links.map((l) => {
              const active =
                l.to === "/" ? path === "/" : path.startsWith(l.to);
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        GhostOps · making the invisible visible
      </footer>
    </div>
  );
}
