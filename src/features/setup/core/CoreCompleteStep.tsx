import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function CoreCompleteStep({ installPhpmyadmin }: { installPhpmyadmin: boolean }) {
  return (
    <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Installation complete</h3>
          <p className="max-w-xl line-clamp-2 text-sm leading-snug text-muted-foreground">
            Your MewAMP runtime stack has been installed successfully. You can now start services and begin local
            development.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Apache
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            PHP
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            MariaDB
          </Badge>
          {installPhpmyadmin && (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              phpMyAdmin
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
