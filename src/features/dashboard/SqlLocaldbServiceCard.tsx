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
import { Info, Play, Square } from "lucide-react";
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
  const visibleCommands = commands.filter((c) => {
    if (c.cmd === "start") return status !== "running" && status !== "starting";
    if (c.cmd === "stop") return status !== "stopped";
    return true;
  });
  const actionCount = visibleCommands.length;

  return (
    <Card className="h-full rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-colors hover:border-border">
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">SqlLocalDB</CardTitle>
              <CardDescription className="mt-0.5 text-xs">LocalDB instances (Windows).</CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn("shrink-0 px-2 py-0.5 text-[10px] capitalize", getStatusBadgeClass(status))}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-2 pt-0">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium" htmlFor="dashboard-sqllocaldb-instance">
            Instance
          </Label>
          <Select
            value={instance}
            onValueChange={(v) => {
              if (typeof v === "string" && v) onInstanceChange(v);
            }}
          >
            <SelectTrigger id="dashboard-sqllocaldb-instance" className="w-full font-mono text-xs" size="default">
              <SelectValue placeholder="Select instance" />
            </SelectTrigger>
            <SelectContent>
              {instanceOptions.map((name) => (
                <SelectItem key={name} value={name} className="font-mono text-xs">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            "mt-auto grid gap-3",
            actionCount === 1 && "grid-cols-1",
            actionCount === 2 && "grid-cols-2",
            actionCount >= 3 && "grid-cols-3"
          )}
        >
          {visibleCommands.map(({ cmd, label, icon: ActionIcon, variant }) => {
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
                size="sm"
                variant={variant ?? "default"}
                disabled={disabled}
                className="gap-1 text-center"
                onClick={() => onCommand(cmd)}
              >
                <ActionIcon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
