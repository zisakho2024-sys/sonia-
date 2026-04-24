import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uploadBusPhoto, type BusRouteInput } from "@/lib/adminApi";
import type { RouteStop } from "@/lib/busRoutes";
import { TimePicker } from "@/components/admin/TimePicker";
import { BusTypeSelect } from "@/components/admin/BusTypeSelect";

type Props = {
  initial: BusRouteInput;
  onCancel?: () => void;
  onSubmit: (data: BusRouteInput) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
};

const emptyStop: RouteStop = { stoppage_name: "", up_time: "", down_time: "" };

export function RouteForm({ initial, onCancel, onSubmit, submitting, submitLabel = "Save" }: Props) {
  const [form, setForm] = useState<BusRouteInput>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateField = <K extends keyof BusRouteInput>(key: K, value: BusRouteInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const stopsBn = (form.route_data_bn ?? []) as RouteStop[];

  const updateStop = (idx: number, key: keyof RouteStop, value: string) =>
    setForm((f) => ({
      ...f,
      route_data: f.route_data.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }));

  const updateStopBn = (idx: number, value: string) =>
    setForm((f) => {
      const current = (f.route_data_bn ?? []) as RouteStop[];
      // Mirror the EN array length so indices stay aligned.
      const padded: RouteStop[] = f.route_data.map(
        (en, i) => current[i] ?? { ...emptyStop, up_time: en.up_time, down_time: en.down_time },
      );
      padded[idx] = { ...padded[idx], stoppage_name: value };
      return { ...f, route_data_bn: padded };
    });

  const addStop = () =>
    setForm((f) => ({
      ...f,
      route_data: [...f.route_data, { ...emptyStop }],
      route_data_bn: [...((f.route_data_bn ?? []) as RouteStop[]), { ...emptyStop }],
    }));

  const removeStop = (idx: number) =>
    setForm((f) => ({
      ...f,
      route_data: f.route_data.filter((_, i) => i !== idx),
      route_data_bn: ((f.route_data_bn ?? []) as RouteStop[]).filter((_, i) => i !== idx),
    }));

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadBusPhoto(file);
      updateField("image_url", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const stops = form.route_data;
        const stopsBnAligned = (form.route_data_bn ?? []) as RouteStop[];
        // Keep up/down times mirrored from EN onto BN so search/segment timings work.
        const route_data_bn = stops.map((en, i) => ({
          stoppage_name: stopsBnAligned[i]?.stoppage_name ?? "",
          up_time: en.up_time,
          down_time: en.down_time,
        }));
        const final: BusRouteInput = {
          ...form,
          source: form.source || stops[0]?.stoppage_name || "",
          destination: form.destination || stops[stops.length - 1]?.stoppage_name || "",
          route_data_bn,
        };
        onSubmit(final);
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <BilingualField
          label="Bus Name"
          en={form.bus_name}
          bn={form.bus_name_bn ?? ""}
          onEn={(v) => updateField("bus_name", v)}
          onBn={(v) => updateField("bus_name_bn", v)}
          requiredEn
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Registration Number">
            <Input value={form.reg_number} onChange={(e) => updateField("reg_number", e.target.value)} required className="rounded-xl" />
          </Field>
          <Field label="Photo">
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => onPhoto(e.target.files?.[0])}
                className="rounded-xl"
              />
              {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>
            {form.image_url && (
              <a href={form.image_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline truncate max-w-full">
                {form.image_url}
              </a>
            )}
            {uploadError && <p className="mt-1 text-xs text-destructive-foreground">{uploadError}</p>}
          </Field>
        </div>

        <BilingualField
          label="Source"
          en={form.source}
          bn={form.source_bn ?? ""}
          onEn={(v) => updateField("source", v)}
          onBn={(v) => updateField("source_bn", v)}
          enPlaceholder="auto from first stop"
          bnPlaceholder="প্রথম স্টপ থেকে স্বয়ংক্রিয়"
        />
        <BilingualField
          label="Destination"
          en={form.destination}
          bn={form.destination_bn ?? ""}
          onEn={(v) => updateField("destination", v)}
          onBn={(v) => updateField("destination_bn", v)}
          enPlaceholder="auto from last stop"
          bnPlaceholder="শেষ স্টপ থেকে স্বয়ংক্রিয়"
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Bus Type
          </label>
          <BusTypeSelect
            valueEn={form.bus_type}
            valueBn={form.bus_type_bn ?? ""}
            onChange={(en, bn) => {
              setForm((f) => ({ ...f, bus_type: en, bus_type_bn: bn }));
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Stoppages — English & বাংলা
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={addStop} className="rounded-xl">
            <Plus className="w-4 h-4" /> Add Stop
          </Button>
        </div>
        <div className="rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Stoppage (EN)</TableHead>
                <TableHead>স্টপ (BN)</TableHead>
                <TableHead className="w-36">Up Time</TableHead>
                <TableHead className="w-36">Down Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.route_data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    No stops yet — click "Add Stop" to begin.
                  </TableCell>
                </TableRow>
              )}
              {form.route_data.map((stop, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Input
                      value={stop.stoppage_name}
                      onChange={(e) => updateStop(i, "stoppage_name", e.target.value)}
                      placeholder="Stop name"
                      className="rounded-lg h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={stopsBn[i]?.stoppage_name ?? ""}
                      onChange={(e) => updateStopBn(i, e.target.value)}
                      placeholder="স্টপের নাম"
                      lang="bn"
                      className="rounded-lg h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <TimePicker
                      value={stop.up_time}
                      onChange={(v) => updateStop(i, "up_time", v)}
                      placeholder="06:30 AM"
                    />
                  </TableCell>
                  <TableCell>
                    <TimePicker
                      value={stop.down_time}
                      onChange={(v) => updateStop(i, "down_time", v)}
                      placeholder="08:15 PM"
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeStop(i)} className="h-8 w-8">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-xl bg-orange-gradient text-primary-foreground font-semibold shadow-glow hover:opacity-95"
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function BilingualField({
  label,
  en,
  bn,
  onEn,
  onBn,
  enPlaceholder,
  bnPlaceholder,
  requiredEn,
}: {
  label: string;
  en: string;
  bn: string;
  onEn: (v: string) => void;
  onBn: (v: string) => void;
  enPlaceholder?: string;
  bnPlaceholder?: string;
  requiredEn?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
        {label}
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground/80 mb-1">English</div>
          <Input
            value={en}
            onChange={(e) => onEn(e.target.value)}
            placeholder={enPlaceholder}
            required={requiredEn}
            className="rounded-xl"
          />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground/80 mb-1">বাংলা (Bengali)</div>
          <Input
            value={bn}
            onChange={(e) => onBn(e.target.value)}
            placeholder={bnPlaceholder}
            lang="bn"
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

export const emptyBusInput: BusRouteInput = {
  bus_name: "",
  reg_number: "",
  source: "",
  destination: "",
  bus_type: "",
  image_url: null,
  route_data: [],
  bus_name_bn: "",
  source_bn: "",
  destination_bn: "",
  bus_type_bn: "",
  route_data_bn: [],
};
