import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceMeta, getStatusBadgeClass } from "@/features/dashboard/dashboard-utils";
import { Play, Square, RotateCcw } from "lucide-react";
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

  return (
    <Card className="h-full rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", meta.iconWrapClass)}>
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-h-[60px] min-w-0 flex-1">
              <CardTitle className="text-lg leading-tight">{name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 min-h-[40px] leading-snug">{description}</CardDescription>
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
          <Button onClick={onStart} disabled={isRunning || isBusy} className="h-11 rounded-xl">
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>

          <Button variant="outline" onClick={onStop} disabled={!isRunning || isBusy} className="h-11 rounded-xl">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>

          <Button variant="outline" onClick={onRestart} disabled={!isRunning || isBusy} className="h-11 rounded-xl">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
