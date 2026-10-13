"use client";

import type { ArtifactType } from "@/lib/catalog/types";
import { t, type MessageKey } from "@/lib/i18n";

const OPTIONS: { type: ArtifactType; label: MessageKey }[] = [
  { type: "plugin", label: "catalog.badge.plugin" },
  { type: "skill", label: "catalog.badge.skill" },
  { type: "agent", label: "catalog.badge.agent" },
  { type: "command", label: "catalog.badge.command" },
  { type: "hook", label: "catalog.badge.hook" },
  { type: "mcp", label: "catalog.badge.mcp" },
];

interface TypeFilterProps {
  selected: ArtifactType[];
  onToggle(type: ArtifactType): void;
}

export function TypeFilter({ selected, onToggle }: TypeFilterProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{t("search.typeFilter")}</legend>
      {OPTIONS.map(({ type, label }) => (
        <label key={type} className="cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={selected.includes(type)}
            onChange={() => onToggle(type)}
          />
          <span className="inline-flex h-8 items-center rounded-full border border-input px-3 text-sm peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
            {t(label)}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
