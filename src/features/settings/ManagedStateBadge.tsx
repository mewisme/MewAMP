import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export function ManagedStateBadge({ managed }: { managed: boolean }) {
  if (managed) {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Managed by MewAMP
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
      Not managed by app
    </Badge>
  );
}
