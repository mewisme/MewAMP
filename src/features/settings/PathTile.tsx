import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PathTile({
  label,
  value,
  onOpenFolder,
}: {
  label: string;
  value: string;
  onOpenFolder?: () => void;
}) {
  const canOpen = Boolean(onOpenFolder && value.trim());

  return (
    <Card
      className={cn(
        "rounded-xl border-border/60 shadow-none",
        canOpen &&
          "cursor-pointer transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={canOpen ? onOpenFolder : undefined}
      onKeyDown={
        canOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenFolder?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="space-y-1 p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="break-all text-xs font-medium leading-snug">{value || "Not set"}</div>
      </CardContent>
    </Card>
  );
}
