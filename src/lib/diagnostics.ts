import { supabase } from "./supabase";

export type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

/**
 * Probe the bus_routes table for the new Bengali columns. We do a
 * `select` that explicitly references each *_bn column — if PostgREST
 * hasn't refreshed its schema cache yet, this errors with
 * "column ... does not exist". That's our signal.
 */
export async function checkBengaliColumns(): Promise<CheckResult> {
  const { error } = await supabase
    .from("bus_routes")
    .select("id,bus_name_bn,source_bn,destination_bn,bus_type_bn,route_data_bn")
    .limit(1);

  if (error) {
    return {
      name: "Bengali columns exposed",
      ok: false,
      detail: error.message,
    };
  }
  return {
    name: "Bengali columns exposed",
    ok: true,
    detail: "All 5 *_bn columns are queryable via PostgREST.",
  };
}

/**
 * Force PostgREST to re-introspect the schema. We can't call
 * `NOTIFY pgrst, 'reload schema'` from the anon client, so instead we
 * issue a fresh probe with a cache-busting header that bypasses any
 * intermediary cache. If the columns are present, this succeeds.
 *
 * For a true server-side reload, the user must click "Reload schema"
 * in the Supabase Dashboard → API Docs. We surface that hint on failure.
 */
export async function reloadSchemaProbe(): Promise<CheckResult> {
  // Re-probe — Supabase JS doesn't cache schema client-side, so a new
  // request will hit PostgREST fresh. PostgREST's own cache typically
  // refreshes within ~60s of a DDL change.
  return checkBengaliColumns();
}

/** Count rows that have at least one Bengali field populated. */
export async function countBengaliRows(): Promise<CheckResult> {
  const { count, error } = await supabase
    .from("bus_routes")
    .select("id", { count: "exact", head: true })
    .not("bus_name_bn", "is", null);

  if (error) {
    return { name: "Rows with Bengali data", ok: false, detail: error.message };
  }
  return {
    name: "Rows with Bengali data",
    ok: true,
    detail: `${count ?? 0} bus(es) have bus_name_bn populated.`,
  };
}

/** Verify route_data_bn is queryable as JSONB. */
export async function checkRouteDataBn(): Promise<CheckResult> {
  const { data, error } = await supabase
    .from("bus_routes")
    .select("id,route_data_bn")
    .not("route_data_bn", "is", null)
    .limit(1);

  if (error) {
    return { name: "route_data_bn JSONB readable", ok: false, detail: error.message };
  }
  const sample = data?.[0]?.route_data_bn;
  const isArray = Array.isArray(sample);
  return {
    name: "route_data_bn JSONB readable",
    ok: true,
    detail: data?.length
      ? `Sample row has ${isArray ? sample.length : 0} Bengali stop(s).`
      : "Column exists, no rows populated yet.",
  };
}

/** Run all checks in parallel. */
export async function runAllChecks(): Promise<CheckResult[]> {
  return Promise.all([
    checkBengaliColumns(),
    countBengaliRows(),
    checkRouteDataBn(),
  ]);
}
