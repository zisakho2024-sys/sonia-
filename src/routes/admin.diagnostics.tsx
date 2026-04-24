import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { runAllChecks, type CheckResult } from "@/lib/diagnostics";
import { searchBuses } from "@/lib/busRoutes";

export const Route = createFileRoute("/admin/diagnostics")({
  head: () => ({
    meta: [
      { title: "Diagnostics — SoniaBuddy Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DiagnosticsPage,
});

type ViewCheck = CheckResult & { running?: boolean };

function DiagnosticsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [checks, setChecks] = useState<ViewCheck[]>([]);
  const [searchCheck, setSearchCheck] = useState<ViewCheck | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) navigate({ to: "/admin/login" });
  }, [user, isAdmin, loading, navigate]);

  const runAll = async () => {
    setRunning(true);
    setChecks([]);
    setSearchCheck(null);
    try {
      const results = await runAllChecks();
      setChecks(results);

      // Bonus: smoke-test the Bengali search path end-to-end.
      try {
        const rows = await searchBuses("দিঘা", "কলকাতা");
        setSearchCheck({
          name: "Bengali search query",
          ok: true,
          detail: `searchBuses("দিঘা", "কলকাতা") returned ${rows.length} row(s) without errors.`,
        });
      } catch (e) {
        setSearchCheck({
          name: "Bengali search query",
          ok: false,
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const allOk = checks.length > 0 && checks.every((c) => c.ok) && (searchCheck?.ok ?? true);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <Button size="sm" variant="outline" onClick={runAll} disabled={running} className="rounded-xl">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Re-run
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Bengali (বাংলা) Diagnostics</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Confirms that the <code className="px-1 rounded bg-muted">*_bn</code> columns are exposed by PostgREST
          and that the app can read &amp; render Bengali end-to-end.
        </p>

        {running && checks.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Running checks…
          </div>
        ) : (
          <div className="space-y-3">
            {[...checks, ...(searchCheck ? [searchCheck] : [])].map((c) => (
              <Card key={c.name} className="p-4 flex items-start gap-3">
                {c.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 break-words">{c.detail}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!running && checks.length > 0 && (
          <Card className={`p-5 mt-6 border-2 ${allOk ? "border-green-500/40 bg-green-500/5" : "border-destructive/40 bg-destructive/5"}`}>
            <div className="flex items-center gap-2 font-semibold">
              {allOk ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> All checks passed — Bengali is live.
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" /> Some checks failed.
                </>
              )}
            </div>
            {!allOk && (
              <p className="text-xs text-muted-foreground mt-2">
                If a column is missing, run the SQL migration. If columns exist but PostgREST returns
                "column does not exist", open Supabase Dashboard → API Docs → <strong>Reload schema</strong>,
                wait ~10s, then click <strong>Re-run</strong>.
              </p>
            )}
          </Card>
        )}

        <div className="mt-8 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Manual verification:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Switch the header language to <strong>বাংলা</strong>.</li>
            <li>Open <Link to="/" className="underline">Home</Link> — labels &amp; placeholders should be Bengali.</li>
            <li>Search for <code>দিঘা → কলকাতা</code> on <Link to="/routes" className="underline">Routes</Link>.</li>
            <li>Open any bus detail — stoppage table headers and (if populated) names should be Bengali.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
