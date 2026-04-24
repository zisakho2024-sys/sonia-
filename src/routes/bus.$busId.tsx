import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TriangleAlert as AlertTriangle, ArrowLeft, Bus, Clock, Download, MapPin, Navigation } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { getBusById, type RouteStop } from "@/lib/busRoutes";
import { pickLocalized, useLanguage } from "@/lib/i18n";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.busbuddy.mapingapp";

export const Route = createFileRoute("/bus/$busId")({
  loader: async ({ params }) => {
    const bus = await getBusById(params.busId);
    if (!bus) throw notFound();
    return { bus };
  },
  head: ({ loaderData }) => {
    const bus = loaderData?.bus;
    if (!bus) return { meta: [{ title: "Bus — Sonia Buddy" }] };
    const stops = bus.route_data ?? [];
    const first = stops[0];
    const last = stops[stops.length - 1];
    const title = `${bus.bus_name} (${bus.reg_number}) — ${bus.source} to ${bus.destination} Schedule | Sonia Buddy`;
    const description = `Full schedule for ${bus.bus_name} from ${bus.source} to ${bus.destination}. ${stops.length} stoppages with up & down timings. Bus type: ${bus.bus_type}.`;
    const url = `https://primo-routes.lovable.app/bus/${bus.id}`;

    const tripSchema = {
      "@context": "https://schema.org",
      "@type": "BusTrip",
      name: `${bus.bus_name} — ${bus.source} to ${bus.destination}`,
      busName: bus.bus_name,
      busNumber: bus.reg_number,
      provider: {
        "@type": "TransportationBusiness",
        name: "Sonia Buddy",
        url: "https://primo-routes.lovable.app",
      },
      departureBusStop: {
        "@type": "BusStation",
        name: first?.stoppage_name ?? bus.source,
      },
      arrivalBusStop: {
        "@type": "BusStation",
        name: last?.stoppage_name ?? bus.destination,
      },
      ...(first?.up_time ? { departureTime: first.up_time } : {}),
      ...(last?.up_time ? { arrivalTime: last.up_time } : {}),
    };

    const businessSchema = {
      "@context": "https://schema.org",
      "@type": "TransportationBusiness",
      name: "Sonia Buddy",
      url: "https://primo-routes.lovable.app",
      areaServed: "West Bengal, India",
      description: "Smart bus route discovery and live schedules across West Bengal.",
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: `${bus.bus_name}, ${bus.reg_number}, ${bus.source} to ${bus.destination} bus, bus schedule, West Bengal bus routes` },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(bus.image_url
          ? [
              { property: "og:image", content: bus.image_url },
              { name: "twitter:image", content: bus.image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(tripSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(businessSchema),
        },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Couldn't load bus</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Bus not found</h1>
        <Link to="/" className="text-primary underline">Go home</Link>
      </div>
    </div>
  ),
  component: BusPage,
});

function BusPage() {
  const { bus } = Route.useLoaderData();
  const { lang, t } = useLanguage();
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const stops = bus.route_data ?? [];
  const stopsBn = bus.route_data_bn ?? null;

  const busName = pickLocalized(bus.bus_name, bus.bus_name_bn, lang);
  const busType = pickLocalized(bus.bus_type, bus.bus_type_bn, lang);
  const source = pickLocalized(bus.source, bus.source_bn, lang);
  const destination = pickLocalized(bus.destination, bus.destination_bn, lang);

  const openTracking = () => {
    toast.info(t("modal.tracking.toast"), { description: t("modal.tracking.body") });
    setTrackingOpen(true);
  };

  const isFirstStop = (i: number) => i === 0;
  const isLastStop = (i: number) => i === stops.length - 1;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      {/* Scrollable content area — no page-level scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 pt-4 sm:pt-6 pb-6">
          {/* Back link */}
          <Link
            to="/routes"
            search={{ from: bus.source, to: bus.destination }}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-smooth mb-4 px-3 py-2 -ml-3 rounded-xl hover:bg-secondary/60"
          >
            <ArrowLeft className="w-5 h-5" /> {t("bus.back")}
          </Link>

          {/* HEADER CARD — compact */}
          <div className="bg-card-gradient border border-border/60 rounded-2xl overflow-hidden shadow-elegant mb-4">
            <div className="h-32 sm:h-40 md:h-52 bg-orange-gradient relative flex items-center justify-center overflow-hidden">
              {bus.image_url ? (
                <img src={bus.image_url} alt={busName} className="w-full h-full object-cover" />
              ) : (
                <Bus className="w-20 h-20 sm:w-28 sm:h-28 text-white/95 animate-float" strokeWidth={1.2} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                <div className="text-[10px] font-semibold text-white/90 uppercase tracking-widest mb-1 drop-shadow">{busType}</div>
                <div className="flex items-start gap-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg flex-1 min-w-0">
                    {busName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setDisclaimerOpen(true)}
                    aria-label={t("disclaimer.title")}
                    className="shrink-0 mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-smooth ring-2 ring-destructive/40"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs text-muted-foreground mb-0.5">{t("bus.regNo")}: <span className="text-foreground">{bus.reg_number}</span></div>
                <div className="text-sm sm:text-base font-semibold">{source} → {destination}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={openTracking} className="h-8 text-xs">
                  <Navigation className="w-3.5 h-3.5" /> {t("card.busTracking")}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={openTracking} className="h-8 text-xs">
                  <MapPin className="w-3.5 h-3.5" /> {t("card.stopTracking")}
                </Button>
              </div>
            </div>
          </div>

          {/* SCHEDULE — full-height with internal scroll */}
          <div className="bg-card-gradient border border-border/60 rounded-2xl shadow-card-elegant overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 280px)", minHeight: 200 }}>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-orange-gradient flex items-center justify-center"><Clock className="w-4 h-4 text-primary-foreground" /></div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">{t("bus.schedule.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("bus.schedule.desc")}</p>
              </div>
            </div>
            {stops.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t("bus.empty")}</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-secondary/80 backdrop-blur text-left">
                      <th className="px-3 sm:px-5 py-2.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground w-10 sm:w-14">#</th>
                      <th className="px-3 sm:px-5 py-2.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-primary min-w-[80px]">{t("bus.col.upTime")}</th>
                      <th className="px-3 sm:px-5 py-2.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground min-w-[140px]">{t("bus.col.stop")}</th>
                      <th className="px-3 sm:px-5 py-2.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-primary text-right min-w-[80px]">{t("bus.col.downTime")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((s: RouteStop, i: number) => {
                      const stopName = pickLocalized(s.stoppage_name, stopsBn?.[i]?.stoppage_name, lang);
                      const isFrom = isFirstStop(i);
                      const isTo = isLastStop(i);
                      return (
                        <tr
                          key={`${s.stoppage_name}-${i}`}
                          className="border-t border-border/30 hover:bg-secondary/20 transition-smooth"
                        >
                          <td className="px-3 sm:px-5 py-4 sm:py-5 font-mono text-muted-foreground text-xs">{String(i + 1).padStart(2, "0")}</td>
                          <td className="px-3 sm:px-5 py-4 sm:py-5 font-semibold text-foreground whitespace-nowrap text-sm">{s.up_time}</td>
                          <td className="px-3 sm:px-5 py-4 sm:py-5">
                            <div className="flex items-center gap-2 min-w-0">
                              {isFrom ? (
                                <span className="shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-orange-gradient text-primary-foreground leading-none">
                                  FROM
                                </span>
                              ) : isTo ? (
                                <span className="shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-orange-gradient text-primary-foreground leading-none">
                                  TO
                                </span>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-orange-gradient shrink-0" />
                              )}
                              <span className="font-semibold text-[1.05rem] sm:text-base text-white truncate">
                                {stopName}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-4 sm:py-5 font-semibold text-right text-foreground whitespace-nowrap text-sm">{s.down_time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bus / Stop Tracking modal */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
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
            <Button variant="outline" onClick={() => setTrackingOpen(false)}>
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

      <DisclaimerModal open={disclaimerOpen} onOpenChange={setDisclaimerOpen} />
    </div>
  );
}
