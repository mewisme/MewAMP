import { Card, CardContent } from "@/components/ui/card";

export function PathTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-2 p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="break-all text-sm font-medium">{value || "Not set"}</div>
      </CardContent>
    </Card>
  );
}
