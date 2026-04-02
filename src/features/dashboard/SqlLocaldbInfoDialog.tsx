import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SqlLocaldbInfoDialog({
  open,
  onOpenChange,
  instanceLabel,
  text,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceLabel: string;
  text: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>SqlLocalDB info</DialogTitle>
          <DialogDescription className="font-mono text-xs">{instanceLabel}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[min(50vh,24rem)] rounded-lg border border-border/60 bg-muted/30">
          <pre className="p-3 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
            {text || "(no output)"}
          </pre>
        </ScrollArea>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
