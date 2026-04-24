import { supabase } from "./supabase";
import type { BusRoute, RouteStop } from "./busRoutes";

const BUCKET = "sonia photo";

export type BusRouteInput = {
  bus_name: string;
  reg_number: string;
  source: string;
  destination: string;
  bus_type: string;
  image_url: string | null;
  route_data: RouteStop[];
  // Optional Bengali fields — saved when available (e.g. from Gemini extraction).
  bus_name_bn?: string;
  source_bn?: string;
  destination_bn?: string;
  bus_type_bn?: string;
  route_data_bn?: RouteStop[];
};

function normalizeRouteData(routeData: RouteStop[] | unknown): RouteStop[] {
  if (!Array.isArray(routeData)) return [];

  return routeData.map((stop) => {
    const raw = typeof stop === "object" && stop !== null ? stop : {};
    const safeStop = raw as Partial<RouteStop>;

    return {
      stoppage_name: typeof safeStop.stoppage_name === "string" ? safeStop.stoppage_name : "",
      up_time: typeof safeStop.up_time === "string" ? safeStop.up_time : "",
      down_time: typeof safeStop.down_time === "string" ? safeStop.down_time : "",
    };
  });
}

export async function listAllBuses(): Promise<BusRoute[]> {
  const { data, error } = await supabase
    .from("bus_routes")
    .select("*")
    .order("bus_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BusRoute[];
}

function buildPayload(input: BusRouteInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    bus_name: input.bus_name,
    source: input.source,
    destination: input.destination,
    route_data: normalizeRouteData(input.route_data),
  };

  if (input.reg_number?.trim()) payload.reg_number = input.reg_number.trim();
  if (input.bus_type?.trim()) payload.bus_type = input.bus_type.trim();
  if (input.image_url?.trim()) payload.image_url = input.image_url.trim();

  // Bengali fields — only attach when present so we don't fail before migration runs.
  if (input.bus_name_bn?.trim()) payload.bus_name_bn = input.bus_name_bn.trim();
  if (input.source_bn?.trim()) payload.source_bn = input.source_bn.trim();
  if (input.destination_bn?.trim()) payload.destination_bn = input.destination_bn.trim();
  if (input.bus_type_bn?.trim()) payload.bus_type_bn = input.bus_type_bn.trim();
  if (Array.isArray(input.route_data_bn) && input.route_data_bn.length > 0) {
    payload.route_data_bn = normalizeRouteData(input.route_data_bn);
  }

  return payload;
}

async function insertWithFallback(
  payload: Record<string, unknown>,
): Promise<BusRoute> {
  const { data, error } = await supabase.from("bus_routes").insert(payload).select("*").single();
  if (error && /column .*_bn.* does not exist/i.test(error.message ?? "")) {
    // Bengali columns don't exist yet — strip them and retry so the form still works.
    const safe = { ...payload };
    for (const k of Object.keys(safe)) if (k.endsWith("_bn")) delete safe[k];
    const retry = await supabase.from("bus_routes").insert(safe).select("*").single();
    if (retry.error) throw retry.error;
    return retry.data as BusRoute;
  }
  if (error) throw error;
  return data as BusRoute;
}

async function updateWithFallback(
  id: string,
  payload: Record<string, unknown>,
): Promise<BusRoute> {
  const { data, error } = await supabase.from("bus_routes").update(payload).eq("id", id).select("*").single();
  if (error && /column .*_bn.* does not exist/i.test(error.message ?? "")) {
    const safe = { ...payload };
    for (const k of Object.keys(safe)) if (k.endsWith("_bn")) delete safe[k];
    const retry = await supabase.from("bus_routes").update(safe).eq("id", id).select("*").single();
    if (retry.error) throw retry.error;
    return retry.data as BusRoute;
  }
  if (error) throw error;
  return data as BusRoute;
}

export async function createBus(input: BusRouteInput): Promise<BusRoute> {
  const payload = buildPayload(input);
  console.log("[createBus] inserting into bus_routes with payload:", payload);
  return insertWithFallback(payload);
}

export async function updateBus(id: string, input: BusRouteInput): Promise<BusRoute> {
  const payload = buildPayload(input);
  return updateWithFallback(id, payload);
}

export async function deleteBus(id: string): Promise<void> {
  const { error } = await supabase.from("bus_routes").delete().eq("id", id);
  if (error) throw error;
}

/** Upload an image to the `sonia photo` bucket and return its public URL. */
export async function uploadBusPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `buses/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
