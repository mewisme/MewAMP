import type { ElementType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServiceRuntimeState } from "@/stores/services";
import { getServiceMeta, getStatusBadgeClass } from "@/features/dashboard/dashboard-utils";
import { Play, Square, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function SqlLocaldbServiceCard({
  instanceOptions,
  instance,
  onInstanceChange,
  status,
  busy,
  onCommand,
}: {
  instanceOptions: string[];
  instance: string;
  onInstanceChange: (v: string) => void;
  status: ServiceRuntimeState;
  busy: boolean;
  onCommand: (cmd: "start" | "stop" | "info") => void;
}) {
  const meta = getServiceMeta("sqllocaldb");
  const Icon = meta.icon;
  const isRunning = status === "running";
  const isStarting = status === "starting";
  const isStopping = status === "stopping";
  const isBusy = isStarting || isStopping || busy;

  const commands: Array<{
    cmd: "start" | "stop" | "info";
    label: string;
    icon: ElementType;
    variant?: "outline";
  }> = [
    { cmd: "start", label: "Start", icon: Play },
    { cmd: "stop", label: "Stop", icon: Square, variant: "outline" },
    { cmd: "info", label: "Info", icon: Info, variant: "outline" },
  ];

  return (
    <Card className="h-full rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-h-[60px] min-w-0">
              <CardTitle className="text-lg leading-tight">SqlLocalDB</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 leading-snug">Manage LocalDB instances on Windows.</CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs capitalize", getStatusBadgeClass(status))}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="space-y-1 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <p>
            {isRunning
              ? `${instance} is running and ready to use.`
              : isStarting
                ? `${instance} is starting...`
                : isStopping
                  ? `${instance} is stopping...`
                  : status === "stopped"
                    ? `${instance} is stopped.`
                    : `Current status for ${instance} could not be determined.`}
          </p>
          <p className="text-xs opacity-90">CLI output is logged under Logs → SqlLocalDB.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium" htmlFor="dashboard-sqllocaldb-instance">
            Instance
          </Label>
          <Select
            value={instance}
            onValueChange={(v) => {
              if (typeof v === "string" && v) onInstanceChange(v);
            }}
          >
            <SelectTrigger id="dashboard-sqllocaldb-instance" className="h-11 w-full rounded-xl font-mono text-sm" size="default">
              <SelectValue placeholder="Select instance" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {instanceOptions.map((name) => (
                <SelectItem key={name} value={name} className="rounded-lg font-mono text-sm">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2">
          {commands.map(({ cmd, label, icon: ActionIcon, variant }) => {
            const empty = instance.trim() === "";
            const disabled =
              empty ||
              (cmd === "start" && (isRunning || isBusy)) ||
              (cmd === "stop" && (!isRunning || isBusy)) ||
              (cmd === "info" && busy);

            return (
              <Button
                key={cmd}
                type="button"
                variant={variant ?? "default"}
                disabled={disabled}
                className="h-11 rounded-xl"
                onClick={() => onCommand(cmd)}
              >
                <ActionIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
