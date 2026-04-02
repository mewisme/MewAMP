import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceMeta, getStatusBadgeClass } from "@/features/dashboard/dashboard-utils";
import { Play, RotateCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServiceCard({
  name,
  type,
  status,
  description,
  onStart,
  onStop,
  onRestart,
}: {
  name: string;
  type: "apache" | "database";
  status: "running" | "stopped" | "unknown" | "starting" | "stopping";
  description: string;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
}) {
  const meta = getServiceMeta(type);
  const Icon = meta.icon;
  const isRunning = status === "running";
  const isStarting = status === "starting";
  const isStopping = status === "stopping";
  const isBusy = isStarting || isStopping;
  const showStart = status !== "running" && status !== "starting";
  const showStopRestart = status !== "stopped";
  const actionCount = (showStart ? 1 : 0) + (showStopRestart ? 2 : 0);

  return (
    <Card className="h-full rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-colors hover:border-border">
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.iconWrapClass)}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">{name}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
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

      <CardContent className="space-y-2 pt-0">
        <div
          className={cn(
            "grid gap-3",
            actionCount === 1 && "grid-cols-1",
            actionCount === 2 && "grid-cols-2",
            actionCount === 3 && "grid-cols-3"
          )}
        >
          {showStart ? (
            <Button type="button" size="sm" onClick={onStart} disabled={isRunning || isBusy} className="gap-1">
              <Play className="size-3.5" />
              Start
            </Button>
          ) : null}

          {showStopRestart ? (
            <>
              <Button type="button" size="sm" variant="outline" onClick={onStop} disabled={!isRunning || isBusy} className="gap-1">
                <Square className="size-3.5" />
                Stop
              </Button>

              <Button type="button" size="sm" variant="outline" onClick={onRestart} disabled={!isRunning || isBusy} className="gap-1">
                <RotateCcw className="size-3.5" />
                Restart
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
