"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  id?: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({
  id,
  placeholder = "Type and press Enter…",
  tags,
  onChange,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function addTag(raw: string) {
    const value = raw.trim().toLowerCase();
    // Avoid empty strings and duplicates
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
    setInputValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Prevent form submission on Enter
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-shadow">
        {tags.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="gap-1 pl-2.5 pr-1.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              disabled={disabled}
              className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)} // Also add on blur for convenience
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : "Add more…"}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">Enter</kbd> or{" "}
        <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">,</kbd> to add a skill
      </p>
    </div>
  );
}
