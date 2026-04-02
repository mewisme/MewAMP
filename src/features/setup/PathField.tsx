import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PathField({
  label,
  value,
  placeholder,
  hint,
  onChange,
  onBrowse,
}: {
  label: string;
  value: string;
  placeholder: string;
  hint: string;
  onChange: (value: string) => void;
  onBrowse: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2">
          <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          <Button type="button" variant="outline" className="rounded-xl" onClick={onBrowse}>
            Browse
          </Button>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
