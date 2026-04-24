import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sonia Buddy — Smart Bus Routes & Schedules" },
      { name: "description", content: "Find live bus routes, schedules and timings across West Bengal with Sonia AI." },
      { property: "og:title", content: "Sonia Buddy — Smart Bus Routes & Schedules" },
      { property: "og:description", content: "Find live bus routes, schedules and timings across West Bengal with Sonia AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sonia Buddy — Smart Bus Routes & Schedules" },
      { name: "twitter:description", content: "Find live bus routes, schedules and timings across West Bengal with Sonia AI." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/P0xuyQqGMkRc8TfwmkdMmCr7ruj2/social-images/social-1776843432266-WhatsApp_Image_2026-04-22_at_1.02.20_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/P0xuyQqGMkRc8TfwmkdMmCr7ruj2/social-images/social-1776843432266-WhatsApp_Image_2026-04-22_at_1.02.20_PM.webp" },
    ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "canonical", href: "https://primo-routes.lovable.app/" },
      ],
    }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
