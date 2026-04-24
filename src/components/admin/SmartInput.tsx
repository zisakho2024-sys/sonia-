import { useEffect, useRef, useState } from "react";
import { Sparkles, Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { extractFromImage, extractFromText, checkGeminiConfigured } from "@/lib/gemini";
import { createBus } from "@/lib/adminApi";
import { RouteForm, emptyBusInput } from "./RouteForm";
import type { BusRouteInput } from "@/lib/adminApi";

// Billing is enabled — no artificial cooldown.
const COOLDOWN_MS = 0;

function isQuotaError(msg: string): boolean {
  return /429|quota|rate.?limit|resource.?exhausted/i.test(msg);
}

type TriggerSource = "manual-image" | "manual-text";
type ExtractStatus = "start" | "success" | "error" | "blocked-cooldown" | "blocked-empty";

function logExtract(source: TriggerSource, status: ExtractStatus, detail?: string) {
  // eslint-disable-next-line no-console
  console.info("[gemini-extract]", {
    timestamp: new Date().toISOString(),
    trigger: source,
    status,
    ...(detail ? { detail } : {}),
  });
}

export function SmartInput({ onCreated }: { onCreated: () => void }) {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BusRouteInput | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const lastCallRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Probe the server once to learn whether GEMINI_API_KEY is set.
  // If it isn't (or the probe fails), we run in Manual Entry Mode.
  useEffect(() => {
    let alive = true;
    checkGeminiConfigured().then((ok) => {
      if (alive) setAiAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Tick down the cooldown for UI feedback (does NOT trigger any API calls)
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastCallRef.current));
      setCooldownLeft(remaining);
      if (remaining === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const guard = (source: TriggerSource): boolean => {
    if (extracting) return false;
    const since = Date.now() - lastCallRef.current;
    if (since < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
      logExtract(source, "blocked-cooldown", `${wait}s remaining`);
      toast.warning(`Please wait ${wait}s before extracting again.`);
      return false;
    }
    return true;
  };

  const startCooldown = () => {
    lastCallRef.current = Date.now();
    setCooldownLeft(COOLDOWN_MS);
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    if (!guard("manual-image")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setExtracting(true);
    startCooldown();
    logExtract("manual-image", "start", file.name);
    try {
      const data = await extractFromImage(file);
      logExtract("manual-image", "success");
      setDraft({
        bus_name: data.bus_name,
        reg_number: data.reg_number,
        source: data.source,
        destination: data.destination,
        bus_type: data.bus_type,
        route_data: data.route_data,
        image_url: null,
        bus_name_bn: data.bus_name_bn,
        source_bn: data.source_bn,
        destination_bn: data.destination_bn,
        bus_type_bn: data.bus_type_bn,
        route_data_bn: data.route_data_bn,
      });
      toast.success("Extraction complete", { description: "Review the draft before saving." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      logExtract("manual-image", "error", msg);
      setError(msg);
      if (isQuotaError(msg)) {
        toast.error("AI is resting. Please use the Manual Dropdown.", {
          description: "You can still fill the form below by hand.",
        });
      } else {
        toast.error("Magic Fill failed", { description: msg });
      }
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleText = async () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      logExtract("manual-text", "blocked-empty");
      toast.warning("Paste some text first.");
      return;
    }
    if (!guard("manual-text")) return;
    setError(null);
    setExtracting(true);
    startCooldown();
    logExtract("manual-text", "start", `${trimmed.length} chars`);
    try {
      const data = await extractFromText(trimmed);
      logExtract("manual-text", "success");
      setDraft({
        bus_name: data.bus_name,
        reg_number: data.reg_number,
        source: data.source,
        destination: data.destination,
        bus_type: data.bus_type,
        route_data: data.route_data,
        image_url: null,
        bus_name_bn: data.bus_name_bn,
        source_bn: data.source_bn,
        destination_bn: data.destination_bn,
        bus_type_bn: data.bus_type_bn,
        route_data_bn: data.route_data_bn,
      });
      toast.success("Extraction complete", { description: "Review the draft before saving." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      logExtract("manual-text", "error", msg);
      setError(msg);
      if (isQuotaError(msg)) {
        toast.error("AI is resting. Please use the Manual Dropdown.", {
          description: "You can still fill the form below by hand.",
        });
      } else {
        toast.error("Magic Fill failed", { description: msg });
      }
    } finally {
      setExtracting(false);
    }
  };

  const save = async (data: BusRouteInput) => {
    setSaving(true);
    setError(null);
    try {
      await createBus(data);
      toast.success("Bus Created Successfully", {
        description: `${data.bus_name} has been added to the database.`,
      });
      setDraft(null);
      setPasteText("");
      setFormKey((k) => k + 1);
      onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (draft) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm">AI extracted draft — verify and edit before saving.</span>
        </div>
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm flex gap-3 items-start">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive">Extraction failed</div>
              <div className="text-foreground/80 mt-0.5">{error}</div>
            </div>
          </div>
        )}
        <RouteForm
          initial={draft}
          submitting={saving}
          submitLabel="Save to database"
          onCancel={() => setDraft(null)}
          onSubmit={save}
        />
      </div>
    );
  }

  const cooldownActive = cooldownLeft > 0;
  const cooldownSeconds = Math.ceil(cooldownLeft / 1000);
  const aiReady = aiAvailable === true;
  const disableTriggers = extracting || cooldownActive || !aiReady;

  // Safe-mode: if the server probe says AI is unavailable, hide the
  // "Extract with AI" UI entirely and surface the manual form instead.
  if (aiAvailable === false) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Manual Entry Mode Active</div>
            <div className="text-foreground/80 mt-0.5 text-xs">
              AI extraction is currently unavailable. You can still add routes by filling
              the form below in both English and Bengali.
            </div>
          </div>
        </div>
        <RouteForm
          key={formKey}
          initial={emptyBusInput}
          submitting={saving}
          submitLabel="Create bus"
          onSubmit={save}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {aiAvailable === null && (
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Checking AI availability…
        </div>
      )}

      <Tabs defaultValue="image">
        <TabsList className="rounded-xl">
          <TabsTrigger value="image" className="rounded-lg gap-2"><Upload className="w-4 h-4" /> Photo</TabsTrigger>
          <TabsTrigger value="text" className="rounded-lg gap-2"><FileText className="w-4 h-4" /> Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-6">
          <label className="block">
            <div className="rounded-3xl border-2 border-dashed border-border bg-card-gradient p-12 text-center cursor-pointer hover:border-primary/60 transition-smooth">
              {extracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Gemini is reading the timetable…</p>
                </div>
              ) : cooldownActive ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Cooling down… {cooldownSeconds}s</p>
                </div>
              ) : (
                <>
                  <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="font-semibold mb-1">Drop or pick a timetable photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG — Gemini will extract stops + times</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disableTriggers}
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
          </label>
        </TabsContent>

        <TabsContent value="text" className="mt-6 space-y-3">
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste route text here, e.g.&#10;&#10;Sonia Travels (WB-23-1234) — AC Sleeper&#10;Kolkata 06:00 AM / 10:30 PM&#10;Durgapur 08:30 AM / 08:00 PM&#10;Asansol 09:15 AM / 07:15 PM&#10;…"
            rows={10}
            className="rounded-2xl font-mono text-sm"
            disabled={extracting || !aiReady}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasteText("");
                setError(null);
              }}
              disabled={extracting || !pasteText}
              className="rounded-xl"
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleText}
              disabled={disableTriggers || !pasteText.trim()}
              className="rounded-xl bg-orange-gradient text-primary-foreground font-semibold shadow-glow"
            >
              {extracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : cooldownActive ? (
                <>Wait {cooldownSeconds}s</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Magic Fill (AI)</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm flex gap-3 items-start">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-destructive">Extraction failed</div>
            <div className="text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">{error}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Tip: try a sharper photo, or paste the text manually in the “Paste Text” tab.
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Or skip AI and add manually</summary>
          <div className="mt-4">
            <RouteForm
              key={formKey}
              initial={emptyBusInput}
              submitting={saving}
              submitLabel="Create bus"
              onSubmit={save}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
