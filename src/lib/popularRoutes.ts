import { supabase } from "./supabase";

export type PopularRoute = {
  id: string;
  source: string;
  destination: string;
  source_bn: string | null;
  destination_bn: string | null;
  image_url: string | null;
  pinned: boolean;
  sort_order: number;
  created_at?: string;
};

export type PopularRouteInput = {
  source: string;
  destination: string;
  source_bn?: string | null;
  destination_bn?: string | null;
  image_url?: string | null;
  pinned?: boolean;
  sort_order?: number;
};

const TABLE = "popular_routes";

/** Detect "table missing" errors (Postgres / PostgREST). */
export function isMissingTableError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .* does not exist|does not exist|schema cache|404/i.test(msg);
}

export async function listPopularRoutes(): Promise<PopularRoute[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PopularRoute[];
}

function buildPayload(input: PopularRouteInput): Record<string, unknown> {
  const p: Record<string, unknown> = {
    source: input.source.trim(),
    destination: input.destination.trim(),
    pinned: !!input.pinned,
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
  };
  if (input.source_bn?.trim()) p.source_bn = input.source_bn.trim();
  if (input.destination_bn?.trim()) p.destination_bn = input.destination_bn.trim();
  if (input.image_url?.trim()) p.image_url = input.image_url.trim();
  return p;
}

export async function createPopularRoute(input: PopularRouteInput): Promise<PopularRoute> {
  const { data, error } = await supabase.from(TABLE).insert(buildPayload(input)).select("*").single();
  if (error) throw error;
  return data as PopularRoute;
}

export async function updatePopularRoute(id: string, input: PopularRouteInput): Promise<PopularRoute> {
  const { data, error } = await supabase.from(TABLE).update(buildPayload(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return data as PopularRoute;
}

export async function deletePopularRoute(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function togglePin(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ pinned }).eq("id", id);
  if (error) throw error;
}
