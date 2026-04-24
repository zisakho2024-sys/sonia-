import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

const STORAGE_KEY = "sonia.lang";

type Dict = Record<string, string>;

const en: Dict = {
  // Header
  "nav.home": "Home",
  "nav.routes": "Routes",
  "nav.about": "About",
  "nav.download": "Download",
  "lang.label": "Language",

  // Home / Hero
  "hero.badge": "AI-Powered Travel",
  "hero.title.1": "Sonia AI:",
  "hero.title.2": "Your Smart",
  "hero.title.3": "Travel Companion",
  "hero.subtitle": "Find every bus, every route, every stop — instantly. Real-time schedules across West Bengal, powered by intelligent route discovery.",
  "hero.cta.download": "Download on Play Store",
  "hero.cta.search": "Search Routes",

  // Search card
  "search.title": "Find Your Bus",
  "search.hint": "Try Arambagh → Tarkeshwar",
  "search.from": "From",
  "search.to": "To",
  "search.from.placeholder": "Source city",
  "search.to.placeholder": "Destination",
  "search.button": "Search",
  "search.recent": "Recent Searches",
  "search.clear": "Clear",

  // Features
  "feat.fast.title": "Lightning Fast",
  "feat.fast.desc": "Find routes in milliseconds with AI-optimized search.",
  "feat.live.title": "Live Schedules",
  "feat.live.desc": "Real-time up & down timings for every stoppage.",
  "feat.trust.title": "Trusted Across WB",
  "feat.trust.desc": "Daily commuters rely on Sonia Buddy across West Bengal.",

  // Sections
  "section.fleet.eyebrow": "Live Fleet",
  "section.fleet.title": "Buses on the Network",
  "section.popular.eyebrow": "Popular Routes",
  "section.popular.title": "Quick Search",
  "section.popular.desc": "Tap a route to see all buses, timings and stoppages instantly.",
  "card.viewSchedule": "View buses & schedule",

  // Routes page
  "routes.eyebrow": "Search Results",
  "routes.searching": "Searching…",
  "routes.found": "buses found • Updated just now",
  "routes.empty.title": "No direct buses found",
  "routes.empty.desc.1": "We couldn't find any buses running from",
  "routes.empty.desc.2": "to",
  "routes.empty.desc.3": "in this direction. Try different stops or check spelling.",
  "routes.empty.cta": "New Search",
  "routes.viewFull": "View Full Schedule",
  "routes.live": "Live Tracking",
  "routes.stop": "Stop Tracking",
  "routes.departure": "Departure",
  "routes.arrival": "Arrival",
  "routes.down": "Down",

  // Bus detail
  "bus.back": "Back to results",
  "bus.regNo": "Reg No",
  "bus.live": "Live Tracking",
  "bus.getApp": "Get the App",
  "bus.schedule.title": "Detailed Schedule",
  "bus.schedule.desc": "Up & Down timings for all stoppages",
  "bus.empty": "No stoppage data yet.",
  "bus.col.upTime": "Up Time",
  "bus.col.stop": "Stoppage Name",
  "bus.col.downTime": "Down Time",

  // Tracking modal
  "modal.tracking.title": "Bus Tracking",
  "modal.tracking.body": "Estimated times only. For live GPS tracking, please download the app.",
  "modal.tracking.cta": "Get the App",
  "modal.tracking.close": "Close",
  "modal.tracking.toast": "Showing estimated schedule…",

  // Disclaimer
  "disclaimer.title": "Schedule disclaimer",
  "disclaimer.body": "Schedules are crowd-sourced and may change without notice. Please verify timings with the operator before travel.",

  // Bus card
  "card.busTracking": "Bus Tracking",
  "card.stopTracking": "Stop Tracking",

  // Misc
  "common.loading": "Loading…",
};

