import { FileJson } from "lucide-react";
import { MutedCallout } from "@/components/MutedCallout";
import { Skeleton } from "@/components/ui/skeleton";

export function DiagnosticsJsonView({
  data,
  loading,
}: {
  data: Record<string, unknown> | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return <Skeleton className="min-h-[200px] w-full rounded-lg" />;
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-px">
      {data ? (
        <div className="max-h-[min(420px,55vh)] min-h-0 overflow-auto overscroll-contain rounded-[calc(var(--radius-lg)-1px)]">
          <pre className="p-3 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-[calc(var(--radius-lg)-1px)] bg-background/40 px-4 py-8 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
            <FileJson className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Nothing loaded</p>
          <MutedCallout className="mt-2 max-w-sm text-center">
            Load diagnostics to inspect runtime state, then copy JSON or export a bundle for support.
          </MutedCallout>
        </div>
      )}
    </div>
  );
}
