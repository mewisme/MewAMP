import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  Package,
  Settings2,
  Server,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Monitor,
  Palette,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkPorts } from "@/lib/tauri-commands";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Settings = {
  runtime_root: string;
  data_root: string;
  config_root: string;
  selected_manifest_source: string;
  selected_manifest_version: string;
};

type PortStatus = "idle" | "checking" | "available" | "in_use";

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [httpPort, setHttpPort] = useState(8080);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [portStatus, setPortStatus] = useState<PortStatus>("idle");
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const result = await invoke<Settings>("get_app_settings");
        setSettings(result);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load settings.");
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const validatePort = async () => {
    setPortStatus("checking");
    try {
      const result = await checkPorts([httpPort]);
      const available = result[0]?.available;

      if (available) {
        setPortStatus("available");
        toast.success("Port is available.");
      } else {
        setPortStatus("in_use");
        toast.error("Port is already in use.");
      }
    } catch (error) {
      console.error(error);
      setPortStatus("idle");
      toast.error("Failed to validate port.");
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-lg leading-tight">Settings</CardTitle>
            <CardDescription className="mt-1">
              Review manifest details, appearance, and validate local service ports.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryTile
            icon={Package}
            label="Manifest Source"
            value={loadingSettings ? "Loading..." : settings?.selected_manifest_source || "Not available"}
          />

          <SummaryTile
            icon={Server}
            label="Manifest Version"
            value={loadingSettings ? "Loading..." : settings?.selected_manifest_version || "Not available"}
          />
        </div>

        <Card className="rounded-2xl border-border/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium">Appearance</div>
                <p className="text-sm text-muted-foreground">
                  Choose how MewAMP looks across the app.
                </p>
              </div>
            </div>

            {mounted ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <ThemeOption
                  icon={Sun}
                  label="Light"
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                />
                <ThemeOption
                  icon={Moon}
                  label="Dark"
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                <ThemeOption
                  icon={Monitor}
                  label="System"
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <div className="font-medium">HTTP Port Validation</div>
              <p className="text-sm text-muted-foreground">
                Check whether the selected local HTTP port is free before applying it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="http-port">HTTP Port</Label>
              <Input
                id="http-port"
                type="number"
                value={httpPort}
                onChange={(e) => {
                  setHttpPort(Number(e.target.value));
                  setPortStatus("idle");
                }}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={validatePort}
                disabled={portStatus === "checking"}
                className="h-11 rounded-xl"
              >
                {portStatus === "checking" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Validate Port"
                )}
              </Button>

              <PortStatusBadge status={portStatus} />
            </div>
          </CardContent>
        </Card>

        {settings && (
          <div className="grid gap-4 md:grid-cols-3">
            <PathTile label="Runtime Root" value={settings.runtime_root} />
            <PathTile label="Data Root" value={settings.data_root} />
            <PathTile label="Config Root" value={settings.config_root} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="truncate font-medium">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PathTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-2 p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="break-all text-sm font-medium">{value || "Not set"}</div>
      </CardContent>
    </Card>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 justify-between rounded-xl px-4 py-3",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>

      {active ? (
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Check className="h-4 w-4" />
          <span>Selected</span>
        </div>
      ) : null}
    </Button>
  );
}

function PortStatusBadge({ status }: { status: PortStatus }) {
  if (status === "idle") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
        Not checked
      </Badge>
    );
  }

  if (status === "checking") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
        Checking...
      </Badge>
    );
  }

  if (status === "available") {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Available
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400"
    >
      <AlertCircle className="mr-1 h-3.5 w-3.5" />
      In use
    </Badge>
  );
}