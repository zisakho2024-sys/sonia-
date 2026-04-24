import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GooglePlayIcon } from "@/components/GooglePlayIcon";
import { useLanguage, type Lang } from "@/lib/i18n";
import logoImg from "@/assets/logo.jpeg";

export function Header() {
  const { t, lang, setLang } = useLanguage();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-primary/80 bg-background overflow-hidden flex items-center justify-center shadow-glow group-hover:scale-110 transition-smooth shrink-0">
            <img src={logoImg} alt="SoniaBuddy logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-bold text-sm sm:text-base tracking-tight truncate">
              Sonia<span className="text-gradient-orange">Buddy</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-widest truncate">
              Smart Travel
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.home")}
          </Link>
          <Link to="/routes" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.routes")}
          </Link>
          <Link to="/about" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.about")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher lang={lang} setLang={setLang} />
          <Button asChild size="sm" className="bg-orange-gradient hover:opacity-90 text-primary-foreground font-semibold shadow-glow h-9 px-2.5 sm:px-3">
            <a href="https://play.google.com/store/apps/details?id=com.busbuddy.mapingapp" target="_blank" rel="noopener noreferrer">
              <GooglePlayIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t("nav.download")}</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function LanguageSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const baseBtn =
    "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-smooth whitespace-nowrap";
  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="flex items-center gap-0.5 sm:gap-1 rounded-xl border border-border/60 bg-background/60 backdrop-blur pl-1.5 sm:pl-2 pr-1 py-0.5 sm:py-1"
    >
      <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground hidden sm:inline" aria-hidden />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`${baseBtn} ${lang === "en" ? "bg-orange-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        className={`${baseBtn} ${lang === "bn" ? "bg-orange-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
      >
        বাংলা
      </button>
    </div>
  );
}
