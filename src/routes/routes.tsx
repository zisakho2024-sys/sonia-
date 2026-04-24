import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Bus, Clock, Download, MapPin, MapPinned, Navigation, Search } from "lucide-react";
import emptyRouteImg from "@/assets/empty-route.png";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { BusCardSkeletonGrid } from "@/components/BusCardSkeleton";
import { searchBuses, getSegmentTimings, type BusRoute } from "@/lib/busRoutes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useLanguage, pickLocalized, type Lang } from "@/lib/i18n";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.busbuddy.mapingapp";

const search = z.object({
  from: fallback(z.string(), "Arambagh").default("Arambagh"),
  to: fallback(z.string(), "Tarkeshwar").default("Tarkeshwar"),
});

export const Route = createFileRoute("/routes")({
  validateSearch: zodValidator(search),
  head: ({ match }) => {
    const s = match.search as { from?: string; to?: string };
    const f = s?.from ?? "";
    const t = s?.to ?? "";
    return {
      meta: [
        { title: `Buses from ${f} to ${t} — Schedule & Timings | Sonia Buddy` },
        { name: "description", content: `Live list of buses running from ${f} to ${t} with arrival, departure and stoppage timings.` },
        { property: "og:title", content: `${f} → ${t} bus schedule | Sonia Buddy` },
        { property: "og:description", content: `All buses, timings and stops for the ${f} to ${t} route.` },
      ],
    };
  },
  component: RoutesPage,
});

function RoutesPage() {
  const { from, to } = Route.useSearch();
  const { t, lang } = useLanguage();
  const PAGE_SIZE = 10;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search-buses", from, to],
    queryFn: () => searchBuses(from, to),
    enabled: isSupabaseConfigured && !!from && !!to,
  });

  // Reset pagination when search changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [from, to]);

  const total = data?.length ?? 0;
  const shown = data?.slice(0, visible) ?? [];
  const hasMore = visible < total;

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, total));
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, total]);

  // Prefetch next page's images so "Load more" / scroll feels instant on 4G.
  useEffect(() => {
    if (!data || visible >= total) return;
    const next = data.slice(visible, visible + PAGE_SIZE);
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 200);
    idle(() => {
      for (const b of next) {
        if (b.image_url) {
          const img = new Image();
          img.decoding = "async";
          img.src = b.image_url;
        }
      }
    });
  }, [data, visible, total]);


  return (
    <div className="min-h-screen">
      <Header />

      {/* SEARCH HEADER */}
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="bg-card-gradient border border-border/60 rounded-3xl p-6 md:p-8 shadow-card-elegant">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{t("routes.eyebrow")}</div>
          <div className="flex flex-wrap items-center gap-3 text-2xl md:text-4xl font-bold tracking-tight">
            <span className="flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" />{from}</span>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <span className="flex items-center gap-2"><MapPinned className="w-6 h-6 text-primary" />{to}</span>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {isLoading
              ? t("routes.searching")
              : `${total} ${t("routes.found")}${hasMore ? ` • showing ${shown.length}` : ""}`}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container mx-auto px-4 pb-12">
        {!isSupabaseConfigured && <ConfigWarning />}

        {error && (
          <div className="bg-destructive/10 border border-destructive/40 text-destructive rounded-2xl p-6">
            Failed to load buses: {(error as Error).message}
          </div>
        )}

        {isLoading && <BusCardSkeletonGrid count={4} />}

        {!isLoading && data && data.length === 0 && <EmptyState from={from} to={to} t={t} />}

        {!isLoading && shown.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-5">
              {shown.map((b) => (
                <ResultCard key={b.id} bus={b} from={from} to={to} lang={lang} t={t} />
              ))}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, total))}
                  className="rounded-2xl px-6"
                >
                  Load more ({total - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

function ResultCard({
  bus,
  from,
  to,
  lang,
  t,
}: {
  bus: BusRoute;
  from: string;
  to: string;
  lang: Lang;
  t: (k: string) => string;
}) {
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const seg = getSegmentTimings(bus, from, to);
  const name = pickLocalized(bus.bus_name, bus.bus_name_bn, lang);
  const src = pickLocalized(bus.source, bus.source_bn, lang);
  const dst = pickLocalized(bus.destination, bus.destination_bn, lang);
  const type = pickLocalized(bus.bus_type, bus.bus_type_bn, lang);
  const fromName = seg ? pickLocalized(seg.fromName, seg.fromNameBn, lang) : "";
  const toName = seg ? pickLocalized(seg.toName, seg.toNameBn, lang) : "";

  return (
    <div className="group bg-card-gradient border border-border/60 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-glow transition-smooth flex flex-col">
      <div className="flex">
        <div className="w-24 sm:w-32 md:w-40 bg-orange-gradient flex items-center justify-center shrink-0 overflow-hidden">
          {bus.image_url ? (
            <img src={bus.image_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Bus className="w-10 h-10 sm:w-14 sm:h-14 text-white/90 group-hover:scale-110 transition-smooth" strokeWidth={1.5} />
          )}
        </div>
        <div className="p-5 sm:p-6 flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            <h3 className="font-bold text-lg sm:text-xl md:text-2xl tracking-tight leading-tight flex-1 min-w-0 break-words">{name}</h3>
            <button
              type="button"
              onClick={() => setDisclaimerOpen(true)}
              aria-label={t("disclaimer.title")}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[11px] sm:text-xs text-muted-foreground font-mono mb-3 truncate">{bus.reg_number}</div>

          {/* Aligned vertical From → To stack */}
          <div className="flex flex-col gap-2 text-xs sm:text-sm font-semibold mb-3">
            <div className="grid grid-cols-[16px_1fr] items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-primary justify-self-center" />
              <span className="truncate leading-snug">{src}</span>
            </div>
            <div className="grid grid-cols-[16px_1fr] items-center gap-2 min-w-0">
              <MapPinned className="w-4 h-4 text-primary justify-self-center" />
              <span className="truncate leading-snug">{dst}</span>
            </div>
          </div>

          {type && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {type
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider"
                    lang={lang}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          )}
          <Link to="/bus/$busId" params={{ busId: bus.id }} className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-smooth">
            {t("routes.viewFull")} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-smooth" />
          </Link>
        </div>
      </div>

      {/* Dynamic timings for the searched segment */}
      {seg && (
        <div className="border-t border-border/40 bg-secondary/30 px-4 sm:px-5 py-3 sm:py-4 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">{t("routes.departure")} ({fromName})</span>
            </div>
            <div className="font-bold text-foreground text-sm sm:text-base">{seg.departure}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t("routes.down")}: {seg.downArrival}</div>
          </div>
          <div className="text-right min-w-0">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">{t("routes.arrival")} ({toName})</span>
            </div>
            <div className="font-bold text-foreground text-sm sm:text-base">{seg.arrival}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t("routes.down")}: {seg.downDeparture}</div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-5 py-3 border-t border-border/40 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            toast.info(t("modal.tracking.toast"), { description: t("modal.tracking.body") });
            setTrackingOpen(true);
          }}
          className="flex-1 min-w-[120px]"
        >
          <Navigation className="w-3.5 h-3.5" /> {t("card.busTracking")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            toast.info(t("modal.tracking.toast"), { description: t("modal.tracking.body") });
            setTrackingOpen(true);
          }}
          className="flex-1 min-w-[120px] bg-orange-gradient text-primary-foreground font-semibold"
        >
          <MapPin className="w-3.5 h-3.5" /> {t("card.stopTracking")}
        </Button>
      </div>

      <TrackingDialog open={trackingOpen} onOpenChange={setTrackingOpen} t={t} />
      <DisclaimerModal open={disclaimerOpen} onOpenChange={setDisclaimerOpen} />
    </div>
  );
}

