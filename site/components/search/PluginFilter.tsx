"use client";

import { t } from "@/lib/i18n";

interface PluginFilterProps {
  plugins: string[];
  value?: string;
  onChange(plugin?: string): void;
}

export function PluginFilter({ plugins, value, onChange }: PluginFilterProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t("search.pluginFilter")}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-8 rounded-lg border border-input bg-background px-2"
      >
        <option value="">{t("search.allPlugins")}</option>
        {plugins.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
