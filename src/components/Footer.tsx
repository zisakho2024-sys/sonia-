import { Bus, ExternalLink, HelpCircle, Mail, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listFaqs } from "@/lib/faqs";
import { GooglePlayIcon } from "@/components/GooglePlayIcon";
import { pickLocalized, useLanguage } from "@/lib/i18n";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.busbuddy.mapingapp";

// Static fallback questions used when the DB has no FAQs yet.
const STATIC_TEASERS_EN = [
  "How to track buses?",
  "Is it free?",
  "Available routes?",
];
const STATIC_TEASERS_BN = [
  "বাস ট্র্যাক করব কীভাবে?",
  "এটা কি ফ্রি?",
  "কোন কোন রুট পাওয়া যাবে?",
];

export function Footer() {
  const { lang } = useLanguage();

  // Footer FAQ teaser — top 3 questions (graceful if table missing).
  const { data: faqs } = useQuery({
    queryKey: ["faqs"],
    queryFn: listFaqs,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const topFaqs = (faqs ?? []).slice(0, 3);
  const staticTeasers = lang === "bn" ? STATIC_TEASERS_BN : STATIC_TEASERS_EN;

  return (
    <footer className="mt-20 border-t border-border/50 bg-card/30 backdrop-blur">
      <div className="container mx-auto px-4 py-12">
        {/* Compact Download Card */}
        <div className="rounded-2xl bg-hero-gradient px-5 py-4 sm:px-7 sm:py-5 mb-10 shadow-elegant overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-orange-gradient opacity-20 blur-3xl" />
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-semibold text-primary uppercase tracking-wider mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" /> Available
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                Download <span className="text-gradient-orange">Sonia Buddy App</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-0.5">
                Live schedules, AI suggestions and route alerts on your phone.
              </p>
            </div>
            <div className="sm:justify-self-end">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-background border border-border hover:border-primary hover:shadow-glow transition-smooth"
              >
                <GooglePlayIcon className="w-5 h-5" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Get it on</div>
                  <div className="font-bold text-xs">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-primary/80 bg-orange-gradient flex items-center justify-center">
                <Bus className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Sonia<span className="text-gradient-orange">Buddy</span></span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your smart AI travel companion for hassle-free bus journeys.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-smooth">Home</Link></li>
              <li><Link to="/routes" className="hover:text-primary transition-smooth">Popular Routes</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-smooth">About</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-smooth">FAQ</Link></li>
            </ul>
            <h4 className="font-semibold mt-6 mb-3 text-sm uppercase tracking-wider">Network</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://soniabuddy.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-smooth">
                  soniabuddy.in <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* FAQ teaser column */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" /> Frequently Asked Questions
            </h4>
            {topFaqs.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topFaqs.map((f) => {
                  const q = pickLocalized(f.question, f.question_bn, lang);
                  return (
                    <li key={f.id}>
                      <Link
                        to="/faq"
                        hash={f.id}
                        className="hover:text-primary transition-smooth line-clamp-2"
                        lang={lang === "bn" && f.question_bn ? "bn" : undefined}
                      >
                        {q}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link to="/faq" className="text-primary font-semibold hover:underline">
                    {lang === "bn" ? "সব FAQ দেখুন →" : "See all FAQs →"}
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {staticTeasers.map((q, i) => (
                  <li key={i}>
                    <Link
                      to="/faq"
                      className="hover:text-primary transition-smooth line-clamp-2"
                      lang={lang === "bn" ? "bn" : undefined}
                    >
                      {q}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/faq" className="text-primary font-semibold hover:underline">
                    {lang === "bn" ? "সব FAQ দেখুন →" : "See all FAQs →"}
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 break-all">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:zisakhoofficial@gmail.com" className="hover:text-primary transition-smooth">
                  zisakhoofficial@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary shrink-0" /> West Bengal, India</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sonia Buddy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
