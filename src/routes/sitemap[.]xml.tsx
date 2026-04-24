import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

const SITE = "https://primo-routes.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticUrls = ["/", "/routes", "/about"];

        let busUrls: { loc: string; lastmod?: string }[] = [];
        try {
          const { data } = await supabase
            .from("bus_routes")
            .select("id, created_at")
            .limit(5000);
          busUrls = (data ?? []).map((r: { id: string; created_at?: string }) => ({
            loc: `${SITE}/bus/${r.id}`,
            lastmod: r.created_at,
          }));
        } catch {
          /* ignore */
        }

        const today = new Date().toISOString();
        const urls = [
          ...staticUrls.map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`),
          ...busUrls.map(
            (b) =>
              `<url><loc>${b.loc}</loc><lastmod>${b.lastmod ?? today}</lastmod><changefreq>weekly</changefreq></url>`,
          ),
        ].join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
