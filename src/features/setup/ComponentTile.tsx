import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ComponentTile({
  title,
  description,
  required,
  icon: Icon,
}: {
  title: string;
  description: string;
  required?: boolean;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {required && <Badge>Required</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
