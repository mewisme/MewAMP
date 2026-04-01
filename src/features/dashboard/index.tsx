import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { servicesAtom, type ServiceRuntimeState } from "@/stores/services";
import { getHtdocsPath, getInstallState, getServiceStatus, openFolder, startManagedService, stopService, type InstallState } from "@/lib/tauri-commands";
import { useNavigate } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

import {
  Globe,
  Database,
  FolderOpen,
  RotateCcw,
  Square,
  Play,
  Server,
  Settings2,
  Activity,
  HardDrive,
} from "lucide-react"
import { cn } from "@/lib/utils";

export function DashboardPanel() {
  const [services, setServices] = useAtom(servicesAtom);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [installState, setInstallState] = useState<InstallState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInstallState = async () => {
      try {
        const state = await getInstallState();
        setIsInstalled(state.install_completed);
        setInstallState(state);
      } catch (error) {
        console.error(error);
        setIsInstalled(false);
      }
    };

    loadInstallState();
  }, []);

  useEffect(() => {
    if (isInstalled !== true) {
      return;
    }

    const tick = async () => {
      const apache = await getServiceStatus("apache");
      const mariadb = await getServiceStatus("mariadb");
      setServices((prev) => ({
        apache: isTransitionState(prev.apache)
          ? prev.apache
          : (apache.status as ServiceRuntimeState),
        mariadb: isTransitionState(prev.mariadb)
          ? prev.mariadb
          : (mariadb.status as ServiceRuntimeState),
      }));
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [isInstalled, setServices]);

  if (isInstalled === false) {
    return (
      <Alert>
        <AlertTitle>Setup required</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Runtime is not installed yet. Run Setup Wizard first to download Apache, PHP, MariaDB, and phpMyAdmin.</p>
          <Button onClick={() => navigate("/setup")}>Open Setup Wizard</Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isInstalled === null) {
    return <div className="text-sm text-muted-foreground">Loading install state...</div>;
  }

  const openLocalhost = async () => {
    const port = installState?.ports.apache_http ?? 8080;
    try {
      await openUrl(`http://127.0.0.1:${port}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to open localhost.");
    }
  };

  const openPhpMyAdmin = async () => {
    const port = installState?.ports.apache_http ?? 8080;
    try {
      await openUrl(`http://127.0.0.1:${port}/phpmyadmin/`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to open phpMyAdmin.");
    }
  };

  const openHtdocs = async () => {
    try {
      const htdocsPath = await getHtdocsPath();
      await openFolder(htdocsPath);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open htdocs directory: ${String(error)}`);
    }
  };

  const openRuntime = async () => {
    const root = installState?.runtime_root;
    if (!root) return;
    try {
      await openFolder(root);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open runtime folder: ${String(error)}`);
    }
  };

  const openConfig = async () => {
    const root = installState?.config_root;
    if (!root) return;
    try {
      await openFolder(root);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open config folder: ${String(error)}`);
    }
  };

  const startDashboardService = async (name: "apache" | "mariadb") => {
    setServices((prev) => ({ ...prev, [name]: "starting" }));
    try {
      await startManagedService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} started.`);
    } catch (error) {
      console.error(error);
      setServices((prev) => ({ ...prev, [name]: "stopped" }));
      toast.error(`Failed to start ${name}: ${String(error)}`);
    }
  };

  const stopDashboardService = async (name: "apache" | "mariadb") => {
    setServices((prev) => ({ ...prev, [name]: "stopping" }));
    try {
      await stopService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} stopped.`);
    } catch (error) {
      console.error(error);
      setServices((prev) => ({ ...prev, [name]: "running" }));
      toast.error(`Failed to stop ${name}: ${String(error)}`);
    }
  };

  const restartService = async (name: "apache" | "mariadb") => {
    try {
      setServices((prev) => ({ ...prev, [name]: "stopping" }));
      await stopService(name);
      setServices((prev) => ({ ...prev, [name]: "starting" }));
      await startManagedService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} restarted.`);
    } catch (error) {
      console.error(error);
      const result = await getServiceStatus(name).catch(() => ({ status: "unknown" }));
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.error(`Failed to restart ${name}: ${String(error)}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Open common web endpoints and local folders quickly.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Web */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Web</p>
                <p className="text-xs text-muted-foreground">
                  Open local services in your browser
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                size="lg"
                className="h-14 justify-start rounded-xl px-4 text-left"
                onClick={openLocalhost}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open Localhost</span>
                    <span className="text-xs opacity-80">Main local web entry</span>
                  </div>
                </div>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-14 justify-start rounded-xl px-4 text-left"
                onClick={openPhpMyAdmin}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open PhpMyAdmin</span>
                    <span className="text-xs text-muted-foreground">
                      Database admin panel
                    </span>
                  </div>
                </div>
              </Button>
            </div>
          </section>

          {/* Files */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Files</p>
                <p className="text-xs text-muted-foreground">
                  Open project and runtime directories
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Button
                variant="outline"
                className="h-14 justify-start rounded-xl px-4 text-left"
                onClick={openHtdocs}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open htdocs</span>
                    <span className="text-xs text-muted-foreground">
                      Web root directory
                    </span>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-14 justify-start rounded-xl px-4 text-left"
                onClick={openRuntime}
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open Runtime</span>
                    <span className="text-xs text-muted-foreground">
                      Logs, temp, process data
                    </span>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-14 justify-start rounded-xl px-4 text-left"
                onClick={openConfig}
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open Config</span>
                    <span className="text-xs text-muted-foreground">
                      Service configuration files
                    </span>
                  </div>
                </div>
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ServiceCard
          name="Apache"
          type="apache"
          status={services.apache}
          description="Handles HTTP requests for your local web apps."
          onStart={() => startDashboardService("apache")}
          onStop={() => stopDashboardService("apache")}
          onRestart={() => restartService("apache")}
        />

        <ServiceCard
          name="MariaDB"
          type="database"
          status={services.mariadb}
          description="Local database server for apps and phpMyAdmin."
          onStart={() => startDashboardService("mariadb")}
          onStop={() => stopDashboardService("mariadb")}
          onRestart={() => restartService("mariadb")}
        />

        <SimpleServiceCard
          name="PHP"
          type="php"
          description="Used by Apache via FastCGI."
          actions={[
            { label: "Open htdocs", onClick: openHtdocs, icon: FolderOpen },
            { label: "Open Runtime", onClick: openRuntime, icon: Activity },
          ]}
        />

        <SimpleServiceCard
          name="phpMyAdmin"
          type="phpmyadmin"
          description="Browser-based database management UI."
          actions={[
            { label: "Open Browser", onClick: openPhpMyAdmin, icon: Globe },
            { label: "Open Config", onClick: openConfig, icon: Settings2 },
          ]}
        />
      </div>
    </div>
  );
}
function getServiceMeta(type: "apache" | "database" | "php" | "phpmyadmin") {
  switch (type) {
    case "apache":
      return {
        icon: Server,
        iconWrapClass: "bg-muted",
      }
    case "database":
      return {
        icon: Database,
        iconWrapClass: "bg-muted",
      }
    case "php":
      return {
        icon: Activity,
        iconWrapClass: "bg-muted",
      }
    case "phpmyadmin":
      return {
        icon: Globe,
        iconWrapClass: "bg-muted",
      }
  }
}

function isTransitionState(status: ServiceRuntimeState): boolean {
  return status === "starting" || status === "stopping";
}

function getStatusBadgeClass(status: "running" | "stopped" | "unknown" | "available" | "starting" | "stopping") {
  switch (status) {
    case "running":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    case "starting":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
    case "stopping":
      return "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
    case "stopped":
      return "border-border bg-muted text-muted-foreground"
    case "unknown":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    case "available":
      return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400"
  }
}

function ServiceCard({
  name,
  type,
  status,
  description,
  onStart,
  onStop,
  onRestart,
}: {
  name: string
  type: "apache" | "database"
  status: "running" | "stopped" | "unknown" | "starting" | "stopping"
  description: string
  onStart: () => void
  onStop: () => void
  onRestart: () => void
}) {
  const meta = getServiceMeta(type)
  const Icon = meta.icon

  const isRunning = status === "running"
  const isStarting = status === "starting"
  const isStopping = status === "stopping"
  const isBusy = isStarting || isStopping

  return (
    <Card className="h-full rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                meta.iconWrapClass
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div>
              <CardTitle className="text-lg leading-none">{name}</CardTitle>
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn("rounded-full px-2.5 py-1 text-xs capitalize", getStatusBadgeClass(status))}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {isRunning
            ? `${name} is currently running and ready to use.`
            : isStarting
              ? `${name} is starting...`
              : isStopping
                ? `${name} is stopping...`
                : status === "stopped"
                  ? `${name} is currently stopped.`
                  : `Current ${name} status could not be determined.`}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onStart}
            disabled={isRunning || isBusy}
            className="h-11 rounded-xl"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>

          <Button
            variant="outline"
            onClick={onStop}
            disabled={!isRunning || isBusy}
            className="h-11 rounded-xl"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>

          <Button
            variant="outline"
            onClick={onRestart}
            disabled={!isRunning || isBusy}
            className="h-11 rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SimpleServiceCard({
  name,
  type,
  description,
  actions,
}: {
  name: string
  type: "php" | "phpmyadmin"
  description: string
  actions: Array<{ label: string; onClick: () => void; icon?: React.ElementType }>
}) {
  const meta = getServiceMeta(type)
  const Icon = meta.icon

  return (
    <Card className="h-full rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-h-[60px] min-w-0">
              <CardTitle className="text-lg leading-tight">{name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 leading-snug">
                {description}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs capitalize",
              getStatusBadgeClass("available")
            )}
          >
            Available
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Utility tools and shortcuts.
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          {actions.map((action) => {
            const ActionIcon = action.icon

            return (
              <Button
                key={action.label}
                variant="outline"
                onClick={action.onClick}
                className="h-11 justify-start rounded-xl px-4"
              >
                {ActionIcon ? <ActionIcon className="mr-2 h-4 w-4 shrink-0" /> : null}
                <span className="truncate">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}