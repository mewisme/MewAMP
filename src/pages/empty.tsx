import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function Empty() {
  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-medium text-foreground">This route is unused</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Open the dashboard to manage your local stack.
        </p>
        <Link
          to="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex gap-2")}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
