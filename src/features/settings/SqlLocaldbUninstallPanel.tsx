import { Button } from "@/components/ui/button";
import { ManagedStateBadge } from "@/features/settings/ManagedStateBadge";
import { Loader2, Trash2 } from "lucide-react";

export function SqlLocaldbUninstallPanel({
  managed,
  busy,
  onUninstall,
}: {
  managed: boolean;
  busy: boolean;
  onUninstall: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="font-medium">Uninstall SqlLocalDB</div>
        <p className="text-sm text-muted-foreground">Remove SqlLocalDB only when it was installed by MewAMP.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {managed
          ? "This SqlLocalDB install is tracked by MewAMP and can be removed safely here."
          : "This system does not currently have an app-managed SqlLocalDB install."}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ManagedStateBadge managed={managed} />

        <Button
          type="button"
          variant="outline"
          className="rounded-xl text-destructive hover:text-destructive"
          disabled={busy || !managed}
          onClick={onUninstall}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall SqlLocalDB
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
