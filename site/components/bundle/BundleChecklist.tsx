"use client";

import { useBundle } from "./BundleProvider";

export function BundleChecklist() {
  const { source, has, toggle } = useBundle();
  return (
    <ul className="flex flex-col gap-2">
      {source.plugins.map((plugin) => (
        <li key={plugin.name}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={has(plugin.name)}
              onChange={() => toggle(plugin.name)}
            />
            <span>{plugin.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
