import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, Trash2, X } from "lucide-react";
import { getStopSuggestions, type StopSuggestion } from "@/lib/busRoutes";
import { useLanguage } from "@/lib/i18n";
import {
  clearSearchHistory,
  getRecentStops,
  removeRecentStop,
} from "@/lib/searchHistory";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function StopAutocomplete({ label, value, onChange, placeholder }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StopSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load recents on mount + whenever dropdown opens (in case other field added one).
  useEffect(() => {
    if (open) setRecents(getRecentStops(6));
  }, [open]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setItems([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getStopSuggestions(q, 8);
        setItems(res);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showRecents = open && value.trim().length === 0 && recents.length > 0;
  const showSuggestions = open && value.trim().length > 0 && (loading || items.length > 0);
  const showDropdown = showRecents || showSuggestions;

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const removeOne = (e: React.MouseEvent, stop: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentStop(stop);
    setRecents(getRecentStops(6));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearSearchHistory();
    setRecents([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-3 mt-1 bg-input/60 border border-border rounded-xl px-4 h-14 focus-within:border-primary transition-smooth">
        <MapPin className="w-5 h-5 text-primary" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent flex-1 outline-none font-medium"
          autoComplete="off"
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-elegant overflow-hidden max-h-80 overflow-y-auto">
          {showRecents && (
            <>
              <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/40 border-b border-border">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent
                </span>
                <button
                  type="button"
                  onMouseDown={clearAll}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              {recents.map((r) => (
                <div
                  key={`recent-${r}`}
                  className="group flex items-center hover:bg-accent hover:text-accent-foreground"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(r);
                    }}
                    className="flex-1 text-left px-4 py-2.5 text-sm flex items-center gap-2 min-w-0"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{r}</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => removeOne(e, r)}
                    aria-label={`Remove ${r} from recent searches`}
                    className="px-3 py-2.5 text-muted-foreground hover:text-destructive opacity-60 group-hover:opacity-100 transition-smooth"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}
          {showSuggestions && (
            <>
              {showRecents && (
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/40 border-y border-border">
                  Suggestions
                </div>
              )}
              {loading && items.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">{t("routes.searching")}</div>
              ) : (
                items.map((s) => (
                  <button
                    key={`${s.value}-${s.display}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // Always store the canonical English value so search works
                      // regardless of UI language; the display string shows "BN (EN)".
                      pick(s.value);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{s.display}</span>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
