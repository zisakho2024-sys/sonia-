import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bus, Clock, Flame, HelpCircle, History, Search, Sparkles, Star, X, Zap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StopAutocomplete } from "@/components/StopAutocomplete";
import { GooglePlayIcon } from "@/components/GooglePlayIcon";
import { FleetLightbox } from "@/components/FleetLightbox";
import logoImg from "@/assets/logo.jpeg";
import defaultRouteImg from "@/assets/default-route.jpg";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { BusRoute } from "@/lib/busRoutes";
import { listPopularRoutes, isMissingTableError, type PopularRoute } from "@/lib/popularRoutes";
import {
  addSearchToHistory,
  clearSearchHistory,
  getSearchHistory,
  type SearchHistoryItem,
} from "@/lib/searchHistory";
import { useLanguage, pickLocalized } from "@/lib/i18n";
import heroImg from "@/assets/hero-bus.jpg";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.busbuddy.mapingapp";

const FALLBACK_POPULAR: PopularRoute[] = [
  { id: "f1", source: "Arambagh", destination: "Kolkata", source_bn: "আরামবাগ", destination_bn: "কলকাতা", image_url: null, pinned: false, sort_order: 0 },
  { id: "f2", source: "Arambagh", destination: "Tarkeshwar", source_bn: "আরামবাগ", destination_bn: "তারকেশ্বর", image_url: null, pinned: false, sort_order: 1 },
  { id: "f3", source: "Arambagh", destination: "Howrah", source_bn: "আরামবাগ", destination_bn: "হাওড়া", image_url: null, pinned: false, sort_order: 2 },
  { id: "f4", source: "Tarkeshwar", destination: "Kolkata", source_bn: "তারকেশ্বর", destination_bn: "কলকাতা", image_url: null, pinned: false, sort_order: 3 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sonia Buddy — Smart Bus Routes & Schedules in West Bengal" },
      { name: "description", content: "Search live bus routes, schedules and timings across West Bengal with Sonia AI — your smart travel companion." },
      { property: "og:title", content: "Sonia Buddy — Smart Bus Routes & Schedules" },
      { property: "og:description", content: "Plan smarter journeys with AI-powered bus schedules and live timings." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const f = from.trim();
    const t = to.trim();
    if (!f || !t) return;
    addSearchToHistory(f, t);
    setHistory(getSearchHistory());
    navigate({ to: "/routes", search: { from: f, to: t } });
  };

  const applyHistory = (item: SearchHistoryItem) => {
    setFrom(item.from);
    setTo(item.to);
    setShowHistory(false);
  };

  const onClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    setShowHistory(false);
  };

  const showRecent =
    showHistory && history.length > 0 && from.trim() === "" && to.trim() === "";

  // Featured fleet preview (first 4 buses from DB).
  const { data: featured } = useQuery({
    queryKey: ["featured-buses"],
    queryFn: async (): Promise<BusRoute[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from("bus_routes").select("*").limit(4);
      if (error) throw error;
      return (data ?? []) as BusRoute[];
    },
  });

  // Popular routes (admin-managed). Falls back to a static list if the
  // table doesn't exist yet so the homepage never goes blank.
  const { data: popularData } = useQuery({
    queryKey: ["popular-routes"],
    queryFn: async (): Promise<PopularRoute[]> => {
      try {
        return await listPopularRoutes();
      } catch (err) {
        if (isMissingTableError(err)) return FALLBACK_POPULAR;
        throw err;
      }
    },
  });
  const popular = popularData && popularData.length > 0 ? popularData : FALLBACK_POPULAR;

  // Lightbox state for fleet image preview.
  const [lightbox, setLightbox] = useState<{ url: string | null; title: string; subtitle: string } | null>(null);

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1920} height={1080} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-hero-gradient opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 pt-5 pb-12 sm:pt-10 sm:pb-20 md:pt-16 md:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur text-[9px] sm:text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("hero.badge")}
            </div>
            <h1 className="flex items-center gap-2 sm:gap-3 text-[1.6rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight sm:leading-[1] mb-2 sm:mb-4">
              <span className="inline-flex w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full border-2 border-primary/80 overflow-hidden shadow-glow shrink-0">
                <img src={logoImg} alt="Sonia AI logo" className="w-full h-full object-cover" />
              </span>
              <span>
                Sonia AI:<br />Your Smart{" "}
                <span className="text-gradient-orange">Travel Companion</span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mb-3 sm:mb-5 leading-snug line-clamp-2 sm:line-clamp-3">
              {t("hero.subtitle")}
            </p>
            {/* Mobile: Search first (above the fold), then Download. Desktop: Download primary, Search secondary. */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button asChild size="default" className="order-1 sm:order-2 bg-orange-gradient text-primary-foreground font-semibold text-xs sm:text-sm h-10 sm:h-11 px-5 sm:px-6 shadow-glow hover:scale-[1.02] transition-smooth">
                <a href="#search">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("hero.cta.search")} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Button>
              <Button asChild size="default" variant="outline" className="order-2 sm:order-1 h-10 sm:h-11 px-5 sm:px-6 border-border/60 backdrop-blur bg-background/40 hover:bg-background/60 text-xs sm:text-sm">
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <GooglePlayIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> {t("hero.cta.download")}
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* SEARCH CARD */}
        <div id="search" className="relative container mx-auto px-4 -mt-6 sm:-mt-10 pb-10">
          <form
            onSubmit={onSearch}
            onFocusCapture={() => setShowHistory(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowHistory(false);
            }}
            className="relative bg-card-gradient border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-elegant backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-gradient flex items-center justify-center"><Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" /></div>
              <h3 className="font-bold text-base sm:text-lg">{t("search.title")}</h3>
              <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline">{t("search.hint")}</span>
            </div>
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 sm:gap-4">
              <StopAutocomplete
                label={t("search.from")}
                value={from}
                onChange={setFrom}
                placeholder={t("search.from.placeholder")}
              />
              <StopAutocomplete
                label={t("search.to")}
                value={to}
                onChange={setTo}
                placeholder={t("search.to.placeholder")}
              />
              <div className="flex items-end">
                <Button type="submit" size="default" className="w-full md:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-orange-gradient text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-smooth">
                  {t("search.button")} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showRecent && (
              <div className="mt-5 rounded-2xl border border-border/60 bg-popover/95 backdrop-blur p-4 shadow-elegant">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="w-3.5 h-3.5" /> {t("search.recent")}
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClearHistory}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> {t("search.clear")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={`${h.from}-${h.to}-${h.ts}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyHistory(h)}
                      className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card/60 hover:border-primary/50 hover:bg-primary/10 transition-smooth text-sm"
                    >
                      <span className="font-medium truncate max-w-[8rem]">{h.from}</span>
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-medium truncate max-w-[8rem]">{h.to}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* POPULAR FLEET (live from Supabase) — click any card/photo to open full-size lightbox */}
      {featured && featured.length > 0 && (
        <section className="container mx-auto px-4 pt-4 sm:pt-8 pb-16 sm:pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{t("section.fleet.eyebrow")}</div>
              <h2 className="text-3xl md:text-4xl font-bold">{t("section.fleet.title")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.map((b) => {
              const name = pickLocalized(b.bus_name, b.bus_name_bn, lang);
              const src = pickLocalized(b.source, b.source_bn, lang);
              const dst = pickLocalized(b.destination, b.destination_bn, lang);
              const type = pickLocalized(b.bus_type, b.bus_type_bn, lang);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setLightbox({ url: b.image_url, title: name, subtitle: `${src} → ${dst}` })}
                  className="group text-left bg-card-gradient border border-border/60 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-glow transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Open ${name} photo`}
                >
                  <div className="h-24 sm:h-32 bg-orange-gradient relative flex items-center justify-center overflow-hidden">
                    {b.image_url ? (
                      <img src={b.image_url} alt={`${name} bus operator logo — ${src} to ${dst}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                    ) : (
                      <Bus className="w-10 h-10 sm:w-16 sm:h-16 text-white/90 group-hover:scale-110 transition-smooth" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="p-3 sm:p-5">
                    <h3 className="font-bold text-sm sm:text-base tracking-tight mb-0.5 sm:mb-1 truncate">{name}</h3>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 font-mono truncate">{b.reg_number}</div>
                    <div className="flex flex-col gap-1 text-xs sm:text-sm font-semibold mb-2 min-w-0">
                      <span className="truncate">{src}</span>
                      <span className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs font-normal">
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary shrink-0" />
                        <span className="truncate">{dst}</span>
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[11px] font-semibold text-primary uppercase tracking-wider truncate">{type}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SEO POPULAR ROUTES — admin-managed via popular_routes table */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{t("section.popular.eyebrow")}</div>
          <h2 className="text-3xl md:text-4xl font-bold">{t("section.popular.title")}</h2>
          <p className="text-muted-foreground mt-2">{t("section.popular.desc")}</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {popular.map((r) => {
            const fromLabel = pickLocalized(r.source, r.source_bn, lang);
            const toLabel = pickLocalized(r.destination, r.destination_bn, lang);
            return (
              <Link
                key={r.id}
                to="/routes"
                search={{ from: r.source, to: r.destination }}
                className="group relative flex items-center gap-3 bg-card-gradient border border-border/60 rounded-xl p-4 hover:border-primary/50 hover:shadow-glow transition-smooth"
              >
                {r.pinned && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-gradient text-primary-foreground text-[9px] font-bold uppercase tracking-wider shadow-glow">
                    <Flame className="w-2.5 h-2.5" /> Trending
                  </span>
                )}
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-smooth shrink-0 bg-secondary">
                  <img
                    src={r.image_url || defaultRouteImg}
                    alt={`${r.source} to ${r.destination} bus route`}
                    loading="lazy"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{fromLabel} → {toLabel}</div>
                  <div className="text-[11px] text-muted-foreground">{t("card.viewSchedule")}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURES — moved to bottom, just above Footer */}
      <section className="container mx-auto px-4 pb-16 sm:pb-20">
        {/* Mobile: horizontal scroll */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2 snap-x snap-mandatory">
            {[
              { icon: Zap, title: t("feat.fast.title"), desc: t("feat.fast.desc") },
              { icon: Clock, title: t("feat.live.title"), desc: t("feat.live.desc") },
              { icon: Star, title: t("feat.trust.title"), desc: t("feat.trust.desc") },
            ].map((f) => (
              <div key={f.title} className="snap-start shrink-0 w-[78%] bg-card-gradient border border-border/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-gradient flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm leading-tight">{f.title}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop: full grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: t("feat.fast.title"), desc: t("feat.fast.desc") },
            { icon: Clock, title: t("feat.live.title"), desc: t("feat.live.desc") },
            { icon: Star, title: t("feat.trust.title"), desc: t("feat.trust.desc") },
          ].map((f) => (
            <div key={f.title} className="group bg-card-gradient border border-border/60 rounded-2xl p-7 hover:border-primary/50 hover:shadow-glow transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-orange-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOMEPAGE FAQ — bilingual accordion above the footer */}
      <HomeFaqSection />

      <Footer />

      <FleetLightbox
        open={!!lightbox}
        onOpenChange={(o) => !o && setLightbox(null)}
        imageUrl={lightbox?.url ?? null}
        title={lightbox?.title ?? ""}
        subtitle={lightbox?.subtitle}
      />
    </div>
  );
}

const HOME_FAQS_EN = [
  {
    q: "How accurate are the bus timings?",
    a: "Our schedules are based on ground surveys and official data. However, actual timings may vary due to traffic or weather.",
  },
  {
    q: "Can I track buses in real-time with GPS?",
    a: "Real-time GPS tracking is a premium feature available only on our mobile app. The web version shows estimated schedules.",
  },
  {
    q: "Is SoniaBuddy available for all of West Bengal?",
    a: "We are constantly expanding! Currently, we cover major routes like Digha, Howrah, and Kolkata, with more being added daily.",
  },
];

const HOME_FAQS_BN = [
  {
    q: "বাসের সময়সূচী কতটা সঠিক?",
    a: "আমাদের সময়সূচী গ্রাউন্ড সার্ভে এবং অফিশিয়াল তথ্যের উপর ভিত্তি করে তৈরি। তবে যানজট বা আবহাওয়ার কারণে সময়ের কিছু পরিবর্তন হতে পারে।",
  },
  {
    q: "আমি কি GPS-এর মাধ্যমে লাইভ বাস ট্র্যাক করতে পারি?",
    a: "রিয়েল-টাইম GPS ট্র্যাকিং একটি প্রিমিয়াম ফিচার যা শুধুমাত্র আমাদের মোবাইল অ্যাপে উপলব্ধ। ওয়েব ভার্সনে আনুমানিক সময়সূচী দেখানো হয়।",
  },
  {
    q: "SoniaBuddy কি পুরো পশ্চিমবঙ্গের জন্য উপলব্ধ?",
    a: "আমরা প্রতিনিয়ত আমাদের পরিষেবা বাড়াচ্ছি! বর্তমানে আমরা দিঘা, হাওড়া এবং কলকাতার মতো প্রধান রুটগুলি কভার করছি এবং প্রতিদিন আরও নতুন রুট যুক্ত করা হচ্ছে।",
  },
];

function HomeFaqSection() {
  const { lang } = useLanguage();
  const items = lang === "bn" ? HOME_FAQS_BN : HOME_FAQS_EN;
  return (
    <section className="container mx-auto px-4 pb-16 sm:pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            {lang === "bn" ? "সাহায্য কেন্দ্র" : "Help Center"}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            {lang === "bn" ? (
              <>সাধারণ <span className="text-gradient-orange">প্রশ্ন</span></>
            ) : (
              <>Frequently Asked <span className="text-gradient-orange">Questions</span></>
            )}
          </h2>
        </div>
        <Accordion
          type="single"
          collapsible
          className="bg-card-gradient border border-border/60 rounded-3xl px-4 sm:px-6 shadow-elegant"
        >
          {items.map((it, i) => (
            <AccordionItem key={i} value={`home-faq-${i}`} className="border-border/40">
              <AccordionTrigger
                className="text-left font-semibold text-sm sm:text-base hover:no-underline"
                lang={lang === "bn" ? "bn" : undefined}
              >
                {it.q}
              </AccordionTrigger>
              <AccordionContent
                className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed"
                lang={lang === "bn" ? "bn" : undefined}
              >
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="text-center mt-6">
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {lang === "bn" ? "সব FAQ দেখুন" : "See all FAQs"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
