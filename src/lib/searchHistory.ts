export type SearchHistoryItem = { from: string; to: string; ts: number };

const KEY = "sonia.searchHistory.v1";
const MAX = 5;

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.from === "string" && typeof x.to === "string")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function addSearchToHistory(from: string, to: string) {
  if (typeof window === "undefined") return;
  const f = from.trim();
  const t = to.trim();
  if (!f || !t) return;
  const current = getSearchHistory();
  const dedup = current.filter(
    (x) => x.from.toLowerCase() !== f.toLowerCase() || x.to.toLowerCase() !== t.toLowerCase(),
  );
  const next = [{ from: f, to: t, ts: Date.now() }, ...dedup].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Recent unique stop names (from either side of past searches). */
export function getRecentStops(limit = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of getSearchHistory()) {
    for (const v of [h.from, h.to]) {
      const k = v.trim();
      const lk = k.toLowerCase();
      if (k && !seen.has(lk)) {
        seen.add(lk);
        out.push(k);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

/** Remove a single stop from history (filters any past search containing it). */
export function removeRecentStop(stop: string) {
  if (typeof window === "undefined") return;
  const lk = stop.trim().toLowerCase();
  const next = getSearchHistory().filter(
    (h) => h.from.toLowerCase() !== lk && h.to.toLowerCase() !== lk,
  );
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
