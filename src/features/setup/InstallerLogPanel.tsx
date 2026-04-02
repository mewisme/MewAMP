import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InstallerLogPanel({
  title,
  description,
  copyLabel,
  logText,
  logRef,
  onCopy,
}: {
  title: string;
  description: string;
  copyLabel: string;
  logText: string;
  logRef: RefObject<HTMLPreElement | null>;
  onCopy: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{description}</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onCopy}>
            {copyLabel}
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-1">
          <pre
            ref={logRef}
            className="max-h-[42vh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-background/60 p-4 text-xs leading-6"
          >
            {logText || "No installer logs yet."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
