import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wand2,
  FileText,
  Settings2,
  Activity,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/setup", label: "Setup Wizard", icon: Wand2 },
  { to: "/logs", label: "Logs", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings2 },
  { to: "/diagnostics", label: "Diagnostics", icon: Activity },
];

export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-border/60 bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="mb-4 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight">MewAMP</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Local web stack manager
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "border border-border/60 bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-background text-foreground"
                          : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="truncate">{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/40 px-3 py-3">
          <p className="text-xs text-muted-foreground">
            Manage Apache, PHP, MariaDB, phpMyAdmin, logs, and setup flows in one place.
          </p>
        </div>
      </div>
    </aside>
  );
}