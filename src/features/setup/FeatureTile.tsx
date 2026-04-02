export function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <div className="mb-2 flex size-8 items-center justify-center rounded-md bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium leading-tight">{title}</div>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
    </div>
  );
}
