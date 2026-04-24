import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // "HH:mm AM/PM"
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

type Period = "AM" | "PM";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string): { h: number; m: number; p: Period } {
  const m = value?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { h: 9, m: 0, p: "AM" };
  return {
    h: Math.min(12, Math.max(1, parseInt(m[1], 10))),
    m: Math.min(59, Math.max(0, parseInt(m[2], 10))),
    p: m[3].toUpperCase() as Period,
  };
}

const format = (h: number, m: number, p: Period) => `${pad(h)}:${pad(m)} ${p}`;

/** Premium clock-style time picker. Outputs "HH:mm AM/PM". */
export function TimePicker({ value, onChange, placeholder = "--:-- --", className }: Props) {
  const [open, setOpen] = useState(false);
  const initial = useMemo(() => parse(value), [value]);
  const [hour, setHour] = useState(initial.h);
  const [minute, setMinute] = useState(initial.m);
  const [period, setPeriod] = useState<Period>(initial.p);

  useEffect(() => {
    if (open) {
      const p = parse(value);
      setHour(p.h);
      setMinute(p.m);
      setPeriod(p.p);
    }
  }, [open, value]);

  const commit = (h = hour, m = minute, p = period) => {
    onChange(format(h, m, p));
  };

  // Clock face geometry
  const SIZE = 200;
  const R = 78;
  const CENTER = SIZE / 2;

  const angleFor = (idx: number, total: number) => (idx / total) * Math.PI * 2 - Math.PI / 2;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 h-9 text-sm",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="truncate">{value || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-4 rounded-2xl border-border bg-popover/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Digital readout */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Input
            value={pad(hour)}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              if (!isNaN(n) && n >= 1 && n <= 12) {
                setHour(n);
                commit(n, minute, period);
              }
            }}
            className="w-14 h-12 text-center text-2xl font-mono rounded-lg"
            inputMode="numeric"
            maxLength={2}
          />
          <span className="text-2xl font-mono text-muted-foreground">:</span>
          <Input
            value={pad(minute)}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              if (!isNaN(n) && n >= 0 && n <= 59) {
                setMinute(n);
                commit(hour, n, period);
              }
            }}
            className="w-14 h-12 text-center text-2xl font-mono rounded-lg"
            inputMode="numeric"
            maxLength={2}
          />
          <div className="flex flex-col gap-1 ml-2">
            {(["AM", "PM"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  commit(hour, minute, p);
                }}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded-md transition",
                  period === p
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Clock face */}
        <div
          className="relative mx-auto rounded-full bg-secondary/40 border border-border"
          style={{ width: SIZE, height: SIZE }}
        >
          {/* Hand */}
          <svg className="absolute inset-0 pointer-events-none" width={SIZE} height={SIZE}>
            <circle cx={CENTER} cy={CENTER} r={3} className="fill-primary" />
            <line
              x1={CENTER}
              y1={CENTER}
              x2={CENTER + Math.cos(angleFor(hour % 12, 12)) * (R - 18)}
              y2={CENTER + Math.sin(angleFor(hour % 12, 12)) * (R - 18)}
              className="stroke-primary"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>

          {HOURS.map((h, i) => {
            const a = angleFor(i, 12);
            const x = CENTER + Math.cos(a) * R;
            const y = CENTER + Math.sin(a) * R;
            const active = hour === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHour(h);
                  commit(h, minute, period);
                }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-xs font-semibold transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-glow scale-110"
                    : "text-foreground hover:bg-primary/20",
                )}
                style={{ left: x, top: y }}
              >
                {h}
              </button>
            );
          })}
        </div>

        {/* Minutes row */}
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 text-center">
            Minutes
          </div>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((m) => {
              const active = minute === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMinute(m);
                    commit(hour, m, period);
                  }}
                  className={cn(
                    "h-8 rounded-md text-xs font-mono transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-secondary/60 text-foreground hover:bg-primary/20",
                  )}
                >
                  {pad(m)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="rounded-lg"
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-orange-gradient text-primary-foreground"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
