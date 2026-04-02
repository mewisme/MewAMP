import { Card, CardContent } from "@/components/ui/card";

export function InfoTile({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-2 p-5">
        <div className="font-medium">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
