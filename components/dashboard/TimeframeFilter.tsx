import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronDown, Check, Clock } from "lucide-react";
import {
  Selection,
  SelectionKind,
  MONTHS,
  ALLOWED_YEARS,
  MAX_MONTH_INDEX_2026,
  MAX_SELECTABLE_DATE,
  weeklySelection,
  monthlySelection,
  yearlySelection,
  customSelection,
} from "@/lib/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const tabs: { id: SelectionKind; label: string }[] = [
  { id: "weekly",  label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly",  label: "Yearly" },
  { id: "custom",  label: "Custom" },
];

export function TimeframeFilter({
  value,
  onChange,
}: {
  value: Selection;
  onChange: (s: Selection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SelectionKind>(value.kind);
  const [range, setRange] = useState<DateRange | undefined>();

  const choose = (s: Selection) => {
    onChange(s);
    setOpen(false);
  };

  const triggerLabel = useMemo(() => value.label, [value.label]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group relative inline-flex items-center gap-2 rounded-full border border-border/50 bg-glass px-4 py-2 text-sm font-semibold shadow-card-elevated"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-aurora opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-40" />
          <CalendarDays className="relative z-10 h-4 w-4 text-primary" />
          <span className="relative z-10 text-foreground">{triggerLabel}</span>
          <span className="relative z-10 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
            {value.kind}
          </span>
          <ChevronDown className={cn("relative z-10 h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(92vw,420px)] overflow-hidden border-border/50 bg-glass p-0 shadow-card-elevated"
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/50 p-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="tf-tab-active"
                    className="absolute inset-0 rounded-full bg-gradient-primary glow-cyan"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="p-3"
          >
            {tab === "weekly" && (
              <div className="space-y-2">
                {[
                  { id: "this", label: "This Week", hint: "Current week" },
                  { id: "last", label: "Last Week", hint: "Previous 7 days" },
                ].map((opt) => {
                  const sel = weeklySelection(opt.id, opt.label, opt.hint);
                  const active = value.key === sel.key;
                  return (
                    <OptionRow
                      key={opt.id}
                      icon={<Clock className="h-4 w-4" />}
                      label={opt.label}
                      hint={opt.hint}
                      active={active}
                      onClick={() => choose(sel)}
                    />
                  );
                })}
              </div>
            )}

            {tab === "monthly" && (
              <div className="space-y-3">
                <YearSwitcher
                  year={parseInt(value.key.match(/monthly:(\d{4})/)?.[1] ?? "2026")}
                  onChange={(y) => {
                    const m = parseInt(value.key.match(/monthly:\d{4}-(\d{2})/)?.[1] ?? "1") - 1;
                    choose(monthlySelection(y, isNaN(m) ? 0 : m));
                  }}
                />
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, i) => {
                    const y = parseInt(value.key.match(/monthly:(\d{4})/)?.[1] ?? "2026");
                    const sel = monthlySelection(y, i);
                    const active = value.key === sel.key;
                    const disabled = y === 2026 && i > MAX_MONTH_INDEX_2026;
                    return (
                      <motion.button
                        key={m}
                        whileHover={disabled ? undefined : { y: -2 }}
                        whileTap={disabled ? undefined : { scale: 0.96 }}
                        onClick={() => !disabled && choose(sel)}
                        disabled={disabled}
                        className={cn(
                          "relative overflow-hidden rounded-xl px-2 py-2.5 text-xs font-semibold transition-all",
                          active
                            ? "bg-gradient-primary text-primary-foreground shadow-glow"
                            : disabled
                              ? "cursor-not-allowed border border-border/30 bg-background/20 text-muted-foreground/40"
                              : "border border-border/50 bg-background/30 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m.slice(0, 3)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "yearly" && (
              <div className="grid grid-cols-2 gap-2">
                {ALLOWED_YEARS.map((y) => {
                  const sel = yearlySelection(y);
                  const active = value.key === sel.key;
                  return (
                    <motion.button
                      key={y}
                      whileHover={{ y: -2, scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => choose(sel)}
                      className={cn(
                        "relative overflow-hidden rounded-xl px-3 py-3 font-display text-base font-bold transition-all",
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "border border-border/50 bg-background/30 text-foreground/80 hover:text-foreground",
                      )}
                    >
                      {y}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {tab === "custom" && (
              <div className="space-y-2">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  disabled={{ after: MAX_SELECTABLE_DATE }}
                  numberOfMonths={1}
                  className="pointer-events-auto p-0"
                />
                <button
                  disabled={!range?.from || !range?.to}
                  onClick={() => range?.from && range?.to && choose(customSelection(range.from, range.to))}
                  className="w-full rounded-lg bg-gradient-primary py-2 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-40"
                >
                  Apply Custom Range
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

function OptionRow({
  icon, label, hint, active, onClick,
}: { icon: React.ReactNode; label: string; hint?: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
        active
          ? "border-primary/50 bg-primary/10 shadow-glow"
          : "border-border/50 bg-background/30 hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
      {active && <Check className="h-4 w-4 text-primary" />}
    </motion.button>
  );
}

function YearSwitcher({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const canGoPrev = year > ALLOWED_YEARS[0];
  const canGoNext = year < ALLOWED_YEARS[ALLOWED_YEARS.length - 1];

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 px-2 py-1.5">
      <button
        onClick={() => canGoPrev && onChange(year - 1)}
        disabled={!canGoPrev}
        className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >‹</button>
      <div className="font-display text-sm font-bold tracking-wider">{year}</div>
      <button
        onClick={() => canGoNext && onChange(year + 1)}
        disabled={!canGoNext}
        className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >›</button>
    </div>
  );
}
