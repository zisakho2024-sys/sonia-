import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bus, LogOut, Sparkles, ListChecks, Loader2, RefreshCw, Activity, ShieldCheck, MessageCircleQuestion, Route as RouteIcon, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth, signOut } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { SmartInput } from "@/components/admin/SmartInput";
import { ManageRoutes } from "@/components/admin/ManageRoutes";
import { ManageFaqs } from "@/components/admin/ManageFaqs";
import { ManagePopularRoutes } from "@/components/admin/ManagePopularRoutes";
import { ManageSettings } from "@/components/admin/ManageSettings";
import { reloadSchemaProbe, runAllChecks } from "@/lib/diagnostics";
import { searchBuses } from "@/lib/busRoutes";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — SoniaBuddy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [reloading, setReloading] = useState(false);
  const [e2eRunning, setE2eRunning] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const onLogout = async () => {
    await signOut();
    navigate({ to: "/admin/login" });
  };

  const onReloadSchema = async () => {
    setReloading(true);
    const t = toast.loading("Reloading schema — probing PostgREST for *_bn columns…");
    try {
      const result = await reloadSchemaProbe();
      toast.dismiss(t);
      if (result.ok) {
        toast.success("Schema is in sync ✓", {
          description: "All Bengali (*_bn) columns are live and queryable.",
        });
      } else {
        toast.error("Columns not visible yet", {
          description:
            "Please ensure the SQL migration was run in Supabase Editor, then click Reload schema again. Detail: " +
            result.detail,
          duration: 8000,
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error("Reload failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setReloading(false);
    }
  };

  const onBengaliE2E = async () => {
    setE2eRunning(true);
    const tId = toast.loading("Running Bengali end-to-end check…");
    try {
      // 1. Schema check (Home + Detail rely on these columns)
      const checks = await runAllChecks();
      const failed = checks.filter((c) => !c.ok);

      // 2. Results-view smoke test — the search query path used on /routes
      let searchOk = true;
      let searchDetail = "";
      try {
        const rows = await searchBuses("দিঘা", "কলকাতা");
        searchDetail = `searchBuses returned ${rows.length} row(s).`;
      } catch (e) {
        searchOk = false;
        searchDetail = e instanceof Error ? e.message : String(e);
      }

      toast.dismiss(tId);
      if (failed.length === 0 && searchOk) {
        toast.success("Bengali E2E ✓ All views ready", {
          description: `Home, Results & Detail can read *_bn data. ${searchDetail}`,
          duration: 6000,
        });
      } else {
        const failNames = failed.map((c) => c.name).join(", ") || "(none)";
        toast.error("Bengali E2E failed", {
          description: `Schema fails: ${failNames}. Search: ${searchOk ? "ok" : "failed — " + searchDetail}. Open Diagnostics for details.`,
          duration: 9000,
        });
      }
    } finally {
      setE2eRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-gradient flex items-center justify-center shadow-glow">
              <Bus className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">Sonia<span className="text-gradient-orange">Buddy</span></div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReloadSchema}
              disabled={reloading}
              className="rounded-xl"
              title="Probe PostgREST for *_bn columns"
            >
              {reloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{reloading ? "Reloading…" : "Reload schema"}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onBengaliE2E}
              disabled={e2eRunning}
              className="rounded-xl"
              title="End-to-end Bengali health check (Home + Results + Detail)"
            >
              {e2eRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{e2eRunning ? "Checking…" : "Bengali E2E"}</span>
            </Button>
            <Link to="/admin/diagnostics">
              <Button size="sm" variant="ghost" className="rounded-xl" title="Bengali diagnostics">
                <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Diagnostics</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={onLogout} className="rounded-xl">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-1">Route Control</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Add new bus routes via AI extraction or manage your existing fleet.
        </p>

        <Tabs defaultValue="smart">
          <TabsList className="rounded-xl flex-wrap h-auto">
            <TabsTrigger value="smart" className="rounded-lg gap-2">
              <Sparkles className="w-4 h-4" /> AI Smart Input
            </TabsTrigger>
            <TabsTrigger value="manage" className="rounded-lg gap-2">
              <ListChecks className="w-4 h-4" /> Manage Routes
            </TabsTrigger>
            <TabsTrigger value="popular" className="rounded-lg gap-2">
              <RouteIcon className="w-4 h-4" /> Popular Routes
            </TabsTrigger>
            <TabsTrigger value="faqs" className="rounded-lg gap-2">
              <MessageCircleQuestion className="w-4 h-4" /> FAQs
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg gap-2">
              <SettingsIcon className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart" className="mt-8">
            <SmartInput onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "buses"] })} />
          </TabsContent>

          <TabsContent value="manage" className="mt-8">
            <ManageRoutes />
          </TabsContent>

          <TabsContent value="popular" className="mt-8">
            <ManagePopularRoutes />
          </TabsContent>

          <TabsContent value="faqs" className="mt-8">
            <ManageFaqs />
          </TabsContent>

          <TabsContent value="settings" className="mt-8">
            <ManageSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
