import { FileJson } from "lucide-react";

export function DiagnosticsJsonView({ data }: { data: Record<string, unknown> | null }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-1">
      {data ? (
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-background/60 p-4 text-xs leading-6">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-background/40 px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <FileJson className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No diagnostics loaded</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Load diagnostics to inspect the current runtime state, configuration, and troubleshooting details.
          </p>
        </div>
      )}
    </div>
  );
}
