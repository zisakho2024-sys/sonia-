import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Bus } from "lucide-react";

export function FleetLightbox({
  open,
  onOpenChange,
  imageUrl,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border/60 rounded-3xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative w-full aspect-[16/10] bg-secondary/40 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
              loading="eager"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Bus className="w-20 h-20" strokeWidth={1.2} />
              <p className="text-sm">No photo available</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border/60 bg-card-gradient">
          <h3 className="font-bold text-lg tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
