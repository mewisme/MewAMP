import type { ElementType, RefObject } from "react";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import type { LogKey } from "@/features/logs/types";

export function LogTabPane({
  tabKey,
  label,
  icon: Icon,
  empty,
  text,
  logRef,
  loading,
  onScroll,
  onRefresh,
  onCopy,
  onClear,
}: {
  tabKey: LogKey;
  label: string;
  icon: ElementType;
  empty: string;
  text: string;
  logRef: RefObject<HTMLPreElement | null>;
  loading: boolean;
  onScroll: () => void;
  onRefresh: () => void;
  onCopy: () => void;
  onClear: () => void;
}) {
  return (
    <TabsContent value={tabKey} className="mt-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{label} Log</div>
            <p className="text-sm text-muted-foreground">Latest output captured from the {label.toLowerCase()} process.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            aria-label={`Refresh ${label} log`}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={onCopy}
            title="Copy log"
            aria-label={`Copy ${label} log to clipboard`}
          >
            <Copy />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl text-destructive hover:text-destructive"
            onClick={onClear}
            title="Clear log"
            aria-label={`Clear ${label} log file`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-1">
        <pre
          ref={logRef}
          onScroll={onScroll}
          className="max-h-[60vh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-background/60 p-4 text-xs leading-6"
        >
          {text || empty}
        </pre>
      </div>
    </TabsContent>
  );
}
