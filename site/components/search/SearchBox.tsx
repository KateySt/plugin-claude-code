"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface SearchBoxProps {
  value: string;
  onChange(value: string): void;
}

const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel", "password", "number"]);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type);
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onChange("");
        }}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value ? (
        <Button type="button" variant="outline" onClick={() => onChange("")}>
          {t("search.clear")}
        </Button>
      ) : null}
    </div>
  );
}