// NOTE: Bengali strings below are written in *Chalti Bhasha* — the simple,
// everyday spoken Bengali used by people in West Bengal. We deliberately
// avoid heavy Sanskrit-derived (sadhu) words like "অনুসন্ধান", "প্রস্থান",
// "গন্তব্য", "সময়সূচি" in favor of natural words like "খুঁজুন", "থেকে",
// "পর্যন্ত", "সময়" that a common commuter would actually say.
const bn: Dict = {
  // Header
  "nav.home": "হোম",
  "nav.routes": "রুট",
  "nav.about": "আমাদের কথা",
  "nav.download": "ডাউনলোড",
  "lang.label": "ভাষা",

  // Home / Hero
  "hero.badge": "এআই দিয়ে যাত্রা",
  "hero.title.1": "সোনিয়া এআই:",
  "hero.title.2": "আপনার স্মার্ট",
  "hero.title.3": "যাত্রার সঙ্গী",
  "hero.subtitle": "প্রতিটি বাস, প্রতিটি রুট, প্রতিটি স্টপ — চটজলদি খুঁজে নিন। পশ্চিমবঙ্গের সব রুটের লাইভ সময়, একদম হাতের মুঠোয়।",
  "hero.cta.download": "প্লে স্টোর থেকে ডাউনলোড করুন",
  "hero.cta.search": "বাস খুঁজুন",

  // Search card
  "search.title": "আপনার বাস খুঁজুন",
  "search.hint": "যেমন: আরামবাগ → তারকেশ্বর",
  "search.from": "কোথা থেকে",
  "search.to": "কোথায় যাবেন",
  "search.from.placeholder": "কোন জায়গা থেকে",
  "search.to.placeholder": "কোন জায়গা পর্যন্ত",
  "search.button": "খুঁজুন",
  "search.recent": "আগের খোঁজ",
  "search.clear": "মুছুন",

  // Features
  "feat.fast.title": "খুব দ্রুত",
  "feat.fast.desc": "এআই-এর সাহায্যে নিমেষে রুট খুঁজে নিন।",
  "feat.live.title": "লাইভ সময়",
  "feat.live.desc": "প্রতিটি স্টপের আপ ও ডাউন সময়, একদম এই মুহূর্তের।",
  "feat.trust.title": "পশ্চিমবঙ্গের ভরসা",
  "feat.trust.desc": "প্রতিদিনের যাত্রীরা সারা পশ্চিমবঙ্গে সোনিয়া বাডির উপর ভরসা রাখেন।",

  // Sections
  "section.fleet.eyebrow": "লাইভ বাস",
  "section.fleet.title": "চলতে থাকা বাসগুলো",
  "section.popular.eyebrow": "জনপ্রিয় রুট",
  "section.popular.title": "চটপট খুঁজুন",
  "section.popular.desc": "যেকোনো রুটে ট্যাপ করে সব বাস, সময় আর স্টপ এক জায়গায় দেখুন।",
  "card.viewSchedule": "বাস ও সময় দেখুন",

  // Routes page
  "routes.eyebrow": "খোঁজার ফলাফল",
  "routes.searching": "খোঁজা হচ্ছে…",
  "routes.found": "টি বাস পাওয়া গেছে • এইমাত্র আপডেট হলো",
  "routes.empty.title": "এই রুটে কোনো বাস পাওয়া গেল না",
  "routes.empty.desc.1": "এই দিকে",
  "routes.empty.desc.2": "থেকে",
  "routes.empty.desc.3": "পর্যন্ত চলে এমন কোনো বাস খুঁজে পাইনি। অন্য স্টপ দিয়ে চেষ্টা করুন বা বানান একবার দেখে নিন।",
  "routes.empty.cta": "নতুন করে খুঁজুন",
  "routes.viewFull": "পুরো সময় দেখুন",
  "routes.live": "বাস ট্র্যাকিং",
  "routes.stop": "স্টপ ট্র্যাকিং",
  "routes.departure": "ছাড়ার সময়",
  "routes.arrival": "পৌঁছানোর সময়",
  "routes.down": "ডাউন",

  // Bus detail
  "bus.back": "ফিরে যান",
  "bus.regNo": "রেজি নম্বর",
  "bus.live": "বাস ট্র্যাকিং",
  "bus.getApp": "অ্যাপ ডাউনলোড করুন",
  "bus.schedule.title": "পুরো সময়",
  "bus.schedule.desc": "সব স্টপের আপ ও ডাউন সময়",
  "bus.empty": "এখনও কোনো স্টপের তথ্য নেই।",
  "bus.col.upTime": "আপ সময়",
  "bus.col.stop": "স্টপের নাম",
  "bus.col.downTime": "ডাউন সময়",

  // Tracking modal
  "modal.tracking.title": "বাস ট্র্যাকিং",
  "modal.tracking.body": "এই সময়গুলো শুধু আনুমানিক। বাসের লাইভ লোকেশন দেখতে অ্যাপটি ডাউনলোড করে নিন।",
  "modal.tracking.cta": "অ্যাপ ডাউনলোড করুন",
  "modal.tracking.close": "বন্ধ করুন",
  "modal.tracking.toast": "আনুমানিক সময় দেখানো হচ্ছে…",

  // Disclaimer
  "disclaimer.title": "সময় সংক্রান্ত কথা",
  "disclaimer.body": "সময়গুলো যাত্রীদের কাছ থেকে পাওয়া তথ্যের ভিত্তিতে দেওয়া। আগে থেকে না জানিয়েই বদলে যেতে পারে। বেরোনোর আগে বাসের লোকের সঙ্গে সময়টা একবার মিলিয়ে নেবেন।",

  // Bus card
  "card.busTracking": "বাস ট্র্যাকিং",
  "card.stopTracking": "স্টপ ট্র্যাকিং",

  // Misc
  "common.loading": "লোড হচ্ছে…",
};

const dictionaries: Record<Lang, Dict> = { en, bn };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LangContext = createContext<Ctx | null>(null);

function readInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "bn" ? "bn" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setLangState(readInitial());
  }, []);

  // Reflect on <html lang="…"> for accessibility / SEO.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key,
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Safe fallback so hook never crashes outside provider (e.g. tests).
    return {
      lang: "en",
      setLang: () => {},
      t: (key: string) => dictionaries.en[key] ?? key,
    };
  }
  return ctx;
}

/** Pick the localized string for the active language with English fallback. */
export function pickLocalized(en: string | null | undefined, bn: string | null | undefined, lang: Lang): string {
  if (lang === "bn") return (bn && bn.trim()) || en || "";
  return en || "";
}
