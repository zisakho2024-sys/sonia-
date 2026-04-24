import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Loader2, MessageCircleQuestion, Search, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listFaqs, type Faq } from "@/lib/faqs";
import { pickLocalized, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Sonia Buddy" },
      {
        name: "description",
        content:
          "Frequently asked questions about Sonia Buddy bus schedules, live tracking, route accuracy and the mobile app.",
      },
      { property: "og:title", content: "FAQ — Sonia Buddy" },
      {
        property: "og:description",
        content: "Answers to common questions about routes, timings and the Sonia Buddy app.",
      },
    ],
    links: [{ rel: "canonical", href: "https://primo-routes.lovable.app/faq" }],
  }),
  component: FaqPage,
});

const ALL = "__all__";

function FaqPage() {
  const { lang } = useLanguage();
  const location = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["faqs"],
    queryFn: listFaqs,
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [openItem, setOpenItem] = useState<string | undefined>();

  // Build the unique category list from data.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const f of data ?? []) {
      const k = (f.category?.trim() || "General").trim();
      set.add(k);
    }
    const arr = Array.from(set).sort((a, b) => {
      if (a === "General") return -1;
      if (b === "General") return 1;
      return a.localeCompare(b);
    });
    return arr;
  }, [data]);

  // Filter by query + category. Searches across EN + BN.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((f) => {
      const cat = (f.category?.trim() || "General").trim();
      if (category !== ALL && cat !== category) return false;
      if (!q) return true;
      const hay = [
        f.question,
        f.answer,
        f.question_bn ?? "",
        f.answer_bn ?? "",
        cat,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, category]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  // When the URL hash points at an FAQ id, scroll & open that accordion item.
  useEffect(() => {
    if (!data || data.length === 0) return;
    const hash = location.hash?.replace(/^#/, "") ?? "";
    if (!hash) return;
    const exists = data.some((f) => f.id === hash);
    if (!exists) return;
    setOpenItem(hash);
    // Defer to allow accordion to mount before scrolling.
    const id = window.setTimeout(() => {
      const el = document.getElementById(`faq-${hash}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [data, location.hash]);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="container mx-auto px-4 pt-10 sm:pt-14 pb-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Frequently Asked <span className="text-gradient-orange">Questions</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Quick answers about timings, live tracking, route accuracy and using the Sonia Buddy
            app.
          </p>
        </div>
      </section>

      {/* Search + category chips */}
      <section className="container mx-auto px-4 pb-4">
        <div className="max-w-3xl space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs (English or বাংলা)…"
              className="pl-9 pr-9 h-11 rounded-xl"
              aria-label="Search FAQs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <CategoryChip
                label="All"
                active={category === ALL}
                onClick={() => setCategory(ALL)}
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c}
                  label={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Failed to load FAQs: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-10 text-center">
            <MessageCircleQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No FAQs published yet</p>
            <p className="text-sm text-muted-foreground">Please check back soon.</p>
          </div>
        )}

        {!isLoading && (data?.length ?? 0) > 0 && filtered.length === 0 && (
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-10 text-center max-w-3xl">
            <MessageCircleQuestion className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-semibold">No matches</p>
            <p className="text-sm text-muted-foreground">Try a different keyword or category.</p>
          </div>
        )}

        {!isLoading && grouped.length > 0 && (
          <div className="space-y-10 max-w-3xl">
            {grouped.map(({ category, items }) => (
              <div key={category ?? "general"}>
                {category && (
                  <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                    {category}
                  </h2>
                )}
                <Accordion
                  type="single"
                  collapsible
                  value={openItem}
                  onValueChange={setOpenItem}
                  className="bg-card-gradient border border-border/60 rounded-3xl px-4 sm:px-6"
                >
                  {items.map((faq) => {
                    const q = pickLocalized(faq.question, faq.question_bn, lang);
                    const a = pickLocalized(faq.answer, faq.answer_bn, lang);
                    return (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        id={`faq-${faq.id}`}
                        className="border-border/40 scroll-mt-24"
                      >
                        <AccordionTrigger
                          className="text-left font-semibold text-sm sm:text-base hover:no-underline"
                          lang={lang === "bn" && faq.question_bn ? "bn" : undefined}
                        >
                          {q}
                        </AccordionTrigger>
                        <AccordionContent
                          className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line"
                          lang={lang === "bn" && faq.answer_bn ? "bn" : undefined}
                        >
                          {a}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 max-w-3xl">
          <p className="text-sm text-muted-foreground">
            Still have questions?{" "}
            <Link to="/about" className="text-primary font-semibold hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-smooth ${
        active
          ? "bg-orange-gradient text-primary-foreground border-transparent shadow-glow"
          : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function groupByCategory(faqs: Faq[]): Array<{ category: string | null; items: Faq[] }> {
  const map = new Map<string, Faq[]>();
  for (const f of faqs) {
    const key = (f.category?.trim() || "General").trim();
    const arr = map.get(key) ?? [];
    arr.push(f);
    map.set(key, arr);
  }
  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === "General") return -1;
    if (b === "General") return 1;
    return a.localeCompare(b);
  });
  return keys.map((k) => ({ category: k === "General" ? null : k, items: map.get(k)! }));
}
