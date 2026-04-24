import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Route as RouteIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createPopularRoute,
  deletePopularRoute,
  isMissingTableError,
  listPopularRoutes,
  togglePin,
  updatePopularRoute,
  type PopularRoute,
  type PopularRouteInput,
} from "@/lib/popularRoutes";

const SQL_HINT = `-- Run in Supabase SQL Editor:
create table if not exists public.popular_routes (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  source_bn text,
  destination_bn text,
  image_url text,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.popular_routes enable row level security;

create policy "Public can read popular routes"
  on public.popular_routes for select to anon, authenticated using (true);

create policy "Admins can manage popular routes"
  on public.popular_routes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));`;

const empty: PopularRouteInput = {
  source: "",
  destination: "",
  source_bn: "",
  destination_bn: "",
  image_url: "",
  pinned: false,
  sort_order: 0,
};

export function ManagePopularRoutes() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "popular-routes"],
    queryFn: listPopularRoutes,
    retry: false,
  });

  const [editing, setEditing] = useState<PopularRoute | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PopularRouteInput>(empty);

  const createMut = useMutation({
    mutationFn: (data: PopularRouteInput) => createPopularRoute(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "popular-routes"] });
      qc.invalidateQueries({ queryKey: ["popular-routes"] });
      toast.success("Route added");
      setCreating(false);
      setForm(empty);
    },
    onError: (e: Error) => toast.error("Add failed", { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PopularRouteInput }) => updatePopularRoute(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "popular-routes"] });
      qc.invalidateQueries({ queryKey: ["popular-routes"] });
      toast.success("Route updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePopularRoute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "popular-routes"] });
      qc.invalidateQueries({ queryKey: ["popular-routes"] });
      toast.success("Route deleted");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  const pinMut = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => togglePin(id, pinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "popular-routes"] });
      qc.invalidateQueries({ queryKey: ["popular-routes"] });
    },
    onError: (e: Error) => toast.error("Pin failed", { description: e.message }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    if (isMissingTableError(error)) {
      return (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6">
          <h3 className="font-bold mb-2">popular_routes table not found</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Run this SQL once in your Supabase SQL Editor, then return here:
          </p>
          <pre className="text-[11px] bg-background border border-border rounded-xl p-3 overflow-auto whitespace-pre">{SQL_HINT}</pre>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        Failed to load: {(error as Error).message}
      </div>
    );
  }

  const openCreate = () => {
    setForm(empty);
    setCreating(true);
  };

  const openEdit = (r: PopularRoute) => {
    setForm({
      source: r.source,
      destination: r.destination,
      source_bn: r.source_bn ?? "",
      destination_bn: r.destination_bn ?? "",
      image_url: r.image_url ?? "",
      pinned: r.pinned,
      sort_order: r.sort_order,
    });
    setEditing(r);
  };

  const submit = () => {
    if (!form.source.trim() || !form.destination.trim()) {
      toast.error("Source and destination are required");
      return;
    }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const list = data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Routes shown in the homepage <strong>Quick Search</strong> section. Pinned routes appear first.
        </p>
        <Button onClick={openCreate} size="sm" className="rounded-xl bg-orange-gradient text-primary-foreground">
          <Plus className="w-4 h-4" /> Add route
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card-gradient p-12 text-center">
          <RouteIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No popular routes yet</p>
          <p className="text-sm text-muted-foreground">Click &ldquo;Add route&rdquo; to create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card-gradient px-4 py-3 hover:border-primary/40 transition-smooth"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.source} className="w-full h-full object-cover" />
                ) : (
                  <RouteIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-2">
                  {r.source} → {r.destination}
                  {r.pinned && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.source_bn || r.destination_bn
                    ? `${r.source_bn ?? "—"} → ${r.destination_bn ?? "—"}`
                    : "No Bengali translation"}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => pinMut.mutate({ id: r.id, pinned: !r.pinned })}
                className="rounded-xl"
                title={r.pinned ? "Unpin" : "Pin to top"}
              >
                {r.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)} className="rounded-xl">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteId(r.id)}
                className="rounded-xl text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit popular route" : "Add popular route"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source (EN)" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Arambagh" />
              <Field label="Source (BN)" value={form.source_bn ?? ""} onChange={(v) => setForm({ ...form, source_bn: v })} placeholder="আরামবাগ" />
              <Field label="Destination (EN)" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} placeholder="Kolkata" />
              <Field label="Destination (BN)" value={form.destination_bn ?? ""} onChange={(v) => setForm({ ...form, destination_bn: v })} placeholder="কলকাতা" />
            </div>
            <Field
              label="Image URL (optional)"
              value={form.image_url ?? ""}
              onChange={(v) => setForm({ ...form, image_url: v })}
              placeholder="https://…"
            />
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label className="text-xs">Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                  className="rounded-xl mt-1"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4"
                />
                <Pin className="w-3.5 h-3.5 text-primary" /> Pin to top
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
              className="rounded-xl bg-orange-gradient text-primary-foreground"
            >
              {createMut.isPending || updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this popular route?</AlertDialogTitle>
            <AlertDialogDescription>It will disappear from the homepage immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl mt-1"
      />
    </div>
  );
}
