import { cn } from "@/lib/utils";

export function SectionIntro({
  icon: Icon,
  title,
  description,
  spinning = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  spinning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
        <Icon className={cn("h-5 w-5 text-muted-foreground", spinning && "animate-spin")} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
