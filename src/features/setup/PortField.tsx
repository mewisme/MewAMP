import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PortField({
  label,
  value,
  example,
  defaultValue,
  onChange,
}: {
  label: string;
  value: number;
  example: string;
  defaultValue: string;
  onChange: (value: number) => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <Label className="text-sm font-medium">{label}</Label>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{example}</p>
          <p>
            Default: <code>{defaultValue}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
