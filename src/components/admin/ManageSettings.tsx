import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DISCLAIMER,
  SETTING_KEYS,
  SETTINGS_SQL,
  buildDisclaimer,
  getAllSettings,
  upsertSetting,
} from "@/lib/appSettings";

export function ManageSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAllSettings,
    retry: false,
  });

  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyBn, setBodyBn] = useState("");

  // Hydrate form when settings load
  useEffect(() => {
    if (!settings) return;
    const d = buildDisclaimer(settings);
    setTitleEn(d.titleEn);
    setTitleBn(d.titleBn);
    setBodyEn(d.bodyEn);
    setBodyBn(d.bodyBn);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await Promise.all([
        upsertSetting(SETTING_KEYS.disclaimerTitleEn, titleEn.trim()),
        upsertSetting(SETTING_KEYS.disclaimerTitleBn, titleBn.trim()),
        upsertSetting(SETTING_KEYS.disclaimerBodyEn, bodyEn.trim()),
        upsertSetting(SETTING_KEYS.disclaimerBodyBn, bodyBn.trim()),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Disclaimer saved", {
        description: "Updates appear on every bus card immediately.",
      });
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const resetDefaults = () => {
    setTitleEn(DEFAULT_DISCLAIMER.titleEn);
    setTitleBn(DEFAULT_DISCLAIMER.titleBn);
    setBodyEn(DEFAULT_DISCLAIMER.bodyEn);
    setBodyBn(DEFAULT_DISCLAIMER.bodyBn);
    toast.info("Defaults restored — click Save to apply.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="font-bold">app_settings table not found</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Run this SQL once in your Supabase SQL Editor, then click Reload.
        </p>
        <pre className="text-[11px] bg-background border border-border rounded-xl p-3 overflow-auto whitespace-pre">
          {SETTINGS_SQL}
        </pre>
        <Button onClick={() => refetch()} className="mt-3 rounded-xl" size="sm" variant="outline">
          <RotateCcw className="w-4 h-4" /> Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card-gradient p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-lg">Disclaimer</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Shown when users tap the red warning icon on a bus card. Use a blank line between
          paragraphs — each paragraph becomes a bullet point in the modal.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs">Title (EN)</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs">Title (BN)</Label>
            <Input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className="rounded-xl mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Body (EN)</Label>
            <Textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={9}
              className="rounded-xl mt-1 font-normal text-sm"
              placeholder="Use a blank line between paragraphs."
            />
          </div>
          <div>
            <Label className="text-xs">Body (BN)</Label>
            <Textarea
              value={bodyBn}
              onChange={(e) => setBodyBn(e.target.value)}
              rows={9}
              className="rounded-xl mt-1 font-normal text-sm"
              placeholder="অনুচ্ছেদের মাঝে একটি ফাঁকা লাইন ব্যবহার করুন।"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="rounded-xl bg-orange-gradient text-primary-foreground"
          >
            {saveMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save disclaimer
          </Button>
          <Button onClick={resetDefaults} variant="outline" className="rounded-xl">
            <RotateCcw className="w-4 h-4" /> Restore defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
