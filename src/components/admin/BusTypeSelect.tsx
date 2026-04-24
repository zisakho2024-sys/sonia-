import { useMemo } from "react";
import { Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hardcoded bilingual bus type options. No API needed — this list works
 * 100% offline so the form is reliable even if Gemini is unavailable.
 */
export const BUS_TYPE_OPTIONS: { en: string; bn: string }[] = [
  { en: "SBSTC", bn: "এসবিএসটিসি" },
  { en: "NBSTC", bn: "এনবিএসটিসি" },
  { en: "WBTC", bn: "ডাব্লুবিটিসি" },
  { en: "Govt Bus", bn: "সরকারি বাস" },
  { en: "Private", bn: "প্রাইভেট" },
  { en: "Local", bn: "লোকাল" },
  { en: "Express", bn: "এক্সপ্রেস" },
  { en: "Volvo", bn: "ভলভো" },
  { en: "AC", bn: "এসি" },
  { en: "Non-AC", bn: "নন-এসি" },
  { en: "Rocket", bn: "রকেট" },
];

const splitTags = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const joinTags = (arr: string[]): string => arr.join(", ");

/** Map an English tag to its Bengali equivalent (if known). */
function bnFor(en: string): string {
  const found = BUS_TYPE_OPTIONS.find(
    (o) => o.en.toLowerCase() === en.toLowerCase(),
  );
  return found ? found.bn : en;
}

type Props = {
  /** Comma-separated English tags, e.g. "AC, Express". */
  valueEn: string;
  /** Comma-separated Bengali tags, kept in sync with English selection. */
  valueBn: string;
  onChange: (en: string, bn: string) => void;
};

export function BusTypeSelect({ valueEn, valueBn, onChange }: Props) {
  const selected = useMemo(() => splitTags(valueEn), [valueEn]);
  const selectedBn = useMemo(() => splitTags(valueBn), [valueBn]);

  const isSelected = (en: string) =>
    selected.some((s) => s.toLowerCase() === en.toLowerCase());

  const toggle = (en: string) => {
    if (isSelected(en)) {
      const nextEn = selected.filter((s) => s.toLowerCase() !== en.toLowerCase());
      const nextBn = nextEn.map((tag) => bnFor(tag));
      onChange(joinTags(nextEn), joinTags(nextBn));
    } else {
      const nextEn = [...selected, en];
      const nextBn = [...selectedBn.filter((b) => b !== bnFor(en)), bnFor(en)];
      onChange(joinTags(nextEn), joinTags(nextBn));
    }
  };

  const remove = (en: string) => toggle(en);

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground/80 mb-1">
            Bus Type — pick one or more
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-xl h-auto min-h-11 py-2 flex-wrap gap-1.5"
              >
                {selected.length === 0 ? (
                  <span className="text-muted-foreground text-sm">
                    Select bus types…
                  </span>
                ) : (
                  selected.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(tag);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            remove(tag);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full hover:bg-foreground/10 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </Badge>
                  ))
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2 z-50" align="start">
              <div className="max-h-72 overflow-y-auto">
                {BUS_TYPE_OPTIONS.map((opt) => {
                  const active = isSelected(opt.en);
                  return (
                    <button
                      key={opt.en}
                      type="button"
                      onClick={() => toggle(opt.en)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors",
                        active && "bg-primary/10",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 rounded border",
                          active
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="font-medium">{opt.en}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {opt.bn}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground/80 mb-1">
            বাংলা অনুবাদ (auto)
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 min-h-11 flex flex-wrap gap-1.5 items-center">
            {selectedBn.length === 0 ? (
              <span className="text-muted-foreground text-sm">—</span>
            ) : (
              selectedBn.map((tag) => (
                <Badge key={tag} variant="secondary" lang="bn">
                  {tag}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
