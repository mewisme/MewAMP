import { useState, type ElementType, type RefObject } from "react";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <TabsContent value={tabKey} className="mt-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <div className="text-sm font-medium">{label} log</div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              Output from the {label.toLowerCase()} source.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Tooltip>
            <TooltipTrigger
              type="button"
              disabled={loading}
              onClick={onRefresh}
              aria-label={`Refresh ${label} log`}
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={onCopy}
              aria-label={`Copy ${label} log to clipboard`}
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            >
              <Copy />
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => setClearOpen(true)}
              aria-label={`Clear ${label} log file`}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "text-destructive hover:text-destructive"
              )}
            >
              <Trash2 />
            </TooltipTrigger>
            <TooltipContent>Clear log file</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-px">
        <pre
          ref={logRef}
          onScroll={onScroll}
          className="max-h-[60vh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-[calc(var(--radius-lg)-1px)] bg-background/60 p-3 text-xs leading-relaxed"
        >
          {text || empty}
        </pre>
      </div>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear {label} log?</AlertDialogTitle>
            <AlertDialogDescription>
              The log file will be emptied. You cannot undo this from MewAMP. Copy the log first if you need a record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onClear();
                setClearOpen(false);
              }}
            >
              Clear log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
}
