// apps/web/src/components/onboarding/multi-select.tsx
"use client";

/**
 * MultiSelect — toggle-chip component.
 * Selected state: teal background + white text.
 * Unselected state: white bg + slate border.
 */

import { cn } from "@/lib/utils";

interface MultiSelectProps {
  id?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function MultiSelect({ id, options, selected, onChange, disabled = false }: MultiSelectProps) {
  function toggle(option: string) {
    if (disabled) return;
    onChange(
      selected.includes(option)
        ? selected.filter((v) => v !== option)
        : [...selected, option]
    );
  }

  return (
    <div id={id} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-150 cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hv-teal)] focus-visible:ring-offset-1",
              isSelected
                ? "bg-[var(--hv-teal)] border-[var(--hv-teal)] text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-[var(--hv-teal)] hover:text-[var(--hv-teal)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSelected && <span className="mr-1.5 text-xs" aria-hidden="true">✓</span>}
            {option}
          </button>
        );
      })}
    </div>
  );
}