function TrackingDialog({
  open,
  onOpenChange,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: (k: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            {t("modal.tracking.title")}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            {t("modal.tracking.body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("modal.tracking.close")}
          </Button>
          <Button asChild className="bg-orange-gradient text-primary-foreground font-semibold">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4" /> {t("modal.tracking.cta")}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function EmptyState({ from, to, t }: { from: string; to: string; t: (k: string) => string }) {
  return (
    <div className="bg-card-gradient border border-border/60 rounded-3xl p-8 sm:p-12 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-orange-gradient opacity-[0.04] pointer-events-none" aria-hidden />
      <div className="relative">
        <img
          src={emptyRouteImg}
          alt="Empty bus stop illustration"
          width={384}
          height={256}
          loading="lazy"
          className="mx-auto mb-6 w-56 sm:w-72 h-auto drop-shadow-md"
        />
        <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">{t("routes.empty.title")}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-7 text-sm sm:text-base leading-relaxed">
          {t("routes.empty.desc.1")} <span className="text-foreground font-semibold">{from}</span>{" "}
          {t("routes.empty.desc.2")} <span className="text-foreground font-semibold">{to}</span>{" "}
          {t("routes.empty.desc.3")}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-gradient text-primary-foreground font-semibold shadow-glow hover:scale-[1.03] transition-smooth"
        >
          <Search className="w-4 h-4" /> {t("routes.empty.cta")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function ConfigWarning() {
  return (
    <div className="bg-destructive/10 border border-destructive/40 rounded-2xl p-6 mb-6">
      <div className="font-bold text-destructive mb-1">Supabase not configured</div>
      <p className="text-sm text-muted-foreground">
        Add <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
        <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to a{" "}
        <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">.env</code> file at the project root, then restart dev.
      </p>
    </div>
  );
}
