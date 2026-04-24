import { supabase } from "./supabase";

export type RouteStop = {
  stoppage_name: string;
  up_time: string;   // "HH:mm AM/PM"
  down_time: string; // "HH:mm AM/PM"
};

export type BusRoute = {
  id: string;
  bus_name: string;
  reg_number: string;
  source: string;
  destination: string;
  bus_type: string;
  image_url: string | null;
  route_data: RouteStop[];
  // Optional Bengali (বাংলা) localized fields. Null/empty when not yet translated.
  bus_name_bn?: string | null;
  source_bn?: string | null;
  destination_bn?: string | null;
  bus_type_bn?: string | null;
  route_data_bn?: RouteStop[] | null;
};

const norm = (s: string) => s.trim().toLowerCase();

/** True if a stop name matches the user's query (case-insensitive, partial, EN or BN). */
const stopMatches = (stop: string, query: string) => {
  const a = norm(stop);
  const b = norm(query);
  return a === b || a.includes(b) || b.includes(a);
};

/** Find the index of a stop in a route_data array (matches across name + bn name). */
export const findStopIndex = (
  stops: RouteStop[],
  query: string,
  stopsBn?: RouteStop[] | null,
) =>
  stops.findIndex((s, i) => {
    if (stopMatches(s.stoppage_name, query)) return true;
    const bn = stopsBn?.[i]?.stoppage_name;
    return bn ? stopMatches(bn, query) : false;
  });

/** Multilingual search across English AND Bengali fields. */
export async function searchBuses(from: string, to: string): Promise<BusRoute[]> {
  const f = from.trim();
  const t = to.trim();
  if (!f || !t) return [];

  // Pull capped working set; filter client-side across EN + BN columns.
  const { data, error } = await supabase
    .from("bus_routes")
    .select("*")
    .limit(1000);

  if (error) {
    console.error("[searchBuses] fetch failed:", error);
    return [];
  }
  return filterBuses((data ?? []) as BusRoute[], f, t);
}

function filterBuses(rows: BusRoute[], from: string, to: string): BusRoute[] {
  const f = from.trim().toLowerCase();
  const t = to.trim().toLowerCase();
  if (!f || !t) return [];

  const textMatch = (a: string | null | undefined, q: string) => {
    if (!a) return false;
    const x = a.toLowerCase();
    return x === q || x.includes(q) || q.includes(x);
  };

  return rows.filter((r) => {
    const stops = Array.isArray(r.route_data) ? r.route_data : [];
    const stopsBn = Array.isArray(r.route_data_bn) ? r.route_data_bn : null;

    const fromIdx = findStopIndex(stops, from, stopsBn);
    const toIdx = findStopIndex(stops, to, stopsBn);

    // If both stops present in route_data, enforce direction.
    if (fromIdx !== -1 && toIdx !== -1) return fromIdx < toIdx;

    const fromMatches =
      textMatch(r.source, f) ||
      textMatch(r.source_bn, f) ||
      fromIdx !== -1;
    const toMatches =
      textMatch(r.destination, t) ||
      textMatch(r.destination_bn, t) ||
      toIdx !== -1;

    return fromMatches && toMatches;
  });
}

export type StopSuggestion = {
  /** Canonical value to put into the search input (English when available). */
  value: string;
  /** Pretty label, e.g. "তারকেশ্বর (Tarkeshwar)" or just "Tarkeshwar". */
  display: string;
};

/** Suggestions across English + Bengali source/destination/stop names. */
export async function getStopSuggestions(query: string, limit = 8): Promise<StopSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  type SuggestRow = Partial<
    Pick<BusRoute, "source" | "destination" | "route_data" | "source_bn" | "destination_bn" | "route_data_bn">
  >;
  let data: SuggestRow[] | null = null;
  let error: { message?: string } | null = null;

  const full = await supabase
    .from("bus_routes")
    .select("source,destination,route_data,source_bn,destination_bn,route_data_bn")
    .or(
      `source.ilike.${like},destination.ilike.${like},source_bn.ilike.${like},destination_bn.ilike.${like}`,
    )
    .limit(100);
  if (!full.error) {
    data = (full.data ?? []) as unknown as SuggestRow[];
  } else {
    const fallback = await supabase
      .from("bus_routes")
      .select("source,destination,route_data")
      .or(`source.ilike.${like},destination.ilike.${like}`)
      .limit(100);
    if (fallback.error) {
      error = fallback.error;
    } else {
      data = (fallback.data ?? []) as unknown as SuggestRow[];
    }
  }

  if (error || !data) return [];

  const ql = q.toLowerCase();
  const enCanonical = new Map<string, string>(); // key = en lowercased -> en canonical
  const bnByEn = new Map<string, string>();      // key = en lowercased -> bn

  const addPair = (en?: string | null, bn?: string | null) => {
    if (!en) return;
    const enClean = en.trim();
    if (!enClean) return;
    const k = enClean.toLowerCase();
    if (!enCanonical.has(k)) enCanonical.set(k, enClean);
    if (bn && bn.trim() && !bnByEn.has(k)) bnByEn.set(k, bn.trim());
  };

  for (const row of data) {
    addPair(row.source, row.source_bn);
    addPair(row.destination, row.destination_bn);
    if (Array.isArray(row.route_data)) {
      const stopsBn = Array.isArray(row.route_data_bn) ? row.route_data_bn : [];
      row.route_data.forEach((s, i) => addPair(s?.stoppage_name, stopsBn[i]?.stoppage_name));
    }
  }

  const results: StopSuggestion[] = [];
  for (const [k, en] of enCanonical) {
    const bn = bnByEn.get(k);
    const enMatches = k.includes(ql);
    const bnMatches = bn ? bn.toLowerCase().includes(ql) : false;
    if (!enMatches && !bnMatches) continue;
    results.push({
      value: en,
      display: bn ? `${bn} (${en})` : en,
    });
  }
  return results.slice(0, limit);
}

/** Get the up/down timings for a specific (from, to) pair on a route. */
export function getSegmentTimings(route: BusRoute, from: string, to: string) {
  const stops = route.route_data ?? [];
  const stopsBn = route.route_data_bn ?? null;
  const fromIdx = findStopIndex(stops, from, stopsBn);
  const toIdx = findStopIndex(stops, to, stopsBn);
  if (fromIdx === -1 || toIdx === -1) return null;
  return {
    departure: stops[fromIdx].up_time,
    arrival: stops[toIdx].up_time,
    fromName: stops[fromIdx].stoppage_name,
    toName: stops[toIdx].stoppage_name,
    fromNameBn: stopsBn?.[fromIdx]?.stoppage_name ?? null,
    toNameBn: stopsBn?.[toIdx]?.stoppage_name ?? null,
    downDeparture: stops[toIdx].down_time,
    downArrival: stops[fromIdx].down_time,
  };
}

export async function getBusById(id: string): Promise<BusRoute | null> {
  const { data, error } = await supabase
    .from("bus_routes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as BusRoute | null) ?? null;
}
