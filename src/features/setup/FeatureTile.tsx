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
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
