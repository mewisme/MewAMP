import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function OptionalComponentTile({
  title,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
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
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="secondary">Optional</Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div className="text-sm font-medium">Install {title}</div>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
      </CardContent>
    </Card>
  );
}
