# Primo Routes

Bus / route information web app built with TanStack Start (React 19), Vite 7, Tailwind CSS 4, and Supabase.

## Project Layout

- `src/routes/` — TanStack Router file routes (index, about, faq, bus.$busId, sitemap.xml, admin.*)
- `src/components/` — UI components (mostly shadcn/ui based on Radix primitives)
- `src/lib/` — App services: `supabase.ts`, `auth.ts`, `busRoutes.ts`, `popularRoutes.ts`, `searchHistory.ts`, `faqs.ts`, `appSettings.ts`, `gemini.ts`, `i18n.tsx`, `diagnostics.ts`, `adminApi.ts`, `utils.ts`
- `src/server/extractRoute.ts` — Server function used by the admin panel
- `public/` — `manifest.webmanifest`, `robots.txt`
- `vite.config.ts` — Wraps `@lovable.dev/vite-tanstack-config`

## Replit Setup

- Node.js 22 (TanStack Start packages require >= 22.12)
- Dependencies installed with `npm install --legacy-peer-deps` (zod v4 vs `@tanstack/zod-adapter` peer)
- Workflow `Start application` runs `npm run dev` on port 5000 (webview)
- `vite.config.ts` overrides the lovable defaults to bind `0.0.0.0:5000` with `allowedHosts: true` so the Replit proxy iframe works
- `cloudflare: false` is passed to `defineConfig` so the build emits a Node-compatible server bundle (`dist/server/server.js`) instead of a Cloudflare Worker

## Deployment (Autoscale)

- Build: `npm run build` (`tsc --noEmit && vite build`)
- Run: `npx srvx serve --prod --entry=./dist/server/server.js --dir=. --static=./dist/client --port=5000 --host=0.0.0.0`
  - `srvx` is bundled with `h3-v2` and serves the TanStack Start fetch handler over Node HTTP, with `dist/client` as the static asset directory.

## Notes

- Supabase URL/anon key are inlined in `src/lib/supabase.ts` (publishable anon key, safe for the browser).
- `VITE_GEMINI_API_KEY` is optional — only needed for the admin "AI route extraction" panel.
- The dev iframe injects a Replit devtools script which causes a benign React hydration mismatch warning in dev only; it does not affect functionality and disappears in the production build.
