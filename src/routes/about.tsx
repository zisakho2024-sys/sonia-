import { createFileRoute } from "@tanstack/react-router";
import { Bot, Download, MapPin, Shield, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sonia Buddy" },
      { name: "description", content: "Learn about Sonia AI — the smart travel companion built for Indian commuters." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">About Us</div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">Built for the <span className="text-gradient-orange">commuter</span>.</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">Sonia Buddy is an AI-powered companion that brings every bus, route and timing to your fingertips. We started in West Bengal with a simple goal — make daily travel effortless.</p>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {[
            { icon: Bot, title: "AI Suggestions", desc: "Smart route picks based on time, traffic and your habits." },
            { icon: Zap, title: "Real-time", desc: "Live up/down timings updated continuously." },
            { icon: MapPin, title: "Every Stop", desc: "Granular stoppage-level data for hundreds of routes." },
            { icon: Shield, title: "Verified Data", desc: "Sources cross-checked by local operators." },
          ].map((f) => (
            <div key={f.title} className="bg-card-gradient border border-border/60 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-orange-gradient flex items-center justify-center mb-4"><f.icon className="w-5 h-5 text-primary-foreground" /></div>
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-hero-gradient rounded-3xl p-8 md:p-12 shadow-elegant text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Get the app today</h2>
          <p className="text-muted-foreground mb-6">Join 100k+ commuters travelling smarter every day.</p>
          <Button asChild size="lg" className="bg-orange-gradient text-primary-foreground font-semibold shadow-glow">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"><Download className="w-5 h-5" /> Download Now</a>
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
