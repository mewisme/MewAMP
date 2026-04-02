import { Copy, Download, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DiagnosticsToolbar({
  loading,
  exporting,
  canCopy,
  onLoad,
  onExport,
  onCopyJson,
}: {
  loading: boolean;
  exporting: boolean;
  canCopy: boolean;
  onLoad: () => void;
  onExport: () => void;
  onCopyJson: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip>
        <TooltipTrigger
          type="button"
          disabled={loading}
          onClick={onLoad}
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading…" : "Load"}
        </TooltipTrigger>
        <TooltipContent>Fetch current diagnostics from the app</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          type="button"
          disabled={exporting}
          onClick={onExport}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Download className="mr-1.5 size-3.5" />
          {exporting ? "Exporting…" : "Export bundle"}
        </TooltipTrigger>
        <TooltipContent>Save a support bundle to disk</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          type="button"
          disabled={!canCopy}
          onClick={onCopyJson}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Copy className="mr-1.5 size-3.5" />
          Copy JSON
        </TooltipTrigger>
        <TooltipContent>Copy diagnostics JSON to the clipboard</TooltipContent>
      </Tooltip>
    </div>
  );
}
