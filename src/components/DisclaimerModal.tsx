import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import {
  buildDisclaimer,
  getAllSettings,
} from "@/lib/appSettings";

/**
 * SBSTC-style disclaimer modal — dark navy header, yellow alert icon,
 * white body text, multi-paragraph bilingual content. Content is fetched
 * from the `app_settings` table so admins can edit it without code changes.
 */
export function DisclaimerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { lang } = useLanguage();

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAllSettings,
    staleTime: 60_000,
  });

  const disc = buildDisclaimer(settings ?? {});
  const title = lang === "bn" ? disc.titleBn : disc.titleEn;
  const body = lang === "bn" ? disc.bodyBn : disc.bodyEn;
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden border-0 bg-transparent shadow-none max-w-md sm:max-w-lg [&>button]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-300 ease-out"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="rounded-2xl overflow-hidden border border-amber-400/30 shadow-2xl bg-[oklch(0.18_0.04_250)]">
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[oklch(0.22_0.05_250)]">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 ring-2 ring-amber-400/50 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-300" strokeWidth={2.5} />
            </span>
            <h2 className="flex-1 font-bold text-white text-lg tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-white/90"
              >
                <span className="text-amber-300 font-bold mr-1">•</span>
                {p}
              </p>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[oklch(0.22_0.05_250)] border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              {lang === "bn" ? "বন্ধ করুন" : "Close"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
