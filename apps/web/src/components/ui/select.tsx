"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select sub-components must be used inside <Select>");
  return ctx;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function Select({ value = "", onValueChange, disabled, children }: SelectProps) {
  return (
    <SelectContext.Provider
      value={{ value, onValueChange: onValueChange ?? (() => {}), disabled }}
    >
      {children}
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

function SelectTrigger({ className, id, children, ...divProps }: SelectTriggerProps) {
  const { value, onValueChange, disabled } = useSelectContext();

  // Extract the SelectContent child to pull option data out of it
  const contentChild = React.Children.toArray(children).find(
    (c) => React.isValidElement(c) && c.type === SelectContent
  ) as React.ReactElement<SelectContentProps> | undefined;

  const placeholder = contentChild?.props.placeholder;
  const items = contentChild?.props.children as React.ReactNode;

  // Collect <SelectItem> value+label pairs from the SelectContent children
  const options = extractItems(items);

  return (
    <div className="relative w-full" {...divProps}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value || null)}
        className={cn(
          // Full-width, styled to match shadcn Input aesthetic
          "w-full appearance-none rounded-lg border border-input bg-background",
          "px-3 pr-9 text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          // Placeholder styling — when value is empty the first (disabled) option shows
          !value && "text-muted-foreground",
          "h-11", // match the rest of the form inputs
          className
        )}
        aria-label={placeholder}
      >
        {/* Placeholder option */}
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(({ value: v, label }) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      {/* Custom chevron icon — pointer-events-none so it doesn't block clicks */}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface SelectContentProps {
  children?: React.ReactNode;
  placeholder?: string;
  // The following props exist so callers can pass them without TS errors
  side?: string;
  sideOffset?: number;
  align?: string;
  className?: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function SelectContent({ children, ...props }: SelectContentProps) {
  return null;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function SelectItem({ children, ...props }: SelectItemProps) {
  return null;
}

function SelectValue(props: { placeholder?: string }) {
  return null;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

interface OptionDef {
  value: string;
  label: string;
}

function extractItems(children: React.ReactNode): OptionDef[] {
  const result: OptionDef[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      const { value, children: label } = child.props as SelectItemProps;
      result.push({ value, label: String(label) });
    } else if ((child.props as { children?: React.ReactNode })?.children) {
      result.push(
        ...extractItems((child.props as { children: React.ReactNode }).children)
      );
    }
  });
  return result;
}

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function SelectSeparator() {
  return null;
}
function SelectScrollUpButton() {
  return null;
}
function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
