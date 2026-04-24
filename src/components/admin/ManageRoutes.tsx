import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2, Bus as BusIcon, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { listAllBuses, updateBus, deleteBus, type BusRouteInput } from "@/lib/adminApi";
import type { BusRoute } from "@/lib/busRoutes";
import { RouteForm } from "./RouteForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterField = "all" | "name" | "source" | "destination" | "reg";

export function ManageRoutes() {
  const qc = useQueryClient();
  const { data: buses, isLoading, error } = useQuery({
    queryKey: ["admin", "buses"],
    queryFn: listAllBuses,
  });

  const [editing, setEditing] = useState<BusRoute | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [field, setField] = useState<FilterField>("all");

  const filtered = useMemo(() => {
    if (!buses) return [];
    const q = query.trim().toLowerCase();
    if (!q) return buses;
    const matches = (b: BusRoute, key: keyof BusRoute) =>
      typeof b[key] === "string" && (b[key] as string).toLowerCase().includes(q);
    return buses.filter((b) => {
      switch (field) {
        case "name":
          return matches(b, "bus_name");
        case "source":
          return matches(b, "source");
        case "destination":
          return matches(b, "destination");
        case "reg":
          return matches(b, "reg_number");
        case "all":
        default:
          return (
            matches(b, "bus_name") ||
            matches(b, "source") ||
            matches(b, "destination") ||
            matches(b, "reg_number")
          );
      }
    });
  }, [buses, query, field]);

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BusRouteInput }) => updateBus(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "buses"] });
      toast.success("Bus Updated Successfully", {
        description: `${vars.data.bus_name} saved.`,
      });
      setEditing(null);
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "buses"] });
      toast.success("Bus Deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error("Delete failed", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        Failed to load: {(error as Error).message}
      </div>
    );
  }

  if (!buses || buses.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card-gradient p-12 text-center">
        <BusIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold">No buses yet</p>
        <p className="text-sm text-muted-foreground">Use the AI Smart Input tab to add your first route.</p>
      </div>
    );
  }

  return (
    <>
      {/* Search & filter bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              field === "all"
                ? "Search by bus name, source, destination or reg…"
                : field === "name"
                  ? "Search by bus name…"
                  : field === "source"
                    ? "Search by source…"
                    : field === "destination"
                      ? "Search by destination…"
                      : "Search by registration number…"
            }
            className="pl-9 pr-9 rounded-xl"
            aria-label="Search routes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={field} onValueChange={(v) => setField(v as FilterField)}>
          <SelectTrigger className="h-10 w-full sm:w-[170px] rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fields</SelectItem>
            <SelectItem value="name">Bus name</SelectItem>
            <SelectItem value="source">Source</SelectItem>
            <SelectItem value="destination">Destination</SelectItem>
            <SelectItem value="reg">Registration</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground whitespace-nowrap sm:ml-2">
          {filtered.length} of {buses.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card-gradient p-10 text-center">
          <BusIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-sm">No matches for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-muted-foreground">Try a different name or stop.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((bus) => (
            <div
              key={bus.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card-gradient px-4 py-3 hover:border-primary/40 transition-smooth"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {bus.image_url ? (
                  <img src={bus.image_url} alt={bus.bus_name} className="w-full h-full object-cover" />
                ) : (
                  <BusIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{bus.bus_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {bus.reg_number} · {bus.bus_type} · {bus.source} → {bus.destination} · {bus.route_data?.length ?? 0} stops
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(bus)} className="rounded-xl">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(bus.id)} className="rounded-xl text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit bus route</DialogTitle>
          </DialogHeader>
          {editing && (
            <RouteForm
              initial={{
                bus_name: editing.bus_name,
                reg_number: editing.reg_number,
                source: editing.source,
                destination: editing.destination,
                bus_type: editing.bus_type,
                image_url: editing.image_url,
                route_data: editing.route_data ?? [],
              }}
              submitting={updateMut.isPending}
              submitLabel="Update"
              onCancel={() => setEditing(null)}
              onSubmit={async (data) => { await updateMut.mutateAsync({ id: editing.id, data }); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bus?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the route from the database. This cannot be undone.
            </AlertDialogDescription>
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
